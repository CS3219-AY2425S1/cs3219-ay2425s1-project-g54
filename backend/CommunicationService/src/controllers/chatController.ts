import { Socket, Server } from "socket.io";
import ChatMessage from "../models/model";
import { console } from "inspector";

// Handle connection and store user info on the socket
export const handleConnection = (socket: Socket): void => {
  const userId = socket.handshake.auth.userId;
  const username = socket.handshake.auth.username;

  // Emit errors if user ID or username is missing
  if (!userId) {
    socket.emit("connection-error", { message: "User ID is required" });
    socket.disconnect(true);
    return;
  }
  if (!username) {
    socket.emit("connection-error", { message: "Username is required" });
    socket.disconnect(true);
    return;
  }

  // Attach user data to the socket
  socket.data.userId = userId;
  socket.data.username = username;

  // Notify the client of successful connection
  socket.emit("connection-success", { message: "Connected successfully!" });
};

// Handle joining a specific room
export const handleJoinRoom = async (
  socket: Socket,
  roomId: string
): Promise<void> => {
  socket.join(roomId);
  console.log(`User ${socket.data.username} joined room ${roomId}`);

  try {
    const chatHistory = await ChatMessage.find({ roomId })
      .sort({ timestamp: 1 }) // Sort messages by time
      .limit(100);

    socket.emit("chatHistory", chatHistory); // Emit history to client
  } catch (error) {
    console.error("Error retrieving chat history:", error);
  }

  socket.emit("room-joined", { roomId });
};

// Handle sending a message within a specific room
export const handleSendMessage = async (
  io: Server,
  socket: Socket,
  roomId: string,
  text: string
): Promise<void> => {
  const chatMessage = new ChatMessage({
    roomId,
    userId: socket.data.userId,
    username: socket.data.username,
    message: text,
  });

  try {
    await chatMessage.save(); // Save to MongoDB
    console.log("Message saved into MongoDB");
    // Broadcast the message to the room only
    io.sockets.in(roomId).emit("chatMessage", {
      username: socket.data.username,
      message: text,
    });
  } catch (error) {
    console.error("Error saving chat message:", error);
  }
};
