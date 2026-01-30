const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')

// ===== BOT =====
const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

// ===== FORCE SUB =====
const CHANNELS = ['@aternosbot24','@N_NHGER','@sjxhhdbx72','@vsyfyk']

// ===== STORAGE =====
const servers = {}   // uid => [{host,port}]
const clients = {}   // uid => client
const waitIP  = {}   // uid => true

// ===== GLOBAL CALLBACK GUARD (الأهم) =====
bot.use(async (ctx, next) => {
  if (ctx.callbackQuery) {
    try { await ctx.answerCbQuery() } catch {}
  }
  return next()
})

// ===== HELPERS =====
async function safeEdit(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, keyboard)
  } catch {
    // fallback مرة وحدة فقط
    await ctx.reply(text, keyboard)
  }
}

async function checkSub(ctx) {
  for (const ch of CHANNELS) {
    try {
      const m = await ctx.telegram.getChatMember(ch, ctx.from.id)
      if (m.status === 'left' || m.status === 'kicked') return false
    } catch { return false }
  }
  return true
}

const mainMenu = () => Markup.inlineKeyboard([
  [Markup.button.callback('➕ إضافة سيرفر','ADD')],
  [Markup.button.callback('📂 سيرفراتي','LIST')]
])

// ===== START =====
bot.start(async ctx => {
  if (!(await checkSub(ctx))) {
    return ctx.reply(
      '🚫 اشترك بالقنوات ثم /start:\n' +
      'https://t.me/aternosbot24\n' +
      'https://t.me/N_NHGER\n' +
      'https://t.me/sjxhhdbx72\n' +
      'https://t.me/vsyfyk'
    )
  }
  ctx.reply('🎮 لوحة التحكم', mainMenu())
})

// ===== ADD =====
bot.action('ADD', async ctx => {
  if (!(await checkSub(ctx))) return
  waitIP[ctx.from.id] = true
  await safeEdit(ctx,'📡 أرسل السيرفر: ip:port')
})

// ===== RECEIVE IP =====
bot.on('text', async ctx => {
  const uid = ctx.from.id
  if (!waitIP[uid]) return
  if (!(await checkSub(ctx))) return

  const t = ctx.message.text.trim()
  if (!t.includes(':')) return ctx.reply('❌ اكتب ip:port')

  const [host,port] = t.split(':')
  servers[uid] = servers[uid] || []
  servers[uid].push({host,port:port.trim()})
  delete waitIP[uid]

  ctx.reply('✅ تم الإضافة', mainMenu())
})

// ===== LIST =====
bot.action('LIST', async ctx => {
  if (!(await checkSub(ctx))) return
  const list = servers[ctx.from.id]
  if (!list || list.length===0)
    return safeEdit(ctx,'📭 لا توجد سيرفرات', mainMenu())

  const kb = list.map((s,i)=>[Markup.button.callback(`${s.host}:${s.port}`,`SRV_${i}`)])
  kb.push([Markup.button.callback('⬅️ رجوع','BACK')])
  await safeEdit(ctx,'📂 اختر سيرفر', Markup.inlineKeyboard(kb))
})

// ===== SERVER =====
bot.action(/^SRV_(\d+)$/, async ctx => {
  if (!(await checkSub(ctx))) return
  const uid = ctx.from.id, id = ctx.match[1]
  const s = servers[uid][id]
  const on = !!clients[uid]

  await safeEdit(
    ctx,
    `🖥 ${s.host}:${s.port}\nالحالة: ${on?'🟢 يعمل':'🔴 متوقف'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(on?'⏹ إيقاف':'▶️ تشغيل',`TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف',`DEL_${id}`)],
      [Markup.button.callback('⬅️ رجوع','LIST')]
    ])
  )
})

// ===== DELETE =====
bot.action(/^DEL_(\d+)$/, async ctx => {
  if (!(await checkSub(ctx))) return
  servers[ctx.from.id].splice(ctx.match[1],1)
  await safeEdit(ctx,'🗑 تم الحذف', mainMenu())
})

// ===== TOGGLE =====
bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  if (!(await checkSub(ctx))) return
  const uid = ctx.from.id
  const s = servers[uid][ctx.match[1]]

  if (clients[uid]) {
    clients[uid].close()
    delete clients[uid]
    return safeEdit(ctx,'⏹ تم الإيقاف', mainMenu())
  }

  await safeEdit(ctx,'⏳ جاري الدخول...')
  try {
    const c = bedrock.createClient({
      host:s.host, port:parseInt(s.port),
      username:'MaxBlackBot', offline:true
    })
    clients[uid]=c
    c.on('spawn',()=>safeEdit(ctx,'✅ دخل السيرفر', mainMenu()))
    c.on('error',()=>{ delete clients[uid]; safeEdit(ctx,'❌ خرج', mainMenu()) })
  } catch {
    await safeEdit(ctx,'❌ فشل التشغيل', mainMenu())
  }
})

// ===== BACK =====
bot.action('BACK', ctx => safeEdit(ctx,'🎮 لوحة التحكم', mainMenu()))

// ===== SAFE =====
process.on('uncaughtException',console.error)
process.on('unhandledRejection',console.error)

bot.launch({ dropPendingUpdates:true })
console.log('✅ BOT ONLINE')
