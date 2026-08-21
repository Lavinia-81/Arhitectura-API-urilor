// monitoring/alerts.ts

// Folosește logger-ul proiectului dacă există; altfel, folosește logger-ul consolei
let logger: { warn: (...args: any[]) => void; info?: (...args: any[]) => void; error?: (...args: any[]) => void }

try {
  // Încearcă să importe logger-ul custom din proiect
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // @ts-ignore
  const maybe = require('../utils/logger.js')

  // Dacă modulul exportă logger, îl folosește; altfel fallback la default sau modulul în sine
  logger = maybe.logger ?? maybe.default ?? maybe
} catch (e) {
  // Dacă importul eșuează, folosește logger-ul consolei
  logger = {
    warn: (...args: any[]) => console.warn(...args),
    info: (...args: any[]) => console.info(...args),
    error: (...args: any[]) => console.error(...args),
  }
}

// Declarații pentru variabile globale (simulate)
declare const process: {
  env: Record<string, string | undefined>
}

// Funcții care returnează metrici (în realitate ar veni din Prometheus)
declare function getErrorRate(): Promise<number>
declare function getP95Latency(): Promise<number>
declare function getDbConnections(): Promise<number>

// Prag maxim pentru conexiuni DB
const MAX_CONNECTIONS = 100

// Webhook-ul Slack unde se trimit alertele
const ALERT_WEBHOOK = process.env.SLACK_WEBHOOK_URL

// Funcție care trimite o alertă către Slack
export async function sendAlert(
  title: string,
  message: string,
  severity: 'critical' | 'warning' | 'info' = 'warning'
) {
  // Log intern pentru debugging
  logger.warn({ severity, title, message }, 'Alert triggered')
  
  // Dacă nu există webhook, nu trimite nimic
  if (!ALERT_WEBHOOK) return
  
  // Culori diferite în funcție de severitate
  const colors = {
    critical: '#ff0000',
    warning: '#ffaa00',
    info: '#00aa00',
  }
  
  // Trimite payload-ul către Slack
  await fetch(ALERT_WEBHOOK, {
    method: 'POST',
    body: JSON.stringify({
      attachments: [{
        color: colors[severity],
        title,
        text: message,
        footer: `Environment: ${process.env.NODE_ENV}`,
        ts: Math.floor(Date.now() / 1000), // timestamp Slack
      }],
    }),
  })
}

// Funcție care verifică metricile periodic (ex: la fiecare 5 minute)
export async function checkMetrics() {
  // Într-un sistem real, aceste valori ar veni din Prometheus sau alt sistem de monitorizare
  const errorRate = await getErrorRate()
  const latency = await getP95Latency()
  const dbConnections = await getDbConnections()
  
  // Dacă rata de erori depășește 2%, trimite alertă critică
  if (errorRate > 0.02) {
    await sendAlert(
      'High error rate',
      `Error rate is ${(errorRate * 100).toFixed(2)}% for the last 5 minutes`,
      'critical'
    )
  }
  
  // Dacă p95 latency depășește 800ms, trimite alertă de warning
  if (latency > 800) {
    await sendAlert(
      'High latency',
      `p95 latency is ${latency}ms for the last 5 minutes`,
      'warning'
    )
  }
  
  // Dacă conexiunile DB depășesc 80, trimite alertă
  if (dbConnections > 80) {
    await sendAlert(
      'High database connections',
      `Active connections: ${dbConnections} / ${MAX_CONNECTIONS}`,
      'warning'
    )
  }
}
