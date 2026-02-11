import ChatModel from "../models/chat.model";
import UserModel from "../models/user.model";
import { NotFoundException } from "../utils/appError";

export const createChatService= async(
    userId: string,
    body: {
        participantId?: string;
        isGroup?: boolean;
        participants?: string[];
        groupName?: string;
    }
) => {
    const {participantId, isGroup, participants, groupName}= body;

    let chat;
    let allParticipantIds:string[]= [];

    if(isGroup && participants?.length && groupName) {
        allParticipantIds= [userId, ...participants];

        chat= await ChatModel.create({
            participants: allParticipantIds,
            isGroup: true,
            groupName,
            createdBy: userId
        })
    } else if(participantId) {
        const otherUser= await UserModel.findById(participantId)

        if(!otherUser)
            throw new NotFoundException("User not found")

        allParticipantIds= [userId, participantId]

        const existingChat= await ChatModel.findOne({
            participants: {
                $all: allParticipantIds,
                $size: 2
            },
        }).populate("participants", "name avatar")

        if(existingChat)
            return existingChat

        chat= await ChatModel.create({
            participants: allParticipantIds,
            isGroup: false,
            createdBy: userId
        })
    }

    return chat
}