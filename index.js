const { Telegraf, Markup, session } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')
const net = require('net')

/* Railway Keep Alive - إصلاح مهم */
const server = http.createServer((req, res) => {
  console.log('✅ Ping received from Railway')
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('MaxBlack Bot is Online')
})

server.listen(process.env.PORT || 3000, () => {
  console.log(`✅ Keep-alive server running on port ${process.env.PORT || 3000}`)
})

/* إدارة الذاكرة وإعادة التشغيل */
let restartAttempts = 0
const MAX_RESTART_ATTEMPTS = 5
const RESTART_DELAY = 10000 // 10 ثواني

/* Telegram Bot */
const bot = new Telegraf('8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU')

/* 📢 قنوات الاشتراك الإجباري */
const REQUIRED_CHANNELS = [
  {
    id: '@minecrafmodss12',
    name: 'Minecraft Mods',
    url: 'https://t.me/minecrafmodss12'
  },
  {
    id: '@aternosbot24',
    name: 'Aternos Bot',
    url: 'https://t.me/aternosbot24'
  }
]

/* ✅ تحسين الجلسات مع تنظيف تلقائي */
bot.use(session({
  getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`,
  defaultSession: () => ({
    servers: [],
    currentServer: null,
    step: null,
    action: null,
    tempServer: {},
    hasCheckedSubscription: false,
    lastActivity: Date.now()
  })
}))

// متغيرات عامة مع إدارة ذاكرة محسنة
let clients = new Map()
let afkIntervals = new Map()
let cleanupInterval

/* 🎮 القائمة الرئيسية */
function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'add_server')],
    [Markup.button.callback('📋 قائمة السيرفرات', 'list_servers')],
    [Markup.button.callback('🗑️ حذف سيرفر', 'delete_server')],
    [Markup.button.callback('▶️ دخول', 'connect')],
    [Markup.button.callback('⏹️ خروج', 'disconnect')],
    [Markup.button.callback('⚙️ إعدادات AFK', 'afk_settings')],
    [Markup.button.callback('🔧 إعدادات متقدمة', 'advanced_settings')],
    [Markup.button.callback('📊 الحالة', 'status')],
    [Markup.button.callback('🔄 إعادة تشغيل البوت', 'restart_bot')]
  ])
}

/* 🔄 وظيفة تنظيف الذاكرة التلقائية */
function startCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
  }
  
  cleanupInterval = setInterval(() => {
    try {
      console.log('🧹 جاري تنظيف الذاكرة...')
      
      // تنظيف الاتصالات الميتة
      let cleaned = 0
      clients.forEach((connection, key) => {
        if (!connection.client || connection.client.ended || connection.client.destroyed) {
          console.log(`🧹 تنظيف اتصال ميت: ${key}`)
          cleanupConnection(key)
          cleaned++
        }
      })
      
      if (cleaned > 0) {
        console.log(`🧹 تم تنظيف ${cleaned} اتصال ميت`)
      }
      
      // إعادة تعيين محاولات إعادة التشغيل بعد فترة
      if (restartAttempts > 0) {
        setTimeout(() => {
          restartAttempts = 0
          console.log('🔄 إعادة تعيين محاولات إعادة التشغيل')
        }, 3600000) // كل ساعة
      }
      
    } catch (error) {
      console.error('❌ خطأ في التنظيف:', error)
    }
  }, 300000) // كل 5 دقائق
}

/* 🔍 اختبار اتصال بالسيرفر */
async function testServerConnection(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    
    socket.setTimeout(3000) // 3 ثواني فقط لـ Railway
    
    socket.on('connect', () => {
      console.log(`✅ ${host}:${port} - متصل`)
      socket.destroy()
      resolve({ success: true, message: '✅ السيرفر متاح للاتصال' })
    })
    
    socket.on('timeout', () => {
      console.log(`⏰ ${host}:${port} - انتهى الوقت`)
      socket.destroy()
      resolve({ 
        success: false, 
        message: '⏰ انتهى وقت الاتصال',
        suggestion: 'تأكد من أن السيرفر يعمل'
      })
    })
    
    socket.on('error', (err) => {
      console.log(`❌ ${host}:${port} - خطأ: ${err.message}`)
      resolve({ 
        success: false, 
        message: `❌ خطأ: ${err.message}`,
        suggestion: 'تأكد من IP و Port صحيحين'
      })
    })
    
    try {
      socket.connect(port, host)
    } catch (err) {
      resolve({ 
        success: false, 
        message: `❌ خطأ في الاتصال: ${err.message}` 
      })
    }
  })
}

/* 🎮 قائمة السيرفرات */
function serversMenu(servers, action = 'select') {
  const buttons = servers.map((server, index) => [
    Markup.button.callback(
      `📌 ${server.name}`,
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
      `❌ ${server.name}`,
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

/* 📢 قائمة الاشتراك الإجباري */
function subscriptionMenu() {
  const buttons = REQUIRED_CHANNELS.map(channel => [
    Markup.button.url(`✅ ${channel.name}`, channel.url)
  ])
  buttons.push([Markup.button.callback('🔃 تحقق من الاشتراك', 'check_subscription')])
  return Markup.inlineKeyboard(buttons)
}

/* ✅ التحقق من الاشتراك في القنوات */
async function checkSubscription(ctx) {
  try {
    const userId = ctx.from.id
    
    for (const channel of REQUIRED_CHANNELS) {
      try {
        const chatMember = await ctx.telegram.getChatMember(channel.id, userId)
        const isMember = ['member', 'administrator', 'creator'].includes(chatMember.status)
        
        if (!isMember) {
          return {
            success: false,
            missingChannel: channel,
            message: `⚠️ يجب الاشتراك في ${channel.name} أولاً`
          }
        }
      } catch (error) {
        console.error(`خطأ في التحقق من ${channel.name}:`, error)
        return {
          success: false,
          missingChannel: channel,
          message: `❌ لا يمكن التحقق من ${channel.name}`
        }
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('خطأ في التحقق:', error)
    return { success: false, message: '❌ حدث خطأ في التحقق' }
  }
}

/* 🔧 اكتشاف الإصدار تلقائياً - محسّن لـ Railway */
async function autoDetectVersion(host, port) {
  try {
    console.log(`🔄 محاولة اكتشاف إصدار ${host}:${port}`)
    
    // اختصار الوقت في Railway
    const connectionTest = await testServerConnection(host, port)
    if (!connectionTest.success) {
      console.log(`❌ لا يمكن الوصول للسيرفر`)
      return false
    }
    
    const options = {
      host: host,
      port: port,
      username: 'VersionDetector',
      offline: true,
      skipPing: true,
      connectTimeout: 8000, // تقليل الوقت لـ Railway
      authTitle: 'MaxBlack Bot',
      version: false
    }
    
    const client = bedrock.createClient(options)
    
    return new Promise((resolve) => {
      let detected = false
      const timeout = setTimeout(() => {
        if (!detected) {
          detected = true
          console.log('⏰ انتهى وقت الاكتشاف')
          client.close()
          resolve(false)
        }
      }, 7000)
      
      client.on('connect_allowed', () => {
        if (!detected) {
          detected = true
          clearTimeout(timeout)
          const version = client.version
          console.log(`✅ تم اكتشاف الإصدار: ${version}`)
          client.close()
          resolve(version)
        }
      })
      
      client.on('error', (err) => {
        if (!detected) {
          detected = true
          clearTimeout(timeout)
          console.log(`⚠️ تعذر الاكتشاف: ${err.message}`)
          client.close()
          resolve(false)
        }
      })
    })
    
  } catch (error) {
    console.error('❌ خطأ في الاكتشاف:', error)
    return false
  }
}

/* 🚀 بدء البوت مع معالجة الأخطاء */
bot.start(async (ctx) => {
  try {
    const subscription = await checkSubscription(ctx)
    
    if (!subscription.success) {
      ctx.session.hasCheckedSubscription = false
      return ctx.reply(
        `📢 **اشتراك إجباري**\n\n` +
        `يجب الاشتراك في:\n\n` +
        `📌 ${REQUIRED_CHANNELS[0].name}\n` +
        `📌 ${REQUIRED_CHANNELS[1].name}\n\n` +
        `بعد الاشتراك اضغط: 🔃 تحقق`,
        {
          parse_mode: 'Markdown',
          reply_markup: subscriptionMenu().reply_markup
        }
      )
    }
    
    ctx.session.hasCheckedSubscription = true
    ctx.session.lastActivity = Date.now()
    
    ctx.reply(
      `🎮 **MaxBlack Bot - Railway Edition**\n\n` +
      `✅ إصدار مستقر ومحسّن\n` +
      `🧹 تنظيف ذاكرة تلقائي\n` +
      `🚀 أداء محسّن\n\n` +
      `اختر من القائمة:`,
      { 
        reply_markup: mainMenu().reply_markup 
      }
    )
  } catch (error) {
    console.error('❌ خطأ في start:', error)
    ctx.reply('❌ حدث خطأ. حاول مرة أخرى.')
  }
})

/* 🔄 إعادة تشغيل البوت */
bot.action('restart_bot', async (ctx) => {
  await ctx.answerCbQuery('جاري إعادة التشغيل...')
  
  if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
    return ctx.reply(
      `⚠️ **تم تجاوز الحد الأقصى لإعادة التشغيل**\n\n` +
      `انتظر قليلاً ثم حاول مرة أخرى.`,
      { parse_mode: 'Markdown' }
    )
  }
  
  restartAttempts++
  
  ctx.reply(
    `🔄 **جاري إعادة تشغيل البوت...**\n\n` +
    `سيتم:\n` +
    `1. إغلاق جميع الاتصالات\n` +
    `2. تنظيف الذاكرة\n` +
    `3. إعادة التشغيل\n\n` +
    `🔄 المحاولة: ${restartAttempts}/${MAX_RESTART_ATTEMPTS}`,
    { parse_mode: 'Markdown' }
  )
  
  // إغلاق جميع الاتصالات
  let closedConnections = 0
  clients.forEach((connection, key) => {
    if (connection.client) {
      try {
        connection.client.close()
        closedConnections++
      } catch (error) {
        console.error(`خطأ في إغلاق اتصال ${key}:`, error)
      }
    }
    cleanupConnection(key)
  })
  
  // إيقاف جميع مؤقتات AFK
  afkIntervals.forEach((interval, key) => {
    clearInterval(interval)
  })
  afkIntervals.clear()
  
  setTimeout(() => {
    ctx.reply(
      `✅ **تمت إعادة التشغيل بنجاح!**\n\n` +
      `🔗 اتصالات مغلقة: ${closedConnections}\n` +
      `🧹 تم تنظيف الذاكرة\n\n` +
      `يمكنك الآن استخدام البوت بشكل طبيعي.`,
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu().reply_markup
      }
    )
  }, 2000)
})

/* 🔧 إعدادات متقدمة */
bot.action('advanced_settings', async (ctx) => {
  try {
    await ctx.answerCbQuery()
    
    const subscription = await checkSubscription(ctx)
    if (!subscription.success) {
      ctx.session.hasCheckedSubscription = false
      return ctx.reply(
        `📢 **يجب الاشتراك أولاً**`,
        {
          parse_mode: 'Markdown',
          reply_markup: subscriptionMenu().reply_markup
        }
      )
    }
    
    ctx.session.hasCheckedSubscription = true
    ctx.session.lastActivity = Date.now()
    
    ctx.reply(
      `🔧 **الإعدادات المتقدمة - Railway**\n\n` +
      `اختر خياراً:`,
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🧹 تنظيف الذاكرة', 'cleanup_memory')],
          [Markup.button.callback('📊 معلومات النظام', 'system_info')],
          [Markup.button.callback('🔍 اختبار اتصال', 'test_connection')],
          [Markup.button.callback('🔄 اكتشاف إصدار', 'detect_version')],
          [Markup.button.callback('🔙 رجوع', 'back_to_main')]
        ]).reply_markup
      }
    )
  } catch (error) {
    console.error('❌ خطأ في advanced_settings:', error)
  }
})

/* 🧹 تنظيف الذاكرة */
bot.action('cleanup_memory', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery('جاري التنظيف...')
  
  let cleanedConnections = 0
  let cleanedAFK = 0
  
  clients.forEach((connection, key) => {
    if (!connection.client || connection.client.ended) {
      cleanupConnection(key)
      cleanedConnections++
    }
  })
  
  afkIntervals.forEach((interval, key) => {
    if (!clients.has(key)) {
      clearInterval(interval)
      afkIntervals.delete(key)
      cleanedAFK++
    }
  })
  
  ctx.reply(
    `🧹 **تم تنظيف الذاكرة**\n\n` +
    `🔗 اتصالات نظفت: ${cleanedConnections}\n` +
    `⏱️ مؤقتات AFK نظفت: ${cleanedAFK}\n` +
    `📦 إجمالي الذاكرة: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    {
      parse_mode: 'Markdown',
      reply_markup: mainMenu().reply_markup
    }
  )
})

