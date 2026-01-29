const { Telegraf } = require('telegraf');
const express = require('express');
const fs = require('fs');

// خادم بسيط
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.json({ status: 'online' }));
app.get('/health', (req, res) => res.json({ status: 'healthy' }));
app.listen(PORT, () => console.log(`🚀 الخادم يعمل على ${PORT}`));

// البوت
const TOKEN = process.env.TELEGRAM_TOKEN || "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// تخزين
const STORAGE_FILE = 'data.json';
let userData = {};

// تحميل البيانات
function loadData() {
    try {
        if (fs.existsSync(STORAGE_FILE)) {
            userData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
            console.log(`📂 تم تحميل ${Object.keys(userData).length} مستخدم`);
        }
    } catch (error) {
        console.log('📭 لا توجد بيانات سابقة');
        userData = {};
    }
}

// حفظ البيانات
function saveData() {
    try {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(userData, null, 2));
        console.log('💾 تم حفظ البيانات');
    } catch (error) {
        console.error('❌ خطأ في الحفظ:', error.message);
    }
}

// تحميل البيانات عند البدء
loadData();

// 🏁 القائمة الرئيسية البسيطة
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    
    // تهيئة المستخدم الجديد
    if (!userData[userId]) {
        userData[userId] = {
            name: ctx.from.first_name,
            servers: [],
            botName: "Player", // الاسم الافتراضي للبوت
            createdAt: new Date().toISOString()
        };
        saveData();
    }
    
    const menu = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "➕ أضف سيرفر", callback_data: "add_server" },
                    { text: "📋 سيرفراتي", callback_data: "my_servers" }
                ],
                [
                    { text: "✏️ تغيير اسم البوت", callback_data: "change_bot_name" }
                ]
            ]
        }
    };
    
    await ctx.reply(`
🎮 *مرحباً ${ctx.from.first_name}!*

🛠️ *القائمة الرئيسية:*

1️⃣ *➕ أضف سيرفر* - إضافة سيرفر جديد
2️⃣ *📋 سيرفراتي* - عرض سيرفراتك
3️⃣ *✏️ تغيير اسم البوت* - تغيير اسم البوتات

🤖 *اسم البوت الحالي:* ${userData[userId].botName}
📊 *عدد السيرفرات:* ${userData[userId].servers.length}
    `.trim(), {
        parse_mode: 'Markdown',
        ...menu
    });
});

// ➕ إضافة سيرفر
bot.action('add_server', async (ctx) => {
    await ctx.answerCbQuery();
    
    const userId = ctx.from.id.toString();
    userData[userId].waitingForIP = true;
    
    await ctx.editMessageText(`
📝 *إضافة سيرفر جديد*

✏️ *اكتب IP السيرفر:*
🌐 **مثال:** play.example.com:19132

🎯 *بسيط جداً، فقط اكتب وانسى*
👇 *اكتب الآن:* ip:port
    `.trim(), {
        parse_mode: 'Markdown'
    });
});

// 📨 استقبال IP
bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const text = ctx.message.text.trim();
    
    // إذا كان ينتظر إضافة سيرفر
    if (userData[userId] && userData[userId].waitingForIP) {
        delete userData[userId].waitingForIP;
        
        if (text.includes(':') && text.split(':').length === 2) {
            const [ip, portStr] = text.split(':');
            const port = parseInt(portStr);
            
            if (ip && port && port > 0 && port < 65536) {
                // إضافة السيرفر
                const server = {
                    id: Date.now(),
                    ip: ip,
                    port: port,
                    added: new Date().toLocaleString('ar-SA'),
                    name: `سيرفر ${userData[userId].servers.length + 1}`
                };
                
                userData[userId].servers.push(server);
                saveData();
                
                await ctx.reply(`
✅ *تم إضافة السيرفر!*

🎮 ${server.name}
🌐 ${ip}:${port}
📅 ${server.added}

👇 *اضغط "📋 سيرفراتي" لرؤيته*
                `.trim(), {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "📋 سيرفراتي", callback_data: "my_servers" },
                                { text: "➕ أضف آخر", callback_data: "add_server" }
                            ]
                        ]
                    }
                });
            } else {
                await ctx.reply('❌ *بورت غير صحيح*\nجرب: play.example.com:19132', {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "🔄 حاول مرة أخرى", callback_data: "add_server" }
                            ]
                        ]
                    }
                });
            }
        } else {
            await ctx.reply('❌ *تنسيق خاطئ*\nيجب أن يكون: ip:port', {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🔄 حاول مرة أخرى", callback_data: "add_server" }
                        ]
                    ]
                }
            });
        }
    }
    
    // إذا كان ينتظر تغيير اسم البوت
    else if (userData[userId] && userData[userId].waitingForBotName) {
        delete userData[userId].waitingForBotName;
        
        if (text.length > 2 && text.length < 20) {
            userData[userId].botName = text;
            saveData();
            
            await ctx.reply(`
✅ *تم تغيير اسم البوت!*

🤖 **الاسم الجديد:** ${text}

🎮 *سيظهر هذا الاسم في سيرفر ماينكرافت*
            `.trim(), {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🏠 الرئيسية", callback_data: "main_menu" }
                        ]
                    ]
                }
            });
        } else {
            await ctx.reply('❌ *الاسم قصير أو طويل جداً*\nيجب أن يكون بين 3 و 20 حرف', {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🔄 حاول مرة أخرى", callback_data: "change_bot_name" }
                        ]
                    ]
                }
            });
        }
    }
});

