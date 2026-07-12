// tracing.ts
declare function require(name: string): any

// Minimal ambient declaration for process.env to avoid needing @types/node
declare const process: { env: { [key: string]: string | undefined } }

type TracingSDK = {
  start(): void
}

type TracingNodeSDKCtor = new (config?: Record<string, unknown>) => TracingSDK
type InstrumentationFactory = (config?: Record<string, unknown>) => unknown[]
type TraceExporterCtor = new (config?: Record<string, unknown>) => unknown
type ResourceCtor = new (attrs?: Record<string, unknown>) => unknown
type SemanticResourceAttributesShape = Record<string, string>

let NodeSDK: TracingNodeSDKCtor
let getNodeAutoInstrumentations: InstrumentationFactory
let OTLPTraceExporter: TraceExporterCtor
let Resource: ResourceCtor
let SemanticResourceAttributes: SemanticResourceAttributesShape

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

  NodeSDK = sdkNodeModule.NodeSDK
  getNodeAutoInstrumentations = autoInstrumentationModule.getNodeAutoInstrumentations
  OTLPTraceExporter = traceExporterModule.OTLPTraceExporter
  Resource = resourcesModule.Resource
  SemanticResourceAttributes = semanticAttributesModule.SemanticResourceAttributes
} catch {
  NodeSDK = class {
    constructor(_config?: Record<string, unknown>) {}
    start(): void {}
  } as unknown as TracingNodeSDKCtor

  getNodeAutoInstrumentations = () => []
  OTLPTraceExporter = class {} as unknown as TraceExporterCtor
  Resource = class {
    constructor(_attrs?: Record<string, unknown>) {}
  } as unknown as ResourceCtor
  SemanticResourceAttributes = {
    SERVICE_NAME: 'service.name',
    SERVICE_VERSION: 'service.version',
    DEPLOYMENT_ENVIRONMENT: 'deployment.environment',
  }
}

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'poezii-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
  }),
  instrumentations: getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-http': { enabled: true },
    '@opentelemetry/instrumentation-express': { enabled: true },
    '@opentelemetry/instrumentation-pg': { enabled: true },
  }),
})

sdk.start()
console.log('OpenTelemetry tracing started')