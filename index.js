const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

// منفذ Railway الإجباري
const PORT = process.env.PORT || 8080
http.createServer((req, res) => res.end('BOT ACTIVE')).listen(PORT)

const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')
const CHANNELS = ['@aternosbot24', '@N_NHGER', '@sjxhhdbx72', '@vsyfyk']

const servers = {}; const clients = {}; const waitIP = {}

async function checkSub(ctx) {
  for (const ch of CHANNELS) {
    try {
      const m = await ctx.telegram.getChatMember(ch, ctx.from.id)
      if (['left', 'kicked'].includes(m.status)) return false
    } catch { continue }
  }
  return true
}

const menu = () => Markup.inlineKeyboard([
  [Markup.button.callback('➕ إضافة سيرفر جديد', 'ADD')],
  [Markup.button.callback('📂 قائمة سيرفراتي', 'LIST')]
])

bot.start(async ctx => {
  if (!(await checkSub(ctx))) return ctx.reply('⚠️ اشترك بالقنوات أولاً:\n' + CHANNELS.join('\n'), Markup.inlineKeyboard([[Markup.button.callback('✅ تم الاشتراك', 'CHECK')]]))
  ctx.reply('🎮 أهلاً بك في لوحة التحكم، اختر خياراً:', menu())
})

bot.action('CHECK', async ctx => {
  if (await checkSub(ctx)) ctx.editMessageText('✅ تم التفعيل بنجاح!', menu())
  else ctx.answerCbQuery('❌ اشترك أولاً!', { show_alert: true })
})

bot.action('ADD', ctx => { waitIP[ctx.from.id] = true; ctx.reply('📡 أرسل عنوان السيرفر (ip:port)') })

bot.on('text', ctx => {
  const uid = ctx.from.id
  if (!waitIP[uid]) return
  if (!ctx.message.text.includes(':')) return ctx.reply('❌ الصيغة خاطئة (ip:port)')
  const [h, p] = ctx.message.text.split(':')
  servers[uid] = servers[uid] || []
  servers[uid].push({ host: h.trim(), port: p.trim() })
  delete waitIP[uid]
  ctx.reply('✅ تم حفظ السيرفر بنجاح!', menu())
})

bot.action('LIST', ctx => {
  const list = servers[ctx.from.id]
  if (!list || list.length === 0) return ctx.reply('📭 قائمة سيرفراتك فارغة.', menu())
  const btns = list.map((s, i) => [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)])
  btns.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  ctx.reply('📂 اختر السيرفر:', Markup.inlineKeyboard(btns))
})

bot.action(/^SRV_(\d+)$/, ctx => {
  const id = ctx.match[1]; const s = servers[ctx.from.id][id]; const active = clients[ctx.from.id]
  ctx.reply(`🖥 السيرفر: ${s.host}:${s.port}\nالحالة: ${active ? '🟢 متصل' : '🔴 متوقف'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(active ? '⏹ إيقاف البوت' : '▶️ تشغيل البوت', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف السيرفر', `DEL_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ]))
})

bot.action(/^DEL_(\d+)$/, ctx => {
  const uid = ctx.from.id; servers[uid].splice(parseInt(ctx.match[1]), 1)
  ctx.answerCbQuery('✅ تم الحذف'); ctx.reply('🗑 تم الحذف بنجاح.', menu())
})

bot.action(/^TOGGLE_(\d+)$/, ctx => {
  const uid = ctx.from.id; const s = servers[uid][ctx.match[1]]
  if (clients[uid]) { clients[uid].close(); delete clients[uid]; return ctx.reply('⏹ تم سحب البوت.') }

  ctx.reply('⏳ جاري محاولة الدخول (1.20 - 1.21)...')
  try {
    const c = bedrock.createClient({ host: s.host, port: parseInt(s.port), username: 'Max_Bot', offline: true })
    clients[uid] = c
    c.on('spawn', () => ctx.reply('✅ دخل البوت السيرفر!'))
    c.on('error', (err) => { console.log(err); delete clients[uid]; ctx.reply('❌ فشل الاتصال.') })
  } catch { ctx.reply('❌ خطأ فني.') }
})

bot.action('BACK', ctx => ctx.editMessageText('🎮 لوحة التحكم:', menu()))

bot.launch().then(() => console.log('✅ BOT DEPLOYED'))

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)
