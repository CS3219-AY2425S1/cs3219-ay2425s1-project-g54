import { Server, Socket } from "socket.io";
import { MatchController } from "../controllers/matchController";
import { MatchRequest } from "../utils/types";
import { validateMatchRequest } from "../utils/validation";
import logger from "../utils/logger";

export const initializeSocketHandlers = (io: Server): void => {
  const matchController = new MatchController();

  const handleConnection = (socket: Socket) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      socket.emit("connection-error", { message: "User ID is required" });
      return;
    }

    if (!matchController.addConnection(userId, socket.id)) {
      socket.emit("connection-error", { message: "User is already connected" });
      return;
    }

    socket.data.userId = userId;
    logger.info(`User connected: ${userId}`);
  };

  const handleMatchRequest = (socket: Socket, request: MatchRequest) => {
    try {
      const userId = socket.data.userId;
      validateMatchRequest(request);
      socket.emit("match-request-accepted");
      logger.info(`Match requested for user ${userId}`, { request });

      // Store the match request in socket data
      socket.data.matchRequest = request;

      matchController.addToMatchingPool(userId, request);
    } catch (error) {
      socket.emit("match-request-error", {
        message:
          error instanceof Error ? error.message : "Invalid match request",
      });
      socket.disconnect(true);
    }
  };

  const handleCancelMatch = (socket: Socket) => {
    const userId = socket.data.userId;
    const matchRequest: MatchRequest | undefined = socket.data.matchRequest;

    if (matchRequest) {
      matchController.removeFromMatchingPool(userId); // Update this line
      socket.emit("match-cancelled");
      logger.info(`Match cancelled for user ${userId}`);
      delete socket.data.matchRequest; // Clear the match request after cancellation
    } else {
      logger.warn(
        `No match request found for user ${userId} when attempting to cancel match.`
      );
    }
  };

  const handleDisconnect = (socket: Socket) => {
    const userId = socket.data.userId;
    const matchRequest: MatchRequest | undefined = socket.data.matchRequest;

    if (matchRequest) {
      matchController.removeFromMatchingPool(userId); // Just call this method without parameters
    }

    matchController.removeConnection(userId);
    logger.info(`User disconnected: ${userId}`);
  };

  io.on("connection", (socket: Socket) => {
    handleConnection(socket);

    socket.on("request-match", (request: MatchRequest) =>
      handleMatchRequest(socket, request)
    );

    socket.on("cancel-match", () => handleCancelMatch(socket));

    socket.on("disconnect", () => handleDisconnect(socket));
  });

  matchController.on("match-success", ({ socket1Id, socket2Id, match }) => {
    io.to(socket1Id).to(socket2Id).emit("match-found", match);
  });

  matchController.on("match-timeout", (socketId) => {
    io.to(socketId).emit("match-timeout");
  });
};
