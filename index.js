const { Telegraf, Markup } = require('telegraf')
const http = require('http')

http.createServer((req, res) => res.end('OK')).listen(3000)

const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

bot.start(ctx => {
  ctx.reply(
    '✅ البوت شغال',
    Markup.inlineKeyboard([
      [Markup.button.callback('🔘 زر اختبار', 'test')]
    ])
  )
})

bot.action('test', ctx => {
  ctx.answerCbQuery('اشتغل الزر ✅')
  ctx.reply('🎉 الزر يشتغل بدون تعليق')
})

;(async () => {
  await bot.telegram.deleteWebhook()
  bot.launch()
  console.log('BOT READY')
})()

process.on('uncaughtException', e => console.log(e))
process.on('unhandledRejection', e => console.log(e))
