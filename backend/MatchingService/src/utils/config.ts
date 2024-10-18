export const config = {
    port: process.env.PORT ?? 3000,
    matchTimeout: parseInt(process.env.MATCH_TIMEOUT ?? '30000'),
    environment: process.env.NODE_ENV ?? 'development',
    redis: process.env.REDIS_PORT ?? 6379,
};
