const { Telegraf, Markup, session } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

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

/* 🎮 جميع إصدارات Bedrock من 1.8 إلى 1.21.132 */
const SUPPORTED_VERSIONS = [
  // الإصدارات الحديثة 1.21.x
  '1.21.132', '1.21.131', '1.21.130', '1.21.120', '1.21.110', '1.21.100', '1.21.90', '1.21.80', '1.21.70', '1.21.60', '1.21.50', '1.21.40', '1.21.30', '1.21.20', '1.21.10', '1.21.0',
  
  // الإصدارات 1.20.x
  '1.20.80', '1.20.75', '1.20.70', '1.20.62', '1.20.60', '1.20.55', '1.20.50', '1.20.45', '1.20.42', '1.20.41', '1.20.40', '1.20.32', '1.20.30', '1.20.28', '1.20.26', '1.20.22', '1.20.21', '1.20.20', '1.20.18', '1.20.16', '1.20.15', '1.20.14', '1.20.12', '1.20.11', '1.20.10', '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20.0',
  
  // الإصدارات 1.19.x
  '1.19.84', '1.19.83', '1.19.82', '1.19.81', '1.19.80', '1.19.73', '1.19.72', '1.19.71', '1.19.70', '1.19.63', '1.19.62', '1.19.61', '1.19.60', '1.19.51', '1.19.50', '1.19.41', '1.19.40', '1.19.31', '1.19.30', '1.19.21', '1.19.20', '1.19.11', '1.19.10', '1.19.0',
  
  // الإصدارات 1.18.x
  '1.18.33', '1.18.32', '1.18.31', '1.18.30', '1.18.12', '1.18.11', '1.18.10', '1.18.2', '1.18.0',
  
  // الإصدارات 1.17.x
  '1.17.41', '1.17.40', '1.17.34', '1.17.33', '1.17.32', '1.17.30', '1.17.11', '1.17.10', '1.17.2', '1.17.0',
  
  // الإصدارات 1.16.x
  '1.16.221', '1.16.220', '1.16.210', '1.16.201', '1.16.200', '1.16.101', '1.16.100', '1.16.20', '1.16.10', '1.16.1', '1.16.0',
  
  // الإصدارات 1.15.x
  '1.15.1', '1.15.0',
  
  // الإصدارات 1.14.x
  '1.14.60', '1.14.32', '1.14.31', '1.14.30', '1.14.20', '1.14.1', '1.14.0',
  
  // الإصدارات 1.13.x
  '1.13.5', '1.13.4', '1.13.3', '1.13.2', '1.13.1', '1.13.0',
  
  // الإصدارات 1.12.x
  '1.12.1', '1.12.0',
  
  // الإصدارات 1.11.x
  '1.11.4', '1.11.3', '1.11.2', '1.11.1', '1.11.0',
  
  // الإصدارات 1.10.x
  '1.10.1', '1.10.0',
  
  // الإصدارات 1.9.x
  '1.9.0',
  
  // الإصدارات 1.8.x
  '1.8.1', '1.8.0'
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
    [Markup.button.callback('📊 الحالة', 'status')]
  ])
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

/* 🔧 قائمة الإصدارات */
function versionMenu() {
  const rows = []
  const chunkSize = 3
  
  // عرض الإصدارات الحديثة أولاً
  const recentVersions = SUPPORTED_VERSIONS.slice(0, 15) // آخر 15 إصدار
  
  for (let i = 0; i < recentVersions.length; i += chunkSize) {
    const chunk = recentVersions.slice(i, i + chunkSize)
    const buttons = chunk.map(version => 
      Markup.button.callback(version, `version_${version}`)
    )
    rows.push(buttons)
  }
  
  // زر لعرض المزيد
  rows.push([
    Markup.button.callback('📜 عرض كل الإصدارات', 'show_all_versions'),
    Markup.button.callback('🔙 رجوع', 'back_to_main')
  ])
  
  rows.push([
    Markup.button.callback('🔄 اكتشاف تلقائي', 'version_auto')
  ])
  
  return Markup.inlineKeyboard(rows)
}

