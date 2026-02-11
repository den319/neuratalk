import "dotenv/config"
import express, {Request, Response} from "express";
import cookieParser from "cookie-parser"
import cors from "cors"
import { Env } from "./config/env.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { HTTP_STATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import connectDatabase from "./config/database.config";
import passport from "passport";
import routes from "./routes";
import http from "http";
import { initializeSocket } from "./lib/socket";

const app= express();

const server = http.createServer(app);

//socket
initializeSocket(server);

app.use(express.json({limit: "5mb"}));
app.use(cookieParser());

app.use(express.urlencoded({extended: true}));

app.use(
    cors({
        origin: Env.FRONTEND_ORIGIN,
        credentials: true,
    })
);

app.use(passport.initialize())

app.get('/health', asyncHandler(async (req: Request, res:Response) => {
    res.status(HTTP_STATUS.OK).json({
        status: "OK",
        message: "Server is working!"
    })
}));

app.use('/api', routes)

app.use(errorHandler);

app.listen(Env.PORT, async () => {
    await connectDatabase();
    console.log(`Server is running on port: ${Env.PORT}`);
    console.log(`\nServer is running in ${Env.NODE_ENV} mode\n`);
})