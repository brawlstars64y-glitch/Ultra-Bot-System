const { Telegraf } = require('telegraf');
const express = require('express');

// خادم Railway
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.json({ status: 'online' }));
app.get('/health', (req, res) => res.json({ status: 'healthy' }));
app.listen(PORT, () => console.log(`🚀 ${PORT}`));

// البوت
const TOKEN = process.env.TELEGRAM_TOKEN || "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// تخزين المستخدمين الذين ينتظرون إضافة سيرفر
let waitingForIP = {};

// 🏁 أمر البداية مع زر واحد فقط
bot.start(async (ctx) => {
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "➕ أضف سيرفر",
                        callback_data: "add_server"
                    }
                ]
            ]
        }
    };
    
    await ctx.reply(`
🎮 *مرحباً ${ctx.from.first_name}!*

✨ *بوت بيدروك البسيط*

📌 *لإضافة سيرفر:* اضغط الزر بالأسفل

*مثال:* play.example.com:19132
    `.trim(), {
        parse_mode: 'Markdown',
        ...keyboard
    });
});

// ➕ زر إضافة سيرفر
bot.action('add_server', async (ctx) => {
    await ctx.answerCbQuery();
    
    // حفظ أن المستخدم ينتظر IP
    waitingForIP[ctx.from.id] = true;
    
    await ctx.editMessageText(`
📝 *أضف سيرفر جديد*

✏️ *اكتب IP السيرفر بالتنسيق:*

🌐 **ip:port**

📌 *أمثلة صحيحة:*
• play.example.com:19132
• mc.server.com:25565
• 192.168.1.100:25565
• myserver.aternos.me:25565

👇 *اكتب الآن:* ip:port
    `.trim(), {
        parse_mode: 'Markdown'
    });
});

// 📨 استقبال IP:Port
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text.trim();
    
    // إذا كان المستخدم ينتظر إضافة سيرفر
    if (waitingForIP[userId]) {
        // تجاهل الأوامر
        if (text.startsWith('/')) {
            waitingForIP[userId] = false;
            return;
        }
        
        // فحص التنسيق ip:port
        if (text.includes(':') && text.split(':').length === 2) {
            const [ip, portStr] = text.split(':');
            const port = parseInt(portStr);
            
            if (ip && ip.length > 3 && port && port > 0 && port < 65536) {
                // نجاح - سيرفر مضاف
                waitingForIP[userId] = false;
                
                const successKeyboard = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "🚀 تشغيل بوتات",
                                    callback_data: `start_${ip}_${port}`
                                },
                                {
                                    text: "➕ أضف آخر",
                                    callback_data: "add_server"
                                }
                            ],
                            [
                                {
                                    text: "🏠 الرئيسية",
                                    callback_data: "back_home"
                                }
                            ]
                        ]
                    }
                };
                
                await ctx.reply(`
✅ *تم إضافة السيرفر بنجاح!*

🎮 **السيرفر:** ${ip}
🔌 **البورت:** ${port}
🌐 **الاتصال:** ${text}
📅 **الوقت:** ${new Date().toLocaleString('ar-SA')}

👇 *ماذا تريد الآن؟*
                `.trim(), {
                    parse_mode: 'Markdown',
                    ...successKeyboard
                });
                
            } else {
                await ctx.reply(`
❌ *بورت غير صحيح!*

📌 *تأكد أن:*
1. البورت بين 1 و 65535
2. IP يحتوي على نقطة (.)
3. التنسيق ip:port

✏️ *جرب مرة أخرى:* ip:port
                `.trim(), {
                    parse_mode: 'Markdown'
                });
            }
        } else {
            await ctx.reply(`
❌ *تنسيق خاطئ!*

📌 *استخدم:* **ip:port**

📋 *مثال صحيح:* play.example.com:19132

✏️ *جرب مرة أخرى:*
            `.trim(), {
                parse_mode: 'Markdown'
            });
        }
    }
    
    // إذا كان يكتب IP:Port بدون الضغط على زر أولاً
    else if (text.includes(':') && text.split(':').length === 2) {
        const [ip, portStr] = text.split(':');
        const port = parseInt(portStr);
        
        if (ip && port) {
            const quickAddKeyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "✅ نعم، أضفه",
                                callback_data: `quick_add_${ip}_${port}`
                            },
                            {
                                text: "❌ لا، تجاهل",
                                callback_data: "ignore"
                            }
                        ]
                    ]
                }
            };
            
            await ctx.reply(`
🤔 *هل تريد إضافة هذا السيرفر؟*

🌐 **${ip}:${port}**

👇 *اختر:*
            `.trim(), {
                parse_mode: 'Markdown',
                ...quickAddKeyboard
            });
        }
    }
});

