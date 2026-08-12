// src/utils/logger.ts

import pino from 'pino';

// Detectăm dacă rulăm în modul development
const isDevelopment = process.env.NODE_ENV === 'development';

// Configurația logger-ului (folosită de Fastify)
export const loggerConfig = {
  // Nivelul de log (info, warn, error etc.)
  level: process.env.LOG_LEVEL || 'info',

  // În development folosim pino-pretty pentru loguri colorizate și lizibile
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,               // culori în terminal
          translateTime: 'SYS:standard',// timestamp uman
          ignore: 'pid,hostname',       // elimină zgomotul inutil
          messageFormat: '{msg}',       // afișează doar mesajul
        },
      }
    : undefined, // în producție logurile sunt JSON brut (pentru ELK, Datadog, Loki)

  // Redactarea automată a câmpurilor sensibile
  redact: {
    paths: [
      'apiKey',        // chei API
      'token',         // token-uri JWT
      'password',      // parole
      'authorization', // header Authorization
      '*.keyHash',     // hash-uri de chei API
    ],
    censor: '[REDACTED]', // valoarea înlocuită
  },
};

// Instanța reală de logger (folosită manual în cod)
// pino poate fi export default sau named export → normalizăm
const pinoFactory = (pino as any).default ?? pino;

// Logger-ul folosit în restul aplicației
export const logger = pinoFactory(loggerConfig);
