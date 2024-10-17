import { EventEmitter } from "events";
import { MatchRequest, UserMatch, QueuedUser } from "../utils/types";
import { config } from "../utils/config";
import logger from "../utils/logger";
import redisClient from "../utils/redisClient";
import { Mutex } from "async-mutex";

export class MatchController extends EventEmitter {
  private matchTimeouts: Map<string, NodeJS.Timeout>;
  private connectedUsers: Map<string, string>; // userId: socketId
  private queueMutex: Mutex;

  constructor() {
    super();
    this.matchTimeouts = new Map();
    this.connectedUsers = new Map();
    this.queueMutex = new Mutex();
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

  private async getQueueLen(difficultyLevel: string): Promise<number> {
    const release = await this.queueMutex.acquire();
    try {
      const queueSize = await redisClient.lLen(difficultyLevel);
      return queueSize;
    } finally {
      release();
    }
  }

  private async getQueueItems(difficultyLevel: string): Promise<string[]> {
    const release = await this.queueMutex.acquire();
    try {
      const queue = await redisClient.lRange(difficultyLevel, 0, -1);
      return queue;
    } finally {
      release();
    }
  }

  private async addToQueue(difficultyLevel: string, queuedUser: QueuedUser) {
    const release = await this.queueMutex.acquire();
    try {
      await redisClient.rPush(difficultyLevel, JSON.stringify(queuedUser));
    } finally {
      release();
    }
  }

  private async removeFromQueue(difficultyLevel: string, queuedUser: QueuedUser) {
    const release = await this.queueMutex.acquire();
    try {
      await redisClient.lRem(difficultyLevel, 1, JSON.stringify(queuedUser));
    } finally {
      release();
    }
  }


  async addToMatchingPool(
    userId: string,
    request: MatchRequest
  ): Promise<void> {
    const { difficultyLevel, category } = request;
    const queueSize = await this.getQueueLen(difficultyLevel);
    logger.info(
      `Queue size is ${queueSize} in ${difficultyLevel} queue`
    );
    // Check if queue is empty
    if (queueSize === 0) {
      logger.info(
        `Queue is empty in ${difficultyLevel} queue`
      );
      // Add user to the appropriate Redis queue
      const queuedUser: QueuedUser = { ...request, userId }; // Include userId in the request
      await this.addToQueue(difficultyLevel, queuedUser);

      logger.info(
        `User ${userId} added to ${difficultyLevel} queue. Queue size: ${await this.getQueueLen(difficultyLevel)}`
      );

      const timeout = setTimeout(() => {
        this.removeFromMatchingPool(userId, request);
        this.emit("match-timeout", this.connectedUsers.get(userId));
        this.removeConnection(userId);
        logger.info(`Match timeout for user ${userId}`);
      }, config.matchTimeout);

      this.matchTimeouts.set(userId, timeout);
      return;
    } else {
      logger.info(
        `Attempting match for user ${userId} in ${difficultyLevel} queue with queue size: ${queueSize}`
      );
  
      const queue = await this.getQueueItems(difficultyLevel);
  
      for (const item of queue) {
        const potentialMatch = JSON.parse(item);
    
        if (this.isCompatibleMatch(request, potentialMatch)) {
          const match: UserMatch = {
            difficultyLevel,
            category: category || potentialMatch.category || null,
          };
  
          this.removeFromMatchingPool(userId, request);
          this.removeFromMatchingPool(potentialMatch.userId, potentialMatch);
  
          // Clear the timeout for both users
          clearTimeout(this.matchTimeouts.get(userId));
          clearTimeout(this.matchTimeouts.get(potentialMatch.userId));
          this.matchTimeouts.delete(userId);
          this.matchTimeouts.delete(potentialMatch.userId);
  
          this.emit("match-success", {
            socket1Id: this.connectedUsers.get(userId),
            socket2Id: this.connectedUsers.get(potentialMatch.userId),
            match,
          });
  
          logger.info(
            `Match success: User ${userId} matched with ${potentialMatch.userId} in ${difficultyLevel} queue`
          );
  
          this.removeConnection(userId);
          this.removeConnection(potentialMatch.userId);
  
          return;
        }
      }
    }
  }

  async removeFromMatchingPool(
    userId: string,
    request: MatchRequest
  ): Promise<void> {
    const { difficultyLevel } = request;

    const queue = await this.getQueueItems(difficultyLevel);
    for (const item of queue) {
      const potentialUser = JSON.parse(item);
      if (potentialUser.userId === userId) {
        await this.removeFromQueue(difficultyLevel, potentialUser);
        logger.info(`User ${userId} removed from ${difficultyLevel} queue`);
        break;
      }
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
