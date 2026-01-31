const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

// ===== حل مشكلة التوقف (Keep Alive المحسن) =====
// الاستضافة تحتاج رؤية نشاط مستمر على هذا المنفذ
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('MAX BLACK BOT IS ALIVE');
  res.end();
}).listen(7860);

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
      `⚠️ يجب عليك الاشتراك في القنوات أولاً:`,
      Markup.inlineKeyboard([
        [Markup.button.url('القناة 1', `https://t.me/aternosbot24`), Markup.button.url('القناة 2', `https://t.me/N_NHGER`)],
        [Markup.button.url('القناة 3', `https://t.me/sjxhhdbx72`), Markup.button.url('القناة 4', `https://t.me/vsyfyk`)],
        [Markup.button.callback('✅ تم الاشتراك', 'CHECK_SUB')]
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
  ctx.reply('📡 أرسل عنوان السيرفر هكذا -> ip:port')
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
  if (!list || list.length === 0) return ctx.reply('📭 القائمة فارغة.', mainMenu())

  const buttons = list.map((s, i) => [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)])
  buttons.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  ctx.reply('📂 اختر السيرفر:', Markup.inlineKeyboard(buttons))
})

// --- قائمة السيرفر الواحد ---
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

// --- وظيفة الحذف ---
bot.action(/^DELETE_(\d+)$/, async (ctx) => {
  const uid = ctx.from.id
  const id = parseInt(ctx.match[1])
  if (servers[uid] && servers[uid][id]) {
    servers[uid].splice(id, 1)
    await ctx.answerCbQuery('✅ تم الحذف')
    ctx.reply('🗑 تم حذف السيرفر من قائمتك.', mainMenu())
  }
})

// --- تشغيل وإيقاف الاتصال (دعم 1.20 - 1.21.132) ---
bot.action(/^TOGGLE_(\d+)$/, async (ctx) => {
  ctx.answerCbQuery()
  const uid = ctx.from.id
  const s = servers[uid][ctx.match[1]]

  if (clients[uid]) {
    clients[uid].close()
    delete clients[uid]
    return ctx.reply('⏹ تم سحب البوت.')
  }

  ctx.reply('⏳ جاري محاولة الدخول...')
  try {
    const client = bedrock.createClient({
      host: s.host,
      port: parseInt(s.port),
      username: 'Max_Bot',
      offline: true
      // ترك الإصدار فارغاً يجعله يتعرف تلقائياً على السيرفر
    })

    clients[uid] = client
    client.on('spawn', () => ctx.reply('✅ البوت دخل السيرفر!'))
    client.on('error', () => {
      delete clients[uid]
      ctx.reply('❌ فشل الاتصال.')
    })
  } catch { ctx.reply('❌ حدث خطأ.') }
})

bot.action('BACK', ctx => {
  ctx.answerCbQuery()
  ctx.reply('🎮 القائمة الرئيسية:', mainMenu())
})

// الحماية من الانهيار
process.on('uncaughtException', (err) => console.error('Error:', err))
process.on('unhandledRejection', (err) => console.error('Rejection:', err))

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT STARTED')
