const { Telegraf, Markup, session } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Alive')
}).listen(process.env.PORT || 3000)

const BOT_TOKEN = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU'
const bot = new Telegraf(BOT_TOKEN)
bot.use(session())

let mcClient = null
let afk = null
let server = null

const menu = Markup.inlineKeyboard([
  [Markup.button.callback('➕ إضافة سيرفر', 'add')],
  [Markup.button.callback('▶️ دخول', 'connect')],
  [Markup.button.callback('⏹️ خروج', 'disconnect')],
  [Markup.button.callback('📊 الحالة', 'status')]
])

bot.start(ctx => {
  ctx.reply('🤖 لوحة تحكم بوت بلاير', menu)
})

bot.action('add', ctx => {
  ctx.answerCbQuery()
  ctx.session.step = 'ip'
  ctx.reply('🌐 IP السيرفر؟')
})

bot.on('text', ctx => {
  if (!ctx.session?.step) return

  if (ctx.session.step === 'ip') {
    ctx.session.ip = ctx.message.text
    ctx.session.step = 'port'
    return ctx.reply('🔢 Port؟')
  }

  if (ctx.session.step === 'port') {
    ctx.session.port = parseInt(ctx.message.text)
    ctx.session.step = 'name'
    return ctx.reply('👤 اسم البوت؟')
  }

  if (ctx.session.step === 'name') {
    server = { host: ctx.session.ip, port: ctx.session.port, username: ctx.message.text }
    ctx.session = null
    ctx.reply('✅ تم حفظ السيرفر', menu)
  }
})

bot.action('connect', ctx => {
  ctx.answerCbQuery()
  if (!server) return ctx.reply('⚠️ أضف سيرفر أولاً', menu)
  if (mcClient) return ctx.reply('⚠️ متصل بالفعل', menu)

  mcClient = bedrock.createClient({
    host: server.host,
    port: server.port,
    username: server.username,
    offline: true
  })

  mcClient.on('spawn', () => {
    ctx.reply('✅ دخل السيرفر')
    afk = setInterval(() => {
      mcClient.queue('command_request', {
        command: 'tp @s ~ ~ ~',
        origin: { type: 0 },
        internal: false
      })
    }, 30000)
  })

  mcClient.on('disconnect', () => clean(ctx, '❌ فصل'))
  mcClient.on('error', () => clean(ctx, '⚠️ خطأ'))
})

bot.action('disconnect', ctx => {
  ctx.answerCbQuery()
  if (!mcClient) return ctx.reply('⚠️ غير متصل', menu)
  mcClient.close()
  clean(ctx, '🛑 تم الإخراج')
})

bot.action('status', ctx => {
  ctx.answerCbQuery()
  ctx.reply(
    mcClient ? '🟢 متصل' : '🔴 غير متصل',
    menu
  )
})

function clean (ctx, msg) {
  if (afk) clearInterval(afk)
  afk = null
  mcClient = null
  ctx.reply(msg, menu)
}

process.on('uncaughtException', e => console.log(e))
process.on('unhandledRejection', e => console.log(e))

bot.launch()
console.log('🚀 Bot Stable')