/* 📜 قائمة كل الإصدارات */
function allVersionsMenu() {
  const rows = []
  
  // تجميع الإصدارات حسب الإصدار الرئيسي
  const versionsByMajor = {}
  
  SUPPORTED_VERSIONS.forEach(version => {
    const majorVersion = version.split('.')[1] // الحصول على الجزء الثاني مثل "21" أو "20"
    if (!versionsByMajor[majorVersion]) {
      versionsByMajor[majorVersion] = []
    }
    versionsByMajor[majorVersion].push(version)
  })
  
  // إنشاء أزرار لكل إصدار رئيسي
  Object.keys(versionsByMajor).sort((a, b) => b - a).forEach(majorVersion => {
    const latestVersion = versionsByMajor[majorVersion][0]
    rows.push([
      Markup.button.callback(`🎮 MC 1.${majorVersion}.x`, `version_group_${majorVersion}`)
    ])
  })
  
  rows.push([
    Markup.button.callback('🔙 رجوع للإصدارات الحديثة', 'show_recent_versions')
  ])
  
  return Markup.inlineKeyboard(rows)
}

/* 🎮 قائمة إصدارات مجموعة محددة */
function versionGroupMenu(majorVersion) {
  const rows = []
  const chunkSize = 3
  const groupVersions = SUPPORTED_VERSIONS.filter(v => v.split('.')[1] === majorVersion)
  
  for (let i = 0; i < groupVersions.length; i += chunkSize) {
    const chunk = groupVersions.slice(i, i + chunkSize)
    const buttons = chunk.map(version => 
      Markup.button.callback(version, `version_${version}`)
    )
    rows.push(buttons)
  }
  
  rows.push([
    Markup.button.callback('🔙 رجوع للقائمة', 'show_all_versions'),
    Markup.button.callback('🏠 الرئيسية', 'back_to_main')
  ])
  
  return Markup.inlineKeyboard(rows)
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
    
    const options = {
      host: host,
      port: port,
      username: 'VersionDetector',
      offline: true,
      skipPing: false,
      connectTimeout: 10000,
      version: false
    }
    
    const client = bedrock.createClient(options)
    
    return new Promise((resolve, reject) => {
      let detected = false
      
      client.on('connect_allowed', () => {
        if (!detected) {
          detected = true
          const version = client.version
          console.log(`✅ تم اكتشاف الإصدار: ${version}`)
          client.close()
          resolve(version)
        }
      })
      
      client.on('error', (err) => {
        if (!detected) {
          detected = true
          console.log(`⚠️ تعذر اكتشاف الإصدار: ${err.message}`)
          client.close()
          resolve(false)
        }
      })
      
      setTimeout(() => {
        if (!detected) {
          detected = true
          console.log('⏰ انتهى وقت اكتشاف الإصدار')
          client.close()
          resolve(false)
        }
      }, 8000)
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
    `🎮 **MaxBlack Bot - جميع إصدارات Bedrock**\n\n` +
    `✅ يدعم **${SUPPORTED_VERSIONS.length}** إصدار\n` +
    `📅 من **1.8.0** إلى **1.21.132**\n` +
    `🔄 اكتشاف تلقائي للإصدار\n` +
    `🔧 خيار اختيار إصدار يدوي\n\n` +
    `اختر من القائمة:`,
    { 
      reply_markup: mainMenu().reply_markup 
    }
  )
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
        [Markup.button.callback('🎮 اختيار إصدار', 'select_version')],
        [Markup.button.callback('🔄 اكتشاف إصدار سيرفر', 'detect_version')],
        [Markup.button.callback('📋 قائمة الإصدارات', 'list_versions')],
        [Markup.button.callback('🔙 رجوع', 'back_to_main')]
      ]).reply_markup
    }
  )
})

