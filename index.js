const { Telegraf } = require('telegraf')
const bedrock = require('bedrock-protocol')

// 🔑 توكن البوت
const BOT_TOKEN = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU'

const bot = new Telegraf(BOT_TOKEN)

let mcClient = null
let afkInterval = null

bot.start(ctx => {
  ctx.reply(
    '🤖 *بوت بلاير Bedrock*\n\n' +
    'الأوامر:\n' +
    '/connect IP PORT NAME\n' +
    '/disconnect',
    { parse_mode: 'Markdown' }
  )
})

bot.command('connect', ctx => {
  if (mcClient) {
    return ctx.reply('⚠️ البوت داخل السيرفر بالفعل')
  }

  const args = ctx.message.text.split(' ')
  if (args.length < 4) {
    return ctx.reply('❌ الاستخدام:\n/connect IP PORT NAME')
  }

  const host = args[1]
  const port = parseInt(args[2])
  const username = args.slice(3).join(' ')

  ctx.reply('⏳ جاري الدخول للسيرفر...')

  mcClient = bedrock.createClient({
    host,
    port,
    username,
    offline: true
  })

  mcClient.on('spawn', () => {
    ctx.reply('✅ البوت دخل السيرفر بنجاح')

    // Anti-AFK بسيط (ما يسبب طرد)
    afkInterval = setInterval(() => {
      if (!mcClient) return
      mcClient.queue('command_request', {
        command: 'tp @s ~ ~ ~',
        origin: { type: 0 },
        internal: false
      })
    }, 30000)
  })

  mcClient.on('disconnect', reason => {
    ctx.reply('❌ تم فصل البوت من السيرفر')
    cleanup()
  })

  mcClient.on('error', err => {
    ctx.reply('⚠️ خطأ: ' + err.message)
    cleanup()
  })
})

bot.command('disconnect', ctx => {
  if (!mcClient) {
    return ctx.reply('⚠️ لا يوجد بوت متصل')
  }

  mcClient.close()
  cleanup()
  ctx.reply('🛑 تم إخراج البوت')
})

function cleanup () {
  if (afkInterval) clearInterval(afkInterval)
  afkInterval = null
  mcClient = null
}

bot.launch()
console.log('🤖 Telegram Bot Online')
