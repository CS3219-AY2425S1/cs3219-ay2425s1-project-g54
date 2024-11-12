import { Server, Socket } from "socket.io";
import { verifyRoomJoinPermission, handleConnection } from "../controllers/collaborationController";
import { Question } from "../utils/types";

export const initialiseCollaborationSockets = (io : Server) => {

    io.on("connection", (socket : Socket) => {
        handleConnection(socket)

        socket.on("join-room", (roomID: string) => {
            if (verifyRoomJoinPermission(socket, roomID)){
                console.log(`${socket.data.username} joined ${roomID}`);
                socket.join(roomID);
            }
            console.log(io.sockets.adapter.rooms.get(roomID)?.size);
        })

        socket.on("leave-room",  (roomID: string) => {
            socket.leave(roomID);
            socket.to(roomID).emit("user-left", socket.data.username);
            socket.disconnect(true);    
        })

        socket.on("edit-code", (roomID: string, edittedCode : string) => {
            console.log(`Sent to ${roomID}`);
            socket.to(roomID).emit("sync-code", edittedCode);
        })

        socket.on("console-change", (roomId: string, consoleContent: string, error: boolean) => {
            socket.nsp.to(roomId).emit("sync-console", consoleContent, error);
        })

        socket.on("console-load", (roomId: string, isLoading: boolean) => {
            socket.to(roomId).emit("sync-load", isLoading);
        })

        socket.on("language-change", (roomId: string, newLanguage: string) => {
            socket.to(roomId).emit("sync-language", newLanguage);
        })

        socket.on("question-change", (roomId: string, question: Question) => {
            socket.to(roomId).emit("sync-question", question);
        })

        socket.on("disconnecting", () => {
            // leaves all rooms, ideally only one
            socket.rooms.forEach((roomID: string) => {
                socket.to(roomID).emit("user-left", socket.data.username);
                console.log(`Socket has left ${roomID}`);
                socket.leave(roomID);
            });
        })

        socket.on("disconnect", () => {
            socket.removeAllListeners();
            console.log(`${socket.data.username} has disconnected`)
        })

    })
}
