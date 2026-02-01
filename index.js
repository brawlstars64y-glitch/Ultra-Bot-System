const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')

/* ===== BOT TOKEN ===== */
const bot = new Telegraf(process.env.BOT_TOKEN)

/* ===== FORCE SUB CHANNELS ===== */
const CHANNELS = [
  '@aternosbot24',
  '@N_NHGER',
  '@sjxhhdbx72',
  '@vsyfyk'
]

/* ===== STORAGE ===== */
const servers = {}   // uid => [{host, port}]
const clients = {}   // uid => client
const waiting = {}   // uid => true

/* ===== CHECK SUB ===== */
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

/* ===== MENU ===== */
const mainMenu = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'ADD')],
    [Markup.button.callback('📂 سيرفراتي', 'LIST')]
  ])

/* ===== SAFE EDIT ===== */
async function safeEdit(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard)
  } catch {
    await ctx.reply(text, keyboard)
  }
}

/* ===== START ===== */
bot.start(async ctx => {
  if (!(await checkSub(ctx))) {
    return ctx.reply(
      '🚫 اشترك بالقنوات ثم ارسل /start\n\n' +
      'https://t.me/aternosbot24\n' +
      'https://t.me/N_NHGER\n' +
      'https://t.me/sjxhhdbx72\n' +
      'https://t.me/vsyfyk'
    )
  }
  ctx.reply('🎮 لوحة تحكم بوت ماينكرافت بيدروك', mainMenu())
})

/* ===== ADD SERVER ===== */
bot.action('ADD', async ctx => {
  if (!(await checkSub(ctx))) return
  waiting[ctx.from.id] = true
  await safeEdit(ctx, '📡 أرسل السيرفر بهذا الشكل:\n`ip:port`', {
    parse_mode: 'Markdown'
  })
})

/* ===== RECEIVE IP ===== */
bot.on('text', async ctx => {
  const uid = ctx.from.id
  if (!waiting[uid]) return
  if (!(await checkSub(ctx))) return

  const text = ctx.message.text.trim()
  if (!text.includes(':'))
    return ctx.reply('❌ الصيغة غلط\nمثال:\nplay.example.com:19132')

  const [host, port] = text.split(':')

  servers[uid] ??= []
  servers[uid].push({ host, port })

  delete waiting[uid]
  ctx.reply('✅ تم حفظ السيرفر', mainMenu())
})

/* ===== LIST SERVERS ===== */
bot.action('LIST', async ctx => {
  if (!(await checkSub(ctx))) return

  const list = servers[ctx.from.id]
  if (!list || list.length === 0)
    return safeEdit(ctx, '📭 لا يوجد سيرفرات', mainMenu())

  const kb = list.map((s, i) => [
    Markup.button.callback(`${s.host}:${s.port}`, `SRV_${i}`)
  ])
  kb.push([Markup.button.callback('⬅️ رجوع', 'BACK')])

  await safeEdit(ctx, '📂 اختر سيرفر', Markup.inlineKeyboard(kb))
})

/* ===== SERVER PANEL ===== */
bot.action(/^SRV_(\d+)$/, async ctx => {
  if (!(await checkSub(ctx))) return

  const uid = ctx.from.id
  const id = Number(ctx.match[1])
  const s = servers[uid][id]
  const online = !!clients[uid]

  await safeEdit(
    ctx,
    `🖥 ${s.host}:${s.port}\nالحالة: ${online ? '🟢 يعمل' : '🔴 متوقف'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(online ? '⏹ إيقاف' : '▶️ تشغيل', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف السيرفر', `DEL_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ])
  )
})

/* ===== DELETE SERVER ===== */
bot.action(/^DEL_(\d+)$/, async ctx => {
  if (!(await checkSub(ctx))) return

  const uid = ctx.from.id
  const id = Number(ctx.match[1])

  servers[uid].splice(id, 1)
  await safeEdit(ctx, '🗑 تم حذف السيرفر', mainMenu())
})

/* ===== TOGGLE BOT ===== */
bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  if (!(await checkSub(ctx))) return

  const uid = ctx.from.id
  const s = servers[uid][ctx.match[1]]

  if (clients[uid]) {
    clients[uid].disconnect()
    delete clients[uid]
    return safeEdit(ctx, '⏹ تم إيقاف البوت', mainMenu())
  }

  await safeEdit(ctx, '⏳ جاري الدخول للسيرفر...')

  try {
    const client = bedrock.createClient({
      host: s.host,
      port: Number(s.port),
      username: 'BedrockBot',
      offline: true,
      version: 'auto' // 1.20 → 1.21.132
    })

    clients[uid] = client

    client.on('spawn', () => {
      safeEdit(ctx, '✅ دخل السيرفر بنجاح', mainMenu())
    })

    client.on('disconnect', () => {
      delete clients[uid]
    })

    client.on('error', err => {
      console.log(err)
      delete clients[uid]
      safeEdit(ctx, '❌ خرج من السيرفر', mainMenu())
    })

  } catch (e) {
    console.log(e)
    await safeEdit(ctx, '❌ فشل الاتصال', mainMenu())
  }
})

/* ===== BACK ===== */
bot.action('BACK', ctx => {
  safeEdit(ctx, '🎮 لوحة تحكم بوت ماينكرافت', mainMenu())
})

/* ===== SAFETY ===== */
process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

/* ===== LAUNCH ===== */
bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT ONLINE')
    
