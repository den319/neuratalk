import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request, Response } from "express";
import { getUsersService } from "../services/user.service";
import { HTTP_STATUS } from "../config/http.config";

export const getUserController= asyncHandler(
    async(req:Request, res:Response) => {
        const userId= req.user?._id

        const users= await getUsersService(userId)

        return res.status(HTTP_STATUS.OK).json({
            message: "Users retrieved successfully",
            users
        })
    }
)