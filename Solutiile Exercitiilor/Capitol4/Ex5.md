Ex5 — API complet: Fastify + Prisma + PostgreSQL

-----

Structura pe straturi
```
src/
  controllers/
  services/
  repositories/
  routes/
  middlewares/
  errors/
```
-----

Repository — works.repository.ts
```
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const WorksRepository = {
  findAll() {
    return prisma.work.findMany();
  },
  findById(id: string) {
    return prisma.work.findUnique({ where: { id } });
  },
  create(data) {
    return prisma.work.create({ data });
  },
  update(id: string, data) {
    return prisma.work.update({ where: { id }, data });
  },
  delete(id: string) {
    return prisma.work.delete({ where: { id } });
  }
};
```
-----

Service — works.service.ts
```
import { WorksRepository } from "../repositories/works.repository";
import { ApiError } from "../errors/api.error";

export const WorksService = {
  async getById(id: string) {
    const work = await WorksRepository.findById(id);
    if (!work) throw new ApiError("ERR_NOT_FOUND", "Lucrarea nu există", 404);
    return work;
  },

  async create(data) {
    if (!data.title || !data.author) {
      throw new ApiError("ERR_VALIDATION", "Titlu și autor sunt obligatorii", 400);
    }
    return WorksRepository.create(data);
  }
};
```
-----

Controller — works.controller.ts
```
import { WorksService } from "../services/works.service";

export async function getWorkById(req, reply) {
  const work = await WorksService.getById(req.params.id);
  return reply.send({ data: work });
}

export async function createWork(req, reply) {
  const work = await WorksService.create(req.body);
  return reply.code(201).send({ data: work });
}
```
-----

Routes — works.routes.ts
```
export default async function (app) {
  app.get("/works", async () => WorksRepository.findAll());
  app.get("/works/:id", getWorkById);
  app.post("/works", createWork);
  app.put("/works/:id", async (req) => WorksRepository.update(req.params.id, req.body));
  app.delete("/works/:id", async (req) => WorksRepository.delete(req.params.id));
}
```
-----

Loguri structurate cu Pino
```
import Fastify from "fastify";
const app = Fastify({ logger: true });
```
-----

Cache Redis pentru GET /works/:id
```
import { getCachedOrFetch } from "../cache/redis";
export async function getWorkById(req, reply) {
  const work = await getCachedOrFetch(`work:${req.params.id}`, () =>
    WorksService.getById(req.params.id)
  );

  return reply.send({ data: work });
}
```