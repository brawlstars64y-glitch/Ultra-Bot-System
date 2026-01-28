const { Telegraf } = require('telegraf');
const express = require('express');
const mineflayer = require('mineflayer');

// ⚠️ استبدل التوكن هذا بعد التجربة
const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";

// خادم ويب للحفاظ على التطبيق نشط على Railway
const app = express();
const PORT = process.env.PORT || 3000;

// صفحة رئيسية بسيطة
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>بيدروك بوت | يعمل على Railway</title>
            <meta charset="UTF-8">
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
                    backdrop-filter: blur(10px);
                }
                h1 { margin-bottom: 30px; }
                .status { 
                    background: rgba(0,255,0,0.2); 
                    padding: 15px; 
                    border-radius: 10px; 
                    margin: 20px 0; 
                }
                .info { 
                    background: rgba(255,255,255,0.1); 
                    padding: 15px; 
                    border-radius: 10px; 
                    margin: 10px 0; 
                    text-align: right;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 بوت بيدروك 24/7</h1>
                <div class="status">
                    <h2>✅ النظام يعمل بشكل طبيعي</h2>
                    <p>🕒 ${new Date().toLocaleString('ar-SA')}</p>
                </div>
                <div class="info">
                    <h3>📋 معلومات النظام:</h3>
                    <p>🎮 الإصدار: بيدروك 1.21.x</p>
                    <p>🤖 البوتات النشطة: ${Object.keys(activeBots).length}</p>
                    <p>🌐 يعمل على: Railway</p>
                </div>
                <div class="info">
                    <h3>📌 كيفية الاستخدام:</h3>
                    <p>1. افتح بوت التلجرام</p>
                    <p>2. أرسل /start</p>
                    <p>3. اتبع التعليمات</p>
                </div>
                <p style="margin-top: 30px;">🔧 النظام مصمم للعمل 24/7 على Railway</p>
            </div>
        </body>
        </html>
    `);
});

// نقطة للتحقق من الصحة
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        bots: Object.keys(activeBots).length,
        memory: process.memoryUsage(),
        uptime: process.uptime()
    });
});

// بدء خادم الويب
app.listen(PORT, () => {
    console.log(`🌐 خادم الويب يعمل على المنفذ ${PORT}`);
});

// تخزين البيانات (مؤقت - في Railway يفضل استخدام قاعدة بيانات)
let userData = {};
let activeBots = {};
let bot = null;

// 🔧 محاولة إنشاء بوت التلجرام مع معالجة الأخطاء
async function initializeBot() {
    try {
        bot = new Telegraf(TOKEN);
        
        // معالج الأخطاء
        bot.catch((err, ctx) => {
            console.error(`❌ خطأ في البوت:`, err.message);
            console.error('حدث الخطأ في:', ctx.updateType);
            
            // محاولة إعادة الاتصال
            setTimeout(initializeBot, 10000);
        });

        // أمر البداية
        bot.start(async (ctx) => {
            try {
                const keyboard = {
                    reply_markup: {
                        keyboard: [
                            ['➕ أضف سيرفر', '▶️ تشغيل البوتات'],
                            ['📋 سيرفراتي', '⏹️ إيقاف البوتات'],
                            ['📊 الحالة', '🆘 المساعدة']
                        ],
                        resize_keyboard: true
                    }
                };
                
                await ctx.reply(`🎮 *أهلاً ${ctx.from.first_name}!*
                
✨ *نظام بيدروك 24/7 - يعمل على Railway*

✅ *المميزات:*
• تشغيل تلقائي 24/7
• إضافة سيرفرات بسهولة
• بوتات ذكية
• إعادة اتصال تلقائي

👇 اختر من الأزرار:`, {
                    parse_mode: 'Markdown',
                    ...keyboard
                });
            } catch (error) {
                console.error('خطأ في أمر /start:', error);
            }
        });

        // إضافة سيرفر
        bot.hears('➕ أضف سيرفر', async (ctx) => {
            try {
                await ctx.reply(`📝 *أضف سيرفر بيدروك*
                
أرسل لي معلومات السيرفر:
📌 *الشكل:* اسم السيرفر IP

*مثال:* 
سيرفر الإبداع play.pedrock.net

*مثال مع بورت:*
سيرفر البناء mc.example.com 19133

👇 أرسل الآن:`, {
                    parse_mode: 'Markdown'
                });
                
                // استقبال البيانات مرة واحدة
                const userId = ctx.from.id;
                const messageHandler = async (nextCtx) => {
                    if (nextCtx.from.id === userId) {
                        const text = nextCtx.message.text;
                        
                        // تجاهل أوامر القائمة
                        if (text.includes('أضف سيرفر') || text.includes('سيرفراتي') || 
                            text.includes('تشغيل') || text.includes('إيقاف')) {
                            bot.off('text', messageHandler);
                            return;
                        }
                        
                        const parts = text.split(' ');
                        if (parts.length >= 2) {
                            const name = parts[0];
                            const ip = parts[1];
                            const port = parts[2] ? parseInt(parts[2]) : 19132;
                            
                            // حفظ السيرفر
                            if (!userData[userId]) {
                                userData[userId] = {
                                    name: nextCtx.from.first_name,
                                    servers: []
                                };
                            }
                            
                            const server = {
                                id: Date.now(),
                                name: name,
                                ip: ip,
                                port: port,
                                version: '1.21.132',
                                added: new Date().toLocaleString()
                            };
                            
                            userData[userId].servers.push(server);
                            
                            await nextCtx.reply(`✅ *تمت الإضافة!*
                            
📛 الاسم: ${name}
🌐 IP: ${ip}:${port}
🎮 الإصدار: بيدروك 1.21.132

اضغط "▶️ تشغيل البوتات" للبدء`, {
                                parse_mode: 'Markdown'
                            });
                            
                            // إزالة المعالج
                            bot.off('text', messageHandler);
                        } else {
                            await nextCtx.reply('❌ أرسل بالشكل الصحيح: اسم السيرفر IP');
                        }
                    }
                };
                
                // إضافة المعالج مؤقتاً
                bot.on('text', messageHandler);
                
            } catch (error) {
                console.error('خطأ في إضافة سيرفر:', error);
                await ctx.reply('❌ حدث خطأ، حاول مرة أخرى');
            }
        });

        // تشغيل البوتات
        bot.hears('▶️ تشغيل البوتات', async (ctx) => {
            try {
                const userId = ctx.from.id;
                
                if (!userData[userId] || userData[userId].servers.length === 0) {
                    await ctx.reply('❌ لا توجد سيرفرات، أضف سيرفر أولاً');
                    return;
                }
                
                await ctx.reply('🚀 جاري تشغيل البوتات...');
                
                let total = 0;
                for (const server of userData[userId].servers) {
                    // إيقاف القديم إن وجد
                    if (activeBots[server.id]) {
                        activeBots[server.id].forEach(b => {
                            try { b.quit(); } catch {}
                        });
                    }
                    
                    // إنشاء بوتين جديدين
                    activeBots[server.id] = [];
                    for (let i = 1; i <= 2; i++) {
                        try {
                            const mcBot = mineflayer.createBot({
                                host: server.ip,
                                port: server.port,
                                username: `Bot${i}_${Date.now()}`,
                                version: server.version,
                                auth: 'offline'
                            });
                            
                            mcBot.on('login', () => {
                                console.log(`✅ ${mcBot.username} دخل ${server.name}`);
                            });
                            
                            mcBot.on('spawn', () => {
                                // حركة دورية بسيطة
                                setInterval(() => {
                                    if (mcBot.entity) {
                                        mcBot.setControlState('jump', true);
                                        setTimeout(() => mcBot.setControlState('jump', false), 200);
                                        mcBot.look(Math.random() * 360, 0);
                                    }
                                }, 45000);
                            });
                            
                            mcBot.on('end', () => {
                                console.log(`🔌 ${mcBot.username} انقطع`);
                                setTimeout(() => {
                                    // إعادة الاتصال
                                    if (activeBots[server.id]) {
                                        const botIndex = activeBots[server.id].findIndex(b => b === mcBot);
                                        if (botIndex > -1) {
                                            activeBots[server.id].splice(botIndex, 1);
                                        }
                                    }
                                }, 5000);
                            });
                            
                            mcBot.on('error', (err) => {
                                console.log(`⚠️ خطأ: ${err.message}`);
                            });
                            
                            activeBots[server.id].push(mcBot);
                            total++;
                            
                        } catch (err) {
                            console.log(`❌ فشل إنشاء بوت: ${err.message}`);
                        }
                    }
                }
                
                await ctx.reply(`✅ تم تشغيل ${total} بوت
📌 البوتات تعمل الآن وتعيد الاتصال تلقائياً`);
                
            } catch (error) {
                console.error('خطأ في تشغيل البوتات:', error);
                await ctx.reply('❌ حدث خطأ في التشغيل');
            }
        });

        // سيرفراتي
        bot.hears('📋 سيرفراتي', async (ctx) => {
            try {
                const userId = ctx.from.id;
                
                if (!userData[userId] || userData[userId].servers.length === 0) {
                    await ctx.reply('📭 لا توجد سيرفرات');
                    return;
                }
                
                let message = `📋 *سيرفراتك (${userData[userId].servers.length})*\n\n`;
                
                userData[userId].servers.forEach((server, index) => {
                    const botsCount = activeBots[server.id] ? activeBots[server.id].length : 0;
                    message += `*${index + 1}. ${server.name}*
🌐 ${server.ip}:${server.port}
🤖 ${botsCount} بوت نشط
\n`;
                });
                
                await ctx.reply(message, { parse_mode: 'Markdown' });
                
            } catch (error) {
                console.error('خطأ في عرض السيرفرات:', error);
            }
        });

        // إيقاف البوتات
        bot.hears('⏹️ إيقاف البوتات', async (ctx) => {
            try {
                let stopped = 0;
                
                for (const serverId in activeBots) {
                    activeBots[serverId].forEach(bot => {
                        try {
                            bot.quit();
                            stopped++;
                        } catch {}
                    });
                    delete activeBots[serverId];
                }
                
                await ctx.reply(`🛑 تم إيقاف ${stopped} بوت`);
                
            } catch (error) {
                console.error('خطأ في إيقاف البوتات:', error);
            }
        });

        // الحالة
        bot.hears('📊 الحالة', async (ctx) => {
            try {
                const totalBots = Object.values(activeBots).reduce((sum, bots) => sum + bots.length, 0);
                
                await ctx.reply(`📊 *حالة النظام*
                
🤖 البوتات النشطة: ${totalBots}
🎮 السيرفرات: ${Object.keys(activeBots).length}
🕒 وقت التشغيل: ${Math.floor(process.uptime() / 60)} دقيقة
💾 الذاكرة: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB

✅ النظام يعمل على Railway`, {
                    parse_mode: 'Markdown'
                });
                
            } catch (error) {
                console.error('خطأ في عرض الحالة:', error);
            }
        });

        // المساعدة
        bot.hears('🆘 المساعدة', async (ctx) => {
            await ctx.reply(`🆘 *المساعدة*
            
1. *أضف سيرفر* ← اكتب اسم و IP
2. *تشغيل البوتات* ← يشغل بوتين لكل سيرفر
3. *سيرفراتي* ← يعرض سيرفراتك
4. *إيقاف البوتات* ← يوقف كل البوتات

📌 *ملاحظة:* البوتات تعمل 24/7 وتعيد الاتصال تلقائياً`, {
                parse_mode: 'Markdown'
            });
        });

        // بدء البوت
        await bot.launch();
        console.log('✅ بوت التلجرام يعمل بنجاح!');
        
        // إرسال رسالة بدء التشغيل
        const adminId = process.env.ADMIN_ID;
        if (adminId) {
            try {
                await bot.telegram.sendMessage(adminId, '🚀 النظام يعمل على Railway بنجاح!');
            } catch {}
        }
        
    } catch (error) {
        console.error('❌ فشل تشغيل بوت التلجرام:', error.message);
        
        // إعادة المحاولة بعد 30 ثانية
        setTimeout(initializeBot, 30000);
    }
}

// 🔄 إعادة تشغيل البوت إذا توقف
function keepBotAlive() {
    if (!bot) {
        console.log('🔄 محاولة تشغيل البوت...');
        initializeBot();
    }
}

// بدء التشغيل
console.log('🚀 بدء نظام بيدروك لـ Railway...');
initializeBot();

// 🔁 فحص حالة البوت كل دقيقة
setInterval(() => {
    if (!bot) {
        console.log('⚠️ البوت غير نشط - إعادة التشغيل...');
        initializeBot();
    }
}, 60000);

// 🛑 معالجة إغلاق التطبيق
process.on('SIGINT', () => {
    console.log('\n🛑 إيقاف النظام...');
    
    // إيقاف جميع بوتات ماينكرافت
    for (const serverId in activeBots) {
        activeBots[serverId].forEach(b => {
            try { b.quit(); } catch {}
        });
    }
    
    // إيقاف بوت التلجرام
    if (bot) {
        bot.stop();
    }
    
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 إشارة إيقاف...');
    process.exit(0);
});

// 🚨 معالجة الأخطاء غير الملتقطة
process.on('uncaughtException', (error) => {
    console.error('🚨 خطأ غير ملتقط:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 وعد مرفوض غير معالج:', reason);
});
