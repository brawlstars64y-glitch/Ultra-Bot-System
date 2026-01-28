const { Telegraf, Markup, session } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

/* 🔄 Keep Alive لـ Railway */
http.createServer((req, res) => {
  res.end('OK')
}).listen(process.env.PORT || 3000)

/* 🔑 توكن */
const bot = new Telegraf('8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU')
bot.use(session())

let client = null
let server = null
let afk = null

/* 🎮 القائمة */
const menu = Markup.inlineKeyboard([
  [Markup.button.callback('➕ إضافة سيرفر', 'add')],
  [Markup.button.callback('▶️ دخول', 'connect')],
  [Markup.button.callback('⏹️ خروج', 'disconnect')],
  [Markup.button.callback('📊 الحالة', 'status')]
])

/* 🚀 start */
bot.start(ctx => {
  ctx.reply('🤖 بوت بلاير جاهز\nاختر خيار:', menu)
})

/* ➕ إضافة سيرفر */
bot.action('add', ctx => {
  ctx.answerCbQuery()
  ctx.session.step = 'ip'
  ctx.reply('🌐 أرسل IP السيرفر:')
})

bot.on('text', ctx => {
  if (!ctx.session?.step) return

  if (ctx.session.step === 'ip') {
    ctx.session.ip = ctx.message.text
    ctx.session.step = 'port'
    return ctx.reply('🔢 أرسل Port:')
  }

  if (ctx.session.step === 'port') {
    ctx.session.port = parseInt(ctx.message.text)
    ctx.session.step = 'name'
    return ctx.reply('👤 اسم البوت:')
  }

  if (ctx.session.step === 'name') {
    server = {
      host: ctx.session.ip,
      port: ctx.session.port,
      username: ctx.message.text
    }
    ctx.session = null
    ctx.reply('✅ تم حفظ السيرفر', menu)
  }
})

/* ▶️ دخول */
bot.action('connect', ctx => {
  ctx.answerCbQuery()

  if (!server) return ctx.reply('⚠️ أضف سيرفر أولاً', menu)
  if (client) return ctx.reply('⚠️ البوت متصل', menu)

  ctx.reply('⏳ جاري الدخول...')

  client = bedrock.createClient({
    host: server.host,
    port: server.port,
    username: server.username,
    offline: true
  })

  client.on('spawn', () => {
    ctx.reply('✅ دخل السيرفر')

    afk = setInterval(() => {
      if (!client) return
      client.queue('command_request', {
        command: 'tp @s ~ ~ ~',
        origin: { type: 0 },
        internal: false
      })
    }, 30000)
  })

  client.on('disconnect', () => {
    cleanup()
    ctx.reply('❌ تم فصل البوت', menu)
  })

  client.on('error', err => {
    cleanup()
    ctx.reply('⚠️ خطأ: ' + err.message, menu)
  })
})

/* ⏹️ خروج */
bot.action('disconnect', ctx => {
  ctx.answerCbQuery()
  if (!client) return ctx.reply('⚠️ غير متصل', menu)
  client.close()
  cleanup()
  ctx.reply('🛑 تم الإخراج', menu)
})

/* 📊 الحالة */
bot.action('status', ctx => {
  ctx.answerCbQuery()
  ctx.reply(
    client ? '🟢 البوت متصل' : '🔴 البوت غير متصل',
    menu
  )
})

function cleanup () {
  if (afk) clearInterval(afk)
  afk = null
  client = null
}

/* 🛡️ منع الكراش */
process.on('uncaughtException', e => console.log(e))
process.on('unhandledRejection', e => console.log(e))

bot.launch()
console.log('🤖 Bot Started')
