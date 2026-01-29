const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

// ===== Keep Alive =====
http.createServer((req, res) => res.end('OK'))
  .listen(process.env.PORT || 3000)

// ===== BOT =====
const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

// ===== CONFIG (قنوات الاشتراك) =====
const CHANNELS = ['@N_NHGER', '@aternosbot24', '@sjxhhdbx72', '@vsyfyk'];

// ===== STORAGE =====
const servers = {}   // userId => [{host, port}]
const clients = {}   // userId => client
const waitIP = {}    // userId => true

// ===== CHECK SUBSCRIPTION (فحص الاشتراك) =====
async function isSubscribed(ctx) {
  const uid = ctx.from.id;
  for (const channel of CHANNELS) {
    try {
      const member = await ctx.telegram.getChatMember(channel, uid);
      if (['left', 'kicked'].includes(member.status)) return false;
    } catch (e) {
      console.log(`خطأ في فحص قناة ${channel}:`, e.message);
      // إذا كان البوت ليس أدمن في القناة سيتجاوز الفحص لضمان عدم التوقف
    }
  }
  return true;
}

// ===== MENU =====
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'ADD')],
    [Markup.button.callback('📂 سيرفراتي', 'LIST')]
  ])
}

// ===== START =====
bot.start(async (ctx) => {
  if (!(await isSubscribed(ctx))) {
    return ctx.reply(
      '⚠️ عذراً عزيزي، يجب عليك الاشتراك في قنوات البوت أولاً لاستخدامه:\n\n' +
      '1️⃣ @N_NHGER\n2️⃣ @aternosbot24\n3️⃣ @sjxhhdbx72\n4️⃣ @vsyfyk\n\nاشترك ثم أرسل /start مجدداً.',
      Markup.inlineKeyboard([
        [Markup.button.url('القناة الأولى', 'https://t.me/N_NHGER')],
        [Markup.button.url('القناة الثانية', 'https://t.me/aternosbot24')],
        [Markup.button.url('القناة الثالثة', 'https://t.me/sjxhhdbx72')],
        [Markup.button.url('القناة الرابعة', 'https://t.me/vsyfyk')]
      ])
    );
  }
  ctx.reply('🎮 لوحة تحكم بسيطة\nاختر خيار:', mainMenu());
})

// ===== ADD SERVER =====
bot.action('ADD', async (ctx) => {
  if (!(await isSubscribed(ctx))) return ctx.answerCbQuery('❌ اشترك بالقنوات أولاً!', { show_alert: true });
  ctx.answerCbQuery()
  waitIP[ctx.from.id] = true
  ctx.reply('📡 أرسل السيرفر هكذا:\nip:port')
})

// ===== RECEIVE IP =====
bot.on('text', async (ctx) => {
  const uid = ctx.from.id
  if (!waitIP[uid]) return
  if (!(await isSubscribed(ctx))) return ctx.reply('❌ اشترك بالقنوات أولاً ثم أرسل /start');

  const text = ctx.message.text.trim()
  if (!text.includes(':')) {
    return ctx.reply('❌ خطأ\nاكتب ip:port')
  }

  const [host, port] = text.split(':')
  if (!host || !port) {
    return ctx.reply('❌ صيغة غير صحيحة')
  }

  servers[uid] = servers[uid] || []
  servers[uid].push({ host, port })

  delete waitIP[uid]
  ctx.reply('✅ تم حفظ السيرفر', mainMenu())
})

// ===== LIST SERVERS =====
bot.action('LIST', async (ctx) => {
  if (!(await isSubscribed(ctx))) return ctx.answerCbQuery('❌ اشترك بالقنوات أولاً!', { show_alert: true });
  ctx.answerCbQuery()
  const list = servers[ctx.from.id]

  if (!list || list.length === 0) {
    return ctx.reply('📭 لا يوجد سيرفرات', mainMenu())
  }

  const buttons = list.map((s, i) =>
    [Markup.button.callback(`${s.host}:${s.port}`, `SRV_${i}`)]
  )

  buttons.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  ctx.reply('📂 اختر سيرفر:', Markup.inlineKeyboard(buttons))
})

// ===== SERVER MENU =====
bot.action(/^SRV_(\d+)$/, async (ctx) => {
  if (!(await isSubscribed(ctx))) return ctx.answerCbQuery('❌ اشترك بالقنوات أولاً!', { show_alert: true });
  ctx.answerCbQuery()
  const uid = ctx.from.id
  const id = ctx.match[1]
  const s = servers[uid][id]
  const active = clients[uid]

  ctx.reply(
    `🖥 ${s.host}:${s.port}\nالحالة: ${active ? '🟢 يعمل' : '🔴 متوقف'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(active ? '⏹ إيقاف' : '▶️ تشغيل', `TOGGLE_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ])
  )
})

// ===== TOGGLE BOT PLAYER =====
bot.action(/^TOGGLE_(\d+)$/, async (ctx) => {
  if (!(await isSubscribed(ctx))) return ctx.answerCbQuery('❌ اشترك بالقنوات أولاً!', { show_alert: true });
  ctx.answerCbQuery()
  const uid = ctx.from.id
  const s = servers[uid][ctx.match[1]]

  if (clients[uid]) {
    clients[uid].close()
    delete clients[uid]
    return ctx.reply('⏹ تم إيقاف البوت')
  }

  ctx.reply('⏳ جاري الدخول...')
  try {
    const client = bedrock.createClient({
      host: s.host,
      port: parseInt(s.port),
      username: 'BotPlayer',
      offline: true,
      version: '1.21.130' // أضفت هذا لضمان الدخول كما طلبت سابقاً
    })

    clients[uid] = client
    client.on('spawn', () => ctx.reply('✅ البوت دخل السيرفر'))
    client.on('error', (err) => {
      delete clients[uid]
      ctx.reply('❌ خرج البوت أو حدث خطأ')
    })
  } catch {
    ctx.reply('❌ فشل التشغيل')
  }
})

bot.action('BACK', ctx => {
  ctx.answerCbQuery()
  ctx.reply('⬅️ رجوع', mainMenu())
})

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT READY WITH FORCED SUB')
