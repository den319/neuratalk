import { Router } from "express";
import { authStatusController, loginController, logoutController, registerController } from "../controllers/auth.controller";

const authRoutes= Router()
    .post('/register', registerController)
    .post('/login', loginController)
    .post('/logout', logoutController)
    .post('/status', authStatusController)


export default authRoutes