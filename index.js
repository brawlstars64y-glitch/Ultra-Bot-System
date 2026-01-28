const { Telegraf, Markup, session } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')
const net = require('net')

/* Railway Keep Alive */
http.createServer((req, res) => res.end('OK')).listen(process.env.PORT || 3000)

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

/* 🎮 جميع إصدارات Bedrock */
const SUPPORTED_VERSIONS = [
  '1.21.132', '1.21.131', '1.21.130', '1.21.120', '1.21.110', '1.21.100', '1.21.90', '1.21.80', '1.21.70', '1.21.60', '1.21.50', '1.21.40', '1.21.30', '1.21.20', '1.21.10', '1.21.0',
  '1.20.80', '1.20.75', '1.20.70', '1.20.62', '1.20.60', '1.20.55', '1.20.50', '1.20.45', '1.20.42', '1.20.41', '1.20.40', '1.20.32', '1.20.30', '1.20.28', '1.20.26', '1.20.22', '1.20.21', '1.20.20', '1.20.18', '1.20.16', '1.20.15', '1.20.14', '1.20.12', '1.20.11', '1.20.10', '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20.0',
  '1.19.80', '1.19.70', '1.19.60', '1.19.50', '1.19.40', '1.19.30', '1.19.20', '1.19.10', '1.19.0',
  '1.18.30', '1.18.20', '1.18.10', '1.18.0',
  '1.17.40', '1.17.30', '1.17.10', '1.17.0',
  '1.16.220', '1.16.210', '1.16.200', '1.16.100', '1.16.0',
  '1.15.0', '1.14.60', '1.14.30', '1.14.0',
  '1.13.0', '1.12.0', '1.11.4', '1.11.0',
  '1.10.0', '1.9.0', '1.8.0'
]

