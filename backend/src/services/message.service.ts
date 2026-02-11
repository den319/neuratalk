import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.config";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import { BadRequestException, NotFoundException } from "../utils/appError";

export const sendMessageService= async(
    userId: string,
    body: {
        chatId: string,
        content?: string,
        image?:string,
        replyToId?:string,
    }
) => {
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
        const uploadRes= await cloudinary.uploader.upload(image);

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

    return {
        userMessage: newMessasge,
        chat
    }
}