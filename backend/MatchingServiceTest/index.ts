import { io } from "socket.io-client";

const userId = `user_12345`;

const socket = io("http://localhost:3000", {
  auth: {
    userId: userId,
  },
});

socket.on("connect", () => {
  console.log("Connected with user ID:", userId);

  // Request a match
  console.log("Requesting match...");
  socket.emit("request-match", {
    difficultyLevel: "EASY",
    // category: "ARRAYS",
  });
});

socket.on("connection-error", (error) => {
  console.log("Connection error:", error.message);
  socket.disconnect();
});

socket.on("match-request-accepted", () => {
  console.log("Match request accepted");
});

socket.on("match-found", (match) => {
  console.log("Match found:", match);
});

socket.on("match-timeout", () => {
  console.log("Match timeout");
  socket.disconnect();
});

socket.on("match-request-error", (message) => {
  console.log("Error requesting match:", message);
  socket.disconnect();
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
  socket.disconnect();
});
