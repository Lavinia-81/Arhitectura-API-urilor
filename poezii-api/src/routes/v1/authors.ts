// src/routes/v1/authors.ts

import { FastifyInstance } from 'fastify'
import * as authorController from '../../controllers/author.controller.js'

const {
  getAuthorsHandler,
  getAuthorByIdHandler,
  getAuthorBySlugHandler,
} = authorController

const getAuthorPoemsHandler = (authorController as any).getAuthorPoemsHandler
  ?? (authorController as any).getAuthorPoems
  ?? (authorController as any).getAuthorPopularPoemsHandler
  ?? (authorController as any).getAuthorPopularPoems

const fulltextSearchHandler = (authorController as any).fulltextSearchHandler
  ?? (authorController as any).fulltextSearch

export async function authorRoutes(app: FastifyInstance) {
  
  // GET /v1/authors - Lista poeților
  app.get('/authors', {
    schema: {
      tags: ['Authors'],
      summary: 'Lista poeților',
      description: 'Obține o listă paginată de poeți cu căutare și filtrare după secol.',
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Caută în numele poetului' },
          century: { type: 'integer', minimum: 1, maximum: 21, description: 'Filtrare după secol (ex: 19)' },
          page: { type: 'integer', default: 1, description: 'Numărul paginii' },
          limit: { type: 'integer', default: 10, maximum: 100, description: 'Rezultate pe pagină' },
          sortBy: { type: 'string', enum: ['name', 'birthYear', 'deathYear'], default: 'name', description: 'Câmp pentru sortare' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc', description: 'Direcția de sortare' },
        },
      },
      response: {
        200: {
          type: 'object',
          description: 'Lista de poeți returnată cu succes',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  birthYear: { type: 'integer' },
                  deathYear: { type: 'integer' },
                  popularity: { type: 'integer' }
                }
              }
            },
            count: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            _links: {
              type: 'object',
              properties: {
                self: {
                  type: 'object',
                  properties: {
                    href: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, getAuthorsHandler)

  

  // GET /v1/authors/:id - Detaliile unui poet (după ID)
  app.get('/authors/:id', {
    schema: {
      tags: ['Authors'],
      summary: 'Detaliile unui poet (după ID)',
      description: 'Obține informațiile complete ale unui poet folosind ID-ul numeric.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID-ul numeric al poetului' },
        },
      },
      response: {
        200: {
          type: 'object',
          description: 'Detaliile poetului',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            slug: { type: 'string' },
            birthYear: { type: 'integer' },
            deathYear: { type: 'integer' },
            popularity: { type: 'integer' }
          }
        },
        404: {
          type: 'object',
          description: 'Poetul nu a fost găsit',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      },
    },
  }, getAuthorByIdHandler)
  

  // GET /v1/authors/slug/:slug - Detaliile unui poet (după slug)
  app.get('/authors/slug/:slug', {
    schema: {
      tags: ['Authors'],
      summary: 'Detaliile unui poet (după slug)',
      description: 'Obține informațiile complete ale unui poet folosind slug-ul URL-prietenos.',
      params: {
        type: 'object',
        required: ['slug'],
        properties: {
          slug: { type: 'string', pattern: '^[a-z0-9\\-]+$', description: 'Slug-ul poetului (ex: "mihai-eminescu")' },
        },
      },
      response: {
        200: {
          type: 'object',
          description: 'Detaliile poetului',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            slug: { type: 'string' },
            birthYear: { type: 'integer' },
            deathYear: { type: 'integer' },
            popularity: { type: 'integer' }
          }
        },
        404: {
          type: 'object',
          description: 'Poetul nu a fost găsit',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      },
    },
  }, getAuthorBySlugHandler)
  

  // GET /v1/authors/:id/poems - Poeziile unui poet
  app.get('/authors/:id/poems', {
    schema: {
      tags: ['Authors'],
      summary: 'Poeziile unui poet',
      description: 'Obține toate poeziile unui poet, cu paginare.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID-ul poetului' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10, maximum: 100 },
          includeFullText: { type: 'boolean', default: false, description: 'Include textul integral (doar PRO)' },
        },
      },
      response: {
        200: {
          type: 'object',
          description: 'Lista de poezii returnată cu succes',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  title: { type: 'string' },
                  slug: { type: 'string' },
                  year: { type: 'integer' },
                  popularity: { type: 'integer' }
                }
              }
            },
            count: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            _links: {
              type: 'object',
              properties: {
                self: {
                  type: 'object',
                  properties: {
                    href: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        404: {
          type: 'object',
          description: 'Poetul nu a fost găsit',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      },
    },
  }, getAuthorPoemsHandler)
  

  // GET /v1/authors/:id/poems/popular - Cele mai populare poezii ale unui poet
  app.get('/authors/:id/poems/popular', {
    schema: {
      tags: ['Authors'],
      summary: 'Cele mai populare poezii ale unui poet',
      description: 'Obține topul poeziilor celui mai citit poet.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID-ul poetului' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 5, maximum: 20, description: 'Numărul de rezultate' },
        },
      },
      response: {
        200: {
          type: 'object',
          description: 'Lista returnată cu succes',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  title: { type: 'string' },
                  slug: { type: 'string' },
                  year: { type: 'integer' },
                  popularity: { type: 'integer' }
                }
              }
            }
          }
        },
        404: {
          type: 'object',
          description: 'Poetul nu a fost găsit',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      },
    },
  }, getAuthorPoemsHandler)


  app.get('/search/fulltext', {
    schema: {
      tags: ['Search'],
      querystring: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', minLength: 1 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  title: { type: 'string' },
                  slug: { type: 'string' },
                  author: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      name: { type: 'string' },
                      slug: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, fulltextSearchHandler)
}
    
