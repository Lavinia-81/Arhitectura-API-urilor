// src/routes/v1/poems.ts

import { FastifyInstance } from 'fastify'
import {
  getPoemsHandler,
  getPoemByIdHandler,
  getPoemBySlugHandler,
  getPopularPoemsHandler,
  createPoemHandler,
  updatePoemHandler,
  deletePoemHandler,
  getPoemTextHandler,
} from '../../controllers/poem.controller.js'

export async function poemRoutes(app: FastifyInstance) {
  
  // GET /v1/poems - Lista poeziilor
  app.get('/poems', {
    schema: {
      tags: ['Poems'],
      summary: 'Lista poeziilor',
      description: 'Obține o listă paginată de poezii cu filtrare, căutare și sortare.',
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Caută în titlu sau text' },
          authorSlug: { type: 'string', description: 'Filtrare după autor (slug)' },
          type: { type: 'string', enum: ['pastel', 'baladă', 'sonet', 'elegie', 'meditație', 'epigramă'], description: 'Filtrare după genul poetic' },
          yearMin: { type: 'integer', minimum: 0, description: 'Anul minim' },
          yearMax: { type: 'integer', description: 'Anul maxim' },
          page: { type: 'integer', default: 1, description: 'Numărul paginii' },
          limit: { type: 'integer', default: 10, maximum: 100, description: 'Rezultate pe pagină' },
          sortBy: { type: 'string', enum: ['title', 'year', 'popularity', 'createdAt'], default: 'popularity', description: 'Câmp pentru sortare' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Direcția de sortare' },
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
              items: { type: 'object' }
            },
            pagination: {
              type: 'object',
              properties: {},
              description: 'Metadate de paginare'
            },
            _links: {
              type: 'object',
              properties: {},
              description: 'Link-uri HATEOAS'
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        429: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
  }, getPoemsHandler)

  
  // GET /v1/poems/popular - Cele mai populare poezii
  app.get('/poems/popular', {
    schema: {
      tags: ['Poems'],
      summary: 'Cele mai populare poezii',
      description: 'Obține lista celor mai accesate poezii (pentru pagina principală).',
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 10, maximum: 50, description: 'Numărul de rezultate' },
          includeFullText: { type: 'boolean', default: false, description: 'Include textul integral (doar PRO)' },
        },
      },
      response: {
        200: {
          type: 'object',
          description: 'Lista returnată cu succes',
          properties: {
            data: {
              type: 'array',
              items: { type: 'object' }
            },
            count: {
              type: 'integer'
            },
            _links: {
              type: 'object',
              properties: {}
            }
          }
        }
      }
    },
  }, getPopularPoemsHandler)

  
  // GET /v1/poems/:id - Detaliile unei poezii (după ID)
  app.get('/poems/:id', {
    schema: {
      tags: ['Poems'],
      summary: 'Detaliile unei poezii (după ID)',
      description: 'Obține informațiile complete ale unei poezii folosind ID-ul numeric.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID-ul numeric al poeziei' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          includeFullText: { type: 'boolean', default: false, description: 'Include textul integral (doar PRO)' },
        },
      },
      response: {
        200: {
          type: 'object',
          description: 'Detaliile poeziei',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            slug: { type: 'string' },
            type: { type: 'string' },
            year: { type: 'integer' },
            summary: { type: 'string' },
            keywords: { type: 'string' },
            fullText: { type: 'string' },
            popularity: { type: 'integer' },
            author: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                slug: { type: 'string' }
              }
            },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          description: 'Poezia nu a fost găsită',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
  }, getPoemByIdHandler)
 
  
  // GET /v1/poems/slug/:slug - Detaliile unei poezii (după slug)
  app.get('/poems/slug/:slug', {
    schema: {
      tags: ['Poems'],
      summary: 'Detaliile unei poezii (după slug)',
      description: 'Obține informațiile complete ale unei poezii folosind slug-ul URL-prietenos.',
      params: {
        type: 'object',
        required: ['slug'],
        properties: {
          slug: { type: 'string', pattern: '^[a-z0-9\\-]+$', description: 'Slug-ul poeziei (ex: "luceafarul")' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          includeFullText: { type: 'boolean', default: false, description: 'Include textul integral (doar PRO)' },
        },
      },
      response: {
        200: {
          type: 'object',
          description: 'Detaliile poeziei',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            slug: { type: 'string' },
            type: { type: 'string' },
            year: { type: 'integer' },
            summary: { type: 'string' },
            keywords: { type: 'string' },
            fullText: { type: 'string' },
            popularity: { type: 'integer' },
            author: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                slug: { type: 'string' }
              }
            },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          description: 'Poezia nu a fost găsită',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
  }, getPoemBySlugHandler)

  
  // POST /v1/admin/poems - Crearea unei poezii (admin)
  app.post('/admin/poems', {
    schema: {
      tags: ['Admin'],
      summary: 'Crează o poezie nouă',
      description: 'Adaugă o poezie nouă în baza de date. Necesită plan PRO.',
      body: {
        type: 'object',
        required: ['title', 'slug', 'authorId'],
        properties: {
          title: { type: 'string', description: 'Titlul poeziei' },
          slug: { type: 'string', pattern: '^[a-z0-9\\-]+$', description: 'Slug-ul unic' },
          type: { type: 'string', enum: ['pastel', 'baladă', 'sonet', 'elegie', 'meditație', 'epigramă'], description: 'Genul poetic' },
          year: { type: 'integer', description: 'Anul publicării' },
          summary: { type: 'string', description: 'Rezumat sau context' },
          keywords: { type: 'string', description: 'Cuvinte cheie (separate prin virgulă)' },
          fullText: { type: 'string', description: 'Textul integral al poeziei' },
          authorId: { type: 'integer', description: 'ID-ul autorului' },
        },
      },
      response: {
        201: {
          type: 'object',
          description: 'Poezie creată cu succes',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            slug: { type: 'string' },
            type: { type: 'string' },
            year: { type: 'integer' },
            summary: { type: 'string' },
            keywords: { type: 'string' },
            fullText: { type: 'string' },
            authorId: { type: 'integer' },
            _links: {
              type: 'object',
              properties: {
                self: {
                  type: 'object',
                  properties: {
                    href: { type: 'string' }
                  }
                },
                selfSlug: {
                  type: 'object',
                  properties: {
                    href: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        403: {
          type: 'object',
          description: 'Acces interzis (necesită plan PRO)',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        409: {
          type: 'object',
          description: 'Conflict – slug-ul există deja',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
  }, createPoemHandler)

  
  // PUT /v1/admin/poems/:id - Actualizarea unei poezii (admin)
  app.put('/admin/poems/:id', {
    schema: {
      tags: ['Admin'],
      summary: 'Actualizează o poezie',
      description: 'Modifică o poezie existentă. Necesită plan PRO.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID-ul poeziei' },
        },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          slug: { type: 'string', pattern: '^[a-z0-9\\-]+$' },
          type: { type: 'string', enum: ['pastel', 'baladă', 'sonet', 'elegie', 'meditație', 'epigramă'] },
          year: { type: 'integer' },
          summary: { type: 'string' },
          keywords: { type: 'string' },
          fullText: { type: 'string' },
          authorId: { type: 'integer' },
        },
      },
      response: {
        200: {
          type: 'object',
          description: 'Poezie actualizată cu succes',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            slug: { type: 'string' },
            type: { type: 'string' },
            year: { type: 'integer' },
            summary: { type: 'string' },
            keywords: { type: 'string' },
            fullText: { type: 'string' },
            authorId: { type: 'integer' },
            _links: {
              type: 'object',
              properties: {
                self: {
                  type: 'object',
                  properties: {
                    href: { type: 'string' }
                  }
                },
                selfSlug: {
                  type: 'object',
                  properties: {
                    href: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        403: {
          type: 'object',
          description: 'Acces interzis (necesită plan PRO)',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          description: 'Poezia nu a fost găsită',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
  }, updatePoemHandler)

  
  // DELETE /v1/admin/poems/:id - Ștergerea unei poezii (admin)
  app.delete('/admin/poems/:id', {
    schema: {
      tags: ['Admin'],
      summary: 'Șterge o poezie',
      description: 'Elimină o poezie din baza de date. Necesită plan PRO.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID-ul poeziei' },
        },
      },
      response: {
        204: {
          type: 'null',
          description: 'Poezie ștearsă cu succes'
        },
        403: {
          type: 'object',
          description: 'Acces interzis (necesită plan PRO)',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          description: 'Poezia nu a fost găsită',
          properties: {
            statusCode: { type: 'integer' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
  }, deletePoemHandler)

  
  app.get('/poems/:id/text', {
    schema: {
      tags: ['Poems'],
      summary: 'Textul integral al unei poezii',
      description: 'Obține textul integral al unei poezii folosind ID-ul numeric.',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID-ul numeric al poeziei' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            fullText: { type: 'string' }
          }
        }
      }
    }
  }, getPoemTextHandler)
}
