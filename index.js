const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

/* ================= KEEP ALIVE ================= */
http.createServer((req, res) => {
  res.writeHead(200)
  res.end('BOT ALIVE')
}).listen(process.env.PORT || 3000)

/* ================= BOT ================= */
const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

/* ================= FORCE SUB ================= */
const CHANNELS = [
  '@aternosbot24',
  '@N_NHGER',
  '@sjxhhdbx72',
  '@vsyfyk'
]

/* ================= STORAGE ================= */
const servers = {}
const clients = {}
const waitIP = new Set()

/* ================= GLOBAL SAFE ================= */
bot.use(async (ctx, next) => {
  if (ctx.callbackQuery) {
    try { await ctx.answerCbQuery() } catch {}
  }
  return next()
})

/* ================= HELPERS ================= */
async function safeReply(ctx, text, keyboard) {
  try {
    return await ctx.reply(text, keyboard)
  } catch (e) {
    console.error(e)
  }
}

async function safeEdit(ctx, text, keyboard) {
  try {
    return await ctx.editMessageText(text, keyboard)
  } catch {
    return safeReply(ctx, text, keyboard)
  }
}

async function checkSub(ctx) {
  for (const ch of CHANNELS) {
    try {
      const m = await ctx.telegram.getChatMember(ch, ctx.from.id)
      if (['left', 'kicked'].includes(m.status)) return false
    } catch {
      // لو البوت مو أدمن → لا توقف البوت
      continue
    }
  }
  return true
}

const mainMenu = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'ADD')],
    [Markup.button.callback('📂 سيرفراتي', 'LIST')]
  ])

/* ================= START ================= */
bot.start(async ctx => {
  if (!(await checkSub(ctx))) {
    return safeReply(
      ctx,
      '🚫 اشترك في القنوات ثم أرسل /start',
      Markup.inlineKeyboard([
        [Markup.button.url('القنوات', 'https://t.me/aternosbot24')]
      ])
    )
  }
  safeReply(ctx, '🎮 لوحة التحكم', mainMenu())
})

/* ================= ADD ================= */
bot.action('ADD', async ctx => {
  if (!(await checkSub(ctx))) return
  waitIP.add(ctx.from.id)
  safeReply(ctx, '📡 أرسل السيرفر بصيغة:\nip:port')
})

/* ================= TEXT ================= */
bot.on('text', async ctx => {
  const uid = ctx.from.id
  if (!waitIP.has(uid)) return
  if (!(await checkSub(ctx))) return

  const t = ctx.message.text.trim()
  if (!t.includes(':'))
    return safeReply(ctx, '❌ الصيغة الصحيحة: ip:port')

  const [host, port] = t.split(':')

  servers[uid] ??= []
  servers[uid].push({ host, port: port.trim() })

  waitIP.delete(uid)
  safeReply(ctx, '✅ تم حفظ السيرفر', mainMenu())
})

/* ================= LIST ================= */
bot.action('LIST', async ctx => {
  if (!(await checkSub(ctx))) return
  const list = servers[ctx.from.id]

  if (!list || list.length === 0)
    return safeReply(ctx, '📭 لا توجد سيرفرات', mainMenu())

  const kb = list.map((s, i) => [
    Markup.button.callback(`${s.host}:${s.port}`, `SRV_${i}`)
  ])

  kb.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  safeReply(ctx, '📂 اختر سيرفر', Markup.inlineKeyboard(kb))
})

/* ================= SERVER ================= */
bot.action(/^SRV_(\d+)$/, async ctx => {
  const uid = ctx.from.id
  const id = ctx.match[1]
  const s = servers[uid][id]
  const on = !!clients[uid]

  safeReply(
    ctx,
    `🖥 ${s.host}:${s.port}\nالحالة: ${on ? '🟢 يعمل' : '🔴 متوقف'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(on ? '⏹ إيقاف' : '▶️ تشغيل', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف', `DEL_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ])
  )
})

/* ================= DELETE ================= */
bot.action(/^DEL_(\d+)$/, async ctx => {
  servers[ctx.from.id].splice(ctx.match[1], 1)
  safeReply(ctx, '🗑 تم حذف السيرفر', mainMenu())
})

/* ================= TOGGLE ================= */
bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  const uid = ctx.from.id
  const s = servers[uid][ctx.match[1]]

  if (clients[uid]) {
    clients[uid].close()
    delete clients[uid]
    return safeReply(ctx, '⏹ تم إيقاف البوت', mainMenu())
  }

  safeReply(ctx, '⏳ جاري الدخول إلى السيرفر...')
  try {
    const c = bedrock.createClient({
      host: s.host,
      port: parseInt(s.port),
      username: 'MaxBlackBot',
      offline: true,
      version: false
    })

    clients[uid] = c

    c.on('spawn', () =>
      safeReply(ctx, '✅ دخل البوت السيرفر', mainMenu())
    )

    c.on('error', () => {
      delete clients[uid]
      safeReply(ctx, '❌ خرج البوت من السيرفر', mainMenu())
    })
  } catch (e) {
    console.error(e)
    safeReply(ctx, '❌ فشل التشغيل', mainMenu())
  }
})

/* ================= BACK ================= */
bot.action('BACK', ctx => safeReply(ctx, '🎮 لوحة التحكم', mainMenu()))

/* ================= SAFE ================= */
process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT STABLE & ONLINE')
