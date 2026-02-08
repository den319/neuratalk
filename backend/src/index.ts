import "dotenv/config"
import express, {Request, Response} from "express";
import cookieParser from "cookie-parser"
import cors from "cors"
import { Env } from "./config/env.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { HTTP_STATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import connectDatabase from "./config/database.config";

const app= express();

app.use(express.json());
app.use(cookieParser());

app.use(express.urlencoded({extended: true}));

app.use(
    cors({
        origin: Env.FRONTEND_ORIGIN,
        credentials: true,
    })
);

app.get('/health', asyncHandler(async (req: Request, res:Response) => {
    res.status(HTTP_STATUS.OK).json({
        status: "OK",
        message: "Server is working!"
    })
}));

app.use(errorHandler);

app.listen(Env.PORT, async () => {
    await connectDatabase();
    console.log(`Server is running on port: ${Env.PORT}`);
    console.log(`\nServer is running in ${Env.NODE_ENV} mode\n`);
})