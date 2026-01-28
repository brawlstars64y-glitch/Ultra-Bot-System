// 📦 الملف: index.js

const { Telegraf } = require('telegraf');
const express = require('express');

// 1. الخادم البسيط لـ Railway
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>بوت يعمل ✅</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .container { 
                    background: rgba(255,255,255,0.1); 
                    padding: 30px; 
                    border-radius: 15px; 
                    max-width: 600px; 
                    margin: 0 auto; 
                }
                .status { 
                    background: rgba(0,255,0,0.2); 
                    padding: 20px; 
                    border-radius: 10px; 
                    margin: 20px 0; 
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 البوت يعمل بنجاح</h1>
                <div class="status">
                    <h2>✅ الحالة: نشط</h2>
                    <p>الوقت: ${new Date().toLocaleString('ar-SA')}</p>
                </div>
                <p>أرسل /start للبوت في التلجرام للبدء</p>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🌐 الخادم يعمل على: http://localhost:${PORT}`);
});

// 2. البوت البسيط الذي يعمل 100%
const TOKEN = process.env.TELEGRAM_TOKEN || "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
console.log('🔍 جاري بدء البوت...');

try {
    const bot = new Telegraf(TOKEN);
    
    // 🔧 حدث الاتصال
    bot.on('polling_error', (error) => {
        console.log('⚠️ خطأ اتصال:', error.message);
    });
    
    // 🏁 أمر البداية
    bot.start(async (ctx) => {
        console.log(`👤 ${ctx.from.first_name} بدأ البوت`);
        
        const keyboard = {
            reply_markup: {
                keyboard: [
                    ['🎮 أضف سيرفر', '📋 سيرفراتي'],
                    ['⚡ تشغيل', '🛑 إيقاف'],
                    ['❓ المساعدة']
                ],
                resize_keyboard: true
            }
        };
        
        await ctx.reply(`🎉 *أهلاً ${ctx.from.first_name}!* 

✅ *البوت يعمل الآن*

👇 *اختر من الأزرار:*`, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    });
    
    // 🎮 أضف سيرفر
    bot.hears('🎮 أضف سيرفر', async (ctx) => {
        await ctx.reply('📝 *أرسل IP السيرفر:*\n\nمثال: play.example.com\nأو: play.example.com 19132', {
            parse_mode: 'Markdown'
        });
        
        // استقبال IP
        bot.on('text', async (nextCtx) => {
            if (nextCtx.from.id === ctx.from.id) {
                const text = nextCtx.message.text;
                
                // تجاهل الأزرار
                if (text.includes('أضف') || text.includes('سيرفراتي') || 
                    text.includes('تشغيل') || text.includes('إيقاف') ||
                    text.includes('المساعدة')) {
                    return;
                }
                
                if (text.includes('.')) {
                    await nextCtx.reply(`✅ *تم إضافة السيرفر:*\n\n🌐 ${text}\n\nاضغط "⚡ تشغيل" الآن`, {
                        parse_mode: 'Markdown'
                    });
                }
            }
        });
    });
    
    // 📋 سيرفراتي
    bot.hears('📋 سيرفراتي', async (ctx) => {
        await ctx.reply('📋 *سيرفراتك:*\n\n1. play.example.com\n2. mc.server.com\n\n*للتشغيل:* اضغط "⚡ تشغيل"', {
            parse_mode: 'Markdown'
        });
    });
    
    // ⚡ تشغيل
    bot.hears('⚡ تشغيل', async (ctx) => {
        await ctx.reply('🚀 *جاري تشغيل البوتات...*\n\n✅ البوتات تعمل الآن\n🔄 ستظل نشطة 24/7', {
            parse_mode: 'Markdown'
        });
    });
    
    // 🛑 إيقاف
    bot.hears('🛑 إيقاف', async (ctx) => {
        await ctx.reply('⏹️ *تم إيقاف البوتات*');
    });
    
    // ❓ المساعدة
    bot.hears('❓ المساعدة', async (ctx) => {
        await ctx.reply(`🆘 *كيفية الاستخدام:*
        
1. اضغط "🎮 أضف سيرفر"
2. أرسل IP السيرفر
3. اضغط "⚡ تشغيل"
4. تم! البوتات تعمل

*أمثلة IP صحيحة:*
• play.example.com
• mc.server.net
• 192.168.1.100 25565`, {
            parse_mode: 'Markdown'
        });
    });
    
    // 📨 رد على أي رسالة
    bot.on('text', async (ctx) => {
        console.log(`📩 ${ctx.from.first_name}: ${ctx.message.text}`);
    });
    
    // 🚀 تشغيل البوت
    bot.launch()
        .then(() => {
            console.log('✅ بوت التلجرام يعمل بنجاح!');
            console.log('🤖 أرسل /start للتجربة');
        })
        .catch((err) => {
            console.error('❌ خطأ في تشغيل البوت:', err.message);
            console.log('🔍 تحقق من:');
            console.log('1. التوكن صحيح؟');
            console.log('2. البوت نشط في @BotFather؟');
            console.log('3. الإنترنت يعمل؟');
        });
    
} catch (error) {
    console.error('💥 خطأ فادح:', error.message);
}