/* 🎮 اختيار إصدار */
bot.action('select_version', async (ctx) => {
  await ctx.answerCbQuery()
  
  if (!ctx.session.currentServer) {
    return ctx.reply(
      `⚠️ **لم تختر سيرفراً بعد**\n\n` +
      `1. اختر سيرفراً من القائمة\n` +
      `2. عد إلى هذه الإعدادات\n` +
      `3. اختر الإصدار المناسب`,
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu().reply_markup
      }
    )
  }
  
  ctx.reply(
    `🎮 **اختر إصدار Minecraft**\n\n` +
    `السيرفر الحالي: ${ctx.session.currentServer.name}\n` +
    `اختر إصداراً من القائمة:`,
    {
      parse_mode: 'Markdown',
      reply_markup: versionMenu().reply_markup
    }
  )
})

/* 📜 عرض كل الإصدارات */
bot.action('show_all_versions', async (ctx) => {
  await ctx.answerCbQuery()
  
  const totalVersions = SUPPORTED_VERSIONS.length
  const oldestVersion = SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1]
  const newestVersion = SUPPORTED_VERSIONS[0]
  
  ctx.reply(
    `📜 **جميع الإصدارات المدعومة**\n\n` +
    `✅ **${totalVersions}** إصدار\n` +
    `📅 من **${oldestVersion}** إلى **${newestVersion}**\n\n` +
    `اختر مجموعة الإصدار:`,
    {
      parse_mode: 'Markdown',
      reply_markup: allVersionsMenu().reply_markup
    }
  )
})

/* 🔙 عرض الإصدارات الحديثة */
bot.action('show_recent_versions', async (ctx) => {
  await ctx.answerCbQuery()
  
  ctx.reply(
    `🎮 **الإصدارات الحديثة**\n\n` +
    `اختر إصداراً:`,
    {
      parse_mode: 'Markdown',
      reply_markup: versionMenu().reply_markup
    }
  )
})

/* 🎮 عرض مجموعة إصدارات محددة */
bot.action(/version_group_(\d+)/, async (ctx) => {
  const majorVersion = ctx.match[1]
  await ctx.answerCbQuery(`جاري تحميل إصدارات 1.${majorVersion}.x`)
  
  const groupVersions = SUPPORTED_VERSIONS.filter(v => v.split('.')[1] === majorVersion)
  const count = groupVersions.length
  
  ctx.reply(
    `🎮 **إصدارات Minecraft 1.${majorVersion}.x**\n\n` +
    `📋 ${count} إصدار\n` +
    `📍 من ${groupVersions[count-1]} إلى ${groupVersions[0]}\n\n` +
    `اختر الإصدار المناسب:`,
    {
      parse_mode: 'Markdown',
      reply_markup: versionGroupMenu(majorVersion).reply_markup
    }
  )
})

