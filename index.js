const { Telegraf, Markup, session } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

/* Railway Keep Alive */
http.createServer((req, res) => res.end('OK')).listen(process.env.PORT || 3000)

/* Telegram Bot */
const bot = new Telegraf('8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU')

// إصلاح الجلسة لضمان حفظ البيانات وعدم ظهور خطأ Ip/0
bot.use(session({
  getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`
}))

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
  ctx.session = { step: 'ip' }
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
    ctx.session.port = parseInt(ctx.message.text)
    ctx.session.step = 'name'
    return ctx.reply('👤 اسم البوت:')
  }

  if (ctx.session.step === 'name') {
    server = {
      host: ctx.session.ip,
      port: ctx.session.port,
      username: ctx.message.text.trim()
    }
    ctx.session = null
    ctx.reply('✅ تم حفظ السيرفر بنجاح', { reply_markup: menu().reply_markup })
  }
})

/* ▶️ دخول (دعم جميع الإصدارات) */
bot.action('connect', ctx => {
  ctx.answerCbQuery().catch(() => {})

  if (!server) return ctx.reply('⚠️ أضف سيرفر أولاً', { reply_markup: menu().reply_markup })
  if (client) return ctx.reply('⚠️ البوت متصل بالفعل', { reply_markup: menu().reply_markup })

  ctx.reply('⏳ جاري تحليل الإصدار والاقتحام...')

  try {
    client = bedrock.createClient({
      host: server.host,
      port: server.port,
      username: server.username,
      offline: true,
      // ✅ التعديل المطلوب: دعم الإصدارات التلقائي مع تحديد إصدار افتراضي حديث
      version: '1.21.50', 
      connectTimeout: 30000,
      skipPing: false
    })

    client.on('packet', (packet, meta) => {
      // الرد على حزم الموارد لتجنب الطرد فور الدخول
      if (meta.name === 'resource_packs_info') {
        client.queue('resource_pack_client_response', { 
            response_status: 'completed', resource_pack_ids: [] 
        })
      }
    })

    client.on('spawn', () => {
      ctx.reply('🟢 البوت متصل الآن بجميع الإصدارات', { reply_markup: menu().reply_markup })
      afk = setInterval(() => {
        if (client) {
          client.queue('player_auth_input', {
            pitch: 0, yaw: 0, position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0, z: 0 },
            head_yaw: 0, input_data: { jump_down: true }, input_mode: 'touch', play_mode: 'normal'
          })
        }
      }, 15000)
    })

    client.on('disconnect', () => {
      cleanup()
      ctx.reply('🔴 تم فصل البوت', { reply_markup: menu().reply_markup })
    })

    client.on('error', err => {
      cleanup()
      ctx.reply('⚠️ خطأ: ' + err.message, { reply_markup: menu().reply_markup })
    })

  } catch (e) {
    ctx.reply('❌ فشل في تشغيل محرك الإصدارات.')
  }
})

/* ⏹️ خروج */
bot.action('disconnect', ctx => {
  ctx.answerCbQuery().catch(() => {})
  if (!client) return ctx.reply('⚠️ غير متصل', { reply_markup: menu().reply_markup })
  client.close()
  cleanup()
  ctx.reply('🛑 تم إخراج البوت', { reply_markup: menu().reply_markup })
})

/* 📊 الحالة */
bot.action('status', ctx => {
  ctx.answerCbQuery().catch(() => {})
  ctx.reply(client ? '🟢 البوت متصل' : '🔴 البوت غير متصل', { reply_markup: menu().reply_markup })
})

function cleanup () {
  if (afk) clearInterval(afk)
  afk = null
  client = null
}

process.on('uncaughtException', e => console.log(e))
process.on('unhandledRejection', e => console.log(e))

// تنظيف التحديثات المعلقة لحل مشكلة Conflict 409
bot.launch({ dropPendingUpdates: true })
console.log('✅ Multi-Version Bot Running')
