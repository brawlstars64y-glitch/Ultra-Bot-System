const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

// توكن البوت
const bot = new Telegraf(process.env.BOT_TOKEN)

const CHANNELS = ['@aternosbot24', '@N_NHGER', '@sjxhhdbx72', '@vsyfyk']
const servers = {}   
const clients = {}   
const waiting = {}   

// Keep Alive لمنع توقف الاستضافة
http.createServer((req, res) => res.end('MAX BLACK IS ALIVE')).listen(process.env.PORT || 8080)

async function checkSub(ctx) {
  for (const ch of CHANNELS) {
    try {
      const m = await ctx.telegram.getChatMember(ch, ctx.from.id)
      if (['left', 'kicked'].includes(m.status)) return false
    } catch { return false }
  }
  return true
}

const mainMenu = () => Markup.inlineKeyboard([
  [Markup.button.callback('➕ إضافة سيرفر', 'ADD')],
  [Markup.button.callback('📂 سيرفراتي', 'LIST')]
])

async function safeEdit(ctx, text, keyboard) {
  try { await ctx.editMessageText(text, keyboard) } 
  catch { await ctx.reply(text, keyboard) }
}

bot.start(async ctx => {
  if (!(await checkSub(ctx))) {
    return ctx.reply('🚫 اشترك بالقنوات أولاً لفتح اللوحة:\n' + CHANNELS.join('\n'))
  }
  ctx.reply('🎮 أهلاً بك يا بطل في لوحة التحكم', mainMenu())
})

bot.action('ADD', async ctx => {
  waiting[ctx.from.id] = true
  await safeEdit(ctx, '📡 أرسل عنوان السيرفر بهذا الشكل:\n`ip:port`', { parse_mode: 'Markdown' })
})

bot.on('text', async ctx => {
  const uid = ctx.from.id
  if (!waiting[uid]) return
  const text = ctx.message.text.trim()
  if (!text.includes(':')) return ctx.reply('❌ الصيغة خاطئة، مثال: `play.example.com:19132`', { parse_mode: 'Markdown' })
  
  const [host, port] = text.split(':')
  servers[uid] ??= []
  servers[uid].push({ host: host.trim(), port: port.trim() })
  delete waiting[uid]
  ctx.reply('✅ تم حفظ السيرفر بنجاح!', mainMenu())
})

bot.action('LIST', async ctx => {
  const list = servers[ctx.from.id]
  if (!list || list.length === 0) return safeEdit(ctx, '📭 ليس لديك سيرفرات مضافة.', mainMenu())
  const kb = list.map((s, i) => [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)])
  kb.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  await safeEdit(ctx, '📂 اختر السيرفر المطلوب:', Markup.inlineKeyboard(kb))
})

bot.action(/^SRV_(\d+)$/, async ctx => {
  const uid = ctx.from.id
  const id = Number(ctx.match[1])
  const s = servers[uid][id]
  const online = !!clients[uid]
  await safeEdit(ctx, `🖥 السيرفر: ${s.host}:${s.port}\nالحالة: ${online ? '🟢 شغال' : '🔴 مطفأ'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(online ? '⏹ اطفاء البوت' : '▶️ تشغيل البوت', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف السيرفر', `DEL_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ])
  )
})

bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  const uid = ctx.from.id
  const s = servers[uid][ctx.match[1]]

  if (clients[uid]) {
    clients[uid].disconnect()
    delete clients[uid]
    return safeEdit(ctx, '🔴 تم إيقاف البوت وفصل الاتصال.', mainMenu())
  }

  await safeEdit(ctx, '⏳ جاري محاولة الدخول...')

  try {
    const client = bedrock.createClient({
      host: s.host,
      port: Number(s.port),
      username: 'Max_Black_Bot',
      offline: true,
      version: undefined // اكتشاف تلقائي للإصدار
    })

    clients[uid] = client

    client.on('spawn', () => {
      safeEdit(ctx, '✅ أبشر! دخل السيرفر وهو شغال الآن.', mainMenu())
      
      // نظام Anti-AFK (حركة صامتة كل 20 ثانية)
      const moveInterval = setInterval(() => {
        if (clients[uid]) {
          client.setControlState('jump', true)
          setTimeout(() => { if(clients[uid]) client.setControlState('jump', false) }, 1000)
        } else { clearInterval(moveInterval) }
      }, 20000)
    })

    client.on('error', err => {
      console.error(err)
      delete clients[uid]
      ctx.reply('❌ حدث خطأ أو خرج البوت من السيرفر.')
    })

    client.on('close', () => {
      delete clients[uid]
    })

  } catch (e) {
    await safeEdit(ctx, '❌ فشل الاتصال بالسيرفر.', mainMenu())
  }
})

bot.action('BACK', ctx => safeEdit(ctx, '🎮 لوحة التحكم:', mainMenu()))

bot.launch({ dropPendingUpdates: true })
console.log('✅ BOT RUNNING')
