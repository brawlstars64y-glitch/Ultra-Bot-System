const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')

/* ===== BOT TOKEN ===== */
const bot = new Telegraf(process.env.BOT_TOKEN)

/* ===== FORCE SUB CHANNELS ===== */
const CHANNELS = ['@aternosbot24', '@N_NHGER', '@sjxhhdbx72', '@vsyfyk']

/* ===== STORAGE ===== */
const servers = {}   
const clients = {}   
const waiting = {}   

/* ===== CHECK SUB ===== */
async function checkSub(ctx) {
  for (const ch of CHANNELS) {
    try {
      const m = await ctx.telegram.getChatMember(ch, ctx.from.id)
      if (['left', 'kicked'].includes(m.status)) return false
    } catch { return false }
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
    return ctx.reply('🚫 اشترك بالقنوات أولاً ثم أرسل /start:\n' + CHANNELS.join('\n'))
  }
  ctx.reply('🎮 أهلاً بك يا بطل في لوحة التحكم', mainMenu())
})

/* ===== ADD SERVER ===== */
bot.action('ADD', async ctx => {
  waiting[ctx.from.id] = true
  await ctx.answerCbQuery()
  await safeEdit(ctx, '📡 أرسل السيرفر بهذا الشكل:\n`ip:port`', { parse_mode: 'Markdown' })
})

/* ===== RECEIVE IP (تم إصلاح سرعة الرد هنا) ===== */
bot.on('text', async ctx => {
  const uid = ctx.from.id
  if (!waiting[uid]) return

  const text = ctx.message.text.trim()
  if (!text.includes(':')) return ctx.reply('❌ الصيغة خاطئة. مثال: `play.example.com:19132`', { parse_mode: 'Markdown' })

  const [host, port] = text.split(':')
  servers[uid] ??= []
  servers[uid].push({ host: host.trim(), port: port.trim() })

  delete waiting[uid]
  ctx.reply('✅ تم حفظ السيرفر بنجاح!', mainMenu())
})

/* ===== LIST SERVERS ===== */
bot.action('LIST', async ctx => {
  const list = servers[ctx.from.id]
  if (!list || list.length === 0) return safeEdit(ctx, '📭 لا يوجد سيرفرات مضافة.', mainMenu())

  const kb = list.map((s, i) => [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)])
  kb.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  await safeEdit(ctx, '📂 اختر السيرفر المطلوب:', Markup.inlineKeyboard(kb))
})

/* ===== SERVER PANEL ===== */
bot.action(/^SRV_(\d+)$/, async ctx => {
  const uid = ctx.from.id
  const id = Number(ctx.match[1])
  const s = servers[uid][id]
  const online = !!clients[uid]

  await safeEdit(ctx, `🖥 ${s.host}:${s.port}\nالحالة: ${online ? '🟢 شغال' : '🔴 مطفأ'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(online ? '⏹ اطفاء البوت' : '▶️ تشغيل البوت', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف السيرفر', `DEL_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ])
  )
})

/* ===== DELETE SERVER (تم الإصلاح الجذري هنا) ===== */
bot.action(/^DEL_(\d+)$/, async ctx => {
  const uid = ctx.from.id
  const id = Number(ctx.match[1])

  if (servers[uid] && servers[uid][id]) {
    servers[uid].splice(id, 1)
    await ctx.answerCbQuery('🗑 تم الحذف بنجاح')
    await safeEdit(ctx, '✅ تم حذف السيرفر من قائمتك.', mainMenu())
  }
})

/* ===== TOGGLE BOT ===== */
bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  const uid = ctx.from.id
  const id = ctx.match[1]
  const s = servers[uid][id]

  if (clients[uid]) {
    clients[uid].disconnect()
    delete clients[uid]
    return safeEdit(ctx, '⏹ تم إيقاف البوت وفصل الاتصال.', mainMenu())
  }

  await ctx.answerCbQuery('⏳ جاري الدخول...')
  try {
    const client = bedrock.createClient({
      host: s.host,
      port: Number(s.port),
      username: 'Max_Black',
      offline: true,
      version: undefined
    })
    clients[uid] = client
    client.on('spawn', () => { safeEdit(ctx, '✅ البوت دخل السيرفر وهو شغال الآن.', mainMenu()) })
    client.on('error', () => { delete clients[uid]; safeEdit(ctx, '❌ فشل الاتصال أو خرج البوت.', mainMenu()) })
    client.on('close', () => { delete clients[uid] })
  } catch (e) {
    await safeEdit(ctx, '❌ خطأ في النظام.', mainMenu())
  }
})

/* ===== BACK ===== */
bot.action('BACK', ctx => { safeEdit(ctx, '🎮 لوحة التحكم:', mainMenu()) })

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT IS FIXED AND RUNNING')
