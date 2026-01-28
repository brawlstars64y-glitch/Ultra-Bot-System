const bedrock = require('bedrock-protocol')

const client = bedrock.createClient({
  host: 'IP_HERE',
  port: 19132,
  username: 'BotPlayer',
  offline: true
})

client.on('spawn', () => {
  console.log('✅ البوت دخل السيرفر')

  // Anti-AFK بسيط
  setInterval(() => {
    client.queue('command_request', {
      command: 'tp @s ~ ~ ~',
      origin: { type: 0 },
      internal: false
    })
  }, 30000)
})

client.on('disconnect', r => {
  console.log('❌ فصل:', r)
})

client.on('error', err => {
  console.log('⚠️ خطأ:', err.message)
})
