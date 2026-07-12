// monitoring/alerts.ts
// Try to use project logger if available; otherwise fall back to console-based logger
let logger: { warn: (...args: any[]) => void; info?: (...args: any[]) => void; error?: (...args: any[]) => void }
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // @ts-ignore
  const maybe = require('../utils/logger.js')
  logger = maybe.logger ?? maybe.default ?? maybe
} catch (e) {
  logger = {
    warn: (...args: any[]) => console.warn(...args),
    info: (...args: any[]) => console.info(...args),
    error: (...args: any[]) => console.error(...args),
  }
}

declare const process: {
  env: Record<string, string | undefined>
}

declare function getErrorRate(): Promise<number>
declare function getP95Latency(): Promise<number>
declare function getDbConnections(): Promise<number>

const MAX_CONNECTIONS = 100
const ALERT_WEBHOOK = process.env.SLACK_WEBHOOK_URL

export async function sendAlert(
  title: string,
  message: string,
  severity: 'critical' | 'warning' | 'info' = 'warning'
) {
  logger.warn({ severity, title, message }, 'Alert triggered')
  
  if (!ALERT_WEBHOOK) return
  
  const colors = {
    critical: '#ff0000',
    warning: '#ffaa00',
    info: '#00aa00',
  }
  
  await fetch(ALERT_WEBHOOK, {
    method: 'POST',
    body: JSON.stringify({
      attachments: [{
        color: colors[severity],
        title,
        text: message,
        footer: `Environment: ${process.env.NODE_ENV}`,
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  })
}

// Verificare periodică (de exemplu, la fiecare 5 minute)
export async function checkMetrics() {
  // În realitate, aceste valori vin din Prometheus
  const errorRate = await getErrorRate()
  const latency = await getP95Latency()
  const dbConnections = await getDbConnections()
  
  if (errorRate > 0.02) {
    await sendAlert(
      'High error rate',
      `Error rate is ${(errorRate * 100).toFixed(2)}% for the last 5 minutes`,
      'critical'
    )
  }
  
  if (latency > 800) {
    await sendAlert(
      'High latency',
      `p95 latency is ${latency}ms for the last 5 minutes`,
      'warning'
    )
  }
  
  if (dbConnections > 80) {
    await sendAlert(
      'High database connections',
      `Active connections: ${dbConnections} / ${MAX_CONNECTIONS}`,
      'warning'
    )
  }
}