const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')
const fs = require('fs') // لإضافة ميزة الحفظ الدائم

const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

// --- حفظ البيانات لكي لا تضيع عند توقف البوت ---
let servers = {}
if (fs.existsSync('servers.json')) {
    servers = JSON.parse(fs.readFileSync('servers.json'))
}

function saveDB() {
    fs.writeFileSync('servers.json', JSON.stringify(servers, null, 2))
}

const CHANNELS = ['@aternosbot24', '@N_NHGER', '@sjxhhdbx72', '@vsyfyk']
const clients = {}   
const waitIP = {}    

// --- Keep Alive المطور ---
const server = http.createServer((req, res) => {
  res.write('MAX BLACK BOT IS ALIVE')
  res.end()
})
server.listen(process.env.PORT || 8080)

// --- فحص الاشتراك ---
async function checkSubscription(ctx) {
  for (const channel of CHANNELS) {
    try {
      const member = await ctx.telegram.getChatMember(channel, ctx.from.id)
      if (['left', 'kicked', 'null'].includes(member.status)) return false
    } catch { continue }
  }
  return true
}

const mainMenu = () => Markup.inlineKeyboard([
  [Markup.button.callback('➕ إضافة سيرفر جديد', 'ADD')],
  [Markup.button.callback('📂 قائمة سيرفراتي', 'LIST')]
])

bot.start(async (ctx) => {
  if (!(await checkSubscription(ctx))) {
    return ctx.reply(`⚠️ اشترك أولاً:\n${CHANNELS.join('\n')}`, Markup.inlineKeyboard([
      [Markup.button.callback('✅ تم الاشتراك', 'CHECK_SUB')]
    ]))
  }
  ctx.reply('🎮 أهلاً بك يا بطل، اختر خياراً:', mainMenu())
})

bot.action('CHECK_SUB', async (ctx) => {
  if (await checkSubscription(ctx)) {
    await ctx.answerCbQuery('✅ تم التفعيل')
    ctx.editMessageText('🎮 تم التحقق بنجاح:', mainMenu())
  } else {
    await ctx.answerCbQuery('❌ اشترك أولاً!', { show_alert: true })
  }
})

bot.action('ADD', (ctx) => {
  waitIP[ctx.from.id] = true
  ctx.reply('📡 أرسل ip:port')
})

bot.on('text', async (ctx) => {
  const uid = ctx.from.id
  if (!waitIP[uid]) return
  const text = ctx.message.text.trim()
  if (!text.includes(':')) return ctx.reply('❌ الصيغة غلط')
  const [h, p] = text.split(':')
  servers[uid] = servers[uid] || []
  servers[uid].push({ host: h.trim(), port: p.trim() })
  saveDB() // حفظ في الملف
  delete waitIP[uid]
  ctx.reply('✅ تم الحفظ!', mainMenu())
})

bot.action('LIST', (ctx) => {
  const list = servers[ctx.from.id]
  if (!list || list.length === 0) return ctx.reply('📭 فارغة', mainMenu())
  const btns = list.map((s, i) => [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)])
  btns.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  ctx.reply('📂 سيرفراتك:', Markup.inlineKeyboard(btns))
})

bot.action(/^SRV_(\d+)$/, (ctx) => {
  const id = ctx.match[1]; const s = servers[ctx.from.id][id]; const active = clients[ctx.from.id]
  ctx.reply(`🖥 ${s.host}:${s.port}\nالحالة: ${active ? '🟢 متصل' : '🔴 مطفأ'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(active ? '⏹ إيقاف' : '▶️ تشغيل', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف', `DELETE_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ]))
})

bot.action(/^DELETE_(\d+)$/, (ctx) => {
  const uid = ctx.from.id; const id = parseInt(ctx.match[1])
  if (servers[uid]) {
    servers[uid].splice(id, 1)
    saveDB() // حفظ بعد الحذف
    ctx.answerCbQuery('✅ تم الحذف')
    ctx.reply('🗑 تم الحذف.', mainMenu())
  }
})

bot.action(/^TOGGLE_(\d+)$/, async (ctx) => {
  const uid = ctx.from.id; const s = servers[uid][ctx.match[1]]
  if (clients[uid]) { 
      clients[uid].close(); 
      delete clients[uid]; 
      return ctx.reply('⏹ تم السحب.') 
  }

  ctx.reply('⏳ جاري الدخول...')
  try {
    const client = bedrock.createClient({ host: s.host, port: parseInt(s.port), username: 'Max_Bot', offline: true })
    clients[uid] = client
    client.on('spawn', () => {
        ctx.reply('✅ دخل البوت السيرفر!')
        // إرسال رسالة شات لضمان عدم الطرد
        client.chat("Max Bot System Active 🛡️")
    })
    client.on('error', () => { delete clients[uid]; ctx.reply('❌ فشل الاتصال.') })
    client.on('close', () => { delete clients[uid] })
  } catch { ctx.reply('❌ خطأ فني.') }
})

bot.action('BACK', ctx => ctx.editMessageText('🎮 اللوحة:', mainMenu()))

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT IS LIVE')
