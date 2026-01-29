const { Telegraf } = require('telegraf')
const http = require('http')

http.createServer((req, res) => res.end('OK')).listen(process.env.PORT || 3000)

const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

bot.start(ctx => ctx.reply('✅ البوت شغّال'))
bot.on('text', ctx => ctx.reply('📩 وصلت رسالتك'))

;(async () => {
  await bot.telegram.deleteWebhook()
  bot.launch({ dropPendingUpdates: true })
  console.log('Bot started')
})()
