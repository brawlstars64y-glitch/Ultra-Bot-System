const { Telegraf, Markup } = require('telegraf')
const bedrock = require('bedrock-protocol')
const http = require('http')

/* ===== KEEP ALIVE ===== */
http.createServer((req, res) => {
  res.writeHead(200)
  res.end('BOT ALIVE')
}).listen(process.env.PORT || 3000)

/* ===== BOT ===== */
const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ')

/* ===== STORAGE ===== */
const servers = {}   // uid => [{host, port}]
const clients = {}   // uid => bedrock client
const waitIP = new Set()

/* ===== HELPERS ===== */
async function safeReply(ctx, text, keyboard) {
  try { return await ctx.reply(text, keyboard) } catch {}
}
async function safeEdit(ctx, text, keyboard) {
  try { return await ctx.editMessageText(text, keyboard) }
  catch { return safeReply(ctx, text, keyboard) }
}

const mainMenu = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'ADD')],
    [Markup.button.callback('📂 سيرفراتي', 'LIST')]
  ])

/* ===== START ===== */
bot.start(ctx => safeReply(ctx, '🎮 لوحة التحكم', mainMenu()))

/* ===== ADD ===== */
bot.action('ADD', async ctx => {
  waitIP.add(ctx.from.id)
  safeReply(ctx, '📡 أرسل السيرفر بصيغة:\nip:port')
})

/* ===== RECEIVE IP ===== */
bot.on('text', async ctx => {
  const uid = ctx.from.id
  if (!waitIP.has(uid)) return

  const t = ctx.message.text.trim()
  if (!t.includes(':'))
    return safeReply(ctx, '❌ الصيغة الصحيحة: ip:port')

  const [host, port] = t.split(':')
  servers[uid] ??= []
  servers[uid].push({ host, port: port.trim() })

  waitIP.delete(uid)
  safeReply(ctx, '✅ تم حفظ السيرفر', mainMenu())
})

/* ===== LIST ===== */
bot.action('LIST', async ctx => {
  const list = servers[ctx.from.id]
  if (!list || list.length === 0)
    return safeReply(ctx, '📭 لا توجد سيرفرات', mainMenu())

  const kb = list.map((s, i) => [
    Markup.button.callback(`${s.host}:${s.port}`, `SRV_${i}`)
  ])
  kb.push([Markup.button.callback('⬅️ رجوع', 'BACK')])

  safeReply(ctx, '📂 اختر سيرفر', Markup.inlineKeyboard(kb))
})

/* ===== SERVER MENU ===== */
bot.action(/^SRV_(\d+)$/, async ctx => {
  const uid = ctx.from.id
  const id = parseInt(ctx.match[1])
  const s = servers[uid][id]
  const on = !!clients[uid]

  safeReply(
    ctx,
    `🖥 ${s.host}:${s.port}\nالحالة: ${on ? '🟢 يعمل' : '🔴 متوقف'}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(on ? '⏹ إيقاف' : '▶️ تشغيل', `TOGGLE_${id}`)],
      [Markup.button.callback('🗑 حذف السيرفر', `DEL_${id}`)],
      [Markup.button.callback('⬅️ رجوع', 'LIST')]
    ])
  )
})

/* ===== DELETE SERVER ===== */
bot.action(/^DEL_(\d+)$/, async ctx => {
  const uid = ctx.from.id
  const id = parseInt(ctx.match[1])

  if (clients[uid]) {
    clients[uid].close()
    delete clients[uid]
  }

  servers[uid].splice(id, 1)
  safeReply(ctx, '🗑 تم حذف السيرفر', mainMenu())
})

/* ===== TOGGLE BOT PLAYER ===== */
bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  const uid = ctx.from.id
  const s = servers[uid][parseInt(ctx.match[1])]

  // إيقاف
  if (clients[uid]) {
    clients[uid].close()
    delete clients[uid]
    return safeReply(ctx, '⏹ تم إيقاف البوت', mainMenu())
  }

  safeReply(ctx, '⏳ جاري الدخول إلى السيرفر...')

  try {
    const c = bedrock.createClient({
      host: s.host,
      port: parseInt(s.port),
      username: `Bot_${uid}_${Date.now()}`, // اسم فريد
      offline: true,
      version: false,          // يدعم 1.20 → 1.21.132
      skipPing: false,
      connectTimeout: 60000
    })

    clients[uid] = c

    // منع الطرد
    c.on('packet', (packet, meta) => {
      if (meta.name === 'resource_packs_info') {
        c.queue('resource_pack_client_response', {
          response_status: 'completed',
          resource_pack_ids: []
        })
      }
      if (meta.name === 'network_stack_latency') {
        c.queue('network_stack_latency', {
          server_time: packet.server_time,
          needs_response: false
        })
      }
    })

    // عند الدخول
    c.on('spawn', () => {
      safeReply(ctx, '✅ دخل البوت السيرفر')

      // Anti-AFK
      const afk = setInterval(() => {
        if (!clients[uid]) return clearInterval(afk)
        c.queue('player_auth_input', {
          pitch: 0,
          yaw: Math.random() * 360,
          position: { x: 0, y: 0, z: 0 },
          move_vector: { x: 0, z: 0 },
          head_yaw: Math.random() * 360,
          input_data: { jump_down: true },
          input_mode: 'touch',
          play_mode: 'normal'
        })
      }, 10000)
    })

    c.on('disconnect', () => {
      delete clients[uid]
      safeR
        
