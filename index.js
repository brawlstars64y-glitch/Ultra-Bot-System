const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

// Keeping the bot alive
http.createServer((req, res) => res.end('OK')).listen(7860)

const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

const CHANNELS = [
  '@aternosbot24',
  '@N_NHGER',
  '@sjxhhdbx72',
  '@vsyfyk'
]

const servers = {}   
const clients = {}   
const waitIP = {}    

async function checkSubscription(ctx) {
  for (const channel of CHANNELS) {
    try {
      const member = await ctx.telegram.getChatMember(channel, ctx.from.id)
      if (['left', 'kicked', 'null'].includes(member.status)) return false
    } catch (e) { continue }
  }
  return true
}

function mainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'ADD')],
    [Markup.button.callback('📂 سيرفراتي', 'LIST')]
  ])
}

bot.start(async ctx => {
  if (!(await checkSubscription(ctx))) {
    return ctx.reply('⚠️ يرجى الاشتراك في القنوات أولاً:\n' + CHANNELS.join('\n'), Markup.inlineKeyboard([
      [Markup.button.callback('✅ تم الاشتراك', 'CHECK_SUB')]
    ]))
  }
  ctx.reply('🎮 لوحة تحكم بسيطة\nاختر خيار:', mainMenu())
})

bot.action('CHECK_SUB', async ctx => {
  if (await checkSubscription(ctx)) {
    ctx.reply('✅ تم التفعيل', mainMenu())
  } else {
    ctx.answerCbQuery('❌ اشترك أولاً', { show_alert: true })
  }
})

bot.action('ADD', ctx => {
  ctx.answerCbQuery(); waitIP[ctx.from.id] = true
  ctx.reply('📡 أرسل السيرفر هكذا:\nip:port')
})

bot.on('text', ctx => {
  const uid = ctx.from.id
  if (!waitIP[uid]) return
  const text = ctx.message.text.trim()
  if (!text.includes(':')) return ctx.reply('❌ خطأ')
  const [host, port] = text.split(':')
  servers[uid] = servers[uid] || []
  servers[uid].push({ host: host.trim(), port: port.trim() })
  delete waitIP[uid]
  ctx.reply('✅ تم حفظ السيرفر', mainMenu())
})

bot.action('LIST', ctx => {
  ctx.answerCbQuery()
  const list = servers[ctx.from.id]
  if (!list || list.length === 0) return ctx.reply('📭 لا يوجد سيرفرات', mainMenu())
  const buttons = list.map((s, i) => [Markup.button.callback(`${s.host}:${s.port}`, `SRV_${i}`)])
  buttons.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  ctx.reply('📂 اختر سيرفر:', Markup.inlineKeyboard(buttons))
})

bot.action(/^SRV_(\d+)$/, ctx => {
  ctx.answerCbQuery()
  const id = ctx.match[1]; const s = servers[ctx.from.id][id]; const active = clients[ctx.from.id]
  ctx.reply(`🖥 ${s.host}:${s.port}\nالحالة: ${active ? '🟢 يعمل' : '🔴 متوقف'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(active ? '⏹ إيقاف' : '▶️ تشغيل', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف السيرفر', `DEL_${id}`)], // إضافة الزر هنا
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ]))
})

// --- وظيفة الحذف المضافة فقط ---
bot.action(/^DEL_(\d+)$/, ctx => {
  const uid = ctx.from.id; const id = parseInt(ctx.match[1])
  if (servers[uid] && servers[uid][id]) {
    servers[uid].splice(id, 1)
    ctx.answerCbQuery('✅ تم الحذف')
    ctx.reply('🗑 تم حذف السيرفر بنجاح', mainMenu())
  }
})

bot.action(/^TOGGLE_(\d+)$/, ctx => {
  ctx.answerCbQuery()
  const uid = ctx.from.id; const s = servers[uid][ctx.match[1]]
  if (clients[uid]) { clients[uid].close(); delete clients[uid]; return ctx.reply('⏹ تم إيقاف البوت') }
  ctx.reply('⏳ جاري الدخول...')
  try {
    const client = bedrock.createClient({ host: s.host, port: parseInt(s.port), username: 'BotPlayer', offline: true })
    clients[uid] = client
    client.on('spawn', () => ctx.reply('✅ دخل البوت'))
    client.on('error', () => { delete clients[uid]; ctx.reply('❌ خرج البوت') })
  } catch { ctx.reply('❌ فشل') }
})

bot.action('BACK', ctx => { ctx.answerCbQuery(); ctx.reply('⬅️ رجوع', mainMenu()) })

bot.launch()
console.log('✅ READY')