/* 📊 معلومات النظام */
bot.action('system_info', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()
  
  const memoryUsage = process.memoryUsage()
  const uptime = process.uptime()
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)
  const seconds = Math.floor(uptime % 60)
  
  ctx.reply(
    `📊 **معلومات النظام - Railway**\n\n` +
    `⏰ وقت التشغيل: ${hours} س ${minutes} د ${seconds} ث\n` +
    `🧠 استخدام الذاكرة:\n` +
    `  • Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB\n` +
    `  • RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB\n\n` +
    `🔗 اتصالات نشطة: ${clients.size}\n` +
    `⏱️ مؤقتات AFK: ${afkIntervals.size}\n` +
    `🔄 محاولات إعادة تشغيل: ${restartAttempts}\n\n` +
    `✅ الحالة: ${clients.size > 10 ? '⚠️ ثقيل' : '🟢 ممتاز'}`,
    {
      parse_mode: 'Markdown',
      reply_markup: mainMenu().reply_markup
    }
  )
})

/* 🔍 اختبار اتصال */
bot.action('test_connection', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()
  
  if (!ctx.session.currentServer) {
    return ctx.reply('⚠️ اختر سيرفراً أولاً.')
  }
  
  const server = ctx.session.currentServer
  ctx.reply(`🔍 جاري اختبار ${server.host}:${server.port}...`)
  
  const result = await testServerConnection(server.host, server.port)
  
  ctx.reply(
    `**نتيجة الاختبار:**\n\n` +
    `📍 ${server.host}:${server.port}\n` +
    `📡 ${result.message}\n\n` +
    `${result.success ? '✅ جاهز للاتصال' : '❌ يحتاج إصلاح'}`,
    { 
      parse_mode: 'Markdown',
      reply_markup: mainMenu().reply_markup 
    }
  )
})

