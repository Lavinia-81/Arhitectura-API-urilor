// utils/slack.ts
export async function sendSlackAlert(title: string, message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    throw new Error('SLACK_WEBHOOK_URL is not defined')
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `*${title}*\n${message}`,
    }),
  })
}