/* 🔄 اكتشاف إصدار سيرفر */
bot.action('detect_version', async (ctx) => {
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
        `يمكنك:\n` +
        `1. اختيار إصدار يدوياً من القائمة\n` +
        `2. استخدام "اكتشاف تلقائي" عند الاتصال`,
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

/* 📋 قائمة الإصدارات */
bot.action('list_versions', async (ctx) => {
  await ctx.answerCbQuery()
  
  const recentVersions = SUPPORTED_VERSIONS.slice(0, 10)
  const versionList = recentVersions.map(v => `• ${v}`).join('\n')
  
  ctx.reply(
    `📋 **آخر ${recentVersions.length} إصدار مدعوم:**\n\n${versionList}\n\n` +
    `🔄 **الإجمالي:** ${SUPPORTED_VERSIONS.length} إصدار\n` +
    `🎯 **الأحدث:** ${SUPPORTED_VERSIONS[0]}\n` +
    `📅 **الأقدم:** ${SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1]}`,
    {
      parse_mode: 'Markdown',
      reply_markup: mainMenu().reply_markup
    }
  )
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

/* 🗑️ حذف سيرفر */
bot.action('delete_server', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()
  
  if (!ctx.session.servers || ctx.session.servers.length === 0) {
    return ctx.reply('⚠️ لا توجد سيرفرات لحذفها.', { 
      reply_markup: mainMenu().reply_markup 
    })
  }
  
  ctx.reply('🗑️ اختر السيرفر الذي تريد حذفه:', {
    reply_markup: deleteMenu(ctx.session.servers).reply_markup
  })
})

/* 🗑️ حذف سيرفر محدد */
bot.action(/delete_(\d+)/, requireSubscription, async (ctx) => {
  const index = parseInt(ctx.match[1])
  await ctx.answerCbQuery()
  
  if (!ctx.session.servers || !ctx.session.servers[index]) {
    return ctx.reply('❌ السيرفر غير موجود')
  }
  
  const deletedServer = ctx.session.servers[index]
  const serverKey = `${deletedServer.host}:${deletedServer.port}`
  
  if (clients.has(serverKey)) {
    const connection = clients.get(serverKey)
    if (connection.client) {
      connection.client.close()
    }
    cleanupConnection(serverKey)
  }
  
  ctx.session.servers.splice(index, 1)
  
  if (ctx.session.currentServer && 
      ctx.session.currentServer.host === deletedServer.host &&
      ctx.session.currentServer.port === deletedServer.port) {
    ctx.session.currentServer = null
  }
  
  ctx.reply(`🗑️ تم حذف: ${deletedServer.name}\n📍 ${deletedServer.host}:${deletedServer.port}`, {
    reply_markup: mainMenu().reply_markup
  })
})

/* 🗑️ حذف جميع السيرفرات */
bot.action('delete_all', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()
  
  if (!ctx.session.servers || ctx.session.servers.length === 0) {
    return ctx.reply('⚠️ لا توجد سيرفرات لحذفها.')
  }
  
  const confirmKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('✅ نعم، احذف الكل', 'confirm_delete_all')],
    [Markup.button.callback('❌ إلغاء', 'back_to_main')]
  ])
  
  ctx.reply(`⚠️ **هل أنت متأكد من حذف جميع السيرفرات؟**`, {
    parse_mode: 'Markdown',
    reply_markup: confirmKeyboard.reply_markup
  })
})

/* ✅ تأكيد حذف الكل */
bot.action('confirm_delete_all', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()
  const totalServers = ctx.session.servers ? ctx.session.servers.length : 0
  
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
  
  ctx.session.servers = []
  ctx.session.currentServer = null
  
  ctx.reply(`🗑️ تم حذف جميع السيرفرات (${totalServers}) بنجاح!`, {
    reply_markup: mainMenu().reply_markup
  })
})

/* ⚙️ إعدادات AFK */
bot.action('afk_settings', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()
  ctx.reply('⚙️ إعدادات AFK:', {
    reply_markup: afkMenu().reply_markup
  })
})

/* ◀️ رجوع للقائمة */
bot.action('back_to_main', async (ctx) => {
  await ctx.answerCbQuery()
  ctx.session.step = null
  ctx.session.action = null
  ctx.session.currentServer = null
  ctx.reply('🏠 القائمة الرئيسية:', {
    reply_markup: mainMenu().reply_markup
  })
})

