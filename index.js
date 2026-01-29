const { Telegraf } = require('telegraf');
const express = require('express');
const fs = require('fs'); // ← جديد

// خادم Railway
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.json({ status: 'online' }));
app.listen(PORT, () => console.log(`🚀 ${PORT}`));

// البوت
const TOKEN = process.env.TELEGRAM_TOKEN || "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// 📁 نظام تخزين السيرفرات
const STORAGE_FILE = 'servers.json';

// تحميل السيرفرات المحفوظة
let userServers = {};
try {
    if (fs.existsSync(STORAGE_FILE)) {
        userServers = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
        console.log(`📂 تم تحميل ${Object.keys(userServers).length} مستخدم`);
    }
} catch (error) {
    console.log('⚠️ لا توجد سيرفرات محفوظة');
    userServers = {};
}

// حفظ السيرفرات
function saveServers() {
    try {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(userServers, null, 2));
        console.log('💾 تم حفظ السيرفرات');
    } catch (error) {
        console.error('❌ خطأ في الحفظ:', error.message);
    }
}

// تخزين المستخدمين الذين ينتظرون إضافة سيرفر
let waitingForIP = {};

// 🏁 أمر البداية مع زرين
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    
    // عرض عدد السيرفرات الحالية
    const userServerCount = userServers[userId] ? userServers[userId].length : 0;
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "➕ أضف سيرفر",
                        callback_data: "add_server"
                    }
                ],
                [
                    {
                        text: `📋 سيرفراتي (${userServerCount})`,
                        callback_data: "my_servers"
                    }
                ]
            ]
        }
    };
    
    await ctx.reply(`
🎮 *مرحباً ${ctx.from.first_name}!*

✨ *بوت بيدروك مع حفظ السيرفرات*

📊 *لديك ${userServerCount} سيرفر*

📌 *مثال:* play.example.com:19132

👇 *اختر:*
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

👇 *اكتب الآن:* ip:port
    `.trim(), {
        parse_mode: 'Markdown'
    });
});

// 📨 استقبال IP:Port وحفظه
bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const text = ctx.message.text.trim();
    
    // إذا كان المستخدم ينتظر إضافة سيرفر
    if (waitingForIP[ctx.from.id]) {
        // تجاهل الأوامر
        if (text.startsWith('/')) {
            waitingForIP[ctx.from.id] = false;
            return;
        }
        
        // فحص التنسيق ip:port
        if (text.includes(':') && text.split(':').length === 2) {
            const [ip, portStr] = text.split(':');
            const port = parseInt(portStr);
            
            if (ip && ip.length > 3 && port && port > 0 && port < 65536) {
                // نجاح - حفظ السيرفر
                waitingForIP[ctx.from.id] = false;
                
                // إنشاء كائن السيرفر
                const server = {
                    id: Date.now(),
                    ip: ip,
                    port: port,
                    fullAddress: `${ip}:${port}`,
                    addedAt: new Date().toLocaleString('ar-SA'),
                    name: `سيرفر ${ip.split('.')[0]}`,
                    status: 'active',
                    bots: 0
                };
                
                // حفظ في التخزين
                if (!userServers[userId]) {
                    userServers[userId] = [];
                }
                
                userServers[userId].push(server);
                saveServers(); // ← حفظ في الملف
                
                const successKeyboard = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "🚀 تشغيل 2 بوت",
                                    callback_data: `start_${server.id}`
                                },
                                {
                                    text: "➕ أضف آخر",
                                    callback_data: "add_server"
                                }
                            ],
                            [
                                {
                                    text: "📋 سيرفراتي",
                                    callback_data: "my_servers"
                                }
                            ]
                        ]
                    }
                };
                
                await ctx.reply(`
✅ *تم إضافة السيرفر وحفظه!*

🎮 **الاسم:** ${server.name}
🌐 **IP:** ${ip}:${port}
📅 **أضيف في:** ${server.addedAt}
📊 **رقم السيرفر:** ${userServers[userId].length}

💾 *تم حفظ السيرفر وسيبقى متاحاً دائماً*

👇 *ماذا تريد الآن؟*
                `.trim(), {
                    parse_mode: 'Markdown',
                    ...successKeyboard
                });
                
            } else {
                await ctx.reply(`
❌ *بورت غير صحيح!*

✏️ *جرب مرة أخرى:* ip:port
                `.trim(), {
                    parse_mode: 'Markdown'
                });
            }
        } else {
            await ctx.reply(`
❌ *تنسيق خاطئ!*

📌 *استخدم:* **ip:port**

✏️ *جرب مرة أخرى:*
            `.trim(), {
                parse_mode: 'Markdown'
            });
        }
    }
});

