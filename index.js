const { Telegraf, Markup, session } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

/* Railway Keep Alive */
http.createServer((req, res) => res.end('OK')).listen(process.env.PORT || 3000)

/* Telegram Bot */
const bot = new Telegraf('8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU')

// ✅ تحسين الجلسات لتخزين بيانات متعددة
bot.use(session({
  getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`,
  defaultSession: () => ({
    servers: [], // تخزين عدة سيرفرات
    currentServer: null,
    step: null
  })
}))

// متغيرات عامة
let clients = new Map() // لتخزين اتصالات متعددة
let afkIntervals = new Map()

/* 🎮 القائمة الرئيسية */
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'add_server')],
    [Markup.button.callback('📋 قائمة السيرفرات', 'list_servers')],
    [Markup.button.callback('▶️ دخول', 'connect')],
    [Markup.button.callback('⏹️ خروج', 'disconnect')],
    [Markup.button.callback('⚙️ إعدادات AFK', 'afk_settings')],
    [Markup.button.callback('📊 الحالة', 'status')]
  ])
}

/* 🎮 قائمة السيرفرات */
function serversMenu(servers) {
  const buttons = servers.map((server, index) => 
    [Markup.button.callback(`${server.name} - ${server.host}:${server.port}`, `select_${index}`)]
  )
  buttons.push([Markup.button.callback('🔙 رجوع', 'back_to_main')])
  return Markup.inlineKeyboard(buttons)
}

/* 🎮 قائمة إعدادات AFK */
function afkMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('▶️ تشغيل AFK', 'afk_on'), Markup.button.callback('⏸️ إيقاف AFK', 'afk_off')],
    [Markup.button.callback('🔙 رجوع', 'back_to_main')]
  ])
}

/* 🚀 بدء البوت */
bot.start(ctx => {
  ctx.reply('👋 أهلاً بك في نظام MaxBlack Bot!', { 
    reply_markup: mainMenu().reply_markup 
  })
})

/* ➕ إضافة سيرفر */
bot.action('add_server', ctx => {
  ctx.answerCbQuery().catch(() => {})
  ctx.session.step = 'server_name'
  ctx.reply('📝 أدخل اسم للسيرفر (مثال: سيرفر فري):')
})

/* 📋 قائمة السيرفرات */
bot.action('list_servers', ctx => {
  ctx.answerCbQuery().catch(() => {})
  if (!ctx.session.servers || ctx.session.servers.length === 0) {
    return ctx.reply('⚠️ لا توجد سيرفرات مضافة.', { reply_markup: mainMenu().reply_markup })
  }
  ctx.reply('📋 اختر سيرفر:', { 
    reply_markup: serversMenu(ctx.session.servers).reply_markup 
  })
})

/* ⚙️ إعدادات AFK */
bot.action('afk_settings', ctx => {
  ctx.answerCbQuery().catch(() => {})
  ctx.reply('⚙️ إعدادات AFK:', {
    reply_markup: afkMenu().reply_markup
  })
})

/* ◀️ رجوع للقائمة */
bot.action('back_to_main', ctx => {
  ctx.answerCbQuery().catch(() => {})
  ctx.session.step = null
  ctx.session.currentServer = null
  ctx.reply('🏠 القائمة الرئيسية:', {
    reply_markup: mainMenu().reply_markup
  })
})

/* ✍️ معالجة الرسائل النصية */
bot.on('text', ctx => {
  if (!ctx.session.step) return

  const text = ctx.message.text.trim()

  switch (ctx.session.step) {
    case 'server_name':
      ctx.session.tempServer = { name: text }
      ctx.session.step = 'server_ip'
      ctx.reply('🌐 أدخل IP السيرفر (مثال: play.server.com):')
      break

    case 'server_ip':
      ctx.session.tempServer.host = text
      ctx.session.step = 'server_port'
      ctx.reply('🔢 أدخل Port السيرفر (مثال: 19132):')
      break

    case 'server_port':
      const port = parseInt(text)
      if (isNaN(port) || port < 1 || port > 65535) {
        return ctx.reply('⚠️ Port غير صالح. أدخل رقم بين 1 و 65535:')
      }
      ctx.session.tempServer.port = port
      ctx.session.step = 'bot_username'
      ctx.reply('👤 أدخل اسم البوت في اللعبة:')
      break

    case 'bot_username':
      ctx.session.tempServer.username = text
      ctx.session.step = 'server_version'
      ctx.reply('🔄 أدخل إصدار السيرفر (مثال: 1.20.50 أو اترك فارغ للاكتشاف التلقائي):')
      break

    case 'server_version':
      if (text) {
        ctx.session.tempServer.version = text
      }
      
      // إضافة السيرفر للقائمة
      if (!ctx.session.servers) {
        ctx.session.servers = []
      }
      
      ctx.session.servers.push(ctx.session.tempServer)
      ctx.session.step = null
      ctx.session.tempServer = null
      
      ctx.reply('✅ تم إضافة السيرفر بنجاح!', {
        reply_markup: mainMenu().reply_markup
      })
      break
  }
})

/* 🔘 اختيار سيرفر */
bot.action(/select_(\d+)/, async ctx => {
  const index = parseInt(ctx.match[1])
  if (ctx.session.servers && ctx.session.servers[index]) {
    ctx.session.currentServer = ctx.session.servers[index]
    ctx.answerCbQuery(`تم اختيار ${ctx.session.currentServer.name}`)
    ctx.reply(`✅ السيرفر المحدد: ${ctx.session.currentServer.name}`, {
      reply_markup: mainMenu().reply_markup
    })
  }
})

/* ▶️ دخول للسيرفر */
bot.action('connect', async ctx => {
  ctx.answerCbQuery().catch(() => {})

  if (!ctx.session.currentServer) {
    return ctx.reply('⚠️ الرجاء اختيار سيرفر أولاً من قائمة السيرفرات.')
  }

  const server = ctx.session.currentServer
  const serverKey = `${server.host}:${server.port}`

  if (clients.has(serverKey)) {
    return ctx.reply('⚠️ البوت متصل بالفعل بهذا السيرفر.')
  }

  ctx.reply(`⏳ جاري الدخول إلى ${server.name}...`)

  try {
    const options = {
      host: server.host,
      port: server.port,
      username: server.username || `Bot_${Date.now()}`,
      offline: true,
      skipPing: false,
      connectTimeout: 30000,
      profilesFolder: './profiles'
    }

    // إضافة الإصدار إذا تم تحديده
    if (server.version) {
      options.version = server.version
    } else {
      options.version = false // اكتشاف تلقائي
    }

    const client = bedrock.createClient(options)

    // حفظ العميل في الخريطة
    clients.set(serverKey, {
      client,
      server: server.name,
      connectedAt: new Date()
    })

    // أحداث العميل
    client.on('spawn', () => {
      ctx.reply(`🟢 البوت متصل الآن بـ ${server.name}`)
      
      // تشغيل AFK تلقائياً
      const interval = setInterval(() => {
        if (client) {
          try {
            client.queue('player_auth_input', {
              pitch: 0,
              yaw: 0,
              position: { x: 0, y: 0, z: 0 },
              move_vector: { x: 0, z: 0 },
              head_yaw: 0,
              input_data: { 
                jump_down: true,
                auto_jumping: true
              },
              input_mode: 'touch',
              play_mode: 'normal',
              interaction_model: 'touch'
            })
          } catch (e) {
            console.log('AFK Error:', e.message)
          }
        }
      }, 15000)

      afkIntervals.set(serverKey, interval)
    })

    client.on('error', (err) => {
      console.error('Connection Error:', err)
      ctx.reply(`❌ خطأ في الاتصال بـ ${server.name}: ${err.message}`)
      cleanupConnection(serverKey)
    })

    client.on('disconnect', (packet) => {
      ctx.reply(`🔴 تم فصل البوت من ${server.name}`)
      cleanupConnection(serverKey)
    })

    client.on('server_disconnect', (packet) => {
      ctx.reply(`⚠️ السيرفر ${server.name} قام بفصل البوت`)
      cleanupConnection(serverKey)
    })

  } catch (error) {
    console.error('Connection Setup Error:', error)
    ctx.reply(`❌ فشل الاتصال بـ ${server.name}: ${error.message}`)
  }
})

/* ⏹️ خروج من السيرفر */
bot.action('disconnect', ctx => {
  ctx.answerCbQuery().catch(() => {})

  if (!ctx.session.currentServer) {
    return ctx.reply('⚠️ الرجاء اختيار سيرفر أولاً.')
  }

  const server = ctx.session.currentServer
  const serverKey = `${server.host}:${server.port}`

  if (!clients.has(serverKey)) {
    return ctx.reply('⚠️ البوت غير متصل بهذا السيرفر.')
  }

  const connection = clients.get(serverKey)
  connection.client.close()
  cleanupConnection(serverKey)
  
  ctx.reply(`🛑 تم إخراج البوت من ${server.name}`)
})

/* 🔄 تشغيل/إيقاف AFK */
bot.action('afk_on', ctx => {
  ctx.answerCbQuery().catch(() => {})
  
  if (!ctx.session.currentServer) {
    return ctx.reply('⚠️ الرجاء اختيار سيرفر أولاً.')
  }

  const server = ctx.session.currentServer
  const serverKey = `${server.host}:${server.port}`

  if (!clients.has(serverKey)) {
    return ctx.reply('⚠️ البوت غير متصل.')
  }

  // إذا كان AFK مفعل مسبقاً
  if (afkIntervals.has(serverKey)) {
    return ctx.reply('⚠️ AFK مفعل بالفعل.')
  }

  const connection = clients.get(serverKey)
  
  const interval = setInterval(() => {
    if (connection.client) {
      try {
        connection.client.queue('player_auth_input', {
          pitch: 0,
          yaw: Math.random() * 360 - 180,
          position: { x: 0, y: 0, z: 0 },
          move_vector: { x: 0, z: 0 },
          head_yaw: 0,
          input_data: { 
            jump_down: true,
            auto_jumping: true
          },
          input_mode: 'touch',
          play_mode: 'normal'
        })
      } catch (e) {
        console.log('AFK Error:', e.message)
      }
    }
  }, 15000)

  afkIntervals.set(serverKey, interval)
  ctx.reply('✅ تم تفعيل AFK')
})

bot.action('afk_off', ctx => {
  ctx.answerCbQuery().catch(() => {})
  
  if (!ctx.session.currentServer) {
    return ctx.reply('⚠️ الرجاء اختيار سيرفر أولاً.')
  }

  const server = ctx.session.currentServer
  const serverKey = `${server.host}:${server.port}`

  if (afkIntervals.has(serverKey)) {
    clearInterval(afkIntervals.get(serverKey))
    afkIntervals.delete(serverKey)
    ctx.reply('✅ تم إيقاف AFK')
  } else {
    ctx.reply('⚠️ AFK غير مفعل.')
  }
})

/* 📊 حالة البوت */
bot.action('status', ctx => {
  ctx.answerCbQuery().catch(() => {})

  let statusMessage = '📊 **حالة البوت:**\n\n'
  
  // حالة السيرفر الحالي
  if (ctx.session.currentServer) {
    const server = ctx.session.currentServer
    const serverKey = `${server.host}:${server.port}`
    
    statusMessage += `**السيرفر المحدد:** ${server.name}\n`
    statusMessage += `📍 ${server.host}:${server.port}\n`
    statusMessage += `👤 ${server.username}\n`
    
    if (clients.has(serverKey)) {
      const connection = clients.get(serverKey)
      const uptime = Math.floor((new Date() - connection.connectedAt) / 1000)
      statusMessage += `🟢 **متصل** (منذ ${uptime} ثانية)\n`
      statusMessage += `⏱️ **AFK:** ${afkIntervals.has(serverKey) ? 'مفعل' : 'معطل'}\n`
    } else {
      statusMessage += '🔴 **غير متصل**\n'
    }
  } else {
    statusMessage += '⚠️ **لا يوجد سيرفر محدد**\n'
  }
  
  // إحصاءات عامة
  statusMessage += `\n**إحصاءات:**\n`
  statusMessage += `📋 السيرفرات: ${ctx.session.servers ? ctx.session.servers.length : 0}\n`
  statusMessage += `🔗 اتصالات نشطة: ${clients.size}\n`
  
  ctx.reply(statusMessage, {
    parse_mode: 'Markdown',
    reply_markup: mainMenu().reply_markup
  })
})

/* 🧹 تنظيف الاتصال */
function cleanupConnection(serverKey) {
  if (afkIntervals.has(serverKey)) {
    clearInterval(afkIntervals.get(serverKey))
    afkIntervals.delete(serverKey)
  }
  clients.delete(serverKey)
}

/* 🧹 تنظيف جميع الاتصالات عند إغلاق البوت */
process.on('SIGINT', () => {
  clients.forEach((connection, key) => {
    if (connection.client) {
      connection.client.close()
    }
    cleanupConnection(key)
  })
  bot.stop('SIGINT')
})

/* 🛠️ معالجة الأخطاء */
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

/* 🚀 تشغيل البوت */
bot.launch({
  dropPendingUpdates: true,
  allowedUpdates: ['message', 'callback_query']
}).then(() => {
  console.log('✅ MaxBlack System is Online - All Versions Supported')
  console.log('📞 Bot is running...')
})

// أوامر إضافية للمطور
bot.command('clear', (ctx) => {
  ctx.session.servers = []
  ctx.session.currentServer = null
  ctx.reply('🧹 تم مسح جميع البيانات.')
})

bot.command('restart', (ctx) => {
  ctx.reply('🔄 إعادة تشغيل النظام...')
  // يمكن إضافة منطق إعادة التشغيل هنا
})
