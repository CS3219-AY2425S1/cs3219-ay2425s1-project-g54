import { Server, Socket } from "socket.io";
import {
  handleConnection,
  handleJoinRoom,
  handleSendMessage,
} from "../controllers/chatController";
import { SignalData } from "simple-peer";
import { Caller } from "../utils/types";

export function initializeCommunicationSockets(io: Server) {
  io.on("connection", (socket: Socket) => {
    // Initial connection setup
    handleConnection(socket);

    // Listen for joining a room
    socket.on("join-room", (roomId: string) => {
      handleJoinRoom(socket, roomId);
    });

    // Listen for sending chat messages to a specific room
    socket.on("chatMessage", ({ roomId, text }) => {
      console.log("Received room:", roomId);
      console.log("Received message:", text);
      handleSendMessage(io, socket, roomId, text);
    });

    // video call events
    socket.on("initiate-call", (roomId: string, user : Caller) => {
        socket.to(roomId).emit("incoming-call", user);
        console.log(`${socket.data.username} initiated`);
    })

    socket.on("call-response", (isAnswer: boolean, roomId: string) => {
        socket.to(roomId).emit("call-response", isAnswer);
        console.log(`${socket.data.username} has responded with a ${isAnswer? "Yes" : "No"}`);
    })

    socket.on("call-timeout", (roomId: string) => {
      socket.to(roomId).emit("call-timeout");
    })

    socket.on("start-video", (roomId: string, isInitiator: boolean) => {
      socket.to(roomId).emit("start-video", isInitiator);
    })

    socket.on("stop-video", (roomId: string) => {
      socket.nsp.to(roomId).emit("stop-video");
    })

    socket.on("signal", (roomId: string, signal: SignalData) => {
        socket.to(roomId).emit("signal", signal);
        console.log(`${socket.data.username} signalled`);
    })
    
    socket.on("call-error", (roomId: string) => {
      socket.nsp.to(roomId).emit("call-error");
      // socket.nsp.to(roomId).emit("stop-video");
    })

    socket.on("disconnecting", () => {
      // leaves all rooms, ideally only one  
      socket.rooms.forEach((roomID: string) => {
          socket.nsp.to(roomID).emit("stop-video");
          console.log(`Socket has left ${roomID}`);
          socket.leave(roomID);
      });
  })
    // Handle disconnection
    socket.on("disconnect", () => {
      socket.removeAllListeners();
      console.log(`User ${socket.data.username} disconnected`);
    });
  });
}
