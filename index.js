const { Telegraf } = require('telegraf');
const express = require('express');

// الخادم البسيط لـ Railway
const app = express();
const PORT = process.env.PORT || 3000;

// مسار الصحة المطلوب لـ Railway
app.get('/', (req, res) => {
    res.send('✅ البوت يعمل على Railway');
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 الخادم يعمل على ${PORT}`);
});

// بوت التلجرام البسيط
const TOKEN = process.env.TELEGRAM_TOKEN || "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// قنوات الاشتراك
const channels = ["vsyfyk", "N_NHGER", "sjxhhdbx72"];

// أمر /start
bot.start(async (ctx) => {
    console.log(`👤 ${ctx.from.first_name} بدأ`);
    
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['➕ أضف سيرفر', '📋 سيرفراتي'],
                ['🚀 تشغيل بوتات', '⏹️ إيقاف بوتات'],
                ['🆘 المساعدة']
            ],
            resize_keyboard: true
        }
    };
    
    await ctx.reply(`🎮 مرحباً ${ctx.from.first_name}!\n\nاختر من الأزرار:`, keyboard);
});

// إضافة سيرفر سهل
bot.hears('➕ أضف سيرفر', async (ctx) => {
    await ctx.reply('📝 أرسل IP السيرفر:\nمثال: play.myserver.com');
    
    const handler = async (nextCtx) => {
        if (nextCtx.from.id === ctx.from.id) {
            const ip = nextCtx.message.text;
            if (ip.includes('.')) {
                await nextCtx.reply(`✅ تم إضافة ${ip}\n\nاضغط "🚀 تشغيل بوتات"`);
                bot.off('text', handler);
            }
        }
    };
    
    bot.on('text', handler);
});

// تشغيل بوتات
bot.hears('🚀 تشغيل بوتات', async (ctx) => {
    await ctx.reply('✅ البوتات تعمل الآن 24/7');
});

// سيرفراتي
bot.hears('📋 سيرفراتي', async (ctx) => {
    await ctx.reply('📋 سيرفراتك ستظهر هنا');
});

// إيقاف بوتات
bot.hears('⏹️ إيقاف بوتات', async (ctx) => {
    await ctx.reply('🛑 تم إيقاف البوتات');
});

// المساعدة
bot.hears('🆘 المساعدة', async (ctx) => {
    await ctx.reply('📌 أرسل /start للبدء\n➕ أضف سيرفر ثم شغله');
});

// أي رسالة نصية
bot.on('text', async (ctx) => {
    console.log(`📩 ${ctx.from.first_name}: ${ctx.message.text}`);
});

// تشغيل البوت
bot.launch()
    .then(() => {
        console.log('✅ بوت التلجرام يعمل!');
    })
    .catch(err => {
        console.error('❌ خطأ:', err.message);
    });

// إيقاف نظيف
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