/* 🔃 تحقق من الاشتراك */
bot.action('check_subscription', async (ctx) => {
  try {
    await ctx.answerCbQuery()
    
    const subscription = await checkSubscription(ctx)
    
    if (!subscription.success) {
      return ctx.reply(
        `❌ **لم يتم الاشتراك بعد**\n\n` +
        `يجب الاشتراك في:\n\n` +
        `📌 ${REQUIRED_CHANNELS[0].name}\n` +
        `📌 ${REQUIRED_CHANNELS[1].name}\n\n` +
        `اضغط على الأزرار للاشتراك ثم اضغط تحقق`,
        {
          parse_mode: 'Markdown',
          reply_markup: subscriptionMenu().reply_markup
        }
      )
    }
    
    ctx.session.hasCheckedSubscription = true
    ctx.session.lastActivity = Date.now()
    
    ctx.reply('✅ **تم التحقق بنجاح!**\n\nاختر من القائمة:', {
      parse_mode: 'Markdown',
      reply_markup: mainMenu().reply_markup
    })
  } catch (error) {
    console.error('❌ خطأ في check_subscription:', error)
  }
})

/* 🔥 وسيط للتحقق من الاشتراك */
const requireSubscription = async (ctx, next) => {
  try {
    if (!ctx.session.hasCheckedSubscription) {
      const subscription = await checkSubscription(ctx)
      
      if (!subscription.success) {
        await ctx.reply(
          `📢 **يجب التحقق من الاشتراك أولاً**\n\n` +
          `اضغط على زر التحقق بعد الاشتراك:`,
          {
            parse_mode: 'Markdown',
            reply_markup: subscriptionMenu().reply_markup
          }
        )
        return
      }
      
      ctx.session.hasCheckedSubscription = true
    }
    
    ctx.session.lastActivity = Date.now()
    return next()
  } catch (error) {
    console.error('❌ خطأ في requireSubscription:', error)
    ctx.reply('❌ حدث خطأ. حاول مرة أخرى.')
  }
}