// 📋 سيرفراتي
bot.action('my_servers', async (ctx) => {
    await ctx.answerCbQuery();
    
    const userId = ctx.from.id.toString();
    const servers = userData[userId] ? userData[userId].servers : [];
    
    if (servers.length === 0) {
        await ctx.editMessageText(`
📭 *لا توجد سيرفرات*

لم تقم بإضافة أي سيرفرات بعد.

👇 *لإضافة أول سيرفر:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "➕ أضف سيرفر", callback_data: "add_server" }
                    ],
                    [
                        { text: "🏠 الرئيسية", callback_data: "main_menu" }
                    ]
                ]
            }
        });
        return;
    }
    
    // بناء قائمة السيرفرات
    let message = `📋 *سيرفراتك (${servers.length})*\n\n`;
    
    servers.forEach((server, index) => {
        message += `*${index + 1}. ${server.name}*\n`;
        message += `🌐 ${server.ip}:${server.port}\n`;
        message += `🤖 ${userData[userId].botName}\n`;
        message += `📅 ${server.added}\n\n`;
    });
    
    message += `🎯 *اسم البوت الحالي:* ${userData[userId].botName}`;
    
    const buttons = servers.map(server => [
        {
            text: `🎮 ${server.name}`,
            callback_data: `server_${server.id}`
        }
    ]);
    
    buttons.push([
        { text: "➕ أضف سيرفر", callback_data: "add_server" },
        { text: "✏️ تغيير اسم", callback_data: "change_bot_name" }
    ]);
    
    buttons.push([{ text: "🏠 الرئيسية", callback_data: "main_menu" }]);
    
    await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: buttons
        }
    });
});

// ✏️ تغيير اسم البوت
bot.action('change_bot_name', async (ctx) => {
    await ctx.answerCbQuery();
    
    const userId = ctx.from.id.toString();
    const currentName = userData[userId] ? userData[userId].botName : "Player";
    
    userData[userId].waitingForBotName = true;
    
    await ctx.editMessageText(`
✏️ *تغيير اسم البوت*

🤖 *الاسم الحالي:* ${currentName}

📝 *اكتب الاسم الجديد للبوت:*

📌 *مقترحات:*
• Player
• Guard
• Bot
• AFK_Player
• أي اسم تريده

⚠️ *سيظهر هذا الاسم في سيرفر ماينكرافت*

👇 *اكتب الاسم الجديد الآن:*
    `.trim(), {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "❌ إلغاء", callback_data: "main_menu" }
                ]
            ]
        }
    });
});

// 🎮 إدارة سيرفر معين
bot.action(/^server_/, async (ctx) => {
    await ctx.answerCbQuery();
    
    const serverId = ctx.callbackQuery.data.split('_')[1];
    const userId = ctx.from.id.toString();
    const servers = userData[userId] ? userData[userId].servers : [];
    const server = servers.find(s => s.id == serverId);
    
    if (!server) {
        await ctx.answerCbQuery('❌ السيرفر غير موجود', { show_alert: true });
        return;
    }
    
    await ctx.editMessageText(`
🎮 *إدارة السيرفر*

📛 ${server.name}
🌐 ${server.ip}:${server.port}
🤖 ${userData[userId].botName}
📅 ${server.added}

👇 *اختر الإجراء:*
    `.trim(), {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🚀 تشغيل بوتات", callback_data: `start_${server.id}` },
                    { text: "✏️ تعديل اسم", callback_data: `rename_${server.id}` }
                ],
                [
                    { text: "🗑️ حذف", callback_data: `delete_${server.id}` }
                ],
                [
                    { text: "📋 كل السيرفرات", callback_data: "my_servers" },
                    { text: "🏠 الرئيسية", callback_data: "main_menu" }
                ]
            ]
        }
    });
});

// 🚀 تشغيل البوتات
bot.action(/^start_/, async (ctx) => {
    await ctx.answerCbQuery('جاري التشغيل...');
    
    const serverId = ctx.callbackQuery.data.split('_')[1];
    const userId = ctx.from.id.toString();
    const servers = userData[userId] ? userData[userId].servers : [];
    const server = servers.find(s => s.id == serverId);
    const botName = userData[userId].botName;
    
    if (server) {
        await ctx.editMessageText(`
🚀 *جاري تشغيل البوتات...*

✅ **السيرفر:** ${server.ip}:${server.port}
🤖 **اسم البوت:** ${botName}
🔢 **عدد البوتات:** 2

🎮 *البوتات تعمل الآن باسم "${botName}" في السيرفر*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📋 السيرفرات", callback_data: "my_servers" },
                        { text: "🏠 الرئيسية", callback_data: "main_menu" }
                    ]
                ]
            }
        });
    }
});

