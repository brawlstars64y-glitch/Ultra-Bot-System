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

const clients = {}; const waitIP = {};

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

async function updateUI(ctx, host, port, active, id) {
  const text = `🖥 السيرفر: ${host}:${port}\nالحالة: ${active ? '🟢 شغال' : '🔴 مطفأ'}`
  const kb = Markup.inlineKeyboard([
    [Markup.button.callback(active ? '⏹ اطفاء البوت' : '▶️ تشغيل البوت', `TOGGLE_${id}`)],
    [Markup.button.callback('🗑 حذف السيرفر', `DELETE_${id}`)],
    [Markup.button.callback('⬅️ رجوع', 'LIST')]
  ])
  try { await ctx.editMessageText(text, kb) } catch (e) {}
}

bot.on('text', async (ctx) => {
  const uid = ctx.from.id
  if (waitIP[uid]) {
    const text = ctx.message.text.trim()
    if (!text.includes(':')) return ctx.reply('❌ ارسل ip:port')
    const [h, p] = text.split(':')
    servers[uid] = servers[uid] || []
    servers[uid].push({ host: h.trim(), port: p.trim() })
    saveDB(); delete waitIP[uid]
    return ctx.reply('✅ تم حفظ السيرفر بنجاح!', mainMenu())
  }
  if (ctx.message.text === '/start') {
     if (!(await checkSub(ctx))) {
        const btns = CHANNELS.map(ch => [Markup.button.url(ch.name, ch.url)])
        btns.push([Markup.button.callback('✅ تم الاشتراك', 'CHECK_SUB')])
        return ctx.reply('⚠️ اشترك أولاً:', Markup.inlineKeyboard(btns))
     }
     ctx.reply('🎮 أهلاً بك يا بطل:', mainMenu())
  }
})

bot.action('ADD', ctx => { waitIP[ctx.from.id] = true; ctx.answerCbQuery(); ctx.reply('📡 أرسل ip:port') })

bot.action('LIST', ctx => {
  const list = servers[ctx.from.id] || []
  if (list.length === 0) return ctx.answerCbQuery('📭 القائمة فارغة', { show_alert: true })
  const btns = list.map((s, i) => [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)])
  btns.push([Markup.button.callback('⬅️ رجوع', 'BACK')])
  ctx.editMessageText('📂 اختر سيرفرك:', Markup.inlineKeyboard(btns))
})

bot.action(/^SRV_(\d+)$/, ctx => {
  const id = ctx.match[1]; const s = servers[ctx.from.id][id]
  updateUI(ctx, s.host, s.port, !!clients[ctx.from.id], id)
})

bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  const id = ctx.match[1]; const uid = ctx.from.id; const s = servers[uid][id]
  
  if (clients[uid]) {
    clients[uid].close(); delete clients[uid]
    return updateUI(ctx, s.host, s.port, false, id)
  }

  ctx.answerCbQuery('⏳ جاري الدخول...')
  try {
    const client = bedrock.createClient({
      host: s.host, port: parseInt(s.port), username: 'Max_Black', 
      offline: true, version: undefined 
    })
    clients[uid] = client

    client.on('spawn', () => {
      updateUI(ctx, s.host, s.port, true, id)
      ctx.reply(`✅ أبشرك! البوت دخل السيرفر الآن وهو شغال.`)

      // --- نظام منع الطرد بالحركة فقط (Anti-AFK) ---
      let moveLeft = true
      const afkInterval = setInterval(() => {
        if (clients[uid]) {
          // حركة بسيطة يميناً ويساراً مع قفز لتجنب الطرد
          client.setControlState('jump', true)
          client.setControlState(moveLeft ? 'left' : 'right', true)
          
          setTimeout(() => { 
            if(clients[uid]) {
                client.setControlState('jump', false)
                client.setControlState('left', false)
                client.setControlState('right', false)
            }
          }, 1000)
          
          moveLeft = !moveLeft
        } else {
          clearInterval(afkInterval)
        }
      }, 20000) // كل 20 ثانية لتأكيد النشاط
    })

    client.on('error', () => { delete clients[uid]; updateUI(ctx, s.host, s.port, false, id) })
    client.on('close', () => { delete clients[uid]; updateUI(ctx, s.host, s.port, false, id) })
  } catch (e) { ctx.reply('❌ فشل النظام.') }
})

bot.action('BACK', ctx => ctx.editMessageText('🎮 لوحة التحكم:', mainMenu()))
bot.action('CHECK_SUB', async ctx => {
  if (await checkSub(ctx)) ctx.editMessageText('✅ تم التفعيل!', mainMenu())
  else ctx.answerCbQuery('❌ اشترك أولاً!', { show_alert: true })
})
bot.action(/^DELETE_(\d+)$/, ctx => {
  const uid = ctx.from.id; const id = parseInt(ctx.match[1])
  if (servers[uid]) { servers[uid].splice(id, 1); saveDB(); ctx.reply('🗑 تم الحذف.', mainMenu()) }
})

bot.launch()
console.log('✅ BOT RUNNING WITH SILENT ANTI-AFK')
                   
