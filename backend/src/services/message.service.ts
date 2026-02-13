import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.config";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import { BadRequestException, NotFoundException } from "../utils/appError";
import { emitChatAI, emitLastMessageToParticipants, emitNewMessageToChatRoom } from "../lib/socket";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Env } from "../config/env.config";
import UserModel from "../models/user.model";
import { ModelMessage, streamText } from "ai";

const google= createGoogleGenerativeAI({
    apiKey: Env.GOOGLE_GENERATIVE_AI_API_KEY,
})
export const sendMessageService= async(
    userId: string,
    body: {
        chatId: string,
        content?: string,
        image?:string,
        replyToId?:string,
    }
) => {
    console.log("sending message......")
    const {chatId, content, image, replyToId}= body;

    const chat= await ChatModel.findOne({
        _id: chatId,
        participants: {
            $in: [userId]
        }
    })

    if (!chat) 
        throw new BadRequestException("Chat not found or unauthorized");

    if(replyToId){
        const replyMessage= await MessageModel.findOne({
            _id: replyToId,
            chatId
        })
        if (!replyMessage) throw new NotFoundException("Reply message not found");
    }

    let imageUrl;

    if(image) {
        const uploadRes= await cloudinary.uploader.upload(image, {
            folder: "neuratalk_uploads",
            resource_type: "image",
            transformation: [
                { width: 1280, crop: "limit" }, // prevent massive resolution
                { quality: "auto" },            // smart compression
                { fetch_format: "auto" }        // convert to webp/avif
            ],
        });

        imageUrl= uploadRes.secure_url;
    }

    const newMessasge= await MessageModel.create({
        chatId,
        sender: userId,
        content,
        image: imageUrl,
        replyTo: replyToId || null
    })

    await newMessasge.populate([
        {path: "sender", select: "name avatar"},
        {
            path: "replyTo",
            select: "content image sender",
            populate: {
                path: "sender",
                select: "name avatar"
            }
        }   
    ])

    chat.lastMessage= newMessasge._id as mongoose.Types.ObjectId;

    await chat.save()

    emitNewMessageToChatRoom(userId, chatId, newMessasge)

    const allParticipantIds= chat.participants.map((id) => id.toString())
    emitLastMessageToParticipants(allParticipantIds, chatId, newMessasge)

    let aiResponse:any= null;

    if(chat.isAIChat) {
        aiResponse= await getAIResponse(chatId, userId)

        // console.log({aiResponse, chatId, userId})
        if(aiResponse) {
            chat.lastMessage= aiResponse._id as mongoose.Types.ObjectId
            chat.save()
        }
    }

    return {
        userMessage: newMessasge,
        chat,
        aiResponse,
        isAIChat: chat.isAIChat,
    }
}

async function getAIResponse(chatId:string, userId:string) {
    const ai= await UserModel.findOne({isAI: true})

    if(!ai)
        throw new NotFoundException("AI model not found!")

    const chatHistory= await getChatHistory(chatId)

    const formattedMessages:ModelMessage[]= chatHistory.map((msg:any) => {
        const role= msg.sender.isAI ? "assistant" : "user"

        const parts: any[]= [];

        if(msg.image) {
            parts.push({
                type: "file",
                data: msg.image,
                mediaType: "image/*",
                filename: "image.webp"
            })
        }

        if(msg.content) {
            parts.push({
                type: "text",
                text: msg.replyTo ?
                    `[Replying to: "${msg.replyTo.content}"]\n${msg.content}`
                    : msg.content,
            })
        } else if(msg.image) {
            parts.push({
                type: "text",
                text: "Describe what you see in the image",
            })
        }

        return {
            role,
            content: parts
        }
    })

    console.log({formattedMessages})

    const result= await streamText({
        model: google("gemini-2.5-flash"),
        messages: formattedMessages,
        system: "You are Neuratalk AI, a helpful and friendly assistant. Respond only with text and atte"
    })

    let response= "";

    for await (const chunk of result.textStream) {
        emitChatAI({
            chatId,
            chunk,
            sender:ai,
            done:false,
            message:null
        })

        response += chunk;
    }
    
    if(!response.trim()) return ""

    const aiMessage= await MessageModel.create({
        chatId,
        sender: ai._id,
        content: response
    })

    await aiMessage.populate("sender", "name avatar isAI")

    emitChatAI({
        chatId,
        chunk: null,
        sender:ai,
        done:true,
        message:aiMessage
    })

    emitLastMessageToParticipants([userId], chatId, aiMessage)

    return aiMessage
}

async function getChatHistory(chatId:string) {
    const messages= await MessageModel
        .find({chatId})
        .populate("sender", "isAI")
        .populate("replyTo", "content")
        .sort({createdAt: -1})
        .limit(5)
        .lean()

    return messages.reverse()
}