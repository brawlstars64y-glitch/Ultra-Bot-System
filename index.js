const { Telegraf, Markup } = require('telegraf')
const http = require('http')

// ====== Keep Alive (Railway) ======
http.createServer((req, res) => {
  res.end('OK')
}).listen(process.env.PORT || 3000)

// ====== BOT ======
const TOKEN = '8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ'
const bot = new Telegraf(TOKEN)

// تخزين مؤقت (RAM)
const servers = {}

// ====== START / MAIN MENU ======
async function mainMenu(ctx) {
  await ctx.reply(
    '🎮 *لوحة التحكم*\nاختر خيار:',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('➕ إضافة سيرفر', 'add_server')],
        [Markup.button.callback('📂 سيرفراتي', 'my_servers')]
      ])
    }
  )
}

bot.start(async ctx => {
  await mainMenu(ctx)
})

// ====== ADD SERVER ======
bot.action('add_server', async ctx => {
  await ctx.answerCbQuery()
  servers[ctx.from.id] = servers[ctx.from.id] || []
  servers[ctx.from.id].push(`سيرفر #${servers[ctx.from.id].length + 1}`)
  await ctx.reply('✅ تم إضافة سيرفر (تجريبي)')
})

// ====== MY SERVERS ======
bot.action('my_servers', async ctx => {
  await ctx.answerCbQuery()
  const list = servers[ctx.from.id]

  if (!list || list.length === 0) {
    return ctx.reply('📭 لا يوجد لديك سيرفرات')
  }

  let text = '📂 *سيرفراتك:*\n'
  list.forEach((s, i) => {
    text += `${i + 1}- ${s}\n`
  })

  await ctx.reply(text, { parse_mode: 'Markdown' })
})

// ====== FALLBACK ======
bot.on('text', ctx => {
  ctx.reply('ℹ️ استخدم /start')
})

// ====== SAFE LAUNCH ======
;(async () => {
  await bot.telegram.deleteWebhook()
  bot.launch({ dropPendingUpdates: true })
  console.log('✅ BOT READY')
})()

// ====== ANTI CRASH ======
process.on('uncaughtException', e => console.error(e))
process.on('unhandledRejection', e => console.error(e))
