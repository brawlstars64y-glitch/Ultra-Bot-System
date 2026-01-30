const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

// ===== BOT =====
const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

// ===== قنوات الاشتراك =====
const CHANNELS = [
  '@aternosbot24',
  '@N_NHGER',
  '@sjxhhdbx72',
  '@vsyfyk'
]

// ===== Keep Alive (Railway) =====
http.createServer((req, res) => {
  res.end('BOT IS RUNNING')
}).listen(process.env.PORT || 3000)

// ===== STORAGE =====
const servers = {}   // userId => [{host, port}]
const clients = {}   // userId => bedrock client
const waitIP = {}    // userId => true

// ===== تحقق الاشتراك =====
async function checkSubscription(ctx) {
  for (const ch of CHANNELS) {
    try {
      const member = await ctx.telegram.getChatMember(ch, ctx.from.id)
      if (member.status === 'left' || member.status === 'kicked') return false
    } catch {
      return false
    }
  }
  return true
}

// ===== MENU =====
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'ADD')],
    [Markup.button.callback('📂 سيرفراتي', 'LIST')]
  ])
}

// ===== START =====
bot.start(async ctx => {
  if (!(await checkSubscription(ctx))) {
    return ctx.reply(
      '🚫 يجب الاشتراك في القنوات التالية لاستخدام البوت:\n\n' +
      'https://t.me/aternosbot24\n' +
      'https://t.me/N_NHGER\n' +
      'https://t.me/sjxhhdbx72\n' +
      'https://t.me/vsyfyk\n\n' +
      'ثم اضغط /start'
    )
  }

  ctx.reply('🎮 لوحة التحكم\nاختر خيار:', mainMenu())
})

// ===== ADD SERVER =====
bot.action('ADD', async ctx => {
  if (!(await checkSubscription(ctx))) return
  ctx.answerCbQuery()
  waitIP[ctx.from.id] = true
  ctx.reply('📡 أرسل السيرفر بهذه الصيغة:\nip:port')
})

// ===== RECEIVE IP =====
bot.on('text', async ctx => {
  const uid = ctx.from.id
  if (!waitIP[uid]) return
  if (!(await checkSubscription(ctx))) return

  const text = ctx.message.text.trim()
  if (!text.includes(':')) {
    return ctx.reply('❌ الصيغة غير صحيحة\nاكتب: ip:port')
  }

  const [host, port] = text.split(':')
  servers[uid] = servers[uid] || []
  servers[uid].push({ host, port: port.trim() })

  delete waitIP[uid]
  ctx.reply('✅ تم إضافة السيرفر بنجاح', mainMenu())
})

// ===== LIST SERVERS =====
bot.action('LIST', async ctx => {
  if (!(await checkSubscription(ctx))) return
  ctx.answerCbQuery()

  const list = servers[ctx.from.id]
  if (!list || list.length === 0) {
    return ctx.reply('📭 لا توجد سيرفرات', mainMenu())
  }

  const buttons = list.map((s, i) => [
    Markup.button.callback(`${s.host}:${s.port}`, `SRV_${i}`)
  ])

  buttons.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  ctx.reply('📂 اختر سيرفر:', Markup.inlineKeyboard(buttons))
})

// ===== SERVER MENU =====
bot.action(/^SRV_(\d+)$/, async ctx => {
  if (!(await checkSubscription(ctx))) return
  ctx.answerCbQuery()

  const uid = ctx.from.id
  const id = ctx.match[1]
  const s = servers[uid][id]
  const active = clients[uid]

  ctx.reply(
    `🖥 السيرفر: ${s.host}:${s.port}\nالحالة: ${active ? '🟢 يعمل' : '🔴 متوقف'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(active ? '⏹ إيقاف' : '▶️ تشغيل', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف السيرفر', `DEL_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ])
  )
})

// ===== DELETE SERVER =====
bot.action(/^DEL_(\d+)$/, async ctx => {
  if (!(await checkSubscription(ctx))) return
  ctx.answerCbQuery()

  const uid = ctx.from.id
  const id = ctx.match[1]

  servers[uid].splice(id, 1)
  ctx.reply('🗑 تم حذف السيرفر بنجاح', mainMenu())
})

// ===== TOGGLE BOT =====
bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  if (!(await checkSubscription(ctx))) return
  ctx.answerCbQuery()

  const uid = ctx.from.id
  const s = servers[uid][ctx.match[1]]

  if (clients[uid]) {
    clients[uid].close()
    delete clients[uid]
    return ctx.reply('⏹ تم إيقاف البوت')
  }

  ctx.reply('⏳ جاري الدخول إلى السيرفر...')
  try {
    const client = bedrock.createClient({
      host: s.host,
      port: parseInt(s.port),
      username: 'MaxBlackBot',
      offline: true
    })

    clients[uid] = client

    client.on('spawn', () => {
      ctx.reply('✅ البوت دخل السيرفر وباقي فيه')
    })

    client.on('error', () => {
      delete clients[uid]
      ctx.reply('❌ خرج البوت من السيرفر')
    })

  } catch {
    ctx.reply('❌ فشل تشغيل البوت')
  }
})

// ===== BACK =====
bot.action('BACK', ctx => {
  ctx.answerCbQuery()
  ctx.reply('🎮 القائمة الرئيسية', mainMenu())
})

// ===== SAFE =====
process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT READY')