/* 🔥 الإصلاح: معالجة الرسائل النصية */
bot.on('text', async (ctx) => {
  console.log('📥 رسالة نصية:', ctx.message.text)
  
  if (!ctx.session.hasCheckedSubscription) {
    const subscription = await checkSubscription(ctx)
    if (!subscription.success) {
      return ctx.reply(
        `📢 **يجب التحقق من الاشتراك أولاً**\n\n` +
        `اضغط على زر التحقق بعد الاشتراك:`,
        {
          parse_mode: 'Markdown',
          reply_markup: subscriptionMenu().reply_markup
        }
      )
    }
    ctx.session.hasCheckedSubscription = true
  }

  if (!ctx.session || !ctx.session.step) {
    console.log('⚠️ لا توجد خطوة نشطة')
    return ctx.reply('👋 استخدم الأزرار للتفاعل:', {
      reply_markup: mainMenu().reply_markup
    })
  }

  const text = ctx.message.text.trim()
  console.log(`✅ خطوة: ${ctx.session.step}, النص: ${text}`)

  switch (ctx.session.step) {
    case 'server_name':
      ctx.session.tempServer.name = text
      ctx.session.step = 'server_ip'
      return ctx.reply('🌐 أدخل IP السيرفر (مثال: pixel_craft5.aternos.me):')

    case 'server_ip':
      ctx.session.tempServer.host = text
      ctx.session.step = 'server_port'
      return ctx.reply('🔢 أدخل Port السيرفر (مثال: 48451):')

    case 'server_port':
      const port = parseInt(text)
      if (isNaN(port) || port < 1 || port > 65535) {
        return ctx.reply('⚠️ Port غير صالح. أدخل رقم بين 1 و 65535:')
      }
      ctx.session.tempServer.port = port
      ctx.session.step = 'bot_username'
      return ctx.reply('👤 أدخل اسم البوت في اللعبة:')

    case 'bot_username':
      console.log('✅ اسم البوت:', text)
      ctx.session.tempServer.username = text
      
      try {
        const newServer = {
          id: Date.now(),
          name: ctx.session.tempServer.name,
          host: ctx.session.tempServer.host,
          port: ctx.session.tempServer.port,
          username: ctx.session.tempServer.username || `Bot_${Date.now()}`,
          version: false, // اكتشاف تلقائي افتراضي
          created: new Date().toISOString()
        }
        
        if (!ctx.session.servers) {
          ctx.session.servers = []
        }
        ctx.session.servers.push(newServer)
        
        ctx.session.step = null
        ctx.session.action = null
        ctx.session.tempServer = {}
        
        console.log('✅ تم إضافة سيرفر:', newServer)
        
        ctx.reply(
          `✅ **تم إضافة السيرفر بنجاح!**\n\n` +
          `📌 **الاسم:** ${newServer.name}\n` +
          `📍 **العنوان:** ${newServer.host}:${newServer.port}\n` +
          `👤 **البوت:** ${newServer.username}\n` +
          `🎮 **الإصدار:** اكتشاف تلقائي\n\n` +
          `يمكنك:\n` +
          `1. اختيار إصدار يدوياً من 🔧 إعدادات متقدمة\n` +
          `2. اكتشاف الإصدار تلقائياً\n` +
          `3. الاتصال مباشرة مع الاكتشاف التلقائي`,
          {
            parse_mode: 'Markdown',
            reply_markup: mainMenu().reply_markup
          }
        )
        
      } catch (error) {
        console.error('❌ خطأ:', error)
        ctx.session.step = null
        ctx.session.tempServer = {}
        ctx.reply('❌ حدث خطأ. حاول مرة أخرى.', {
          reply_markup: mainMenu().reply_markup
        })
      }
      break

    default:
      console.log('❌ خطوة غير معروفة')
      ctx.session.step = null
      ctx.reply('⚠️ جلسة منتهية.', {
        reply_markup: mainMenu().reply_markup
      })
  }
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
    `يمكنك الآن:\n` +
    `▶️ اضغط "دخول" للاتصال\n` +
    `🔧 اضغط "إعدادات متقدمة" لتغيير الإصدار`,
    {
      parse_mode: 'Markdown',
      reply_markup: mainMenu().reply_markup
    }
  )
})

/* 🎮 اختيار إصدار معين */
bot.action(/version_(.+)/, async (ctx) => {
  const version = ctx.match[1]
  await ctx.answerCbQuery(`جاري تعيين الإصدار ${version === 'auto' ? 'اكتشاف تلقائي' : version}`)
  
  if (!ctx.session.currentServer) {
    return ctx.reply('⚠️ اختر سيرفراً أولاً.')
  }
  
  const server = ctx.session.currentServer
  
  // تحديث السيرفر في القائمة
  const serverIndex = ctx.session.servers.findIndex(s => 
    s.host === server.host && s.port === server.port
  )
  
  if (serverIndex !== -1) {
    if (version === 'auto') {
      ctx.session.servers[serverIndex].version = false
      ctx.session.currentServer.version = false
    } else {
      ctx.session.servers[serverIndex].version = version
      ctx.session.currentServer.version = version
    }
    
    const versionText = version === 'auto' ? 'اكتشاف تلقائي' : version
    
    ctx.reply(
      `✅ **تم تحديث إصدار السيرفر**\n\n` +
      `📌 ${server.name}\n` +
      `🎮 الإصدار: ${versionText}\n\n` +
      `يمكنك الآن الاتصال بالسيرفر.`,
      {
        parse_mode: 'Markdown',
        reply_markup: mainMenu().reply_markup
      }
    )
  } else {
    ctx.reply('❌ لم يتم العثور على السيرفر.', {
      reply_markup: mainMenu().reply_markup
    })
  }
})

