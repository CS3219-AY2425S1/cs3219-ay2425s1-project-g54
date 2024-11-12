import { Server, Socket } from "socket.io";
import { MatchController } from "../controllers/matchController";
import { MatchRequest } from "../utils/types";
import { validateMatchRequest } from "../utils/validation";
import logger from "../utils/logger";
import { v4 } from "uuid";

export const initializeSocketHandlers = (io: Server): void => {
  const matchController = new MatchController();

  const handleConnection = (socket: Socket) => {
    const userId = socket.handshake.auth.userId;
    const username = socket.handshake.auth.username;
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

    if (!matchController.addConnection(userId, username, socket.id)) {
      socket.emit("connection-error", { message: "User is already connected" });
      socket.disconnect(true);
      return;
    }

    socket.data.userId = userId;
    socket.data.username = username;

  };


  const handleMatchRequest = (socket: Socket, request: MatchRequest) => {
    try {
      const userId = socket.data.userId;
      const username = socket.data.username;
      socket.data.matchRequest = request;
      validateMatchRequest(request);
      socket.emit("match-request-accepted");
      logger.info(`Match requested for user ${username} (${userId})`, { request });
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
    const username = socket.data.username;
    const matchRequest: MatchRequest | undefined = socket.data.matchRequest;
    if (matchRequest) {
      matchController.removeFromMatchingPool(userId, matchRequest);
      matchController.removeTimeout(userId);
      socket.emit("match-cancelled");
      logger.info(`Match cancelled for user ${username} (${userId})`);
    } else {
      logger.warn(
        `No match request found for user ${username} (${userId}) when attempting to cancel match.`
      );
    }
  };

  const handleDisconnect = (socket: Socket) => {
    const userId = socket.data.userId;
    const username = socket.data.username;
    const matchRequest: MatchRequest | undefined = socket.data.matchRequest;
    if (matchRequest) {
      matchController.removeFromMatchingPool(userId, matchRequest);
      matchController.removeTimeout(userId);
    }
    matchController.removeConnection(userId);
    // socket.disconnect(true);
  };

  io.on("connection", (socket: Socket) => {
    handleConnection(socket);

    socket.on("request-match", (request: MatchRequest) =>
      handleMatchRequest(socket, request)
    );

    socket.on("cancel-match", () => handleCancelMatch(socket));

    socket.on("disconnect", () => handleDisconnect(socket));
  });

  matchController.on("match-success", ({ socket1Id, socket2Id, username1, username2, match }) => {
    const uuid = v4();
    io.to(socket1Id).emit("match-found", { match, matchedUsername: username2, uuid });
    io.to(socket2Id).emit("match-found", { match, matchedUsername: username1, uuid });
  });

  matchController.on("match-timeout", (socketId) => {
    io.to(socketId).emit("match-timeout");
  });
};
