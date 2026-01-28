const { Telegraf } = require('telegraf');

// ⚠️ ⚠️ ⚠️ تحذير: هذا التوكن معروض للعامة - سارع بحذفه!
// استبدل هذا بالتوكن الجديد بعد إنشائه
const TOKEN = '8546799299:AAG4vENptWQqQSAk1m6diUVr2nR5uiP3c1g';

// إنشاء البوت
const bot = new Telegraf(TOKEN);

// أمر /start
bot.start((ctx) => {
    ctx.reply('مرحباً! أنا بوت بسيط. أنشئني @BotFather');
});

// أمر /help
bot.help((ctx) => {
    ctx.reply('أرسل لي أي نص وسأرد عليك بنفس النص!');
});

// رد على أي رسالة نصية
bot.on('text', (ctx) => {
    ctx.reply(`لقد قلت: ${ctx.message.text}`);
});

// أمر /time لعرض الوقت الحالي
bot.command('time', (ctx) => {
    const now = new Date();
    ctx.reply(`الوقت الحالي: ${now.toLocaleString()}`);
});

// أمر /about
bot.command('about', (ctx) => {
    ctx.reply('أنا بوت تلجرام بسيط مكتوب بـ Node.js');
});

// معالجة الأخطاء
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
    ctx.reply('حدث خطأ ما!');
});

// تشغيل البوت
console.log('جاري تشغيل البوت...');
bot.launch()
    .then(() => {
        console.log('✅ البوت يعمل بنجاح!');
    })
    .catch((err) => {
        console.error('❌ فشل تشغيل البوت:', err);
    });

// إغلاق أنيق عند استقبال إشارة SIGINT
process.once('SIGINT', () => {
    bot.stop('SIGINT');
    console.log('❌ تم إيقاف البوت');
});

process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    console.log('❌ تم إيقاف البوت');
});
