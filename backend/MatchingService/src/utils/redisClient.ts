import { createClient } from "redis";
import logger from "./logger"; // Adjust the path based on your structure
import { config } from './config';

// Create a Redis client
const redisClient = createClient({
  url: "redis://redis:" + config.redis, // For local execution: url: "redis://localhost:" + config.redis,
});

// Connect to Redis
redisClient
  .connect()
  .then(() => {
    logger.info("Connected to Redis");
  })
  .catch((err) => {
    logger.error("Redis connection error:", err);
  });

// Handle errors
redisClient.on("error", (err) => {
  logger.error("Redis error:", err);
});

// Export the client for use in other modules
export default redisClient;