/* ➕ إضافة سيرفر */
bot.action('add_server', async (ctx) => {
  try {
    await ctx.answerCbQuery()
    
    const subscription = await checkSubscription(ctx)
    if (!subscription.success) {
      ctx.session.hasCheckedSubscription = false
      return ctx.reply(
        `📢 **يجب الاشتراك أولاً**\n\n` +
        `اضغط على زر التحقق بعد الاشتراك:`,
        {
          parse_mode: 'Markdown',
          reply_markup: subscriptionMenu().reply_markup
        }
      )
    }
    
    ctx.session.hasCheckedSubscription = true
    ctx.session.step = 'server_name'
    ctx.session.action = 'add'
    ctx.session.tempServer = {}
    ctx.session.lastActivity = Date.now()
    
    ctx.reply('📝 أدخل اسم للسيرفر (مثال: سيرفر فري):')
  } catch (error) {
    console.error('❌ خطأ في add_server:', error)
  }
})

/* 📋 قائمة السيرفرات */
bot.action('list_servers', requireSubscription, async (ctx) => {
  try {
    await ctx.answerCbQuery()
    
    if (!ctx.session.servers || ctx.session.servers.length === 0) {
      return ctx.reply('⚠️ لا توجد سيرفرات مضافة.\nاضغط ➕ إضافة سيرفر', { 
        reply_markup: mainMenu().reply_markup 
      })
    }
    
    const serverList = ctx.session.servers.map((s, i) => 
      `${i+1}. ${s.name} - ${s.host}:${s.port}`
    ).join('\n')
    
    ctx.reply(
      `📋 **قائمة السيرفرات:**\n\n${serverList}\n\n` +
      `اختر سيرفر من الأزرار:`,
      {
        parse_mode: 'Markdown',
        reply_markup: serversMenu(ctx.session.servers, 'select').reply_markup
      }
    )
  } catch (error) {
    console.error('❌ خطأ في list_servers:', error)
  }
})

