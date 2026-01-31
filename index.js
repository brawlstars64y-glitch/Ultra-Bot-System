const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

// ===== إعدادات القنوات والتوكن =====
const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

const CHANNELS = [
  '@aternosbot24',
  '@N_NHGER',
  '@sjxhhdbx72',
  '@vsyfyk'
]

// ===== Keep Alive لضمان عمل الاستضافة =====
http.createServer((req, res) => {
  res.write('MAX BLACK BOT IS RUNNING')
  res.end()
}).listen(7860) 

// ===== STORAGE =====
const servers = {}   
const clients = {}   
const waitIP = {}    

// ===== دالة التحقق من الاشتراك =====
async function checkSubscription(ctx) {
  for (const channel of CHANNELS) {
    try {
      const member = await ctx.telegram.getChatMember(channel, ctx.from.id)
      if (['left', 'kicked', 'null'].includes(member.status)) return false
    } catch (e) {
      console.error(`خطأ في فحص القناة ${channel}:`, e)
      continue 
    }
  }
  return true
}

// ===== MENU =====
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر جديد', 'ADD')],
    [Markup.button.callback('📂 قائمة سيرفراتي', 'LIST')]
  ])
}

// ===== START =====
bot.start(async (ctx) => {
  const isSubscribed = await checkSubscription(ctx)
  if (!isSubscribed) {
    return ctx.reply(
      `⚠️ لا يمكنك استخدام البوت قبل الاشتراك في قنوات المطور!\n\nيرجى الاشتراك في القنوات أدناه ثم اضغط "تم الاشتراك":`,
      Markup.inlineKeyboard([
        [Markup.button.url('القناة 1', `https://t.me/aternosbot24`), Markup.button.url('القناة 2', `https://t.me/N_NHGER`)],
        [Markup.button.url('القناة 3', `https://t.me/sjxhhdbx72`), Markup.button.url('القناة 4', `https://t.me/vsyfyk`)],
        [Markup.button.callback('✅ تم الاشتراك في الكل', 'CHECK_SUB')]
      ])
    )
  }
  ctx.reply('🎮 أهلاً بك في لوحة التحكم، اختر خياراً:', mainMenu())
})

// ===== CHECK SUB BUTTON =====
bot.action('CHECK_SUB', async (ctx) => {
  const isSubscribed = await checkSubscription(ctx)
  if (isSubscribed) {
    await ctx.answerCbQuery('✅ شكراً لك! تم تفعيل البوت.')
    ctx.editMessageText('🎮 تم التحقق بنجاح، يمكنك الآن البدء بالاقتحام:', mainMenu())
  } else {
    await ctx.answerCbQuery('❌ لم تشترك في جميع القنوات بعد!', { show_alert: true })
  }
})

// ===== ADD SERVER =====
bot.action('ADD', async (ctx) => {
  if (!(await checkSubscription(ctx))) return
  ctx.answerCbQuery()
  waitIP[ctx.from.id] = true
  ctx.reply('📡 أرسل الآن عنوان السيرفر والمنفذ هكذا:\nip:port')
})

// ===== RECEIVE IP =====
bot.on('text', async (ctx) => {
  const uid = ctx.from.id
  if (!waitIP[uid]) return
  if (!(await checkSubscription(ctx))) return

  const text = ctx.message.text.trim()
  if (!text.includes(':')) {
    return ctx.reply('❌ خطأ! الصيغة الصحيحة هي ip:port')
  }

  const [host, port] = text.split(':')
  servers[uid] = servers[uid] || []
  servers[uid].push({ host, port: port.trim() })

  delete waitIP[uid]
  ctx.reply('✅ تم حفظ السيرفر بنجاح!', mainMenu())
})

// ===== LIST SERVERS =====
bot.action('LIST', async (ctx) => {
  if (!(await checkSubscription(ctx))) return
  ctx.answerCbQuery()
  const list = servers[ctx.from.id]

  if (!list || list.length === 0) {
    return ctx.reply('📭 لا توجد سيرفرات مضافة حالياً.', mainMenu())
  }

  const buttons = list.map((s, i) =>
    [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)]
  )
  buttons.push([Markup.button.callback('⬅️ رجوع', 'BACK')])

  ctx.reply('📂 اختر السيرفر المطلوب:', Markup.inlineKeyboard(buttons))
})

// ===== SERVER MENU (تم إضافة زر الحذف هنا) =====
bot.action(/^SRV_(\d+)$/, async (ctx) => {
  if (!(await checkSubscription(ctx))) return
  ctx.answerCbQuery()
  const id = ctx.match[1]
  const s = servers[ctx.from.id][id]
  const active = clients[ctx.from.id]

  ctx.reply(
    `🖥 السيرفر: ${s.host}:${s.port}\nالحالة: ${active ? '🟢 متصل' : '🔴 غير متصل'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(active ? '⏹ إيقاف البوت' : '▶️ تشغيل البوت', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف السيرفر', `DELETE_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ])
  )
})

// ===== DELETE ACTION (وظيفة الحذف) =====
bot.action(/^DELETE_(\d+)$/, async (ctx) => {
  const uid = ctx.from.id
  const id = parseInt(ctx.match[1])
  if (servers[uid] && servers[uid][id]) {
    servers[uid].splice(id, 1)
    await ctx.answerCbQuery('✅ تم الحذف')
    ctx.reply('🗑 تم حذف السيرفر بنجاح من قائمتك.', mainMenu())
  }
})

// ===== TOGGLE BOT PLAYER =====
bot.action(/^TOGGLE_(\d+)$/, async (ctx) => {
  if (!(await checkSubscription(ctx))) return
  ctx.answerCbQuery()
  const uid = ctx.from.id
  const s = servers[uid][ctx.match[1]]

  if (clients[uid]) {
    clients[uid].close()
    delete clients[uid]
    return ctx.reply('⏹ تم سحب البوت من السيرفر.')
  }

  ctx.reply('⏳ جاري الدخول (إصدار 1.21.130)...')
  try {
    const client = bedrock.createClient({
      host: s.host,
      port: parseInt(s.port),
      username: 'Max_Black_Bot',
      offline: true,
      version: '1.21.130'
    })

    clients[uid] = client
    client.on('spawn', () => ctx.reply('✅ دخل البوت السيرفر بنجاح!'))
    client.on('error', (err) => {
      delete clients[uid]
      ctx.reply('❌ حدث خطأ أو السيرفر مغلق.')
    })
  } catch (e) {
    ctx.reply('❌ فشل تشغيل الاتصال.')
  }
})

// ===== BACK =====
bot.action('BACK', ctx => {
  ctx.answerCbQuery()
  ctx.reply('🎮 القائمة الرئيسية:', mainMenu())
})

// الحماية
process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT UPDATED AND READY')
