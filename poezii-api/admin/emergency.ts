// admin/emergency.ts

declare const app: any
declare const prisma: any
declare const redis: any
declare const verifyEmergencyToken: (token: any) => Promise<boolean>
declare const sendSlackAlert: (payload: any) => Promise<void>

app.post('/admin/incident/contain', async (request: any, reply: any) => {
  const { action, target, reason } = request.body
  
  // Verificare autorizare – doar admini cu token special
  const isAuthorized = await verifyEmergencyToken(request.headers['x-emergency-token'])
  if (!isAuthorized) {
    return reply.status(403).send({ error: 'Unauthorized' })
  }
  
  switch (action) {
    case 'revoke_key':
      await prisma.apiKey.update({
        where: { keyHash: target },
        data: { revokedAt: new Date(), revocationReason: reason },
      })
      break
      
    case 'block_ip':
      await redis.sadd('blocked_ips', target)
      await redis.expire('blocked_ips', 3600) // 1 oră
      break
      
    case 'global_throttle':
      await redis.set('global_rate_limit_per_minute', target)
      break
      
    case 'readonly_mode':
      await redis.set('readonly_mode', 'true')
      break
  }
  
  // Notificare echipa
  await sendSlackAlert({
    channel: '#incidents',
    text: `Emergency action: ${action} on ${target}`,
    reason,
    actor: request.user?.id,
  })
  
  reply.send({ status: 'containment applied', action, timestamp: new Date().toISOString() })
})