/* 🔥 اختيار السيرفر */
bot.action(/select_(\d+)/, requireSubscription, async (ctx) => {
  try {
    const index = parseInt(ctx.match[1])
    console.log(`🔘 اختيار سيرفر رقم: ${index}`)
    
    await ctx.answerCbQuery('جاري الاختيار...')
    
    if (!ctx.session.servers || !ctx.session.servers[index]) {
      return ctx.reply('❌ السيرفر غير موجود.')
    }
    
    const selectedServer = ctx.session.servers[index]
    ctx.session.currentServer = selectedServer
    ctx.session.lastActivity = Date.now()
    
    ctx.reply(
      `✅ **تم اختيار السيرفر:**\n\n` +
      `📌 ${selectedServer.name}\n` +
      `📍 ${selectedServer.host}:${selectedServer.port}\n` +
      `👤 ${selectedServer.username}\n\n` +
      `يمكنك الآن الضغط على "▶️ دخول"`,
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu().reply_markup
      }
    )
  } catch (error) {
    console.error('❌ خطأ في select:', error)
  }
})

/* ▶️ دخول للسيرفر - محسّن لـ Railway */
bot.action('connect', requireSubscription, async (ctx) => {
  try {
    await ctx.answerCbQuery('جاري الاتصال...')

    if (!ctx.session.currentServer) {
      return ctx.reply('⚠️ اختر سيرفراً أولاً.', {
        reply_markup: mainMenu().reply_markup
      })
    }

    const server = ctx.session.currentServer
    const serverKey = `${server.host}:${server.port}`
    
    if (clients.has(serverKey)) {
      return ctx.reply(`⚠️ البوت متصل بالفعل.`)
    }

    // ⭐ تحديث مهم لـ Railway: تقليل وقت الاتصال
    ctx.reply(`⏳ جاري الاتصال بـ ${server.name}...`)

    const options = {
      host: server.host,
      port: server.port,
      username: server.username || `Bot_${Date.now().toString().slice(-6)}`,
      offline: true,
      skipPing: true, // مهم جداً لـ Railway
      connectTimeout: 15000, // 15 ثانية فقط
      authTitle: 'MaxBlack Railway Bot',
      profilesFolder: './profiles',
      autoInitPlayer: true,
      version: false
    }

    console.log('🔗 محاولة اتصال:', options)

    let client
    try {
      client = bedrock.createClient(options)
    } catch (error) {
      console.error('❌ فشل إنشاء العميل:', error)
      return ctx.reply(`❌ فشل الاتصال: ${error.message}`)
    }

    // ⭐ إضافة مهلة للاتصال لمنع التجميد
    const connectionTimeout = setTimeout(() => {
      if (client && !clients.has(serverKey)) {
        console.log('⏰ انتهى وقت الاتصال')
        try {
          client.close()
        } catch (e) {
          console.error('خطأ في الإغلاق:', e)
        }
        ctx.reply('⏰ انتهى وقت الاتصال. جرب سيرفراً آخر.')
      }
    }, 20000)

    clients.set(serverKey, {
      client,
      server: server.name,
      connectedAt: new Date(),
      serverInfo: server,
      timeout: connectionTimeout
    })

    client.on('spawn', () => {
      clearTimeout(connectionTimeout)
      console.log(`✅ اتصال ناجح: ${server.name}`)
      
      ctx.reply(
        `🟢 **تم الاتصال!**\n\n` +
        `📌 ${server.name}\n` +
        `👤 ${server.username}\n\n` +
        `✅ البوت الآن داخل اللعبة`
      )
      
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
              play_mode: 'normal'
            })
          } catch (e) {
            console.log('⚠️ خطأ AFK:', e.message)
          }
        }
      }, 15000)

      afkIntervals.set(serverKey, interval)
    })

    client.on('error', (err) => {
      clearTimeout(connectionTimeout)
      console.error(`❌ خطأ اتصال: ${err.message}`)
      
      cleanupConnection(serverKey)
      
      ctx.reply(
        `❌ **فشل الاتصال**\n\n` +
        `السبب: ${err.message}\n\n` +
        `💡 **نصيحة لـ Railway:**\n` +
        `• جرب سيرفر Aternos\n` +
        `• تأكد من تشغيل السيرفر\n` +
        `• جرب مرة أخرى لاحقاً`
      )
    })

    client.on('disconnect', () => {
      clearTimeout(connectionTimeout)
      console.log(`🔴 انقطع الاتصال: ${server.name}`)
      cleanupConnection(serverKey)
    })

  } catch (error) {
    console.error('❌ خطأ في connect:', error)
    ctx.reply('❌ حدث خطأ غير متوقع. حاول مرة أخرى.')
  }
})

