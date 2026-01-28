require('dotenv').config();
const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

let bots = [];

// أمر /start
bot.start((ctx) => {
    ctx.reply(`🎮 *مرحباً بوك في نظام حماية سيرفر ماينكرافت!*

🤖 *الأوامر المتاحة:*
/start - عرض هذه الرسالة
/startbots - تشغيل البوتات الوهمية
/stopbots - إيقاف البوتات
/status - حالة النظام
/setcustom - تعيين إعدادات مخصصة

⚡ *المميزات:*
• إبقاء السيرفر مفتوح 24/7
• بوتات وهمية لمنع إغلاق السيرفر
• مراقبة تلقائية
• إشعارات فورية`, { parse_mode: 'Markdown' });
});

// تشغيل البوتات
bot.command('startbots', (ctx) => {
    const count = process.env.BOT_COUNT || 2;
    
    ctx.reply(`🚀 جاري تشغيل ${count} بوت وهمي...`);
    
    for (let i = 1; i <= count; i++) {
        const botName = `${process.env.BOT_USERNAME_PREFIX}${i}`;
        
        exec(`node minecraftBot.js "${botName}"`, (error, stdout, stderr) => {
            if (error) {
                ctx.reply(`❌ خطأ في تشغيل البوت ${botName}: ${error.message}`);
            } else {
                bots.push(botName);
                ctx.reply(`✅ البوت ${botName} يعمل الآن`);
            }
        });
    }
});

// حالة النظام
bot.command('status', (ctx) => {
    ctx.reply(`📊 *حالة النظام الحالية:*

🤖 البوتات النشطة: ${bots.length}
🔧 الحد الأقصى للبوتات: ${process.env.BOT_COUNT}
🌐 إصدار ماينكرافت: ${process.env.VERSION}
⏰ الوقت: ${new Date().toLocaleTimeString()}

${bots.length > 0 ? '✅ النظام يعمل بشكل طبيعي' : '⚠️ لا توجد بوتات نشطة'}`, { parse_mode: 'Markdown' });
});

// إيقاف البوتات
bot.command('stopbots', (ctx) => {
    if (bots.length === 0) {
        return ctx.reply('⚠️ لا توجد بوتات نشطة لإيقافها');
    }
    
    ctx.reply('🛑 جاري إيقاف جميع البوتات...');
    
    exec('pkill -f minecraftBot.js', (error) => {
        if (error) {
            ctx.reply('❌ خطأ في إيقاف البوتات');
        } else {
            bots = [];
            ctx.reply('✅ تم إيقاف جميع البوتات بنجاح');
        }
    });
});

// تشغيل البوت
bot.launch().then(() => {
    console.log('✅ بوت التلجرام يعمل بنجاح!');
});

// إغلاق نظيف
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
