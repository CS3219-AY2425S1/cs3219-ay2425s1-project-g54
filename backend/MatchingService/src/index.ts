import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './utils/config';
import logger from './utils/logger';
import { errorMiddleware } from './middleware/errorMiddleware';
import { initializeSocketHandlers } from './sockets/handlers';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: `${process.env.FRONTEND_ENDPOINT}`, //config.corsOrigin? This should be set to frontend domain
        methods: ["GET", "POST"]
    },
    path: "/matching/socket",
    allowUpgrades: false,
});

// Middleware
app.use(express.json());
app.use(errorMiddleware);

// Initialize socket handlers
initializeSocketHandlers(io);

httpServer.listen(config.port, () => {
    logger.info(`Matching service listening on port ${config.port}`);
});