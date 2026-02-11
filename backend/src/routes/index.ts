import { Router } from "express";
import authRoutes from "./auth.route";
import userRoutes from "./user.route";
import chatRoutes from "./chat.route";

const router= Router()

router.use("/auth", authRoutes)
router.use("/user", userRoutes)
router.use("/chat", chatRoutes)

export default router