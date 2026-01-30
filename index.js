const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

// ===== BOT TOKEN =====
const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

// ===== FORCE SUB CHANNELS =====
const CHANNELS = [
  '@aternosbot24',
  '@N_NHGER',
  '@sjxhhdbx72',
  '@vsyfyk'
]

// ===== KEEP ALIVE (Railway) =====
http.createServer((req, res) => res.end('OK'))
  .listen(process.env.PORT || 3000)

// ===== STORAGE (RAM) =====
const servers = {}   // userId => [{host, port}]
const clients = {}   // userId => bedrock client
const waitIP = {}    // userId => true

// ===== SAFE EDIT (يمنع السكوت) =====
async function safeEdit(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard)
  } catch {
    await ctx.reply(text, keyboard)
  }
}

// ===== CHECK SUB =====
async function checkSub(ctx) {
  for (const ch of CHANNELS) {
    try {
      const m = await ctx.telegram.getChatMember(ch, ctx.from.id)
      if (m.status === 'left' || m.status === 'kicked') return false
    } catch {
      return false
    }
  }
  return true
}

// ===== MENUS =====
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'ADD')],
    [Markup.button.callback('📂 سيرفراتي', 'LIST')]
  ])
}

// ===== START =====
bot.start(async ctx => {
  if (!(await checkSub(ctx))) {
    return ctx.reply(
      '🚫 يجب الاشتراك في القنوات التالية:\n' +
      'https://t.me/aternosbot24\n' +
      'https://t.me/N_NHGER\n' +
      'https://t.me/sjxhhdbx72\n' +
      'https://t.me/vsyfyk\n\nثم اضغط /start'
    )
  }
  ctx.reply('🎮 لوحة التحكم\nاختر خيار:', mainMenu())
})

// ===== ADD SERVER =====
bot.action('ADD', async ctx => {
  await ctx.answerCbQuery()
  if (!(await checkSub(ctx))) return
  waitIP[ctx.from.id] = true
  await safeEdit(ctx, '📡 أرسل السيرفر بصيغة:\nip:port')
})

// ===== RECEIVE IP =====
bot.on('text', async ctx => {
  const uid = ctx.from.id
  if (!waitIP[uid]) return
  if (!(await checkSub(ctx))) return

  const t = ctx.message.text.trim()
  if (!t.includes(':')) {
    return ctx.reply('❌ الصيغة غير صحيحة\nاكتب: ip:port')
  }

  const [host, port] = t.split(':')
  servers[uid] = servers[uid] || []
  servers[uid].push({ host, port: port.trim() })

  delete waitIP[uid]
  ctx.reply('✅ تم إضافة السيرفر', mainMenu())
})

// ===== LIST SERVERS =====
bot.action('LIST', async ctx => {
  await ctx.answerCbQuery()
  if (!(await checkSub(ctx))) return

  const list = servers[ctx.from.id]
  if (!list || list.length === 0) {
    return safeEdit(ctx, '📭 لا توجد سيرفرات', mainMenu())
  }

  const buttons = list.map((s, i) => [
    Markup.button.callback(`${s.host}:${s.port}`, `SRV_${i}`)
  ])
  buttons.push([Markup.button.callback('⬅️ رجوع', 'BACK')])

  safeEdit(ctx, '📂 اختر سيرفر:', Markup.inlineKeyboard(buttons))
})

// ===== SERVER MENU =====
bot.action(/^SRV_(\d+)$/, async ctx => {
  await ctx.answerCbQuery()
  if (!(await checkSub(ctx))) return

  const uid = ctx.from.id
  const id = ctx.match[1]
  const s = servers[uid][id]
  const active = !!clients[uid]

  safeEdit(
    ctx,
    `🖥 ${s.host}:${s.port}\nالحالة: ${active ? '🟢 يعمل' : '🔴 متوقف'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(active ? '⏹ إيقاف' : '▶️ تشغيل', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف السيرفر', `DEL_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ])
  )
})

// ===== DELETE SERVER =====
bot.action(/^DEL_(\d+)$/, async ctx => {
  await ctx.answerCbQuery()
  if (!(await checkSub(ctx))) return

  const uid = ctx.from.id
  servers[uid].splice(ctx.match[1], 1)
  safeEdit(ctx, '🗑 تم حذف السيرفر', mainMenu())
})

// ===== TOGGLE BOT PLAYER =====
bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  await ctx.answerCbQuery()
  if (!(await checkSub(ctx))) return

  const uid = ctx.from.id
  const s = servers[uid][ctx.match[1]]

  // STOP
  if (clients[uid]) {
    clients[uid].close()
    delete clients[uid]
    return safeEdit(ctx, '⏹ تم إيقاف البوت', mainMenu())
  }

  // START
  await safeEdit(ctx, '⏳ جاري الدخول إلى السيرفر...')
  try {
    const client = bedrock.createClient({
      host: s.host,
      port: parseInt(s.port),
      username: 'MaxBlackBot',
      offline: true // Bedrock
    })

    clients[uid] = client

    client.on('spawn', () => {
      safeEdit(ctx, '✅ البوت دخل السيرفر وباقي فيه', mainMenu())
    })

    client.on('error', () => {
      delete clients[uid]
      safeEdit(ctx, '❌ خرج البوت من السيرفر', mainMenu())
    })
  } catch {
    safeEdit(ctx, '❌ فشل التشغيل', mainMenu())
  }
})

// ===== BACK =====
bot.action('BACK', async ctx => {
  await ctx.answerCbQuery()
  safeEdit(ctx, '🎮 لوحة التحكم', mainMenu())
})

// ===== SAFE =====
process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT ONLINE')
