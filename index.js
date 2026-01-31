const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

// ===== Keep Alive لضمان قبول Railway للمشروع =====
http.createServer((req, res) => {
  res.writeHead(200)
  res.end('MAX BLACK BOT IS RUNNING')
}).listen(process.env.PORT || 8080) 

const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

const CHANNELS = [
  '@aternosbot24',
  '@N_NHGER',
  '@sjxhhdbx72',
  '@vsyfyk'
]

const servers = {}   
const clients = {}   
const waitIP = {}    

// --- فحص الاشتراك ---
async function checkSubscription(ctx) {
  for (const channel of CHANNELS) {
    try {
      const member = await ctx.telegram.getChatMember(channel, ctx.from.id)
      if (['left', 'kicked', 'null'].includes(member.status)) return false
    } catch (e) { continue }
  }
  return true
}

function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر جديد', 'ADD')],
    [Markup.button.callback('📂 قائمة سيرفراتي', 'LIST')]
  ])
}

// --- START ---
bot.start(async (ctx) => {
  if (!(await checkSubscription(ctx))) {
    return ctx.reply(
      `⚠️ يجب عليك الاشتراك في القنوات أولاً لتتمكن من استخدام البوت:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ تم الاشتراك في الكل', 'CHECK_SUB')]
      ])
    )
  }
  ctx.reply('🎮 أهلاً بك في لوحة التحكم، اختر خياراً:', mainMenu())
})

bot.action('CHECK_SUB', async (ctx) => {
  if (await checkSubscription(ctx)) {
    await ctx.answerCbQuery('✅ تم التفعيل')
    ctx.editMessageText('🎮 تم التحقق بنجاح، اختر خياراً:', mainMenu())
  } else {
    await ctx.answerCbQuery('❌ اشترك أولاً في جميع القنوات!', { show_alert: true })
  }
})

// --- إضافة سيرفر ---
bot.action('ADD', async (ctx) => {
  ctx.answerCbQuery()
  waitIP[ctx.from.id] = true
  ctx.reply('📡 أرسل عنوان السيرفر والمنفذ هكذا -> ip:port')
})

bot.on('text', async (ctx) => {
  const uid = ctx.from.id
  if (!waitIP[uid]) return
  
  const text = ctx.message.text.trim()
  if (!text.includes(':')) return ctx.reply('❌ خطأ! الصيغة هي ip:port')

  const [host, port] = text.split(':')
  servers[uid] = servers[uid] || []
  servers[uid].push({ host: host.trim(), port: port.trim() })

  delete waitIP[uid]
  ctx.reply('✅ تم حفظ السيرفر بنجاح!', mainMenu())
})

// --- قائمة السيرفرات ---
bot.action('LIST', async (ctx) => {
  ctx.answerCbQuery()
  const list = servers[ctx.from.id]
  if (!list || list.length === 0) return ctx.reply('📭 قائمة سيرفراتك فارغة.', mainMenu())

  const buttons = list.map((s, i) => [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)])
  buttons.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  ctx.reply('📂 اختر السيرفر المطلوب:', Markup.inlineKeyboard(buttons))
})

// --- لوحة السيرفر الواحد ---
bot.action(/^SRV_(\d+)$/, async (ctx) => {
  ctx.answerCbQuery()
  const id = ctx.match[1]
  const s = servers[ctx.from.id][id]
  const active = clients[ctx.from.id]

  ctx.reply(
    `🖥 السيرفر: ${s.host}:${s.port}\nالحالة: ${active ? '🟢 متصل' : '🔴 متوقف'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(active ? '⏹ إيقاف البوت' : '▶️ تشغيل البوت', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف السيرفر', `DELETE_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ])
  )
})

// --- وظيفة حذف السيرفر (المطلوبة) ---
bot.action(/^DELETE_(\d+)$/, async (ctx) => {
  const uid = ctx.from.id
  const id = parseInt(ctx.match[1])
  if (servers[uid] && servers[uid][id]) {
    servers[uid].splice(id, 1)
    await ctx.answerCbQuery('✅ تم الحذف')
    ctx.reply('🗑 تم حذف السيرفر بنجاح من قائمتك.', mainMenu())
  }
})

// --- تشغيل البوت في اللعبة ---
bot.action(/^TOGGLE_(\d+)$/, async (ctx) => {
  ctx.answerCbQuery()
  const uid = ctx.from.id
  const s = servers[uid][ctx.match[1]]

  if (clients[uid]) {
    clients[uid].close()
    delete clients[uid]
    return ctx.reply('⏹ تم سحب البوت من السيرفر.')
  }

  ctx.reply('⏳ جاري محاولة الدخول (1.20 - 1.21.132)...')
  try {
    const client = bedrock.createClient({
      host: s.host,
      port: parseInt(s.port),
      username: 'Max_Bot',
      offline: true
    })

    clients[uid] = client
    client.on('spawn', () => ctx.reply('✅ دخل البوت السيرفر بنجاح!'))
    client.on('error', (err) => {
      console.error(err)
      delete clients[uid]
      ctx.reply('❌ فشل الاتصال بالسيرفر.')
    })
  } catch (e) { ctx.reply('❌ حدث خطأ في النظام.') }
})

bot.action('BACK', ctx => {
  ctx.answerCbQuery()
  ctx.reply('🎮 لوحة التحكم الرئيسية:', mainMenu())
})

// معالجة الأخطاء لمنع توقف البوت
process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT IS DEPLOYED ON RAILWAY')