/* ✅ تحسين الجلسات */
bot.use(session({
  getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`,
  defaultSession: () => ({
    servers: [],
    currentServer: null,
    step: null,
    action: null,
    tempServer: {},
    hasCheckedSubscription: false
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
    [Markup.button.callback('🔧 إعدادات متقدمة', 'advanced_settings')],
    [Markup.button.callback('📊 الحالة', 'status')],
    [Markup.button.callback('🔍 اختبار اتصال', 'test_connection')]
  ])
}

/* 🔍 اختبار اتصال بالسيرفر */
async function testServerConnection(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    
    socket.setTimeout(5000) // 5 ثواني
    
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
        message: '⏰ انتهى وقت الاتصال (5 ثواني)',
        suggestion: 'تأكد من أن السيرفر يعمل والصحيح'
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

/* 🔧 اكتشاف الإصدار تلقائياً */
async function autoDetectVersion(host, port) {
  try {
    console.log(`🔄 محاولة اكتشاف إصدار ${host}:${port}`)
    
    // أولاً اختبر اتصال TCP الأساسي
    const connectionTest = await testServerConnection(host, port)
    if (!connectionTest.success) {
      console.log(`❌ لا يمكن الوصول للسيرفر: ${connectionTest.message}`)
      return false
    }
    
    const options = {
      host: host,
      port: port,
      username: 'VersionDetector',
      offline: true,
      skipPing: true, // ⭐ مهم: تجاوز Ping لتجنب Timeout
      connectTimeout: 15000, // زيادة وقت الانتظار
      authTitle: 'MaxBlack Bot',
      version: false
    }
    
    const client = bedrock.createClient(options)
    
    return new Promise((resolve, reject) => {
      let detected = false
      let timeout = setTimeout(() => {
        if (!detected) {
          detected = true
          console.log('⏰ انتهى وقت اكتشاف الإصدار')
          client.close()
          resolve(false)
        }
      }, 10000)
      
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
          console.log(`⚠️ تعذر اكتشاف الإصدار: ${err.message}`)
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

/* 🚀 بدء البوت */
bot.start(async (ctx) => {
  const subscription = await checkSubscription(ctx)
  
  if (!subscription.success) {
    ctx.session.hasCheckedSubscription = false
    return ctx.reply(
      `📢 **اشتراك إجباري**\n\n` +
      `يجب الاشتراك في القنوات التالية:\n\n` +
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
  ctx.reply(
    `🎮 **MaxBlack Bot**\n\n` +
    `🔧 **تم إصلاح مشكلة Ping Timeout**\n` +
    `✅ يدعم ${SUPPORTED_VERSIONS.length} إصدار\n\n` +
    `اختر من القائمة:`,
    { 
      reply_markup: mainMenu().reply_markup 
    }
  )
})

/* 🔍 اختبار اتصال */
bot.action('test_connection', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()
  
  if (!ctx.session.currentServer) {
    return ctx.reply('⚠️ اختر سيرفراً أولاً من قائمة السيرفرات.')
  }
  
  const server = ctx.session.currentServer
  ctx.reply(`🔍 جاري اختبار اتصال ${server.host}:${server.port}...`)
  
  const result = await testServerConnection(server.host, server.port)
  
  let message = `**نتيجة اختبار الاتصال:**\n\n`
  message += `📍 ${server.host}:${server.port}\n`
  message += `📡 ${result.message}\n`
  
  if (result.suggestion) {
    message += `\n💡 **نصيحة:** ${result.suggestion}\n\n`
  }
  
  if (result.success) {
    message += `✅ **السيرفر جاهز للاتصال**\n`
    message += `يمكنك الآن الضغط على "▶️ دخول"`
  } else {
    message += `\n⚠️ **تحقق من:**\n`
    message += `1. تأكد أن السيرفر يعمل\n`
    message += `2. تأكد من IP و Port صحيحين\n`
    message += `3. جرب إعادة تشغيل السيرفر\n`
    message += `4. تأكد أن البوت لديه اتصال إنترنت`
  }
  
  ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: mainMenu().reply_markup
  })
})

/* 🔧 إعدادات متقدمة */
bot.action('advanced_settings', async (ctx) => {
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
  
  ctx.reply(
    `🔧 **الإعدادات المتقدمة**\n\n` +
    `اختر خياراً:`,
    {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('🔍 اختبار اتصال', 'test_connection')],
        [Markup.button.callback('🔄 اكتشاف إصدار', 'detect_version')],
        [Markup.button.callback('⚙️ إصلاح الاتصال', 'fix_connection')],
        [Markup.button.callback('🔙 رجوع', 'back_to_main')]
      ]).reply_markup
    }
  )
})

/* ⚙️ إصلاح الاتصال */
bot.action('fix_connection', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()
  
  if (!ctx.session.currentServer) {
    return ctx.reply('⚠️ اختر سيرفراً أولاً.')
  }
  
  ctx.reply(
    `🔧 **إصلاح مشاكل الاتصال**\n\n` +
    `إذا كنت تواجه مشكلة **Ping Timeout**:\n\n` +
    `1. **تأكد من:**\n` +
    `   • السيرفر يعمل وليس مغلقاً\n` +
    `   • IP و Port صحيحين\n` +
    `   • لا يوجد حظر في الجدار الناري\n\n` +
    `2. **حلول مقترحة:**\n` +
    `   • اضغط 🔍 اختبار اتصال\n` +
    `   • جرب سيرفر مختلف\n` +
    `   • تأكد أن البوت على نفس الشبكة\n\n` +
    `3. **للسيرفرات العامة:**\n` +
    `   • بعض السيرفرات تمنع البوتات\n` +
    `   • تأكد أن السيرفر يسمح بالاتصال\n\n` +
    `4. **للإصدارات القديمة:**\n` +
    `   • استخدم إصداراً مناسباً للسيرفر`,
    {
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('🔍 اختبار الاتصال', 'test_connection')],
        [Markup.button.callback('🏠 الرئيسية', 'back_to_main')]
      ]).reply_markup
    }
  )
})

/* 🔄 اكتشاف إصدار سيرفر */
bot.action('detect_version', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()
  
  if (!ctx.session.currentServer) {
    return ctx.reply('⚠️ اختر سيرفراً أولاً.')
  }
  
  const server = ctx.session.currentServer
  ctx.reply(`🔄 جاري اكتشاف إصدار ${server.host}:${server.port}...`)
  
  try {
    const detectedVersion = await autoDetectVersion(server.host, server.port)
    
    if (detectedVersion) {
      const serverIndex = ctx.session.servers.findIndex(s => 
        s.host === server.host && s.port === server.port
      )
      
      if (serverIndex !== -1) {
        ctx.session.servers[serverIndex].version = detectedVersion
        ctx.session.currentServer.version = detectedVersion
      }
      
      ctx.reply(
        `✅ **تم اكتشاف الإصدار:** ${detectedVersion}\n\n` +
        `تم تحديث السيرفر تلقائياً بهذا الإصدار.`,
        {
          parse_mode: 'Markdown',
          reply_markup: mainMenu().reply_markup
        }
      )
    } else {
      ctx.reply(
        `⚠️ **تعذر اكتشاف الإصدار**\n\n` +
        `**الأسباب المحتملة:**\n` +
        `• السيرفر مغلق\n` +
        `• هناك حظر للبوتات\n` +
        `• مشكلة في الشبكة\n\n` +
        `**الحلول:**\n` +
        `1. تأكد أن السيرفر يعمل\n` +
        `2. جرب سيرفر آخر\n` +
        `3. استخدم إصداراً يدوياً`,
        {
          parse_mode: 'Markdown',
          reply_markup: mainMenu().reply_markup
        }
      )
    }
  } catch (error) {
    console.error('خطأ في الاكتشاف:', error)
    ctx.reply('❌ حدث خطأ أثناء الاكتشاف.', {
      reply_markup: mainMenu().reply_markup
    })
  }
})

/* 🔃 تحقق من الاشتراك */
bot.action('check_subscription', async (ctx) => {
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
  ctx.reply('✅ **تم التحقق بنجاح!**\n\nاختر من القائمة:', {
    parse_mode: 'Markdown',
    reply_markup: mainMenu().reply_markup
  })
})

/* 🔥 وسيط للتحقق من الاشتراك */
const requireSubscription = async (ctx, next) => {
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
  
  return next()
}

/* ➕ إضافة سيرفر */
bot.action('add_server', async (ctx) => {
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
  ctx.reply('📝 أدخل اسم للسيرفر (مثال: سيرفر فري):')
})

/* 📋 قائمة السيرفرات */
bot.action('list_servers', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()
  
  if (!ctx.session.servers || ctx.session.servers.length === 0) {
    return ctx.reply('⚠️ لا توجد سيرفرات مضافة.\nاضغط ➕ إضافة سيرفر', { 
      reply_markup: mainMenu().reply_markup 
    })
  }
  
  const serverList = ctx.session.servers.map((s, i) => 
    `${i+1}. ${s.name} - ${s.host}:${s.port} ${s.version ? `(${s.version})` : '(اكتشاف تلقائي)'}`
  ).join('\n')
  
  ctx.reply(
    `📋 **قائمة السيرفرات:**\n\n${serverList}\n\n` +
    `اختر سيرفر من الأزرار أدناه:`,
    {
      parse_mode: 'Markdown',
      reply_markup: serversMenu(ctx.session.servers, 'select').reply_markup
    }
  )
})

/* 🔥 اختيار السيرفر */
bot.action(/select_(\d+)/, requireSubscription, async (ctx) => {
  const index = parseInt(ctx.match[1])
  console.log(`🔘 محاولة اختيار سيرفر رقم: ${index}`)
  
  await ctx.answerCbQuery(`جاري اختيار السيرفر...`)
  
  if (!ctx.session.servers || !ctx.session.servers[index]) {
    console.log('❌ لا توجد سيرفرات أو الفهرس غير صحيح')
    return ctx.reply('❌ السيرفر غير موجود أو تم حذفه.')
  }
  
  const selectedServer = ctx.session.servers[index]
  console.log('✅ تم العثور على سيرفر:', selectedServer)
  
  ctx.session.currentServer = selectedServer
  
  const versionInfo = selectedServer.version ? 
    `🎮 **الإصدار:** ${selectedServer.version}` : 
    `🔄 **الإصدار:** اكتشاف تلقائي`
  
  ctx.reply(
    `✅ **تم اختيار السيرفر:**\n\n` +
    `📌 **الاسم:** ${selectedServer.name}\n` +
    `📍 **العنوان:** ${selectedServer.host}:${selectedServer.port}\n` +
    `👤 **البوت:** ${selectedServer.username}\n` +
    `${versionInfo}\n\n` +
    `**💡 نصيحة:** قبل الدخول، تأكد من:\n` +
    `1. السيرفر يعمل\n` +
    `2. لا يوجد حظر للبوتات\n` +
    `3. العنوان صحيح\n\n` +
    `يمكنك اختبار الاتصال أولاً: 🔍 اختبار اتصال`,
    {
      parse_mode: 'Markdown',
      reply_markup: mainMenu().reply_markup
    }
  )
})

/* ▶️ دخول للسيرفر مع حل مشكلة Ping Timeout */
bot.action('connect', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery('جاري الاتصال...')

  if (!ctx.session.currentServer) {
    console.log('❌ لا يوجد سيرفر مختار')
    return ctx.reply(
      `⚠️ **لم تختر سيرفراً بعد**\n\n` +
      `1. اضغط 📋 قائمة السيرفرات\n` +
      `2. اختر سيرفر من القائمة\n` +
      `3. اضغط ▶️ دخول مرة أخرى`,
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu().reply_markup
      }
    )
  }

  const server = ctx.session.currentServer
  const serverKey = `${server.host}:${server.port}`
  
  console.log('🚀 محاولة الاتصال بـ:', server)

  if (clients.has(serverKey)) {
    return ctx.reply(`⚠️ البوت متصل بالفعل بـ ${server.name}`)
  }

  const versionText = server.version ? server.version : 'اكتشاف تلقائي'
  
  // ⭐ الإصلاح: اختبار الاتصال أولاً قبل المحاولة
  ctx.reply(`🔍 جاري التحقق من اتصال ${server.host}:${server.port}...`)
  
  const connectionTest = await testServerConnection(server.host, server.port)
  
  if (!connectionTest.success) {
    return ctx.reply(
      `❌ **تعذر الاتصال بالسيرفر**\n\n` +
      `📍 ${server.host}:${server.port}\n` +
      `📡 ${connectionTest.message}\n\n` +
      `**💡 الأسباب المحتملة:**\n` +
      `1. السيرفر مغلق\n` +
      `2. Port خاطئ\n` +
      `3. هناك حظر للبوتات\n` +
      `4. مشكلة في الشبكة\n\n` +
      `**الحلول:**\n` +
      `• تأكد أن السيرفر يعمل\n` +
      `• تحقق من IP و Port\n` +
      `• جرب سيرفر مختلف\n` +
      `• تأكد من اتصال الإنترنت`,
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu().reply_markup
      }
    )
  }
  
  ctx.reply(`✅ **السيرفر متاح للاتصال**\n\n⏳ جاري الدخول إلى ${server.name}...\n🎮 الإصدار: ${versionText}`)

  try {
    // ⭐ الإصلاح: خيارات اتصال محسنة لتجنب Ping Timeout
    const options = {
      host: server.host,
      port: server.port,
      username: server.username,
      offline: true,
      skipPing: true, // ⭐ مهم: إلغاء Ping لتجنب Timeout
      connectTimeout: 25000, // زيادة وقت الانتظار
      authTitle: 'MaxBlack Bot',
      profilesFolder: './profiles',
      autoInitPlayer: true
    }

    // تحديد الإصدار
    if (server.version) {
      options.version = server.version
      console.log(`🎮 استخدام الإصدار المحدد: ${server.version}`)
    } else {
      options.version = false // اكتشاف تلقائي
      console.log('🔄 اكتشاف الإصدار تلقائياً')
    }

    console.log('🔧 خيارات الاتصال المحسنة:', options)

    const client = bedrock.createClient(options)

    clients.set(serverKey, {
      client,
      server: server.name,
      connectedAt: new Date(),
      serverInfo: server,
      version: 'جاري الاتصال...'
    })

    client.on('spawn', () => {
      const connectedVersion = client.version || 'غير معروف'
      console.log(`✅ اتصال ناجح: ${server.name} (${connectedVersion})`)
      
      // تحديث الإصدار في بيانات العميل
      const connection = clients.get(serverKey)
      if (connection) {
        connection.version = connectedVersion
      }
      
      ctx.reply(
        `🟢 **تم الاتصال بنجاح!**\n\n` +
        `📌 ${server.name}\n` +
        `🎮 الإصدار: ${connectedVersion}\n` +
        `👤 البوت: ${server.username}\n` +
        `⏰ ${new Date().toLocaleTimeString()}\n\n` +
        `✅ البوت الآن داخل اللعبة!\n` +
        `⚙️ يمكنك تفعيل AFK من الإعدادات`
      )
      
      const interval = setInterval(() => {
        if (client) {
          try {
            // حركات AFK محسنة
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
            console.log('AFK Error:', e.message)
          }
        }
      }, 15000)

      afkIntervals.set(serverKey, interval)
    })

    client.on('error', (err) => {
      console.error('❌ خطأ اتصال:', err.message)
      
      let errorMessage = `❌ **فشل الاتصال بـ ${server.name}**\n\n`
      errorMessage += `**السبب:** ${err.message}\n\n`
      
      // ⭐ نصائح خاصة لمشكلة Ping Timeout
      if (err.message.includes('ping') || err.message.includes('timeout') || err.message.includes('timed out')) {
        errorMessage += `**💡 مشكلة Ping Timeout:**\n`
        errorMessage += `1. **السيرفر مغلق** - تأكد من تشغيل السيرفر\n`
        errorMessage += `2. **Port خاطئ** - تحقق من Port الصحيح\n`
        errorMessage += `3. **حظر البوتات** - بعض السيرفرات تمنع البوتات\n`
        errorMessage += `4. **مشكلة شبكة** - جرب اتصالاً آخر\n`
        errorMessage += `5. **إصدار غير متوافق** - جرب إصداراً مختلفاً\n\n`
        errorMessage += `**الحلول:**\n`
        errorMessage += `• اضغط 🔧 إعدادات متقدمة\n`
        errorMessage += `• اضغط 🔍 اختبار اتصال\n`
        errorMessage += `• جرب سيرفر آخر\n`
        errorMessage += `• تأكد من اتصال الإنترنت`
      } else if (err.message.includes('version')) {
        errorMessage += `**💡 مشكلة إصدار:**\n`
        errorMessage += `جرب إصداراً مختلفاً من الإعدادات المتقدمة`
      }
      
      ctx.reply(errorMessage, { parse_mode: 'Markdown' })
      cleanupConnection(serverKey)
    })

    client.on('disconnect', () => {
      console.log('🔴 تم الفصل:', server.name)
      ctx.reply(`🔴 تم فصل البوت من ${server.name}`)
      cleanupConnection(serverKey)
    })

    // ⭐ إضافة حدث للاتصال الناجح
    client.on('connect', () => {
      console.log('🔗 بدأ الاتصال:', server.name)
      ctx.reply(`🔗 **بدأ الاتصال** بالسيرفر...`)
    })
    
    // ⭐ إضافة حدث لتتبع عملية الاتصال
    setTimeout(() => {
      if (!clients.has(serverKey)) {
        ctx.reply(
          `⏳ **جاري محاولة الاتصال...**\n\n` +
          `إذا استمرت المشكلة:\n` +
          `1. اضغط 🔧 إعدادات متقدمة\n` +
          `2. اضغط 🔍 اختبار اتصال\n` +
          `3. جرب سيرفر مختلف`
        )
      }
    }, 10000)

  } catch (error) {
    console.error('❌ خطأ في الإعداد:', error)
    
    let errorMessage = `❌ **فشل الاتصال**\n\n`
    errorMessage += `**السبب:** ${error.message}\n\n`
    
    if (error.message.includes('ping') || error.message.includes('timeout')) {
      errorMessage += `**💡 مشكلة Ping Timeout**\n`
      errorMessage += `1. السيرفر قد يكون مغلقاً\n`
      errorMessage += `2. تأكد من IP و Port\n`
      errorMessage += `3. بعض السيرفرات ترفض البوتات\n`
      errorMessage += `4. جرب سيرفر Aternos أو سيرفر عام آخر\n\n`
      errorMessage += `**للإصلاح:**\n`
      errorMessage += `اضغط 🔧 إعدادات متقدمة → 🔍 اختبار اتصال`
    }
    
    ctx.reply(errorMessage, {
      parse_mode: 'Markdown',
      reply_markup: mainMenu().reply_markup
    })
  }
})

/* باقي الكود يبقى كما هو (حذف السيرفرات، AFK، الحالة، إلخ) */
// ... [الكود المتبقي يبقى كما هو من الرسالة السابقة]

/* 🧹 تنظيف الاتصال */
function cleanupConnection(serverKey) {
  if (afkIntervals.has(serverKey)) {
    clearInterval(afkIntervals.get(serverKey))
    afkIntervals.delete(serverKey)
  }
  clients.delete(serverKey)
  console.log('🧹 تم تنظيف اتصال:', serverKey)
}

/* 🧹 تنظيف جميع الاتصالات */
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
  console.error('⚠️ خطأ غير معالج:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ وعد مرفوض:', promise, 'السبب:', reason)
})

/* 🚀 تشغيل البوت */
bot.launch({
  dropPendingUpdates: true,
  allowedUpdates: ['message', 'callback_query']
}).then(() => {
  console.log('🔥🔥🔥 MaxBlack Bot يعمل الآن! 🔥🔥🔥')
  console.log('🔧 **تم إصلاح مشكلة Ping Timeout**')
  console.log('✅ اختبار الاتصال مفعل')
  console.log('⚡ الاتصال المحسن مع skipPing')
  console.log('📢 الاشتراك الإجباري مفعل')
  console.log('===========================')
})

/* 📢 أوامر نصية */
bot.command('test', requireSubscription, async (ctx) => {
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
    { parse_mode: 'Markdown' }
  )
})
