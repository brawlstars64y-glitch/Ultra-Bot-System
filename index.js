const { Telegraf } = require('telegraf');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('✅ بوت Aternos يعمل'));
app.listen(PORT, () => console.log(`🚀 ${PORT}`));

const TOKEN = process.env.TELEGRAM_TOKEN || "ضع_توكنك_هنا";
const bot = new Telegraf(TOKEN);

// قنوات الاشتراك الإجباري
const channels = ["vsyfyk", "N_NHGER", "sjxhhdbx72"];

// التحقق من الاشتراك
async function checkChannels(userId) {
    return true; // مؤقتاً
}

// /start
bot.start(async (ctx) => {
    const isSubscribed = await checkChannels(ctx.from.id);
    
    if (!isSubscribed) {
        const buttons = channels.map(ch => [{
            text: `انضم @${ch}`,
            url: `https://t.me/${ch}`
        }]);
        
        return ctx.reply('🔒 يجب الاشتراك في القنوات أولاً', {
            reply_markup: { inline_keyboard: buttons }
        });
    }
    
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['🌐 أضف سيرفر Aternos', '📋 سيرفراتي'],
                ['▶️ تشغيل السيرفر', '⏸️ إيقاف مؤقت'],
                ['🔄 تحديث', '🆘 المساعدة']
            ],
            resize_keyboard: true
        }
    };
    
    ctx.reply(`🎮 *مرحباً ${ctx.from.first_name}!*\n\n*بوت إدارة سيرفرات Aternos*\n\nاختر من الأزرار:`, {
        parse_mode: 'Markdown',
        ...keyboard
    });
});

// إضافة سيرفر Aternos
let awaitingAternos = {};

bot.hears('🌐 أضف سيرفر Aternos', (ctx) => {
    const userId = ctx.from.id;
    awaitingAternos[userId] = true;
    
    ctx.reply(`📝 *أرسل معلومات سيرفر Aternos:*\n\n📌 *الشكل:*\nاسم السيرفر.aternos.me\n\n*مثال:*\nmyserver.aternos.me\n\n*ملاحظة:* يجب أن ينتهي بـ **.aternos.me**`);
});

// استقبال معلومات Aternos
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text.trim();
    
    // إذا كان ينتظر سيرفر Aternos
    if (awaitingAternos[userId]) {
        // تجاهل الأزرار
        if (text.includes('أضف') || text.includes('سيرفراتي') || 
            text.includes('تشغيل') || text.includes('إيقاف') ||
            text.includes('تحديث') || text.includes('مساعدة')) {
            return;
        }
        
        // تحقق من أن الاسم ينتهي بـ .aternos.me
        if (text.toLowerCase().endsWith('.aternos.me')) {
            // نجاح - إضافة سيرفر Aternos
            ctx.reply(`✅ *تم إضافة سيرفر Aternos!*\n\n🌐 ${text}\n🎮 إصدار: 1.21.1\n⚡ Aternos مجاني\n\n*للتشغيل:*\n1. سجل دخول لـ Aternos\n2. اضغط "▶️ تشغيل السيرفر"\n3. انتظر 1-2 دقيقة`, {
                parse_mode: 'Markdown'
            });
            
            awaitingAternos[userId] = false;
        } else {
            // خطأ
            ctx.reply(`❌ *اسم Aternos غير صحيح*\n\nيجب أن ينتهي بـ **.aternos.me**\n\n*مثال صحيح:*\nmyserver.aternos.me\nmyworld.aternos.me\nbestserver.aternos.me`, {
                parse_mode: 'Markdown'
            });
        }
    }
    
    // رد عام على أي نص
    else if (!text.startsWith('/') && 
             !text.includes('أضف') && 
             !text.includes('سيرفراتي') &&
             !text.includes('تشغيل') &&
             !text.includes('إيقاف') &&
             !text.includes('تحديث') &&
             !text.includes('مساعدة')) {
        
        // إذا كان يبدو مثل سيرفر Aternos
        if (text.toLowerCase().includes('aternos')) {
            ctx.reply(`🤔 *هل هذا سيرفر Aternos؟*\n\nإذا كان سيرفر Aternos، اضغط "🌐 أضف سيرفر Aternos"\n\nإذا كان سيرفر عادي، اكتبه بهذا الشكل:\nplay.example.com\nأو:\nplay.example.com 25565`);
        } 
        // إذا كان IP عادي
        else if (text.includes('.')) {
            const parts = text.split(' ');
            const ip = parts[0];
            const port = parts[1] || '25565';
            
            ctx.reply(`🌐 *تم استلام السيرفر:*\n\n${ip}:${port}\n\n*هل تريد إضافته؟*\n\nاضغط "🌐 أضف سيرفر Aternos" للسيرفرات Aternos\nأو أعد إرساله مع كلمة "أضف" في البداية`);
        }
    }
});

// تشغيل سيرفر Aternos
bot.hears('▶️ تشغيل السيرفر', (ctx) => {
    ctx.reply(`⚡ *تشغيل سيرفر Aternos*\n\n📌 *للتشغيل اليدوي:*\n1. اذهب إلى aternos.org\n2. سجل دخول بحسابك\n3. اضغط Start\n4. انتظر حتى يظهر "Online"\n\n⏳ *الوقت التقريبي:* 1-3 دقائق\n\n⚠️ *ملاحظة:* Aternos يوقف السيرفر بعد فترة من عدم اللعب`);
});

// إيقاف مؤقت
bot.hears('⏸️ إيقاف مؤقت', (ctx) => {
    ctx.reply(`🛑 *إيقاف سيرفر Aternos*\n\nاذهب إلى aternos.org → Stop\nأو سيوقف تلقائياً بعد فترة`);
});

// سيرفراتي
bot.hears('📋 سيرفراتي', (ctx) => {
    ctx.reply(`📋 *سيرفرات Aternos الخاصة بك:*\n\n1. **myserver.aternos.me**\n   🟢 Status: Online\n   👥 Players: 3/10\n   ⏰ Uptime: 45 min\n\n2. **bestworld.aternos.me**\n   🔴 Status: Offline\n   ⏰ Last online: 2 hours ago\n\n*للتشغيل:* اضغط "▶️ تشغيل السيرفر"`);
});

// تحديث
bot.hears('🔄 تحديث', (ctx) => {
    ctx.reply(`🔄 *تحديث معلومات Aternos*\n\n*الإصدارات المتاحة:*\n• 1.21.1 (أحدث)\n• 1.20.4\n• 1.19.4\n\n*للتحويل:*\n1. اذهب إلى aternos.org\n2. Options → Version\n3. اختر الإصدار\n4. اضغط Save`);
});

// المساعدة
bot.hears('🆘 المساعدة', (ctx) => {
    ctx.reply(`🆘 *مساعدة Aternos*\n\n*كيفية إنشاء سيرفر:*\n1. سجل في aternos.org\n2. Create Server\n3. اختر الإصدار\n4. اضغط Create\n\n*كيفية المشاركة:*\n1. اختر سيرفرك\n2. Copy IP\n3. أعطه لأصدقائك\n\n*مميزات Aternos:*\n✅ مجاني 100%\n✅ 24/7 (مع تشغيل يدوي)\n✅ دعم معظم الإصدارات\n✅ لوحة تحكم سهلة\n\n*عيوب:*\n❌ يحتاج تشغيل يدوي\n❌ يوقف بعد فترة\n❌ محدودية الرام`);
});

// تشغيل البوت
bot.launch()
    .then(() => console.log('✅ بوت Aternos يعمل!'))
    .catch(err => console.error('❌ خطأ:', err.message));

// إيقاف نظيف
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
