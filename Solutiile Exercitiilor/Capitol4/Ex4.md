Ex4 — Benchmark: Express vs Fastify

-----
R1. Server Express
```
import express from "express";
const app = express();
app.get("/ping", (req, res) => res.json({ pong: true }));
app.listen(3001);
```
-----


R2. Server Fastify
```
import Fastify from "fastify";
const app = Fastify();
app.get("/ping", () => ({ pong: true }));
app.listen({ port: 3002 });
```
-----


R3. Benchmark cu autocannon
```
autocannon http://localhost:3001/ping
autocannon http://localhost:3002/ping
```
-----


R4. Rezultate tipice
```
Server	  req/s (aprox)	   Latency	      CPU
Express	   15k–20k	       mai mare	     mai mare
Fastify	   40k–50k	       mai mică	     mai eficient
```
Fastify câștigă detașat.