const { Telegraf } = require('telegraf');
const express = require('express');

// الخادم
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('✅ البوت يعمل'));
app.listen(PORT, () => console.log(`🚀 ${PORT}`));

// البوت - التوكن هنا
const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

console.log('🚀 جاري بدء البوت...');

// /start
bot.start((ctx) => {
    console.log(`👤 ${ctx.from.first_name} أرسل /start`);
    ctx.reply(`🎮 *مرحباً ${ctx.from.first_name}!*\n\nالبوت يعمل ✅\n\n*أرسل أي شيء*`, {
        parse_mode: 'Markdown'
    });
});

// رد على أي نص
bot.on('text', async (ctx) => {
    console.log(`📩 ${ctx.from.first_name}: ${ctx.message.text}`);
    await ctx.reply(`📢 تلقيت: ${ctx.message.text}`);
});

// حدث الأخطاء
bot.catch((err) => {
    console.error('❌ خطأ:', err);
});

// تشغيل البوت
bot.launch()
    .then(() => {
        console.log('✅ البوت يعمل بنجاح!');
        console.log('📱 أرسل /start للتجربة');
    })
    .catch(err => {
        console.error('💥 فشل التشغيل:', err.message);
        console.log('🔍 أسباب محتملة:');
        console.log('1. التوكن خاطئ أو منتهي');
        console.log('2. البوت محذوف من @BotFather');
        console.log('3. مشكلة في اتصال الإنترنت');
    });

// إيقاف نظيف
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