/* ⏹️ خروج من السيرفر */
bot.action('disconnect', requireSubscription, async (ctx) => {
  try {
    await ctx.answerCbQuery()

    if (!ctx.session.currentServer) {
      return ctx.reply('⚠️ لم تختر سيرفراً بعد.')
    }

    const server = ctx.session.currentServer
    const serverKey = `${server.host}:${server.port}`

    if (!clients.has(serverKey)) {
      return ctx.reply(`⚠️ البوت غير متصل.`)
    }

    const connection = clients.get(serverKey)
    if (connection.timeout) {
      clearTimeout(connection.timeout)
    }
    
    if (connection.client) {
      connection.client.close()
    }
    
    cleanupConnection(serverKey)
    
    ctx.reply(`🛑 تم إخراج البوت من ${server.name}`)
  } catch (error) {
    console.error('❌ خطأ في disconnect:', error)
  }
})

/* ◀️ رجوع للقائمة */
bot.action('back_to_main', async (ctx) => {
  try {
    await ctx.answerCbQuery()
    ctx.session.step = null
    ctx.session.action = null
    ctx.session.lastActivity = Date.now()
    
    ctx.reply('🏠 القائمة الرئيسية:', {
      reply_markup: mainMenu().reply_markup
    })
  } catch (error) {
    console.error('❌ خطأ في back_to_main:', error)
  }
})