/* ▶️ دخول للسيرفر مع دعم جميع الإصدارات */
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
  ctx.reply(`⏳ جاري الدخول إلى ${server.name}...\n🎮 الإصدار: ${versionText}`)

  try {
    const options = {
      host: server.host,
      port: server.port,
      username: server.username,
      offline: true,
      skipPing: false,
      connectTimeout: 30000,
      profilesFolder: './profiles'
    }

    // تحديد الإصدار
    if (server.version) {
      options.version = server.version
      console.log(`🎮 استخدام الإصدار المحدد: ${server.version}`)
    } else {
      options.version = false // اكتشاف تلقائي
      console.log('🔄 اكتشاف الإصدار تلقائياً')
    }

    console.log('🔧 خيارات الاتصال:', options)

    const client = bedrock.createClient(options)

    clients.set(serverKey, {
      client,
      server: server.name,
      connectedAt: new Date(),
      serverInfo: server,
      version: client.version || 'غير معروف'
    })

    ctx.reply(`🔗 بدأ الاتصال بـ ${server.name}...`)

    client.on('spawn', () => {
      const connectedVersion = client.version || 'غير معروف'
      console.log(`✅ اتصال ناجح: ${server.name} (${connectedVersion})`)
      
      ctx.reply(
        `🟢 **تم الاتصال بنجاح!**\n\n` +
        `📌 ${server.name}\n` +
        `🎮 الإصدار: ${connectedVersion}\n` +
        `👤 البوت: ${server.username}\n\n` +
        `البوت الآن داخل اللعبة!`
      )
      
      const interval = setInterval(() => {
        if (client) {
          try {
            // حركات AFK متوافقة مع جميع الإصدارات
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
      
      let errorMessage = `❌ **فشل الاتصال بـ ${server.name}**\n\nالسبب: ${err.message}`
      
      // اقتراحات ذكية حسب نوع الخطأ
      if (err.message.includes('version') || err.message.includes('unsupported')) {
        errorMessage += '\n\n💡 **الحلول المقترحة:**\n'
        errorMessage += '1. اذهب إلى 🔧 إعدادات متقدمة\n'
        errorMessage += '2. اضغط 🎮 اختيار إصدار\n'
        
        if (server.version) {
          // اقتراح إصدارات قريبة
          const currentVersion = server.version
          const versionParts = currentVersion.split('.').map(Number)
          
          if (versionParts.length >= 2) {
            const major = versionParts[0]
            const minor = versionParts[1]
            
            // البحث عن إصدارات في نفس المجموعة
            const similarVersions = SUPPORTED_VERSIONS.filter(v => {
              const parts = v.split('.').map(Number)
              return parts[0] === major && parts[1] === minor
            })
            
            if (similarVersions.length > 1) {
              errorMessage += `3. جرب إصدارات قريبة مثل: ${similarVersions.slice(0, 3).join(', ')}\n`
            }
          }
        }
        
        errorMessage += '4. أو استخدم "اكتشاف تلقائي"'
      }
      
      ctx.reply(errorMessage)
      cleanupConnection(serverKey)
    })

    client.on('disconnect', () => {
      console.log('🔴 تم الفصل:', server.name)
      ctx.reply(`🔴 تم فصل البوت من ${server.name}`)
      cleanupConnection(serverKey)
    })

    client.on('connect', () => {
      console.log('🔗 بدأ الاتصال:', server.name)
    })

  } catch (error) {
    console.error('❌ خطأ في الإعداد:', error)
    
    let errorMessage = `❌ **فشل الاتصال**\n\nالسبب: ${error.message}`
    
    if (error.message.includes('version')) {
      errorMessage += '\n\n💡 **جرب:**\n'
      errorMessage += '1. اضغط 🔧 إعدادات متقدمة\n'
      errorMessage += '2. اضغط 🎮 اختيار إصدار\n'
      errorMessage += '3. اختر إصداراً مختلفاً\n'
      errorMessage += '4. حاول الاتصال مرة أخرى'
    }
    
    ctx.reply(errorMessage)
  }
})

/* ⏹️ خروج من السيرفر */
bot.action('disconnect', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()

  if (!ctx.session.currentServer) {
    return ctx.reply('⚠️ لم تختر سيرفراً بعد.')
  }

  const server = ctx.session.currentServer
  const serverKey = `${server.host}:${server.port}`

  if (!clients.has(serverKey)) {
    return ctx.reply(`⚠️ البوت غير متصل بـ ${server.name}`)
  }

  const connection = clients.get(serverKey)
  connection.client.close()
  cleanupConnection(serverKey)
  
  ctx.reply(`🛑 تم إخراج البوت من ${server.name}`)
})

/* 🔄 تشغيل AFK */
bot.action('afk_on', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()
  
  if (!ctx.session.currentServer) {
    return ctx.reply('⚠️ اختر سيرفراً أولاً.')
  }

  const server = ctx.session.currentServer
  const serverKey = `${server.host}:${server.port}`

  if (!clients.has(serverKey)) {
    return ctx.reply('⚠️ البوت غير متصل.')
  }

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

/* ⏸️ إيقاف AFK */
bot.action('afk_off', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()
  
  if (!ctx.session.currentServer) {
    return ctx.reply('⚠️ اختر سيرفراً أولاً.')
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

/* 📊 الحالة */
bot.action('status', requireSubscription, async (ctx) => {
  await ctx.answerCbQuery()

  let statusMessage = '📊 **حالة البوت:**\n\n'
  
  if (ctx.session.currentServer) {
    const server = ctx.session.currentServer
    const serverKey = `${server.host}:${server.port}`
    
    statusMessage += `**السيرفر المختار:** ${server.name}\n`
    statusMessage += `📍 ${server.host}:${server.port}\n`
    statusMessage += `👤 ${server.username}\n`
    statusMessage += `🎮 **الإصدار:** ${server.version ? server.version : 'اكتشاف تلقائي'}\n\n`
    
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
      statusMessage += `🎮 **الإصدار المتصل:** ${connection.version || 'غير معروف'}\n`
      statusMessage += `⏱️ **AFK:** ${afkIntervals.has(serverKey) ? 'مفعل ✅' : 'معطل ❌'}\n`
    } else {
      statusMessage += '🔴 **غير متصل**\n'
    }
  } else {
    statusMessage += '⚠️ **لا يوجد سيرفر مختار**\n'
    statusMessage += 'اضغط 📋 قائمة السيرفرات لاختيار سيرفر\n'
  }
  
  statusMessage += `\n**إحصاءات:**\n`
  statusMessage += `📋 عدد السيرفرات: ${ctx.session.servers ? ctx.session.servers.length : 0}\n`
  statusMessage += `🔗 اتصالات نشطة: ${clients.size}\n`
  statusMessage += `🎮 إصدارات مدعومة: ${SUPPORTED_VERSIONS.length}\n`
  
  const oldestVersion = SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1]
  const newestVersion = SUPPORTED_VERSIONS[0]
  statusMessage += `📅 من ${oldestVersion} إلى ${newestVersion}\n`
  
  if (ctx.session.servers && ctx.session.servers.length > 0) {
    statusMessage += `\n**السيرفرات المضافة:**\n`
    ctx.session.servers.forEach((server, index) => {
      const isCurrent = ctx.session.currentServer && 
                       server.host === ctx.session.currentServer.host &&
                       server.port === ctx.session.currentServer.port
      const version = server.version ? `(${server.version})` : '(اكتشاف تلقائي)'
      statusMessage += `${isCurrent ? '▶️' : '📌'} ${index + 1}. ${server.name} ${version}\n`
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
  console.log('🎮 **دعم كامل لكل إصدارات Bedrock**')
  console.log(`📋 عدد الإصدارات المدعومة: ${SUPPORTED_VERSIONS.length}`)
  console.log(`📅 من ${SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1]} إلى ${SUPPORTED_VERSIONS[0]}`)
  console.log('📢 الاشتراك الإجباري مفعل')
  console.log('🔧 النظام جاهز للاستخدام!')
  console.log('===========================')
})

/* 📢 أوامر نصية */
bot.command('channels', async (ctx) => {
  ctx.reply(
    `📢 **قنوات الاشتراك الإجباري:**\n\n` +
    `📌 ${REQUIRED_CHANNELS[0].name}\n🔗 ${REQUIRED_CHANNELS[0].url}\n\n` +
    `📌 ${REQUIRED_CHANNELS[1].name}\n🔗 ${REQUIRED_CHANNELS[1].url}\n\n` +
    `يجب الاشتراك في القنوات لاستخدام البوت.`,
    {
      parse_mode: 'Markdown',
      reply_markup: subscriptionMenu().reply_markup
    }
  )
})

bot.command('versions', async (ctx) => {
  const recentVersions = SUPPORTED_VERSIONS.slice(0, 15)
  const versionList = recentVersions.map(v => `• ${v}`).join('\n')
  
  const oldestVersion = SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1]
  const newestVersion = SUPPORTED_VERSIONS[0]
  
  ctx.reply(
    `🎮 **الإصدارات المدعومة:**\n\n${versionList}\n\n` +
    `🔄 **الإجمالي:** ${SUPPORTED_VERSIONS.length} إصدار\n` +
    `📅 **النطاق:** من ${oldestVersion} إلى ${newestVersion}\n\n` +
    `لتغيير إصدار سيرفر:\n` +
    `1. اختر سيرفراً\n` +
    `2. اضغط 🔧 إعدادات متقدمة\n` +
    `3. اضغط 🎮 اختيار إصدار\n` +
    `4. اختر من القائمة`,
    {
      parse_mode: 'Markdown',
      reply_markup: mainMenu().reply_markup
    }
  )
})

bot.command('check', async (ctx) => {
  const subscription = await checkSubscription(ctx)
  
  if (subscription.success) {
    ctx.session.hasCheckedSubscription = true
    ctx.reply('✅ **أنت مشترك في جميع القنوات!**', {
      parse_mode: 'Markdown',
      reply_markup: mainMenu().reply_markup
    })
  } else {
    ctx.reply(
      `❌ **يجب الاشتراك في القنوات أولاً**`,
      {
        parse_mode: 'Markdown',
        reply_markup: subscriptionMenu().reply_markup
      }
    )
  }
})

// أمر لاختبار النظام
bot.command('test', requireSubscription, async (ctx) => {
  if (!ctx.session.servers || ctx.session.servers.length === 0) {
    return ctx.reply('لا توجد سيرفرات مضافة.')
  }
  
  const oldestVersion = SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1]
  const newestVersion = SUPPORTED_VERSIONS[0]
  
  const testInfo = {
    servers: ctx.session.servers.length,
    currentServer: ctx.session.currentServer ? ctx.session.currentServer.name : 'لا يوجد',
    connections: clients.size,
    supportedVersions: SUPPORTED_VERSIONS.length,
    versionRange: `${oldestVersion} - ${newestVersion}`
  }
  
  ctx.reply(
    `🔧 **اختبار النظام:**\n\n` +
    `📋 السيرفرات: ${testInfo.servers}\n` +
    `🎯 المختار: ${testInfo.currentServer}\n` +
    `🔗 اتصالات: ${testInfo.connections}\n` +
    `🎮 إصدارات مدعومة: ${testInfo.supportedVersions}\n` +
    `📅 نطاق الإصدارات: ${testInfo.versionRange}`,
    {
      parse_mode: 'Markdown'
    }
  )
})
