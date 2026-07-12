// src/utils/logger.ts
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// Configurația logger-ului (folosită de Fastify)
export const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          messageFormat: '{msg}',
        },
      }
    : undefined,
  redact: {
    paths: ['apiKey', 'token', 'password', 'authorization', '*.keyHash'],
    censor: '[REDACTED]',
  },
};

// Instanța reală de logger (folosită manual în cod)
const pinoFactory = (pino as any).default ?? pino;
export const logger = pinoFactory(loggerConfig);
