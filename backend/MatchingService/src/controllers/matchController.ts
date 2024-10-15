import { EventEmitter } from "events";
import {
  MatchRequest,
  UserMatch,
  QueuedUser,
  DifficultyLevel,
} from "../utils/types";
import { Kafka } from "kafkajs";
import { EachMessagePayload } from "kafkajs";
import { config } from "../utils/config";
import logger from "../utils/logger";

export class MatchController extends EventEmitter {
  private kafka: Kafka;
  private producer: any;
  private consumer: any;
  private matchTimeouts: Map<string, NodeJS.Timeout>;

  constructor() {
    super();

    // Initialize Kafka
    this.kafka = new Kafka({
      clientId: "matchmaking-service",
      brokers: ["localhost:29092"], // Set your Kafka broker here
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: "matchmaking-group" });

    this.matchTimeouts = new Map();

    this.initializeKafka();
  }

  // Initialize Kafka producer and consumer
  async initializeKafka(): Promise<void> {
    await this.producer.connect();
    await this.consumer.connect();
    await this.startConsumers();
  }

  async addToMatchingPool(
    userId: string,
    request: MatchRequest
  ): Promise<void> {
    const { difficultyLevel } = request;

    // Prepare the user to be sent to the Kafka topic
    const queuedUser: QueuedUser = { ...request, userId }; // Include userId in the request

    // Send the user to the appropriate Kafka topic (EASY, MEDIUM, HARD)
    await this.producer.send({
      topic: difficultyLevel.toLowerCase(), // Use the difficulty level as the topic name
      messages: [{ value: JSON.stringify(queuedUser) }],
    });

    logger.info(`User ${userId} added to ${difficultyLevel} Kafka queue`);

    const timeout = setTimeout(() => {
      this.removeFromMatchingPool(userId, request);
      this.emit("match-timeout", userId);
      logger.info(`Match timeout for user ${userId}`);
    }, config.matchTimeout);

    this.matchTimeouts.set(userId, timeout);
  }

  // Kafka Consumer: Start listening to the Kafka topics (easy, medium, hard)
  async startConsumers(): Promise<void> {
    const difficulties = ["easy", "medium", "hard"];

    // First, subscribe to all topics before running the consumer
    for (const difficulty of difficulties) {
      try {
        await this.consumer.subscribe({ topic: difficulty });
        logger.info(`Subscribed to Kafka topic ${difficulty}`);
      } catch (error) {
        const errorMessage =
          (error as Error).message || "startconsumer function error occurred";
        logger.error(
          `Error subscribing to Kafka topic ${difficulty}: ${errorMessage}`
        );
      }
    }

    // Now, start running the consumer to listen for messages from all topics
    try {
      await this.consumer.run({
        eachMessage: async ({
          topic,
          partition,
          message,
        }: {
          topic: string;
          partition: number;
          message: { value: Buffer | null };
        }) => {
          if (message.value) {
            const queuedUser: QueuedUser = JSON.parse(message.value.toString());
            logger.info(
              `Processing user ${queuedUser.userId} from ${topic} queue`
            );

            // Try to match the user
            const matchResult = await this.tryMatch(
              queuedUser,
              topic.toUpperCase()
            );

            if (matchResult) {
              const { user1Id, user2Id, match } = matchResult;

              // Emit the successful match
              this.emit("match-success", { user1Id, user2Id, match });
              logger.info(
                `Match success: User ${user1Id} matched with ${user2Id} in ${topic} queue`
              );
            }
          } else {
            logger.warn(`Received message with null value from topic ${topic}`);
          }
        },
      });
      logger.info("Kafka consumer running for all topics.");
    } catch (error) {
      const errorMessage =
        (error as Error).message || "startconsumer function error occurred";
      logger.error(`Error running Kafka consumer: ${errorMessage}`);
    }
  }
  // Remove the user from the Kafka queue (timeout handling)
  async removeFromMatchingPool(
    userId: string,
    request: MatchRequest
  ): Promise<void> {
    const timeout = this.matchTimeouts.get(userId);

    if (timeout) {
      clearTimeout(timeout);
      this.matchTimeouts.delete(userId);
    }
    logger.info(`User ${userId} removed from matching pool.`);
  }

  async tryMatch(
    queuedUser: QueuedUser,
    difficultyLevel: string
  ): Promise<{ user1Id: string; user2Id: string; match: UserMatch } | null> {
    logger.info(
      `Attempting match for user ${queuedUser.userId} in ${difficultyLevel} queue`
    );

    // Fetch the next user from the Kafka topic
    const potentialMatch = await this.fetchNextUserFromKafka(
      queuedUser,
      difficultyLevel
    );

    if (potentialMatch) {
      const match: UserMatch = {
        difficultyLevel: difficultyLevel.toUpperCase() as DifficultyLevel,
        category: queuedUser.category || potentialMatch.category || null,
      };

      this.removeFromMatchingPool(queuedUser.userId, queuedUser);
      this.removeFromMatchingPool(potentialMatch.userId, potentialMatch);

      return {
        user1Id: queuedUser.userId,
        user2Id: potentialMatch.userId,
        match,
      };
    }

    return null;
  }

  async fetchNextUserFromKafka(
    queuedUser: QueuedUser,
    difficultyLevel: string
  ): Promise<QueuedUser | null> {
    const consumer = this.kafka.consumer({
      groupId: `matching-group-${difficultyLevel}`,
    });

    try {
      // Connect the consumer to the Kafka broker
      await consumer.connect();
      await consumer.subscribe({
        topic: difficultyLevel.toLowerCase(),
        fromBeginning: true,
      });

      let matchedUser: QueuedUser | null = null;

      // Fetch and process each message
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          // Check if message.value is not null
          if (message.value) {
            // Parse the message to get the next user in the queue
            const potentialMatch: QueuedUser = JSON.parse(
              message.value.toString()
            );

            // Skip if it's the same user (to avoid self-matching)
            if (potentialMatch.userId === queuedUser.userId) {
              return; // Continue to the next user
            }

            // Check if this user is compatible using your match logic
            if (this.isCompatibleMatch(queuedUser, potentialMatch)) {
              matchedUser = potentialMatch;

              // Since we've found a match, we can stop consuming further
              await consumer.stop();
            }
          } else {
            logger.warn(`Received a message with null value in topic ${topic}`);
          }
        },
      });

      return matchedUser;
    } catch (error) {
      const errorMessage = (error as Error).message || "Unknown error occurred";
      logger.error(`Error while fetching users from Kafka: ${errorMessage}`);
      return null;
    } finally {
      // Disconnect the consumer after processing
      await consumer.disconnect();
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

  // Ensure proper shutdown of Kafka producers and consumers
  async shutdownKafka(): Promise<void> {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }
}
