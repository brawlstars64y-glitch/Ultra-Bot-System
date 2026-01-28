const { Telegraf, Markup, session } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

/* Railway Keep Alive */
http.createServer((req, res) => res.end('OK')).listen(process.env.PORT || 3000)

/* Telegram Bot */
const bot = new Telegraf('8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU')

// ✅ تحسين الجلسات
bot.use(session({
  getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`,
  defaultSession: () => ({
    servers: [],
    currentServer: null,
    step: null,
    action: null,
    tempServer: null
  })
}))

// متغيرات عامة
let clients = new Map()
let afkIntervals = new Map()

/* 🎮 القائمة الرئيسية */
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'add_server')],
    [Markup.button.callback('📋 قائمة السيرفرات', 'list_servers')],
    [Markup.button.callback('🗑️ حذف سيرفر', 'delete_server')],
    [Markup.button.callback('▶️ دخول', 'connect')],
    [Markup.button.callback('⏹️ خروج', 'disconnect')],
    [Markup.button.callback('⚙️ إعدادات AFK', 'afk_settings')],
    [Markup.button.callback('📊 الحالة', 'status')]
  ])
}

/* 🎮 قائمة السيرفرات */
function serversMenu(servers, action = 'select') {
  const buttons = servers.map((server, index) => [
    Markup.button.callback(
      `${server.name} - ${server.host}:${server.port}`,
      `${action}_${index}`
    )
  ])
  buttons.push([Markup.button.callback('🔙 رجوع', 'back_to_main')])
  return Markup.inlineKeyboard(buttons)
}

/* 🗑️ قائمة حذف السيرفرات */
function deleteMenu(servers) {
  const buttons = servers.map((server, index) => [
    Markup.button.callback(
      `❌ ${server.name} - ${server.host}:${server.port}`,
      `delete_${index}`
    )
  ])
  buttons.push([
    Markup.button.callback('🗑️ حذف الكل', 'delete_all'),
    Markup.button.callback('🔙 رجوع', 'back_to_main')
  ])
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
  ctx.session.action = 'add'
  ctx.session.tempServer = {}
  ctx.reply('📝 أدخل اسم للسيرفر (مثال: سيرفر فري):')
})

/* 📋 قائمة السيرفرات */
bot.action('list_servers', ctx => {
  ctx.answerCbQuery().catch(() => {})
  if (!ctx.session.servers || ctx.session.servers.length === 0) {
    return ctx.reply('⚠️ لا توجد سيرفرات مضافة.', { reply_markup: mainMenu().reply_markup })
  }
  ctx.reply('📋 اختر سيرفر:', { 
    reply_markup: serversMenu(ctx.session.servers, 'select').reply_markup 
  })
})

/* 🗑️ حذف سيرفر */
bot.action('delete_server', ctx => {
  ctx.answerCbQuery().catch(() => {})
  
  if (!ctx.session.servers || ctx.session.servers.length === 0) {
    return ctx.reply('⚠️ لا توجد سيرفرات لحذفها.', { reply_markup: mainMenu().reply_markup })
  }
  
  ctx.reply('🗑️ اختر السيرفر الذي تريد حذفه:', {
    reply_markup: deleteMenu(ctx.session.servers).reply_markup
  })
})

/* 🗑️ حذف سيرفر محدد */
bot.action(/delete_(\d+)/, async ctx => {
  const index = parseInt(ctx.match[1])
  
  if (!ctx.session.servers || !ctx.session.servers[index]) {
    return ctx.answerCbQuery('⚠️ السيرفر غير موجود')
  }
  
  const deletedServer = ctx.session.servers[index]
  const serverKey = `${deletedServer.host}:${deletedServer.port}`
  
  // إغلاق الاتصال إذا كان السيرفر متصلاً
  if (clients.has(serverKey)) {
    const connection = clients.get(serverKey)
    if (connection.client) {
      connection.client.close()
    }
    cleanupConnection(serverKey)
  }
  
  // حذف السيرفر من القائمة
  ctx.session.servers.splice(index, 1)
  
  // إذا كان السيرفر المحذوف هو الحالي، إلغاء تحديده
  if (ctx.session.currentServer && 
      ctx.session.currentServer.host === deletedServer.host &&
      ctx.session.currentServer.port === deletedServer.port) {
    ctx.session.currentServer = null
  }
  
  await ctx.answerCbQuery(`✅ تم حذف ${deletedServer.name}`)
  ctx.reply(`🗑️ تم حذف السيرفر: ${deletedServer.name}\n📍 ${deletedServer.host}:${deletedServer.port}`, {
    reply_markup: mainMenu().reply_markup
  })
})

/* 🗑️ حذف جميع السيرفرات */
bot.action('delete_all', async ctx => {
  ctx.answerCbQuery().catch(() => {})
  
  if (!ctx.session.servers || ctx.session.servers.length === 0) {
    return ctx.reply('⚠️ لا توجد سيرفرات لحذفها.')
  }
  
  const confirmKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('✅ نعم، احذف الكل', 'confirm_delete_all')],
    [Markup.button.callback('❌ إلغاء', 'back_to_main')]
  ])
  
  ctx.reply(`⚠️ **تحذير:** هل أنت متأكد من حذف جميع السيرفرات؟\n\nهذا الإجراء لا يمكن التراجع عنه!`, {
    parse_mode: 'Markdown',
    reply_markup: confirmKeyboard.reply_markup
  })
})

/* ✅ تأكيد حذف الكل */
bot.action('confirm_delete_all', async ctx => {
  const totalServers = ctx.session.servers ? ctx.session.servers.length : 0
  
  // إغلاق جميع الاتصالات النشطة
  ctx.session.servers?.forEach(server => {
    const serverKey = `${server.host}:${server.port}`
    if (clients.has(serverKey)) {
      const connection = clients.get(serverKey)
      if (connection.client) {
        connection.client.close()
      }
      cleanupConnection(serverKey)
    }
  })
  
  // حذف جميع السيرفرات
  ctx.session.servers = []
  ctx.session.currentServer = null
  
  await ctx.answerCbQuery(`✅ تم حذف ${totalServers} سيرفر`)
  ctx.reply(`🗑️ تم حذف جميع السيرفرات (${totalServers}) بنجاح!`, {
    reply_markup: mainMenu().reply_markup
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
  ctx.session.action = null
  ctx.session.currentServer = null
  ctx.reply('🏠 القائمة الرئيسية:', {
    reply_markup: mainMenu().reply_markup
  })
})

/* ✍️ معالجة الرسائل النصية - الإصلاح الرئيسي هنا */
bot.on('text', ctx => {
  // ✅ الإصلاح: التحقق من وجود خطوة نشطة
  if (!ctx.session || !ctx.session.step) {
    // إذا لم يكن هناك خطوة نشطة، تجاهل الرسالة
    return ctx.reply('👋 أهلاً بك! استخدم الأزرار أدناه للتفاعل.', {
      reply_markup: mainMenu().reply_markup
    })
  }

  const text = ctx.message.text.trim()
  console.log(`📝 خطوة: ${ctx.session.step}, نص: ${text}`) // تسجيل للتصحيح

  switch (ctx.session.step) {
    case 'server_name':
      ctx.session.tempServer.name = text
      ctx.session.step = 'server_ip'
      return ctx.reply('🌐 أدخل IP السيرفر (مثال: play.server.com):')

    case 'server_ip':
      ctx.session.tempServer.host = text
      ctx.session.step = 'server_port'
      return ctx.reply('🔢 أدخل Port السيرفر (مثال: 19132):')

    case 'server_port':
      const port = parseInt(text)
      if (isNaN(port) || port < 1 || port > 65535) {
        return ctx.reply('⚠️ Port غير صالح. أدخل رقم بين 1 و 65535:')
      }
      ctx.session.tempServer.port = port
      ctx.session.step = 'bot_username'
      return ctx.reply('👤 أدخل اسم البوت في اللعبة:')

    case 'bot_username':
      ctx.session.tempServer.username = text
      ctx.session.step = 'server_version'
      return ctx.reply('🔄 أدخل إصدار السيرفر (مثال: 1.20.50 أو اكتب "auto" للاكتشاف التلقائي):')

    case 'server_version':
      try {
        console.log('✅ معالجة الإصدار:', text)
        
        // معالجة الإصدار
        if (text.toLowerCase() === 'auto' || text.trim() === '') {
          ctx.session.tempServer.version = false // الاكتشاف التلقائي
        } else {
          // التحقق من تنسيق الإصدار (مثال: 1.20.50)
          const versionRegex = /^\d+\.\d+(\.\d+)?$/
          if (!versionRegex.test(text)) {
            return ctx.reply('⚠️ تنسيق الإصدار غير صالح. استخدم تنسيق مثل: 1.20.50 أو اكتب "auto":')
          }
          ctx.session.tempServer.version = text
        }
        
        // ✅ إضافة السيرفر للقائمة
        if (!ctx.session.servers) {
          ctx.session.servers = []
        }
        
        // إنشاء كائن السيرفر الكامل
        const newServer = {
          id: Date.now(),
          name: ctx.session.tempServer.name || 'سيرفر بدون اسم',
          host: ctx.session.tempServer.host || 'localhost',
          port: ctx.session.tempServer.port || 19132,
          username: ctx.session.tempServer.username || `Bot_${Date.now()}`,
          version: ctx.session.tempServer.version || false,
          created: new Date().toISOString()
        }
        
        ctx.session.servers.push(newServer)
        
        // ✅ إعادة تعيين الجلسة
        ctx.session.step = null
        ctx.session.action = null
        ctx.session.tempServer = null
        
        console.log('✅ تم إضافة سيرفر جديد:', newServer)
        
        ctx.reply(
          `✅ **تم إضافة السيرفر بنجاح!**\n\n` +
          `📌 **الاسم:** ${newServer.name}\n` +
          `📍 **IP:** ${newServer.host}:${newServer.port}\n` +
          `👤 **اسم البوت:** ${newServer.username}\n` +
          `🔄 **الإصدار:** ${newServer.version ? newServer.version : 'اكتشاف تلقائي'}\n\n` +
          `يمكنك الآن استخدام القائمة للدخول إلى السيرفر.`,
          {
            parse_mode: 'Markdown',
            reply_markup: mainMenu().reply_markup
          }
        )
        
      } catch (error) {
        console.error('❌ خطأ في إضافة السيرفر:', error)
        ctx.session.step = null
        ctx.session.tempServer = null
        ctx.reply('❌ حدث خطأ أثناء إضافة السيرفر. حاول مرة أخرى.', {
          reply_markup: mainMenu().reply_markup
        })
      }
      break

    default:
      console.log('❌ خطوة غير معروفة:', ctx.session.step)
      ctx.session.step = null
      ctx.reply('⚠️ جلسة منتهية. ابدأ من جديد.', {
        reply_markup: mainMenu().reply_markup
      })
  }
})

/* 🔘 اختيار سيرفر */
bot.action(/select_(\d+)/, async ctx => {
  const index = parseInt(ctx.match[1])
  if (ctx.session.servers && ctx.session.servers[index]) {
    ctx.session.currentServer = ctx.session.servers[index]
    await ctx.answerCbQuery(`✅ تم اختيار ${ctx.session.currentServer.name}`)
    ctx.reply(`✅ **السيرفر المحدد:** ${ctx.session.currentServer.name}\n📍 ${ctx.session.currentServer.host}:${ctx.session.currentServer.port}`, {
      parse_mode: 'Markdown',
      reply_markup: mainMenu().reply_markup
    })
  } else {
    await ctx.answerCbQuery('❌ السيرفر غير موجود')
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

    console.log('🚀 محاولة الاتصال بـ:', options)

    const client = bedrock.createClient(options)

    // حفظ العميل في الخريطة
    clients.set(serverKey, {
      client,
      server: server.name,
      connectedAt: new Date(),
      serverInfo: server
    })

    // أحداث العميل
    client.on('spawn', () => {
      console.log('✅ اتصال ناجح بـ:', server.name)
      ctx.reply(`🟢 البوت متصل الآن بـ ${server.name}`)
      
      // تشغيل AFK تلقائياً
      const interval = setInterval(() => {
        if (client) {
          try {
            client.queue('player_auth_input', {
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
      console.error('❌ Connection Error:', err)
      ctx.reply(`❌ خطأ في الاتصال بـ ${server.name}: ${err.message}`)
      cleanupConnection(serverKey)
    })

    client.on('disconnect', (packet) => {
      console.log('🔴 تم فصل البوت من:', server.name)
      ctx.reply(`🔴 تم فصل البوت من ${server.name}`)
      cleanupConnection(serverKey)
    })

    client.on('server_disconnect', (packet) => {
      console.log('⚠️ السيرفر قام بفصل البوت:', server.name)
      ctx.reply(`⚠️ السيرفر ${server.name} قام بفصل البوت`)
      cleanupConnection(serverKey)
    })

    // إضافة حدث للتصحيح
    client.on('connect', () => {
      console.log('🔗 بدأ الاتصال بـ:', server.name)
    })

  } catch (error) {
    console.error('❌ Connection Setup Error:', error)
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
      const minutes = Math.floor(uptime / 60)
      const hours = Math.floor(minutes / 60)
      
      let uptimeText = ''
      if (hours > 0) uptimeText += `${hours} ساعة `
      if (minutes % 60 > 0) uptimeText += `${minutes % 60} دقيقة `
      uptimeText += `${uptime % 60} ثانية`
      
      statusMessage += `🟢 **متصل** (منذ ${uptimeText})\n`
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
  
  // عرض السيرفرات المضافة
  if (ctx.session.servers && ctx.session.servers.length > 0) {
    statusMessage += `\n**السيرفرات المضافة:**\n`
    ctx.session.servers.forEach((server, index) => {
      const isCurrent = ctx.session.currentServer && 
                       server.host === ctx.session.currentServer.host &&
                       server.port === ctx.session.currentServer.port
      statusMessage += `${isCurrent ? '▶️' : '📌'} ${index + 1}. ${server.name}\n`
    })
  }
  
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
  console.log('🧹 تم تنظيف اتصال:', serverKey)
}

/* 🧹 تنظيف جميع الاتصالات عند إغلاق البوت */
process.on('SIGINT', () => {
  console.log('🛑 إغلاق البوت...')
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
  console.error('⚠️ Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason)
})

/* 🚀 تشغيل البوت */
bot.launch({
  dropPendingUpdates: true,
  allowedUpdates: ['message', 'callback_query']
}).then(() => {
  console.log('✅ MaxBlack System is Online')
  console.log('📞 Bot is running...')
  console.log('⚠️ Debug logging is enabled')
})

// أوامر إضافية للتصحيح
bot.command('debug', (ctx) => {
  const debugInfo = {
    sessionSteps: ctx.session.step,
    sessionAction: ctx.session.action,
    serversCount: ctx.session.servers ? ctx.session.servers.length : 0,
    tempServer: ctx.session.tempServer,
    activeConnections: clients.size,
    activeAFK: afkIntervals.size
  }
  
  ctx.reply(`🔧 **معلومات التصحيح:**\n\`\`\`json\n${JSON.stringify(debugInfo, null, 2)}\n\`\`\``, {
    parse_mode: 'Markdown'
  })
})

bot.command('reset', (ctx) => {
  ctx.session.step = null
  ctx.session.action = null
  ctx.session.tempServer = null
  ctx.reply('🔄 تم إعادة تعيين الجلسة.', {
    reply_markup: mainMenu().reply_markup
  })
})
