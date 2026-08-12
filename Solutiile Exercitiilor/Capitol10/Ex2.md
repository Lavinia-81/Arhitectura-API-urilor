Ex2. Endpoint /metrics cu prom-client + histogram de latență

---

Instalare
```npm install prom-client```

---

Configurare metrics
```
// src/metrics.ts
import client from "prom-client";

export const register = new client.Registry();

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request latency",
  labelNames: ["method", "path", "status_code"],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2]
});

register.registerMetric(httpRequestDuration);
client.collectDefaultMetrics({ register });
```
---

Integrare în Fastify
```
// src/middlewares/metrics.ts
import { httpRequestDuration } from "../metrics";

export async function metricsMiddleware(app) {
  app.addHook("onResponse", async (req, reply) => {
    const duration = reply.getResponseTime() / 1000; // secunde
    httpRequestDuration.labels(req.method, req.url, String(reply.statusCode)).observe(duration);
  });

  app.get("/metrics", async (req, reply) => {
    const { register } = await import("../metrics");
    reply.header("Content-Type", register.contentType);
    return register.metrics();
  });
}
```
---

Rulezi local Prometheus + Grafana, pui Prometheus să scrape‑uiască /metrics, apoi în Grafana vizualizezi histogramul și p95.