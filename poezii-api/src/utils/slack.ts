// utils/slack.ts

/**
 * Trimite un mesaj către Slack folosind un Incoming Webhook.
 * Folosit pentru alerte critice: rate limiting, scraping, erori server etc.
 */
export async function sendSlackAlert(title: string, message: string): Promise<void> {
  // Webhook-ul Slack trebuie să fie definit în variabilele de mediu
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    throw new Error('SLACK_WEBHOOK_URL is not defined')
  }

  // Trimitem mesajul către Slack
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },

    // Slack acceptă payload-uri simple cu câmpul "text"
    body: JSON.stringify({
      text: `*${title}*\n${message}`, // bold + newline
    }),
  })
}