// ✏️ تعديل اسم سيرفر
bot.action(/^rename_/, async (ctx) => {
    await ctx.answerCbQuery();
    
    const serverId = ctx.callbackQuery.data.split('_')[1];
    const userId = ctx.from.id.toString();
    const servers = userData[userId] ? userData[userId].servers : [];
    const serverIndex = servers.findIndex(s => s.id == serverId);
    
    if (serverIndex !== -1) {
        userData[userId].waitingForServerName = serverId;
        
        await ctx.editMessageText(`
✏️ *تغيير اسم السيرفر*

🌐 السيرفر الحالي: ${servers[serverIndex].ip}:${servers[serverIndex].port}

📝 *اكتب الاسم الجديد للسيرفر:*

👇 *اكتب الآن:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "❌ إلغاء", callback_data: `server_${serverId}` }
                    ]
                ]
            }
        });
    }
});

// 🗑️ حذف سيرفر
bot.action(/^delete_/, async (ctx) => {
    await ctx.answerCbQuery();
    
    const serverId = ctx.callbackQuery.data.split('_')[1];
    const userId = ctx.from.id.toString();
    
    await ctx.editMessageText(`
🗑️ *حذف السيرفر*

⚠️ **هل أنت متأكد من الحذف؟**

❌ *هذا الإجراء لا يمكن التراجع عنه*

👇 *تأكيد:*
    `.trim(), {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "✅ نعم، احذف", callback_data: `confirm_delete_${serverId}` },
                    { text: "❌ لا، إلغاء", callback_data: `server_${serverId}` }
                ]
            ]
        }
    });
});

// تأكيد الحذف
bot.action(/^confirm_delete_/, async (ctx) => {
    await ctx.answerCbQuery('جاري الحذف...');
    
    const serverId = ctx.callbackQuery.data.split('_')[2];
    const userId = ctx.from.id.toString();
    
    if (userData[userId] && userData[userId].servers) {
        userData[userId].servers = userData[userId].servers.filter(s => s.id != serverId);
        saveData();
        
        await ctx.editMessageText(`
✅ *تم حذف السيرفر*

🗑️ تم إزالة السيرفر من قائمتك.

👇 *العودة للقائمة:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📋 سيرفراتي", callback_data: "my_servers" },
                        { text: "🏠 الرئيسية", callback_data: "main_menu" }
                    ]
                ]
            }
        });
    }
});

// 🏠 العودة للرئيسية
bot.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.callbackQuery.data = null;
    bot.start(ctx);
});

// استقبال أسماء السيرفرات
bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const text = ctx.message.text.trim();
    
    if (userData[userId] && userData[userId].waitingForServerName) {
        const serverId = userData[userId].waitingForServerName;
        delete userData[userId].waitingForServerName;
        
        const servers = userData[userId].servers;
        const serverIndex = servers.findIndex(s => s.id == serverId);
        
        if (serverIndex !== -1 && text.length > 0) {
            servers[serverIndex].name = text;
            saveData();
            
            await ctx.reply(`
✅ *تم تغيير اسم السيرفر!*

🔄 **الاسم الجديد:** ${text}

👇 *العودة لإدارة السيرفر:*
            `.trim(), {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🎮 إدارة السيرفر", callback_data: `server_${serverId}` },
                            { text: "📋 كل السيرفرات", callback_data: "my_servers" }
                        ]
                    ]
                }
            });
        }
    }
});

// 🆘 المساعدة
bot.help(async (ctx) => {
    await ctx.reply(`
🆘 *كيفية الاستخدام:*

1️⃣ *أضف سيرفر:* اضغط ➕ ثم اكتب ip:port
2️⃣ *شاهد سيرفراتك:* اضغط 📋
3️⃣ *غير اسم البوت:* اضغط ✏️ ثم اكتب الاسم الجديد

📌 *أمثلة:*
• play.example.com:19132
• mc.server.com:25565
• 192.168.1.100:25565

🎮 *بعدها البوتات تعمل تلقائياً باسمك المختار*
    `.trim(), {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🏠 ابدأ الآن", callback_data: "main_menu" }
                ]
            ]
        }
    });
});

// 🔧 معالجة الأخطاء
bot.catch((err, ctx) => {
    console.error('❌ خطأ:', err.message);
    if (ctx && ctx.reply) {
        ctx.reply('⚠️ حدث خطأ، جرب مرة أخرى', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔄 حاول مرة أخرى", callback_data: "main_menu" }
                    ]
                ]
            }
        });
    }
});

// 🚀 تشغيل البوت
bot.launch()
    .then(() => {
        console.log('✅ البوت يعمل بنجاح!');
        console.log('🎯 واجهة بسيطة: إضافة، سيرفراتي، تغيير اسم');
        console.log('📱 أرسل /start للبدء');
    })
    .catch(err => {
        console.error('💥 فشل التشغيل:', err.message);
    });

// 💾 حفظ البيانات عند الإيقاف
process.once('SIGINT', () => {
    console.log('💾 حفظ البيانات...');
    saveData();
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    console.log('💾 حفظ البيانات...');
    saveData();
    bot.stop('SIGTERM');
});
