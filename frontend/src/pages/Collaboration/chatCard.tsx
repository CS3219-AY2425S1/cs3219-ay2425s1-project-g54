import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  Box,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import { useSocket } from "../../contexts/SocketContext";

interface ChatCardProps {
  roomId: string;
  username: string;
  userId: string;
}

const ChatCard: React.FC<ChatCardProps> = ({ roomId, username, userId }) => {
  const [messages, setMessages] = useState<
    { username: string; message: string }[]
  >([]);
  const { commSocket } = useSocket();
  const [input, setInput] = useState("");
  const chatBoxRef = useRef<HTMLDivElement | null>(null); // Create a ref for the chat box

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight; // Scroll to the bottom
    }
  }, [messages]);
  useEffect(() => {
    if (!commSocket) {
      return;
    }

    // Listen for incoming messages and add them to the chat
    commSocket.on("chatMessage", (message) => {
      console.log("Received message:", message); // Debugging log
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Clean up the socket connection on component unmount
    return () => {
      commSocket.disconnect();
    };
  }, [commSocket]);

  useEffect(() => {
    if (!commSocket) return;

    // Load chat history when joining a room
    commSocket.on("chatHistory", (history) => {
      console.log("Received chat history:", history); // Check structure in console
      setMessages(history);
    });

    return () => {
      commSocket.off("chatHistory");
    };
  }, [commSocket]);

  const handleSendMessage = () => {
    if (input.trim() && commSocket) {
      // Emit the chat message with the correct structure
      console.log("Sending message:", input);
      console.log("Emitting message with data:", { roomId, message: input });

      commSocket.emit("chatMessage", { roomId, text: input });

      setInput(""); // Clear input field
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      // If Ctrl + Enter is pressed, add a newline
      setInput((prev) => prev + "\n");
    } else if (e.key === "Enter") {
      // If only Enter is pressed, send the message
      e.preventDefault(); // Prevent the default newline behavior
      handleSendMessage();
    }
  };

  return (
    <Card
      className="border-gray-700 text-white flex flex-col h-full"
      sx={{ maxHeight: "350px" }}
    >
      <CardContent className="p-6 bg-gray-800 flex-grow"
        sx={{ paddingTop: "8px", paddingBottom: "10px" }}
      >
        <Typography
          variant="h6"
          className="mb-4"
          sx={{ color: "white", textAlign: "center", fontWeight: "bold" }}
        >
          Chat
        </Typography>
        <Box
          ref={chatBoxRef}
          sx={{
            height: 100,
            overflowY: "auto",
            border: "1px solid #ddd",
            padding: 2,
            mb: 2,
            flexGrow: 1,
          }}
          className="chat-box"
        >
          {messages.map((msg, index) => (
            <Typography
              key={index}
              variant="body1" // Increase the font size here
              className="text-gray-300"
              sx={{
                textAlign: "left",
                fontSize: "0.9rem",
                mb: 1,
              }}
            >
              <strong>{msg.username}</strong>:{" "}
              {/* Replace newlines with <br /> for rendering */}
              {/* Check if msg.text is defined before calling split */}
              {msg.message ? (
                msg.message.split("\n").map((line, lineIndex) => (
                  <React.Fragment key={lineIndex}>
                    {line}
                    {lineIndex < msg.message.split("\n").length - 1 && <br />}
                  </React.Fragment>
                ))
              ) : (
                <span>No message content</span> // Fallback for undefined messages
              )}
            </Typography>
          ))}
        </Box>
        {/* Input and Send Button */}
        <Box sx={{ display: "flex", gap: 1 , height: "5vh"}}>
          <TextField
            variant="outlined"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            minRows={1} // Minimum rows to show
            maxRows={2}
            sx={{
              flexGrow: 1,
              backgroundColor: "#ffffff", // White background for input box
              borderRadius: "4px",
            }}
            InputProps={{
              style: { color: "#000", fontSize: "1.1rem", height: "100%"}, // Black text color inside input
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSendMessage}
            sx={{ flexShrink: 0 }}
          >
            Send
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChatCard;
