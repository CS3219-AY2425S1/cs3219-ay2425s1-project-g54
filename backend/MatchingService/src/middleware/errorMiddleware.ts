import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const errorMiddleware = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
};