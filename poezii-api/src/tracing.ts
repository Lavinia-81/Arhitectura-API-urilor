// tracing.ts

// În unele setup‑uri TypeScript, require nu este definit.
// Declarăm minimal pentru a evita erori fără a instala @types/node.
declare function require(name: string): any

// Declarație minimală pentru process.env (fără @types/node)
declare const process: { env: { [key: string]: string | undefined } }

// -------------------------------------------------------------
// Tipuri interne pentru a evita dependența directă de @types/opentelemetry
// -------------------------------------------------------------
type TracingSDK = {
  start(): void
}

type TracingNodeSDKCtor = new (config?: Record<string, unknown>) => TracingSDK
type InstrumentationFactory = (config?: Record<string, unknown>) => unknown[]
type TraceExporterCtor = new (config?: Record<string, unknown>) => unknown
type ResourceCtor = new (attrs?: Record<string, unknown>) => unknown
type SemanticResourceAttributesShape = Record<string, string>

// Variabile care vor fi populate din require() dacă modulele există
let NodeSDK: TracingNodeSDKCtor
let getNodeAutoInstrumentations: InstrumentationFactory
let OTLPTraceExporter: TraceExporterCtor
let Resource: ResourceCtor
let SemanticResourceAttributes: SemanticResourceAttributesShape

// -------------------------------------------------------------
// Încercăm să încărcăm modulele OpenTelemetry.
// Dacă nu sunt instalate → folosim fallback-uri minimaliste.
// -------------------------------------------------------------
try {
  const sdkNodeModule = require('@opentelemetry/sdk-node') as { NodeSDK: TracingNodeSDKCtor }
  const autoInstrumentationModule = require('@opentelemetry/auto-instrumentations-node') as {
    getNodeAutoInstrumentations: InstrumentationFactory
  }
  const traceExporterModule = require('@opentelemetry/exporter-trace-otlp-http') as {
    OTLPTraceExporter: TraceExporterCtor
  }
  const resourcesModule = require('@opentelemetry/resources') as { Resource: ResourceCtor }
  const semanticAttributesModule = require('@opentelemetry/semantic-conventions') as {
    SemanticResourceAttributes: SemanticResourceAttributesShape
  }

  // Modulele reale
  NodeSDK = sdkNodeModule.NodeSDK
  getNodeAutoInstrumentations = autoInstrumentationModule.getNodeAutoInstrumentations
  OTLPTraceExporter = traceExporterModule.OTLPTraceExporter
  Resource = resourcesModule.Resource
  SemanticResourceAttributes = semanticAttributesModule.SemanticResourceAttributes

} catch {
  // -------------------------------------------------------------
  // Fallback minimal — aplicația funcționează chiar dacă OTEL lipsește.
  // -------------------------------------------------------------
  NodeSDK = class {
    constructor(_config?: Record<string, unknown>) {}
    start(): void {}
  } as unknown as TracingNodeSDKCtor

  getNodeAutoInstrumentations = () => []
  OTLPTraceExporter = class {} as unknown as TraceExporterCtor
  Resource = class {
    constructor(_attrs?: Record<string, unknown>) {}
  } as unknown as ResourceCtor

  // Atribuim manual câteva constante semantice
  SemanticResourceAttributes = {
    SERVICE_NAME: 'service.name',
    SERVICE_VERSION: 'service.version',
    DEPLOYMENT_ENVIRONMENT: 'deployment.environment',
  }
}

// -------------------------------------------------------------
// Configurarea SDK-ului OpenTelemetry
// -------------------------------------------------------------
const sdk = new NodeSDK({
  // Metadata despre serviciu (apare în Grafana, Tempo, Jaeger etc.)
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'poezii-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),

  // Exporter OTLP → trimite trace-uri către collector
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
  }),

  // Auto-instrumentări pentru HTTP, Express și PostgreSQL
  instrumentations: getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-http': { enabled: true },
    '@opentelemetry/instrumentation-express': { enabled: true },
    '@opentelemetry/instrumentation-pg': { enabled: true },
  }),
})

// Pornim tracing-ul
sdk.start()
console.log('OpenTelemetry tracing started')
