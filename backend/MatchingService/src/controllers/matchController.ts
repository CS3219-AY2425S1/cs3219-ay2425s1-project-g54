import { EventEmitter } from "events";
import { MatchRequest, UserMatch, QueuedUser, Category } from "../utils/types";
import { config } from "../utils/config";
import logger from "../utils/logger";
import redisClient from "../utils/redisClient";
import { Mutex } from "async-mutex";

export class MatchController extends EventEmitter {
  private matchTimeouts: Map<string, NodeJS.Timeout>;
  private connectedUsers: Map<string, string>; // userId: socketId
  private userIdToUsername: Map<string, string>; // userId: username
  private queueMutex: Mutex;

  constructor() {
    super();
    this.matchTimeouts = new Map();
    this.connectedUsers = new Map();
    this.userIdToUsername = new Map();
    this.queueMutex = new Mutex();
  }

  addConnection(userId: string, username: string, socketId: string): boolean {
    if (this.connectedUsers.has(userId)) {
      logger.warn(
        `User ${username} (${userId}) already has an active connection`
      );
      return false;
    }
    this.connectedUsers.set(userId, socketId);
    this.userIdToUsername.set(userId, username);
    logger.info(
      `User ${username} (${userId}) connected. Total connections: ${this.connectedUsers.size}`
    );
    return true;
  }

  removeConnection(userId: string): void {
    const username = this.userIdToUsername.get(userId);
    this.connectedUsers.delete(userId);
    this.userIdToUsername.delete(userId);
    logger.info(
      `User ${username} (${userId}) disconnected. Total connections: ${this.connectedUsers.size}`
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

  private async removeFromQueue(
    difficultyLevel: string,
    queuedUser: QueuedUser
  ) {
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
    const username = this.userIdToUsername.get(userId);
    const queueSize = await this.getQueueLen(difficultyLevel);
    logger.info(`Queue size is ${queueSize} in ${difficultyLevel} queue`);
    // Check if queue is empty
    if (queueSize === 0) {
      // Add user to the appropriate Redis queue
      const queuedUser: QueuedUser = { ...request, userId }; // Include userId in the request
      await this.addToQueue(difficultyLevel, queuedUser);

      logger.info(
        `User ${username} (${userId}) added to ${difficultyLevel} queue. Queue size of ${difficultyLevel} queue: ${await this.getQueueLen(
          difficultyLevel
        )}`
      );

      const timeout = setTimeout(() => {
        this.removeFromMatchingPool(userId, request);
        this.emit("match-timeout", this.connectedUsers.get(userId));
        // this.removeConnection(userId);
        logger.info(`Match timeout for user ${username} (${userId})`);
        this.matchTimeouts.delete(userId);
      }, config.matchTimeout);

      this.matchTimeouts.set(userId, timeout);

      return;
    } else {
      logger.info(
        `Attempting match for user ${username} (${userId}) in ${difficultyLevel} queue with queue size: ${queueSize} before matching`
      );

      const queue = await this.getQueueItems(difficultyLevel);

      for (const item of queue) {
        const potentialMatch = JSON.parse(item);

        if (this.isCompatibleMatch(request, potentialMatch)) {
          const match: UserMatch = {
            difficultyLevel,
            category: category || potentialMatch.category || null,
          };
          if (!category && !potentialMatch.category) {
            logger.info(
              `Choosing a random category for ${username} (${userId}) and ${potentialMatch.userId}`
            );
            match.category = this.getRandomCategory();
          }
          await this.removeFromMatchingPool(userId, request);
          await this.removeFromMatchingPool(
            potentialMatch.userId,
            potentialMatch
          );

          // Clear the timeout for both users
          this.removeTimeout(userId);
          this.removeTimeout(potentialMatch.userId);

          this.emit("match-success", {
            socket1Id: this.connectedUsers.get(userId),
            socket2Id: this.connectedUsers.get(potentialMatch.userId),
            username1: this.userIdToUsername.get(userId),
            username2: this.userIdToUsername.get(potentialMatch.userId),
            match,
          });
          const potentialMatchUsername = this.userIdToUsername.get(
            potentialMatch.userId
          );
          logger.info(
            `Match success: User ${username} (${userId}) matched with ${potentialMatchUsername} (${
              potentialMatch.userId
            }) in ${difficultyLevel} queue.  Queue size of ${difficultyLevel} queue after match: ${await this.getQueueLen(
              difficultyLevel
            )}`
          );
          // Currently not removing connection upon match found for user in collaboration service
          // this.removeConnection(userId);
          // this.removeConnection(potentialMatch.userId);
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
        const newQueueLen = await this.getQueueLen(difficultyLevel);
        logger.info(
          `User ${userId} removed from ${difficultyLevel} queue. Queue size of ${difficultyLevel} queue : ${newQueueLen}`
        );
        break;
      }
    }
  }

  removeTimeout(userId: string): void {
    clearTimeout(this.matchTimeouts.get(userId));
    this.matchTimeouts.delete(userId);
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

  private getRandomCategory(): Category {
    const categories = Object.values(Category);
    const randomIndex = Math.floor(Math.random() * categories.length);
    return categories[randomIndex];
  }
}
