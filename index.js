const { Telegraf, Markup, session } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

/* Railway Keep Alive */
http.createServer((req, res) => res.end('OK')).listen(process.env.PORT || 3000)

/* Telegram Bot */
const bot = new Telegraf('8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU')

// ✅ الإصلاح الجذري: تهيئة الجلسة لتعمل على مستوى المستخدم والدردشة لضمان حفظ البيانات
bot.use(session({
  getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`
}))

// متغيرات عامة (Global) لضمان عدم ضياع البيانات في النسخة الحالية
let client = null
let server = null
let afk = null

/* 🎮 الواجهة */
function menu () {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'add')],
    [Markup.button.callback('▶️ دخول', 'connect')],
    [Markup.button.callback('⏹️ خروج', 'disconnect')],
    [Markup.button.callback('📊 الحالة', 'status')]
  ])
}

/* 🚀 start */
bot.start(ctx => {
  ctx.reply('🔴 البوت غير متصل', { reply_markup: menu().reply_markup })
})

/* ➕ إضافة سيرفر */
bot.action('add', ctx => {
  ctx.answerCbQuery().catch(() => {})
  ctx.session = { step: 'ip' } // تهيئة الخطوة الأولى
  ctx.reply('🌐 أرسل IP السيرفر:')
})

bot.on('text', ctx => {
  if (!ctx.session || !ctx.session.step) return

  if (ctx.session.step === 'ip') {
    ctx.session.ip = ctx.message.text.trim()
    ctx.session.step = 'port'
    return ctx.reply('🔢 أرسل Port:')
  }

  if (ctx.session.step === 'port') {
    const port = parseInt(ctx.message.text)
    if (isNaN(port)) return ctx.reply('⚠️ أرسل بورت صحيح (أرقام فقط):')
    ctx.session.port = port
    ctx.session.step = 'name'
    return ctx.reply('👤 اسم البوت:')
  }

  if (ctx.session.step === 'name') {
    // ✅ حفظ البيانات في المتغير العام server لتجنب خطأ Ip/0
    server = {
      host: ctx.session.ip,
      port: ctx.session.port,
      username: ctx.message.text.trim()
    }
    ctx.session = null // إنهاء خطوات الإدخال
    ctx.reply('✅ تم حفظ السيرفر بنجاح!', { reply_markup: menu().reply_markup })
  }
})

/* ▶️ دخول */
bot.action('connect', ctx => {
  ctx.answerCbQuery().catch(() => {})

  // فحص إذا كانت البيانات موجودة فعلاً
  if (!server || !server.host) {
    return ctx.reply('⚠️ خطأ: البيانات مفقودة. أعد إضافة السيرفر.', { reply_markup: menu().reply_markup })
  }

  if (client) return ctx.reply('⚠️ البوت متصل بالفعل.', { reply_markup: menu().reply_markup })

  ctx.reply(`⏳ جاري الدخول إلى: ${server.host}...`)

  try {
    client = bedrock.createClient({
      host: server.host,
      port: server.port,
      username: server.username,
      offline: true,
      version: false, // اكتشاف تلقائي للإصدار لتجنب مشاكل التوافق
      skipPing: false
    })

    client.on('spawn', () => {
      ctx.reply('🟢 البوت متصل الآن داخل اللعبة.', { reply_markup: menu().reply_markup })
      afk = setInterval(() => {
        if (client) {
          client.queue('player_auth_input', {
            pitch: 0, yaw: 0, position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0, z: 0 },
            head_yaw: 0, input_data: { jump_down: true }, input_mode: 'touch', play_mode: 'normal'
          })
        }
      }, 15000)
    })

    client.on('error', err => {
      cleanup()
      ctx.reply(`⚠️ خطأ: ${err.message}`, { reply_markup: menu().reply_markup })
    })

    client.on('disconnect', () => {
      cleanup()
      ctx.reply('🔴 تم فصل البوت.', { reply_markup: menu().reply_markup })
    })

  } catch (e) {
    ctx.reply('❌ فشل تشغيل محرك الدخول.')
  }
})

/* ⏹️ خروج */
bot.action('disconnect', ctx => {
  ctx.answerCbQuery().catch(() => {})
  if (!client) return ctx.reply('⚠️ غير متصل.', { reply_markup: menu().reply_markup })
  client.close()
  cleanup()
  ctx.reply('🛑 تم إخراج البوت.', { reply_markup: menu().reply_markup })
})

/* 📊 الحالة */
bot.action('status', ctx => {
  ctx.answerCbQuery().catch(() => {})
  const status = client ? '🟢 متصل' : '🔴 غير متصل'
  const details = server ? `\n📍 \`${server.host}:${server.port}\`` : ''
  ctx.reply(`${status}${details}`, { reply_markup: menu().reply_markup })
})

function cleanup () {
  if (afk) clearInterval(afk)
  afk = null
  client = null
}

process.on('uncaughtException', e => console.log('Error:', e))

// ✅ استخدام dropPendingUpdates لتجنب تكرار العمليات (Conflict 409)
bot.launch({ dropPendingUpdates: true })
console.log('✅ MaxBlack System is Online')
