Ex3. OpenTelemetry + Jaeger local

-----

Instalare pachete de bază
```
npm install @opentelemetry/api @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-jaeger
```
-----

Configurare OpenTelemetry
```
// src/otel.ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";

const jaegerExporter = new JaegerExporter({
  endpoint: "http://localhost:14268/api/traces"
});

export const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()]
});
sdk.start();
```
-----

În index.ts:
```
import { sdk } from "./otel";
// apoi pornești Fastify
```
-----

Rulezi Jaeger local (Docker):
```
docker run -d --name jaeger \
  -p 16686:16686 -p 14268:14268 \
  jaegertracing/all-in-one
```
-----

Faci un request la API, apoi mergi la http://localhost:16686, cauți serviciul tău și vezi trace‑ul end‑to‑end.