/* ✍️ معالجة الرسائل النصية */
bot.on('text', async (ctx) => {
  try {
    if (!ctx.session.hasCheckedSubscription) {
      const subscription = await checkSubscription(ctx)
      if (!subscription.success) {
        return ctx.reply(
          `📢 **يجب التحقق من الاشتراك أولاً**`,
          {
            parse_mode: 'Markdown',
            reply_markup: subscriptionMenu().reply_markup
          }
        )
      }
      ctx.session.hasCheckedSubscription = true
    }

    if (!ctx.session || !ctx.session.step) {
      return ctx.reply('👋 استخدم الأزرار للتفاعل:', {
        reply_markup: mainMenu().reply_markup
      })
    }

    const text = ctx.message.text.trim()
    ctx.session.lastActivity = Date.now()

    switch (ctx.session.step) {
      case 'server_name':
        ctx.session.tempServer.name = text
        ctx.session.step = 'server_ip'
        return ctx.reply('🌐 أدخل IP السيرفر:')

      case 'server_ip':
        ctx.session.tempServer.host = text
        ctx.session.step = 'server_port'
        return ctx.reply('🔢 أدخل Port السيرفر:')

      case 'server_port':
        const port = parseInt(text)
        if (isNaN(port) || port < 1 || port > 65535) {
          return ctx.reply('⚠️ Port غير صالح. أدخل رقم بين 1 و 65535:')
        }
        ctx.session.tempServer.port = port
        ctx.session.step = 'bot_username'
        return ctx.reply('👤 أدخل اسم البوت:')

      case 'bot_username':
        ctx.session.tempServer.username = text
        
        const newServer = {
          id: Date.now(),
          name: ctx.session.tempServer.name,
          host: ctx.session.tempServer.host,
          port: ctx.session.tempServer.port,
          username: ctx.session.tempServer.username || `Bot_${Date.now().toString().slice(-6)}`,
          created: new Date().toISOString()
        }
        
        if (!ctx.session.servers) {
          ctx.session.servers = []
        }
        ctx.session.servers.push(newServer)
        
        ctx.session.step = null
        ctx.session.action = null
        ctx.session.tempServer = {}
        
        ctx.reply(
          `✅ **تم إضافة السيرفر!**\n\n` +
          `📌 ${newServer.name}\n` +
          `📍 ${newServer.host}:${newServer.port}\n` +
          `👤 ${newServer.username}\n\n` +
          `يمكنك الآن الاتصال.`,
          {
            parse_mode: 'Markdown',
            reply_markup: mainMenu().reply_markup
          }
        )
        break
    }
  } catch (error) {
    console.error('❌ خطأ في text handler:', error)
    ctx.reply('❌ حدث خطأ. حاول مرة أخرى.')
  }
})

