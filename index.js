const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')
const fs = require('fs')

const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

// --- إدارة البيانات ---
let servers = {}
if (fs.existsSync('servers.json')) {
    try { servers = JSON.parse(fs.readFileSync('servers.json')) } catch (e) { servers = {} }
}
const saveDB = () => fs.writeFileSync('servers.json', JSON.stringify(servers, null, 2))

const CHANNELS = [
  { name: 'القناة 1', user: '@aternosbot24', url: 'https://t.me/aternosbot24' },
  { name: 'القناة 2', user: '@N_NHGER', url: 'https://t.me/N_NHGER' },
  { name: 'القناة 3', user: '@sjxhhdbx72', url: 'https://t.me/sjxhhdbx72' },
  { name: 'القناة 4', user: '@vsyfyk', url: 'https://t.me/vsyfyk' }
]

const clients = {}; const waitIP = {}

http.createServer((req, res) => res.end('MAX BLACK SYSTEM ACTIVE')).listen(process.env.PORT || 8080)

async function checkSub(ctx) {
  for (const ch of CHANNELS) {
    try {
      const m = await ctx.telegram.getChatMember(ch.user, ctx.from.id)
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
    const btns = CHANNELS.map(ch => [Markup.button.url(ch.name, ch.url)])
    btns.push([Markup.button.callback('✅ تم الاشتراك في الكل', 'CHECK_SUB')])
    return ctx.reply('⚠️ اشترك أولاً لفتح اللوحة:', Markup.inlineKeyboard(btns))
  }
  ctx.reply('🎮 أهلاً بك يا بطل، اختر خياراً:', mainMenu())
})

bot.action('CHECK_SUB', async ctx => {
  if (await checkSub(ctx)) ctx.editMessageText('✅ تم التفعيل!', mainMenu())
  else ctx.answerCbQuery('❌ اشترك في الكل أولاً!', { show_alert: true })
})

bot.action('ADD', ctx => {
  waitIP[ctx.from.id] = true
  ctx.reply('📡 أرسل عنوان السيرفر (ip:port)')
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
  ctx.reply('✅ تم حفظ السيرفر!', mainMenu())
})

bot.action('LIST', ctx => {
  const list = servers[ctx.from.id]
  if (!list || list.length === 0) return ctx.reply('📭 القائمة فارغة.', mainMenu())
  const btns = list.map((s, i) => [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)])
  btns.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  ctx.reply('📂 اختر السيرفر:', Markup.inlineKeyboard(btns))
})

// --- عرض السيرفر مع الحالة الجديدة ---
bot.action(/^SRV_(\d+)$/, ctx => {
  const id = ctx.match[1]; 
  const s = servers[ctx.from.id][id]; 
  const active = clients[ctx.from.id]; 

  ctx.editMessageText(`🖥 السيرفر: ${s.host}:${s.port}\nالحالة: ${active ? '🟢 شغال' : '🔴 مطفأ'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(active ? '⏹ اطفاء البوت' : '▶️ تشغيل البوت', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف السيرفر', `DELETE_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ]))
})

bot.action(/^DELETE_(\d+)$/, ctx => {
  const uid = ctx.from.id; const id = parseInt(ctx.match[1])
  if (servers[uid]) {
    servers[uid].splice(id, 1); saveDB()
    ctx.answerCbQuery('✅ تم الحذف')
    ctx.reply('🗑 تم الحذف.', mainMenu())
  }
})

// --- تشغيل البوت وتحديث الرسالة في التليجرام ---
bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  const uid = ctx.from.id; const s = servers[uid][ctx.match[1]]
  
  if (clients[uid]) { 
    clients[uid].close(); 
    delete clients[uid]
    return ctx.editMessageText(`🖥 السيرفر: ${s.host}:${s.port}\nالحالة: 🔴 مطفأ`,
      Markup.inlineKeyboard([
        [Markup.button.callback('▶️ تشغيل البوت', `TOGGLE_${ctx.match[1]}`)],
        [Markup.button.callback('🗑 حذف السيرفر', `DELETE_${ctx.match[1]}`)],
        [Markup.button.callback('⬅️ رجوع', 'LIST')]
      ]))
  }

  // إرسال تنبيه في التليجرام جاري الدخول
  ctx.answerCbQuery('⏳ جاري محاولة الدخول...')
  
  try {
    const client = bedrock.createClient({
      host: s.host,
      port: parseInt(s.port),
      username: 'Max_Black',
      offline: true,
      version: undefined
    })

    clients[uid] = client

    client.on('spawn', () => {
      // 1. إرسال رسالة شات في اللعبة
      client.chat("Max Black System: Online 🛡️")
      
      // 2. تحديث الرسالة في التليجرام لتصبح "شغال" مع زر "اطفاء"
      ctx.editMessageText(`🖥 السيرفر: ${s.host}:${s.port}\nالحالة: 🟢 شغال`,
        Markup.inlineKeyboard([
          [Markup.button.callback('⏹ اطفاء البوت', `TOGGLE_${ctx.match[1]}`)],
          [Markup.button.callback('🗑 حذف السيرفر', `DELETE_${ctx.match[1]}`)],
          [Markup.button.callback('⬅️ رجوع', 'LIST')]
        ]))
        
      // إرسال رسالة تأكيد مستقلة (اختياري)
      ctx.reply(`✅ البوت الآن شغال داخل السيرفر!`)

      const afk = setInterval(() => {
        if (clients[uid]) client.chat("/list")
        else clearInterval(afk)
      }, 25000)
    })

    client.on('error', (err) => {
      delete clients[uid]
      ctx.reply('❌ فشل الاتصال بالسيرفر.')
    })

    client.on('close', () => { 
        delete clients[uid]
        // إذا أغلق السيرفر فجأة نحدث الحالة لمطفا
        ctx.editMessageText(`🖥 السيرفر: ${s.host}:${s.port}\nالحالة: 🔴 مطفأ`,
        Markup.inlineKeyboard([
          [Markup.button.callback('▶️ تشغيل البوت', `TOGGLE_${ctx.match[1]}`)],
          [Markup.button.callback('🗑 حذف السيرفر', `DELETE_${ctx.match[1]}`)],
          [Markup.button.callback('⬅️ رجوع', 'LIST')]
        ])).catch(() => {})
    })

  } catch (e) {
    ctx.reply('❌ خطأ في النظام.')
  }
})

bot.action('BACK', ctx => ctx.editMessageText('🎮 لوحة التحكم:', mainMenu()))

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT INTERFACE UPDATED')
