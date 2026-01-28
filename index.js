const { Telegraf, Markup, session } = require('telegraf')
const bedrock = require('bedrock-protocol')

const BOT_TOKEN = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU'
const bot = new Telegraf(BOT_TOKEN)

bot.use(session())

let mcClient = null
let afkInterval = null
let serverData = null

// 🎛️ الواجهة الرئيسية
function mainMenu () {
  return Markup.inlineKeyboard([
    [Markup.button.callback('➕ إضافة سيرفر', 'add')],
    [Markup.button.callback('▶️ دخول السيرفر', 'connect')],
    [Markup.button.callback('⏹️ خروج', 'disconnect')],
    [Markup.button.callback('📊 الحالة', 'status')]
  ])
}

bot.start(ctx => {
  ctx.reply('🤖 *لوحة تحكم بوت بلاير*\nاختر خيار:', {
    parse_mode: 'Markdown',
    ...mainMenu()
  })
})

// ➕ إضافة سيرفر
bot.action('add', ctx => {
  ctx.answerCbQuery()
  ctx.session.step = 'ip'
  ctx.reply('🌐 أرسل IP السيرفر:')
})

bot.on('text', ctx => {
  if (!ctx.session.step) return

  if (ctx.session.step === 'ip') {
    ctx.session.ip = ctx.message.text
    ctx.session.step = 'port'
    return ctx.reply('🔢 أرسل Port السيرفر:')
  }

  if (ctx.session.step === 'port') {
    ctx.session.port = parseInt(ctx.message.text)
    ctx.session.step = 'name'
    return ctx.reply