/* 🧹 تنظيف الاتصال */
function cleanupConnection(serverKey) {
  try {
    if (afkIntervals.has(serverKey)) {
      clearInterval(afkIntervals.get(serverKey))
      afkIntervals.delete(serverKey)
    }
    
    const connection = clients.get(serverKey)
    if (connection && connection.timeout) {
      clearTimeout(connection.timeout)
    }
    
    clients.delete(serverKey)
    console.log('🧹 تم تنظيف اتصال:', serverKey)
  } catch (error) {
    console.error('❌ خطأ في cleanupConnection:', error)
  }
}

/* 🧹 تنظيف جميع الاتصالات */
function cleanupAll() {
  console.log('🛑 تنظيف جميع الاتصالات...')
  
  clients.forEach((connection, key) => {
    try {
      if (connection.client) {
        connection.client.close()
      }
      if (connection.timeout) {
        clearTimeout(connection.timeout)
      }
    } catch (error) {
      console.error(`خطأ في تنظيف ${key}:`, error)
    }
    cleanupConnection(key)
  })
  
  afkIntervals.forEach((interval, key) => {
    clearInterval(interval)
  })
  afkIntervals.clear()
}

/* 🛠️ معالجة الأخطاء العالمية */
process.on('uncaughtException', (error) => {
  console.error('⚠️ خطأ غير معالج:', error)
  console.error('Stack:', error.stack)
  
  // تنظيف الذاكرة قبل الخروج
  cleanupAll()
  
  // محاولة إعادة التشغيل إذا لم نتجاوز الحد
  if (restartAttempts < MAX_RESTART_ATTEMPTS) {
    restartAttempts++
    console.log(`🔄 محاولة إعادة تشغيل ${restartAttempts}/${MAX_RESTART_ATTEMPTS}`)
    
    setTimeout(() => {
      console.log('🚀 إعادة تشغيل البوت...')
      process.exit(1) // سيتم إعادة التشغيل بواسطة Railway
    }, 5000)
  } else {
    console.log('❌ تجاوز الحد الأقصى لإعادة التشغيل')
    process.exit(1)
  }
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ وعد مرفوض:', reason)
})

process.on('SIGTERM', () => {
  console.log('🛑 تلقي إشارة إيقاف SIGTERM')
  cleanupAll()
  bot.stop('SIGTERM')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 تلقي إشارة إيقاف SIGINT')
  cleanupAll()
  bot.stop('SIGINT')
  process.exit(0)
})

/* 🚀 تشغيل البوت مع معالجة الأخطاء */
try {
  bot.launch({
    dropPendingUpdates: true,
    allowedUpdates: ['message', 'callback_query']
  }).then(() => {
    console.log('✅✅✅ MaxBlack Bot يعمل على Railway! ✅✅✅')
    console.log('🔧 إصدار محسّن ومستقر')
    console.log('🧹 تنظيف ذاكرة تلقائي مفعل')
    console.log('🚀 جاهز للاستخدام')
    console.log('===========================')
    
    // بدء التنظيف التلقائي
    startCleanup()
    
    // إرسال ping كل دقيقة لإبقاء Railway نشط
    setInterval(() => {
      console.log('📡 إرسال ping للحفاظ على النشاط')
    }, 60000)
    
  }).catch(error => {
    console.error('❌ فشل تشغيل البوت:', error)
    process.exit(1)
  })
} catch (error) {
  console.error('❌ خطأ في تشغيل البوت:', error)
  process.exit(1)
}

/* 📦 package.json إضافي لـ Railway */
/*
{
  "name": "maxblack-bot",
  "version": "2.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "telegraf": "^4.16.3",
    "bedrock-protocol": "^4.11.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
*/
