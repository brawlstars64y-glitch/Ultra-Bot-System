const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

// إعداد السيرفر لضمان بقاء البوت حياً على Railway
const PORT = process.env.PORT || 8080
http.createServer((req, res) => {
  res.writeHead(200)
  res.end('MAX BLACK BOT IS RUNNING')
}).listen(PORT)

const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

// قائمة القنوات
const CHANNELS = [
  { name: 'القناة 1', user: '@aternosbot24', url: 'https://t.me/aternosbot24' },
  { name: 'القناة 2', user: '@N_NHGER', url: 'https://t.me/N_NHGER' },
  { name: 'القناة 3', user: '@sjxhhdbx72', url: 'https://t.me/sjxhhdbx72' },
  { name: 'القناة 4', user: '@vsyfyk', url: 'https://t.me/vsyfyk' }
]

const servers = {}; const clients = {}; const waitIP = {}

// دالة فحص الاشتراك الإجباري
async function checkSub(ctx) {
  for (const ch of CHANNELS) {
    try {
      const member = await ctx.telegram.getChatMember(ch.user, ctx.from.id)
      if (['left', 'kicked', 'null'].includes(member.status)) return false
    } catch (e) {
      console.error(`خطأ فحص القناة ${ch.user}:`, e)
      continue 
    }
  }
  return true
}

// القائمة الرئيسية
const mainMenu = () => Markup.inlineKeyboard([
  [Markup.button.callback('➕ إضافة سيرفر جديد', 'ADD')],
  [Markup.button.callback('📂 قائمة سيرفراتي', 'LIST')]
])

// --- أمر البدء (START) ---
bot.start(async (ctx) => {
  const isSubbed = await checkSub(ctx)
  if (!isSubbed) {
    const buttons = CHANNELS.map(ch => [Markup.button.url(ch.name, ch.url)])
    buttons.push([Markup.button.callback('✅ تم الاشتراك في الكل', 'CHECK')])
    
    return ctx.reply(
      `⚠️ أهلاً بك! لا يمكنك استخدام البوت قبل الاشتراك في قنوات المطور.\n\nيرجى الاشتراك ثم اضغط على زر التحقق:`,
      Markup.inlineKeyboard(buttons)
    )
  }
  ctx.reply('🎮 أهلاً بك في لوحة التحكم، اختر خياراً:', mainMenu())
})

// فحص الاشتراك بعد الضغط على الزر
bot.action('CHECK', async (ctx) => {
  if (await checkSub(ctx)) {
    await ctx.answerCbQuery('✅ شكراً لك! تم التفعيل.')
    ctx.editMessageText('🎮 تم التحقق بنجاح، يمكنك الآن التحكم بسيرفراتك:', mainMenu())
  } else {
    await ctx.answerCbQuery('❌ لم تشترك في جميع القنوات بعد!', { show_alert: true })
  }
})

// --- إضافة سيرفر ---
bot.action('ADD', async (ctx) => {
  ctx.answerCbQuery()
  waitIP[ctx.from.id] = true
  ctx.reply('📡 أرسل الآن عنوان السيرفر والمنفذ هكذا:\nip:port')
})

bot.on('text', async (ctx) => {
  const uid = ctx.from.id
  if (!waitIP[uid]) return

  const text = ctx.message.text.trim()
  if (!text.includes(':')) return ctx.reply('❌ خطأ! الصيغة الصحيحة هي ip:port')

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
  if (!list || list.length === 0) return ctx.reply('📭 قائمة سيرفراتك فارغة حالياً.', mainMenu())

  const buttons = list.map((s, i) => [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)])
  buttons.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  ctx.reply('📂 اختر السيرفر المطلوب:', Markup.inlineKeyboard(buttons))
})

// --- لوحة تحكم السيرفر المختار ---
bot.action(/^SRV_(\d+)$/, async (ctx) => {
  ctx.answerCbQuery()
  const id = ctx.match[1]
  const s = servers[ctx.from.id][id]
  const active = clients[ctx.from.id]

  ctx.reply(
    `🖥 السيرفر: ${s.host}:${s.port}\nالحالة: ${active ? '🟢 متصل' : '🔴 متوقف'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(active ? '⏹ إيقاف البوت' : '▶️ تشغيل البوت', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف السيرفر', `DEL_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ])
  )
})

// --- حذف سيرفر ---
bot.action(/^DEL_(\d+)$/, async (ctx) => {
  const uid = ctx.from.id
  const id = parseInt(ctx.match[1])
  if (servers[uid]) {
    servers[uid].splice(id, 1)
    await ctx.answerCbQuery('✅ تم الحذف')
    ctx.reply('🗑 تم حذف السيرفر بنجاح من قائمتك.', mainMenu())
  }
})

// --- تشغيل وإيقاف البوت في ماين كرافت ---
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
      username: 'Max_Black_Bot',
      offline: true
    })

    clients[uid] = client
    client.on('spawn', () => ctx.reply('✅ دخل البوت السيرفر بنجاح!'))
    client.on('error', (err) => {
      console.error(err)
      delete clients[uid]
      ctx.reply('❌ فشل الاتصال، تأكد من بيانات السيرفر.')
    })
  } catch (e) {
    ctx.reply('❌ حدث خطأ تقني.')
  }
})

bot.action('BACK', ctx => {
  ctx.answerCbQuery()
  ctx.editMessageText('🎮 لوحة التحكم الرئيسية:', mainMenu())
})

// معالجة الأخطاء لضمان عدم توقف البوت
process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

bot.launch().then(() => console.log('✅ BOT IS FULLY OPERATIONAL'))
