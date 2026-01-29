const { Telegraf, Markup, session } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

// ===== Keep Alive (Railway) =====
http.createServer((req, res) => res.end('OK')).listen(process.env.PORT || 3000)

// ===== BOT =====
const TOKEN = '8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ'
const bot = new Telegraf(TOKEN)
bot.use(session())

// ===== STORAGE (RAM) =====
const servers = {}   // { userId: [{host, port}] }
const clients = {}   // { userId: bedrockClient }

// ===== MAIN MENU =====
function menu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'add')],
    [Markup.button.callback('📂 سيرفراتي', 'list')]
  ])
}

bot.start(ctx => {
  ctx.reply('🎮 *لوحة التحكم*\nاختر خيار:', {
    parse_mode: 'Markdown',
    ...menu()
  })
})

// ===== ADD SERVER =====
bot.action('add', ctx => {
  ctx.answerCbQuery()
  ctx.session.step = 'wait_ip'
  ctx.reply('📡 أرسل السيرفر بهذا الشكل:\n`ip:port`', { parse_mode: 'Markdown' })
})

bot.on('text', ctx => {
  if (ctx.session.step !== 'wait_ip') return

  const text = ctx.message.text.trim()
  if (!text.includes(':')) {
    return ctx.reply('❌ خطأ\nاكتبها هكذا:\n`ip:port`', { parse_mode: 'Markdown' })
  }

  const [host, port] = text.split(':')
  if (!host || !port) {
    return ctx.reply('❌ صيغة غير صحيحة')
  }

  servers[ctx.from.id] = servers[ctx.from.id] || []
  servers[ctx.from.id].push({ host, port })

  ctx.session.step = null
  ctx.reply('✅ تم إضافة السيرفر', menu())
})

// ===== LIST SERVERS =====
bot.action('list', ctx => {
  ctx.answerCbQuery()
  const list = servers[ctx.from.id]

  if (!list || list.length === 0) {
    return ctx.reply('📭 لا يوجد سيرفرات', menu())
  }

  const buttons = list.map((s, i) => [
    Markup.button.callback(`${s.host}:${s.port}`, `srv_${i}`)
  ])

  buttons.push([Markup.button.callback('⬅️ رجوع', 'back')])

  ctx.reply('📂 اختر سيرفر:', Markup.inlineKeyboard(buttons))
})

// ===== SERVER CONTROL =====
bot.action(/^srv_(\d+)$/, ctx => {
  ctx.answerCbQuery()
  const id = ctx.match[1]
  const s = servers[ctx.from.id][id]
  const active = clients[ctx.from.id]

  ctx.reply(
    `🖥️ ${s.host}:${s.port}\nالحالة: ${active ? '🟢 يعمل' : '🔴 متوقف'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(active ? '⏹ إيقاف' : '▶️ تشغيل', `toggle_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'list')]
    ])
  )
})

// ===== START / STOP BOT PLAYER =====
bot.action(/^toggle_(\d+)$/, ctx => {
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
  try {
    ctx.reply('⏳ جاري الدخول إلى السيرفر...')

    const client = bedrock.createClient({
      host: s.host,
      port: parseInt(s.port),
      username: 'BotPlayer',
      offline: true
    })

    clients[uid] = client

    client.on('spawn', () => {
      ctx.reply('✅ البوت دخل السيرفر وباقي فيه')
    })

    client.on('error', err => {
      delete clients[uid]
      ctx.reply('❌ خرج البوت (السيرفر رفض الاتصال)')
    })

  } catch (e) {
    ctx.reply('❌ فشل التشغيل')
  }
})

// ===== BACK =====
bot.action('back', ctx => {
  ctx.answerCbQuery()
  ctx.reply('⬅️ رجوع', menu())
})

// ===== ANTI CRASH =====
process.on('uncaughtException', e => console.error(e))
process.on('unhandledRejection', e => console.error(e))

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT ONLINE')