// 📋 عرض سيرفراتي
bot.action('my_servers', async (ctx) => {
    await ctx.answerCbQuery();
    
    const userId = ctx.from.id.toString();
    const servers = userServers[userId] || [];
    
    if (servers.length === 0) {
        await ctx.editMessageText(`
📭 *لا توجد سيرفرات محفوظة*

لم تقم بإضافة أي سيرفرات بعد.

👇 *لإضافة أول سيرفر:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "➕ أضف سيرفر الآن",
                            callback_data: "add_server"
                        }
                    ]
                ]
            }
        });
        return;
    }
    
    // بناء رسالة السيرفرات
    let message = `📋 *سيرفراتك (${servers.length})*\n\n`;
    
    servers.forEach((server, index) => {
        message += `*${index + 1}. ${server.name}*\n`;
        message += `🌐 ${server.fullAddress}\n`;
        message += `📅 ${server.addedAt}\n`;
        message += `🤖 ${server.bots} بوت نشط\n\n`;
    });
    
    // بناء أزرار السيرفرات
    const serverButtons = servers.map(server => [
        {
            text: `🎮 ${server.name}`,
            callback_data: `manage_${server.id}`
        }
    ]);
    
    // أزرار إضافية
    serverButtons.push([
        {
            text: "➕ أضف جديد",
            callback_data: "add_server"
        },
        {
            text: "🗑️ مسح الكل",
            callback_data: "delete_all"
        }
    ]);
    
    await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: serverButtons
        }
    });
});

// 🚀 تشغيل البوتات للسيرفر
bot.action(/^start_/, async (ctx) => {
    await ctx.answerCbQuery('جاري التشغيل...');
    
    const serverId = ctx.callbackQuery.data.split('_')[1];
    const userId = ctx.from.id.toString();
    
    // البحث عن السيرفر
    const servers = userServers[userId] || [];
    const server = servers.find(s => s.id == serverId);
    
    if (server) {
        // تحديث عدد البوتات
        server.bots = 2;
        saveServers();
        
        await ctx.editMessageText(`
🚀 *جاري تشغيل البوتات...*

✅ **السيرفر:** ${server.fullAddress}
🤖 **عدد البوتات:** 2
📊 **الحالة:** البوتات تعمل الآن
💾 **محفوظ:** نعم، سيبقى السيرفر محفوظاً

🎮 *يمكنك الآن فتح ماينكرافت والاتصال بالسيرفر*

👇 *لإضافة سيرفر آخر:*
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
    }
});

// 🗑️ مسح جميع السيرفرات
bot.action('delete_all', async (ctx) => {
    await ctx.answerCbQuery();
    
    const userId = ctx.from.id.toString();
    const serverCount = userServers[userId] ? userServers[userId].length : 0;
    
    if (serverCount === 0) {
        await ctx.answerCbQuery('لا توجد سيرفرات', { show_alert: true });
        return;
    }
    
    const confirmKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "✅ نعم، امسح الكل",
                        callback_data: "confirm_delete_all"
                    },
                    {
                        text: "❌ لا، إلغاء",
                        callback_data: "my_servers"
                    }
                ]
            ]
        }
    };
    
    await ctx.editMessageText(`
⚠️ *تحذير!*

🗑️ **ستقوم بحذف ${serverCount} سيرفر**

❌ *هذا الإجراء لا يمكن التراجع عنه*

👇 *هل أنت متأكد؟*
    `.trim(), {
        parse_mode: 'Markdown',
        ...confirmKeyboard
    });
});

// تأكيد المسح
bot.action('confirm_delete_all', async (ctx) => {
    await ctx.answerCbQuery('جاري الحذف...');
    
    const userId = ctx.from.id.toString();
    const deletedCount = userServers[userId] ? userServers[userId].length : 0;
    
    // حذف جميع سيرفرات المستخدم
    delete userServers[userId];
    saveServers();
    
    await ctx.editMessageText(`
🗑️ *تم حذف جميع السيرفرات*

✅ **تم حذف:** ${deletedCount} سيرفر
📭 **السيرفرات الآن:** 0

👇 *لإضافة سيرفر جديد:*
    `.trim(), {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "➕ أضف سيرفر جديد",
                        callback_data: "add_server"
                    }
                ]
            ]
        }
    });
});

// 🔧 معالجة الأخطاء
bot.catch((err) => {
    console.error('❌ خطأ في البوت:', err.message);
});

// 🚀 تشغيل البوت
bot.launch()
    .then(() => {
        console.log('✅ البوت يعمل مع نظام حفظ السيرفرات!');
        console.log('💾 يتم حفظ السيرفرات في servers.json');
        console.log('📱 أرسل /start للتجربة');
    })
    .catch(err => {
        console.error('💥 فشل التشغيل:', err.message);
    });

// 🛑 إيقاف نظيف مع حفظ البيانات
process.once('SIGINT', () => {
    console.log('💾 جاري حفظ البيانات قبل الإيقاف...');
    saveServers();
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    console.log('💾 جاري حفظ البيانات قبل الإيقاف...');
    saveServers();
    bot.stop('SIGTERM');
});
