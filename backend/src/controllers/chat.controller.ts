import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { createChatSchema } from "../validators/chat.validator";
import { createChatService } from "../services/chat.service";
import { HTTP_STATUS } from "../config/http.config";


export const createChatController= asyncHandler(
    async (req:Request, res:Response) => {
        const userId = req.user?._id;

        const body= createChatSchema.parse(req.body)

        const chat= await createChatService(userId, body);

        return res.status(HTTP_STATUS.OK).json({
            messagee: "Chat created or retrieved successfully",
            chat,
        })

    }
)

