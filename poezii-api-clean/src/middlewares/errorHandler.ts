// src/middlewares/errorHandler.ts

import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { logger } from '../utils/logger.js'

// ============================================
// 1. Handler global pentru erori
// ============================================

/**
 * Handler global de erori pentru Poezii API.
 * 
 * Prinde toate erorile neașteptate și le transformă în răspunsuri JSON.
 * Gestionează special:
 * - Erorile Zod (validare)
 * - Erorile Prisma (bază de date)
 * - Erorile generice
 */
export function setupErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    // Logăm eroarea completă (doar în development)
    if (process.env.NODE_ENV === 'development') {
      logger.error({ 
        error, 
        url: request.url, 
        method: request.method,
        body: request.body,
        params: request.params,
        query: request.query,
      }, 'Eroare în handler-ul global')
    } else {
      // În producție, logăm mai puține informații (securitate)
      logger.error({ 
        message: error.message, 
        statusCode: error.statusCode,
        url: request.url, 
        method: request.method,
      }, 'Eroare în handler-ul global')
    }
    
    // ============================================
    // 2. Erori Zod (validare)
    // ============================================
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: 'Datele trimise nu sunt valide.',
        details: formattedErrors,
      })
    }
    
    // ============================================
    // 3. Erori Prisma (bază de date)
    // ============================================
    
    // Înregistrare duplicată (unique constraint violation)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const field = error.meta?.target as string[]
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: `O resursă cu acest ${field?.join(', ')} există deja.`,
        })
      }
      
      // Înregistrare inexistentă (foreign key violation)
      if (error.code === 'P2003') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Resursa asociată nu există.',
        })
      }
      
      // Înregistrare negăsită
      if (error.code === 'P2025') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Resursa nu a fost găsită.',
        })
      }
    }
    
    // ============================================
    // 4. Erori de business (aruncate de noi în service)
    // ============================================
    if (error.message?.includes('nu există') || error.message?.includes('not found')) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: error.message,
      })
    }
    
    // ============================================
    // 5. Erori generice (fallback)
    // ============================================
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.statusCode === 500 ? 'Internal Server Error' : error.name,
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'A apărut o eroare internă. Vă rugăm să încercați mai târziu.',
    })
  })
}