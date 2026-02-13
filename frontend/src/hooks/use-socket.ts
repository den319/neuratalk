import { io, Socket } from "socket.io-client";
import {create} from "zustand"

const BASE_URL =
  import.meta.env.MODE === "development" ? import.meta.env.VITE_API_URL : "/";

interface ISocketState {
    socket: Socket | null;
    onlineUsers: string[];
    typingUsers: Map<string, string>; 
    connectSocket: () => void;
    disconnectSocket: () => void;
}

export const useSocket= create<ISocketState>()((set, get) => ({
    socket: null,
    onlineUsers: [],
    typingUsers: new Map(),
    connectSocket: () => {
        const {socket}= get();
        if(socket?.connected)
            return

        const newSocket= io(BASE_URL, {withCredentials: true, autoConnect:true})

        set({socket: newSocket})

        newSocket.on("connect", () => {
            console.log("Socket connected successfully!");
        })

        newSocket.on("online:users", (userIds) => {
            set({ onlineUsers: userIds });
        })

        newSocket.on("typing:users", (typingData: [string, string][]) => {
            set({ typingUsers: new Map(typingData) });
        })

    },
    disconnectSocket: () => {
        const {socket}= get()

        if(socket) {
            socket.disconnect()
            set({socket: null})
        }
    },
}))