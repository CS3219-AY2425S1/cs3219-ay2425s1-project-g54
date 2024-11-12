import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeCommunicationSockets } from "./sockets/handlers";
import { errorMiddleware } from "./middleware/errorMiddleware";
import mongoose from "mongoose";
import 'dotenv/config';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: `${process.env.FRONTEND_ENDPOINT}`, //config.corsOrigin? This should be set to frontend domain
    methods: ["GET", "POST"],
  },
  path: "/communication/socket",
  allowUpgrades: false,
});

app.use(express.json());
app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.send("Communication service is running");
});

const PORT = process.env.COMM_SVC_PORT ?? 4005;

// Socket.io setup
initializeCommunicationSockets(io);

mongoose
  .connect(process.env.MONGOURI!)
  .then(() => {
    console.log("Connected to MongoDB for Communication Service");
  })
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Communication Server is running on port ${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.error("Error connecting to MongoDB:", error);
  });
