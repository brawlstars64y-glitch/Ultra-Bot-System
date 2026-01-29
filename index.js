const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

// ===== Keep Alive =====
http.createServer((req, res) => res.end('OK'))
  .listen(process.env.PORT || 3000)

// ===== BOT =====
const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

// ===== STORAGE =====
const servers = {}   // userId => [{host, port}]
const clients = {}   // userId => client
const waitIP = {}    // userId => true

// ===== MENU =====
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'ADD')],
    [Markup.button.callback('📂 سيرفراتي', 'LIST')]
  ])
}

// ===== START =====
bot.start(ctx => {
  ctx.reply(
    '🎮 لوحة تحكم بسيطة\nاختر خيار:',
    mainMenu()
  )
})

// ===== ADD SERVER =====
bot.action('ADD', ctx => {
  ctx.answerCbQuery()
  waitIP[ctx.from.id] = true
  ctx.reply('📡 أرسل السيرفر هكذا:\nip:port')
})

// ===== RECEIVE IP =====
bot.on('text', ctx => {
  const uid = ctx.from.id
  if (!waitIP[uid]) return

  const text = ctx.message.text.trim()
  if (!text.includes(':')) {
    return ctx.reply('❌ خطأ\nاكتب ip:port')
  }

  const [host, port] = text.split(':')
  if (!host || !port) {
    return ctx.reply('❌ صيغة غير صحيحة')
  }

  servers[uid] = servers[uid] || []
  servers[uid].push({ host, port })

  delete waitIP[uid]
  ctx.reply('✅ تم حفظ السيرفر', mainMenu())
})

// ===== LIST SERVERS =====
bot.action('LIST', ctx => {
  ctx.answerCbQuery()
  const list = servers[ctx.from.id]

  if (!list || list.length === 0) {
    return ctx.reply('📭 لا يوجد سيرفرات', mainMenu())
  }

  const buttons = list.map((s, i) =>
    [Markup.button.callback(`${s.host}:${s.port}`, `SRV_${i}`)]
  )

  buttons.push([Markup.button.callback('⬅️ رجوع', 'BACK')])

  ctx.reply('📂 اختر سيرفر:', Markup.inlineKeyboard(buttons))
})

// ===== SERVER MENU =====
bot.action(/^SRV_(\d+)$/, ctx => {
  ctx.answerCbQuery()
  const uid = ctx.from.id
  const id = ctx.match[1]
  const s = servers[uid][id]
  const active = clients[uid]

  ctx.reply(
    `🖥 ${s.host}:${s.port}\nالحالة: ${active ? '🟢 يعمل' : '🔴 متوقف'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(active ? '⏹ إيقاف' : '▶️ تشغيل', `TOGGLE_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ])
  )
})

// ===== TOGGLE BOT PLAYER =====
bot.action(/^TOGGLE_(\d+)$/, ctx => {
  ctx.answerCbQuery()
  const uid = ctx.from.id
  const s = servers[uid][ctx.match[1]]

  // STOP
  if (clients[uid]) {
    clients[uid].close()
    delete clients[uid]
    return ctx.reply('⏹ تم إيقاف البوت')
  }

  // START
  ctx.reply('⏳ جاري الدخول...')
  try {
    const client = bedrock.createClient({
      host: s.host,
      port: parseInt(s.port),
      username: 'BotPlayer',
      offline: true
    })

    clients[uid] = client

    client.on('spawn', () => {
      ctx.reply('✅ البوت دخل السيرفر')
    })

    client.on('error', () => {
      delete clients[uid]
      ctx.reply('❌ خرج البوت')
    })

  } catch {
    ctx.reply('❌ فشل التشغيل')
  }
})

// ===== BACK =====
bot.action('BACK', ctx => {
  ctx.answerCbQuery()
  ctx.reply('⬅️ رجوع', mainMenu())
})

// ===== SAFE =====
process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT READY')
