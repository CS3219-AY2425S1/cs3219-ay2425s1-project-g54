import { EventEmitter } from "events";
import { MatchRequest, UserMatch } from "../utils/types";
import { config } from "../utils/config";
import logger from "../utils/logger";
import amqp from "amqplib";

export class MatchController extends EventEmitter {
  private matchTimeouts: Map<string, NodeJS.Timeout>;
  private connectedUsers: Map<string, string>; // userId: socketId
  private rabbitMqConnection!: amqp.Connection;
  private rabbitMqChannel!: amqp.Channel;

  constructor() {
    super();
    this.matchTimeouts = new Map();
    this.connectedUsers = new Map();
    this.initializeRabbitMq();
  }

  // Initialize RabbitMQ connection and channels
  private async initializeRabbitMq(): Promise<void> {
    try {
      this.rabbitMqConnection = await amqp.connect(
        "amqp://guest:guest@localhost:5672"
      );
      this.rabbitMqChannel = await this.rabbitMqConnection.createChannel();

      // Create queues for each difficulty level
      await this.rabbitMqChannel.assertQueue("EASY");
      await this.rabbitMqChannel.assertQueue("MEDIUM");
      await this.rabbitMqChannel.assertQueue("HARD");

      logger.info("RabbitMQ initialized and queues declared.");
    } catch (error) {
      logger.error(`RabbitMQ initialization error: ${error}`);
    }
  }

  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  addConnection(userId: string, socketId: string): boolean {
    if (this.connectedUsers.has(userId)) {
      logger.warn(`User ${userId} already has an active connection`);
      return false;
    }
    this.connectedUsers.set(userId, socketId);
    logger.info(
      `User ${userId} connected. Total connections: ${this.connectedUsers.size}`
    );
    return true;
  }

  removeConnection(userId: string): void {
    this.connectedUsers.delete(userId);
    logger.info(
      `User ${userId} disconnected. Total connections: ${this.connectedUsers.size}`
    );
  }

  async addToMatchingPool(
    userId: string,
    request: MatchRequest
  ): Promise<void> {
    const { difficultyLevel } = request;

    try {
      const queuedUser = { ...request, userId }; // Include userId in the request
      await this.rabbitMqChannel.sendToQueue(
        difficultyLevel,
        Buffer.from(JSON.stringify(queuedUser))
      );

      logger.info(`User ${userId} added to ${difficultyLevel} RabbitMQ queue.`);

      const timeout = setTimeout(() => {
        this.removeFromMatchingPool(userId);
        this.emit("match-timeout", this.connectedUsers.get(userId));
        this.removeConnection(userId);
        logger.info(`Match timeout for user ${userId}`);
      }, config.matchTimeout);

      this.matchTimeouts.set(userId, timeout);

      this.tryMatch(userId, request);
    } catch (error) {
      logger.error(`Error in addToMatchingPool: ${error}`);
    }
  }

  async removeFromMatchingPool(userId: string): Promise<void> {
    this.removeConnection(userId);
    logger.info(`User ${userId} connection removed from system.`);

    const timeout = this.matchTimeouts.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.matchTimeouts.delete(userId);
    }
  }

  private async tryMatch(userId: string, request: MatchRequest): Promise<void> {
    const { difficultyLevel, category } = request;

    try {
      await this.rabbitMqChannel.consume(
        difficultyLevel,
        async (msg) => {
          if (msg) {
            const potentialMatch = JSON.parse(msg.content.toString());

            if (
              potentialMatch.userId !== userId &&
              this.isCompatibleMatch(request, potentialMatch)
            ) {
              const match: UserMatch = {
                difficultyLevel,
                category: category || potentialMatch.category || null,
              };

              this.emit("match-success", {
                socket1Id: this.connectedUsers.get(userId),
                socket2Id: this.connectedUsers.get(potentialMatch.userId),
                match,
              });

              this.removeFromMatchingPool(userId);
              this.removeFromMatchingPool(potentialMatch.userId);

              logger.info(
                `Match success: User ${userId} matched with ${potentialMatch.userId} in ${difficultyLevel} queue`
              );

              // Acknowledge the message once a match is made
              this.rabbitMqChannel.ack(msg);

              this.removeConnection(userId);
              this.removeConnection(potentialMatch.userId);
            } else {
              // Requeue the message if no match is found
              this.rabbitMqChannel.nack(msg, false, true);
              logger.info(
                `No match found for user ${userId} in ${difficultyLevel} queue`
              );
            }
          }
        },
        { noAck: false }
      );
    } catch (error) {
      logger.error(`Error in tryMatch: ${error}`);
    }
  }

  private isCompatibleMatch(
    request1: MatchRequest,
    request2: MatchRequest
  ): boolean {
    // Match if categories are the same or if either user has no category
    return (
      request1.category === request2.category ||
      !request1.category ||
      !request2.category
    );
  }
}
