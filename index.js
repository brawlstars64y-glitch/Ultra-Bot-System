const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')
const fs = require('fs')

// إعداد التوكن والسيرفر
const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')
const PORT = process.env.PORT || 8080

// قاعدة بيانات بسيطة للحفظ
let servers = {}
if (fs.existsSync('servers.json')) {
    try { servers = JSON.parse(fs.readFileSync('servers.json')) } catch (e) { servers = {} }
}
const saveDB = () => fs.writeFileSync('servers.json', JSON.stringify(servers, null, 2))

const CHANNELS = ['@aternosbot24', '@N_NHGER', '@sjxhhdbx72', '@vsyfyk']
const clients = {}   
const waitIP = {}    

// Keep Alive
http.createServer((req, res) => res.end('MAX BLACK BOT IS ACTIVE')).listen(PORT)

// فحص الاشتراك
async function checkSub(ctx) {
  for (const ch of CHANNELS) {
    try {
      const m = await ctx.telegram.getChatMember(ch, ctx.from.id)
      if (['left', 'kicked', 'null'].includes(m.status)) return false
    } catch { continue }
  }
  return true
}

const mainMenu = () => Markup.inlineKeyboard([
  [Markup.button.callback('➕ إضافة سيرفر جديد', 'ADD')],
  [Markup.button.callback('📂 قائمة سيرفراتي', 'LIST')]
])

bot.start(async ctx => {
  if (!(await checkSub(ctx))) {
    return ctx.reply('⚠️ اشترك بالقنوات أولاً لتعمل اللوحة:', Markup.inlineKeyboard([
      [Markup.button.callback('✅ تم الاشتراك', 'CHECK_SUB')]
    ]))
  }
  ctx.reply('🎮 أهلاً بك يا بطل، اختر خياراً:', mainMenu())
})

bot.action('CHECK_SUB', async ctx => {
  if (await checkSub(ctx)) ctx.editMessageText('✅ تم التفعيل!', mainMenu())
  else ctx.answerCbQuery('❌ اشترك أولاً!', { show_alert: true })
})

bot.action('ADD', ctx => {
  waitIP[ctx.from.id] = true
  ctx.reply('📡 أرسل ip:port')
})

bot.on('text', ctx => {
  const uid = ctx.from.id
  if (!waitIP[uid]) return
  const text = ctx.message.text.trim()
  if (!text.includes(':')) return ctx.reply('❌ الصيغة غلط (ip:port)')
  const [h, p] = text.split(':')
  servers[uid] = servers[uid] || []
  servers[uid].push({ host: h.trim(), port: p.trim() })
  saveDB()
  delete waitIP[uid]
  ctx.reply('✅ تم الحفظ!', mainMenu())
})

bot.action('LIST', ctx => {
  const list = servers[ctx.from.id]
  if (!list || list.length === 0) return ctx.reply('📭 القائمة فارغة', mainMenu())
  const btns = list.map((s, i) => [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)])
  btns.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  ctx.reply('📂 سيرفراتك:', Markup.inlineKeyboard(btns))
})

bot.action(/^SRV_(\d+)$/, ctx => {
  const id = ctx.match[1]; const s = servers[ctx.from.id][id]; const active = clients[ctx.from.id]
  ctx.reply(`🖥 ${s.host}:${s.port}\nالحالة: ${active ? '🟢 متصل' : '🔴 مطفأ'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(active ? '⏹ إيقاف البوت' : '▶️ تشغيل البوت', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف السيرفر', `DELETE_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ]))
})

bot.action(/^DELETE_(\d+)$/, ctx => {
  const uid = ctx.from.id; const id = parseInt(ctx.match[1])
  if (servers[uid]) {
    servers[uid].splice(id, 1); saveDB()
    ctx.answerCbQuery('✅ تم الحذف'); ctx.reply('🗑 تم الحذف.', mainMenu())
  }
})

bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  const uid = ctx.from.id; const s = servers[uid][ctx.match[1]]
  if (clients[uid]) { 
    clients[uid].close(); delete clients[uid]
    return ctx.reply('⏹ تم سحب البوت.') 
  }

  ctx.reply('⏳ جاري فحص الإصدار والدخول (1.8 - 1.21.132)...')
  
  try {
    // محاولة الاتصال مع ميزة التوافقية العالية
    const client = bedrock.createClient({
      host: s.host,
      port: parseInt(s.port),
      username: 'Max_Bot',
      offline: true,
      // هذه الإعدادات تجعله يحاول التكيف مع الإصدار تلقائياً
      connectTimeout: 10000,
      version: undefined // سيحاول اكتشافها من ping السيرفر
    })

    clients[uid] = client

    client.on('spawn', () => {
      ctx.reply('✅ تم الاقتحام بنجاح!')
      client.chat("Max Black Bot: System Ready 🛡️")
      
      // Anti-AFK للحفاظ على الاتصال
      const afk = setInterval(() => {
        if (clients[uid]) client.chat("/list")
        else clearInterval(afk)
      }, 25000)
    })

    client.on('error', (err) => {
      console.log(err)
      delete clients[uid]
      ctx.reply('❌ فشل الاتصال (تأكد من الـ IP أو أن السيرفر يعمل)')
    })

    client.on('close', () => { delete clients[uid] })

  } catch (e) {
    ctx.reply('❌ خطأ في النظام.')
  }
})

bot.action('BACK', ctx => ctx.editMessageText('🎮 اللوحة:', mainMenu()))

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT RUNNING ON ALL VERSIONS')