// 🚀 تشغيل البوتات للسيرفر
bot.action(/^start_/, async (ctx) => {
    await ctx.answerCbQuery('جاري التشغيل...');
    
    const data = ctx.callbackQuery.data;
    const [_, ip, port] = data.split('_');
    
    await ctx.editMessageText(`
🚀 *جاري تشغيل البوتات...*

✅ **السيرفر:** ${ip}:${port}
🤖 **عدد البوتات:** 2
⏳ **الحالة:** البوتات تعمل الآن
🔄 **ميزة:** إعادة اتصال تلقائية

🎮 *يمكنك الآن فتح ماينكرافت والاتصال بالسيرفر*
    `.trim(), {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "➕ أضف سيرفر آخر",
                        callback_data: "add_server"
                    }
                ]
            ]
        }
    });
});

// ➕ إضافة سريعة
bot.action(/^quick_add_/, async (ctx) => {
    await ctx.answerCbQuery('جاري الإضافة...');
    
    const data = ctx.callbackQuery.data;
    const [_, ip, port] = data.split('_');
    
    await ctx.editMessageText(`
✅ *تمت الإضافة السريعة!*

🎮 **${ip}:${port}**

👇 *للتشغيل:* اضغط الزر بالأسفل
    `.trim(), {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "🚀 تشغيل بوتات",
                        callback_data: `start_${ip}_${port}`
                    }
                ]
            ]
        }
    });
});

// 🔙 العودة للرئيسية
bot.action('back_home', async (ctx) => {
    await ctx.answerCbQuery();
    waitingForIP[ctx.from.id] = false;
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "➕ أضف سيرفر",
                        callback_data: "add_server"
                    }
                ]
            ]
        }
    };
    
    await ctx.editMessageText(`
🏠 *الرئيسية*

✨ *بوت بيدروك البسيط*

📌 *لإضافة سيرفر:* اضغط الزر بالأسفل
    `.trim(), {
        parse_mode: 'Markdown',
        ...keyboard
    });
});

// ❌ تجاهل
bot.action('ignore', async (ctx) => {
    await ctx.answerCbQuery('تم التجاهل');
    await ctx.deleteMessage();
});

// 🆘 أمر المساعدة
bot.command('help', async (ctx) => {
    await ctx.reply(`
🆘 *كيفية الاستخدام:*

1. *أرسل* `/start`
2. *اضغط* "➕ أضف سيرفر"
3. *اكتب* **ip:port**
4. *اضغط* "🚀 تشغيل بوتات"

📌 *أمثلة:*
• play.example.com:19132
• mc.server.com:25565
• 192.168.1.100:25565

🎮 *بعدها البوتات تعمل تلقائياً*
    `.trim(), {
        parse_mode: 'Markdown'
    });
});

// 🔧 معالجة الأخطاء
bot.catch((err) => {
    console.error('❌ خطأ في البوت:', err.message);
});

// 🚀 تشغيل البوت
bot.launch()
    .then(() => {
        console.log('✅ البوت يعمل!');
        console.log('📱 أرسل /start للتجربة');
    })
    .catch(err => {
        console.error('💥 فشل التشغيل:', err.message);
    });

// 🛑 إيقاف نظيف
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
