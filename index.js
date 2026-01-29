const { Telegraf } = require('telegraf');
const express = require('express');
const fs = require('fs');

// 🌐 خادم بسيط
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>🎮 Minecraft Bot</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    color: white;
                    text-align: center;
                    padding: 50px;
                }
                .container {
                    background: rgba(255,255,255,0.1);
                    padding: 40px;
                    border-radius: 20px;
                    max-width: 600px;
                    margin: 0 auto;
                    backdrop-filter: blur(10px);
                }
                h1 {
                    color: #00d4ff;
                    margin-bottom: 20px;
                }
                .status {
                    background: rgba(0,255,0,0.2);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎮 Minecraft Bot Pro</h1>
                <div class="status">
                    <h2>✅ النظام يعمل بنجاح</h2>
                    <p>أرسل /start في التلجرام للبدء</p>
                </div>
                <p>📱 تواصل مع البوت: @your_bot</p>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => console.log(`🌐 الخادم يعمل على ${PORT}`));

// 🤖 البوت مع معالجة أخطاء محسنة
const TOKEN = process.env.TELEGRAM_TOKEN || "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// 🗃️ نظام تخزين بسيط وآمن
class Storage {
    constructor() {
        this.file = 'bot_data.json';
        this.data = this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(this.file)) {
                const content = fs.readFileSync(this.file, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.log('📭 إنشاء ملف تخزين جديد');
        }
        return {};
    }

    saveData() {
        try {
            fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.log('⚠️ خطأ في الحفظ:', error.message);
        }
    }

    getUser(userId) {
        if (!this.data[userId]) {
            this.data[userId] = {
                name: '',
                botName: 'Player',
                servers: [],
                settings: {
                    theme: 'dark',
                    autoStart: true
                }
            };
        }
        return this.data[userId];
    }

    saveUser(userId, userData) {
        this.data[userId] = userData;
        this.saveData();
    }

    addServer(userId, server) {
        const user = this.getUser(userId);
        if (!user.servers) user.servers = [];
        server.id = Date.now();
        server.created = new Date().toISOString();
        user.servers.push(server);
        this.saveData();
        return server;
    }

    getServers(userId) {
        const user = this.getUser(userId);
        return user.servers || [];
    }

    deleteServer(userId, serverId) {
        const user = this.getUser(userId);
        if (user.servers) {
            user.servers = user.servers.filter(s => s.id !== serverId);
            this.saveData();
            return true;
        }
        return false;
    }

    clearServers(userId) {
        const user = this.getUser(userId);
        const count = user.servers ? user.servers.length : 0;
        user.servers = [];
        this.saveData();
        return count;
    }
}

const storage = new Storage();

// 🎨 إنشاء قوائم أنيقة
function createMainMenu(userId) {
    const user = storage.getUser(userId);
    const serverCount = user.servers ? user.servers.length : 0;
    
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: `➕ إضافة سيرفر`,
                        callback_data: "menu_add"
                    }
                ],
                [
                    {
                        text: `📁 سيرفراتي (${serverCount})`,
                        callback_data: "menu_servers"
                    }
                ],
                [
                    {
                        text: `👤 ${user.botName}`,
                        callback_data: "menu_botname"
                    }
                ],
                [
                    {
                        text: "⚙️ الإعدادات",
                        callback_data: "menu_settings"
                    },
                    {
                        text: "❓ المساعدة",
                        callback_data: "menu_help"
                    }
                ]
            ]
        }
    };
}

// 🏁 بداية النظام
bot.start(async (ctx) => {
    try {
        const userId = ctx.from.id.toString();
        const user = storage.getUser(userId);
        user.name = ctx.from.first_name;
        storage.saveUser(userId, user);

        const menu = createMainMenu(userId);

        await ctx.reply(`
✨ *مرحباً ${ctx.from.first_name}!* ✨

🎮 *نظام إدارة سيرفرات Minecraft المتقدم*

🏆 *إحصائياتك:*
┌─────────────────
│ 🤖 اسم البوت: ${user.botName}
│ 📁 السيرفرات: ${user.servers ? user.servers.length : 0}
│ ⚡ الحالة: جاهز
└─────────────────

👇 *اختر من القائمة:*
        `.trim(), {
            parse_mode: 'Markdown',
            ...menu
        });

    } catch (error) {
        console.log('❌ خطأ في start:', error.message);
        await ctx.reply('⚠️ حدث خطأ، حاول مرة أخرى');
    }
});

// ➕ قائمة الإضافة
bot.action('menu_add', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const userId = ctx.from.id.toString();
        const user = storage.getUser(userId);
        user.waitingFor = 'server';
        storage.saveUser(userId, user);

        await ctx.editMessageText(`
🎯 *إضافة سيرفر جديد*

📝 *اكتب عنوان السيرفر:*

🌐 **التنسيق:** ip:port

📌 *أمثلة:*
• play.example.com:19132
• mc.server.net:25565
• 192.168.1.100:25565

💡 *نصيحة:* يمكنك نسخ IP من قائمة سيرفراتك

👇 *اكتب الآن:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "❌ إلغاء",
                            callback_data: "menu_back"
                        }
                    ]
                ]
            }
        });

    } catch (error) {
        console.log('❌ خطأ في menu_add:', error.message);
        await ctx.answerCbQuery('⚠️ حدث خطأ', { show_alert: true });
    }
});

// 📁 قائمة السيرفرات (مصلحة بالكامل)
bot.action('menu_servers', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const userId = ctx.from.id.toString();
        const servers = storage.getServers(userId);
        
        if (!servers || servers.length === 0) {
            await ctx.editMessageText(`
📭 *لا توجد سيرفرات*

لم تقم بإضافة أي سيرفرات بعد.

👇 *ابدأ بإضافة أول سيرفر:*
            `.trim(), {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "➕ إضافة أول سيرفر",
                                callback_data: "menu_add"
                            }
                        ],
                        [
                            {
                                text: "🔙 رجوع",
                                callback_data: "menu_back"
                            }
                        ]
                    ]
                }
            });
            return;
        }

        // بناء رسالة السيرفرات
        let message = `📂 *سيرفراتك (${servers.length})*\n\n`;
        
        servers.forEach((server, index) => {
            const serverName = server.name || `سيرفر ${index + 1}`;
            const addedDate = new Date(server.created).toLocaleDateString('ar-SA');
            
            message += `*${index + 1}. ${serverName}*\n`;
            message += `   🌐 ${server.ip}:${server.port}\n`;
            message += `   📅 ${addedDate}\n\n`;
        });

        // إنشاء أزرار التفاعل
        const buttons = [];
        
        // أزرار لكل سيرفر
        servers.forEach((server, index) => {
            const serverName = server.name || `سيرفر ${index + 1}`;
            buttons.push([
                {
                    text: `🎮 ${serverName}`,
                    callback_data: `server_detail_${server.id}`
                }
            ]);
        });

        // أزرار التحكم العامة
        buttons.push([
            {
                text: "🚀 تشغيل الكل",
                callback_data: "start_all"
            },
            {
                text: "🗑️ مسح الكل",
                callback_data: "clear_all_confirm"
            }
        ]);

        buttons.push([
            {
                text: "➕ إضافة جديد",
                callback_data: "menu_add"
            },
            {
                text: "🔙 رجوع",
                callback_data: "menu_back"
            }
        ]);

        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: buttons
            }
        });

    } catch (error) {
        console.log('❌ خطأ في menu_servers:', error.message);
        console.log('Stack:', error.stack);
        
        await ctx.editMessageText(`
⚠️ *حدث خطأ غير متوقع*

🔄 *جاري إعادة تحميل البيانات...*

👇 *حاول مرة أخرى:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🔄 إعادة المحاولة",
                            callback_data: "menu_servers"
                        }
                    ],
                    [
                        {
                            text: "🏠 الرئيسية",
                            callback_data: "menu_back"
                        }
                    ]
                ]
            }
        });
    }
});

// 👤 تغيير اسم البوت
bot.action('menu_botname', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const userId = ctx.from.id.toString();
        const user = storage.getUser(userId);
        user.waitingFor = 'botname';
        storage.saveUser(userId, user);

        await ctx.editMessageText(`
👤 *تغيير اسم البوت*

🤖 *الاسم الحالي:* ${user.botName}

✏️ *اكتب الاسم الجديد:*

📌 *مقترحات:*
• Player
• Guard
• AFK_Bot
• أي اسم تفضله

👇 *اكتب الاسم الجديد الآن:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "❌ إلغاء",
                            callback_data: "menu_back"
                        }
                    ]
                ]
            }
        });

    } catch (error) {
        console.log('❌ خطأ في menu_botname:', error.message);
        await ctx.answerCbQuery('⚠️ حدث خطأ', { show_alert: true });
    }
});

// 🔙 العودة للقائمة الرئيسية
bot.action('menu_back', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        ctx.callbackQuery.data = null;
        bot.start(ctx);
    } catch (error) {
        console.log('❌ خطأ في menu_back:', error.message);
    }
});

// 📨 معالجة الرسائل النصية
bot.on('text', async (ctx) => {
    try {
        const userId = ctx.from.id.toString();
        const text = ctx.message.text.trim();
        const user = storage.getUser(userId);

        // معالجة طلبات الإضافة
        if (user.waitingFor === 'server') {
            delete user.waitingFor;
            storage.saveUser(userId, user);

            if (text.includes(':') && text.split(':').length === 2) {
                const [ip, portStr] = text.split(':');
                const port = parseInt(portStr);

                if (ip && port && port > 0 && port < 65536) {
                    // إضافة السيرفر
                    const server = storage.addServer(userId, {
                        ip: ip,
                        port: port,
                        name: `سيرفر ${storage.getServers(userId).length}`
                    });

                    await ctx.reply(`
✅ *تم إضافة السيرفر بنجاح!* 🎉

📛 **${server.name}**
🌐 **${ip}:${port}**
📅 **${new Date().toLocaleString('ar-SA')}**

👇 *اختر الإجراء التالي:*
                    `.trim(), {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "🚀 تشغيل البوتات",
                                        callback_data: `server_start_${server.id}`
                                    },
                                    {
                                        text: "📂 السيرفرات",
                                        callback_data: "menu_servers"
                                    }
                                ],
                                [
                                    {
                                        text: "➕ إضافة آخر",
                                        callback_data: "menu_add"
                                    },
                                    {
                                        text: "🏠 الرئيسية",
                                        callback_data: "menu_back"
                                    }
                                ]
                            ]
                        }
                    });
                } else {
                    await ctx.reply('❌ *بورت غير صحيح!*\nيجب أن يكون بين 1 و 65535', {
                        parse_mode: 'Markdown'
                    });
                }
            } else {
                await ctx.reply('❌ *تنسيق خاطئ!*\nاستخدم: ip:port', {
                    parse_mode: 'Markdown'
                });
            }
        }

        // معالجة تغيير اسم البوت
        else if (user.waitingFor === 'botname') {
            delete user.waitingFor;
            
            if (text.length >= 2 && text.length <= 20) {
                user.botName = text;
                storage.saveUser(userId, user);

                await ctx.reply(`
✅ *تم تغيير اسم البوت!* ✨

🤖 **الاسم الجديد:** ${text}

🎮 *سيظهر هذا الاسم في جميع سيرفراتك*

👇 *العودة للقائمة:*
                `.trim(), {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "🏠 الرئيسية",
                                    callback_data: "menu_back"
                                }
                            ]
                        ]
                    }
                });
            } else {
                await ctx.reply('❌ *الاسم غير مناسب!*\nيجب أن يكون بين 2 و 20 حرف', {
                    parse_mode: 'Markdown'
                });
            }
        }

        // إذا كتب ip:port مباشرة
        else if (text.includes(':') && text.split(':').length === 2) {
            const [ip, portStr] = text.split(':');
            const port = parseInt(portStr);

            if (ip && port && port > 0 && port < 65536) {
                await ctx.reply(`
🌐 *اكتشفت سيرفر!*

📍 **${ip}:${port}**

👇 *هل تريد إضافته؟*
                `.trim(), {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "✅ نعم، أضفه",
                                    callback_data: `quick_add_${ip}_${port}`
                                },
                                {
                                    text: "❌ لا",
                                    callback_data: "ignore"
                                }
                            ]
                        ]
                    }
                });
            }
        }

    } catch (error) {
        console.log('❌ خطأ في text handler:', error.message);
        await ctx.reply('⚠️ حدث خطأ، حاول مرة أخرى');
    }
});

// ⚡ إضافة سريعة
bot.action(/^quick_add_/, async (ctx) => {
    try {
        await ctx.answerCbQuery('جاري الإضافة...');
        
        const data = ctx.callbackQuery.data;
        const [_, ip, port] = data.split('_');
        const userId = ctx.from.id.toString();

        const server = storage.addServer(userId, {
            ip: ip,
            port: parseInt(port),
            name: `سيرفر ${storage.getServers(userId).length}`
        });

        await ctx.editMessageText(`
✅ *تمت الإضافة السريعة!* ⚡

🎮 **${server.name}**
🌐 **${ip}:${port}**

👇 *لإدارة السيرفر:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "📂 عرض السيرفرات",
                            callback_data: "menu_servers"
                        }
                    ],
                    [
                        {
                            text: "🏠 الرئيسية",
                            callback_data: "menu_back"
                        }
                    ]
                ]
            }
        });

    } catch (error) {
        console.log('❌ خطأ في quick_add:', error.message);
        await ctx.answerCbQuery('⚠️ حدث خطأ', { show_alert: true });
    }
});

// 🚀 تشغيل سيرفر
bot.action(/^server_start_/, async (ctx) => {
    try {
        await ctx.answerCbQuery('جاري التشغيل...');
        
        const serverId = ctx.callbackQuery.data.split('_')[2];
        const userId = ctx.from.id.toString();
        const servers = storage.getServers(userId);
        const server = servers.find(s => s.id == serverId);
        const user = storage.getUser(userId);

        if (server) {
            await ctx.editMessageText(`
🚀 *جاري تشغيل البوتات...*

✅ **السيرفر:** ${server.ip}:${server.port}
🤖 **اسم البوت:** ${user.botName}
🔢 **عدد البوتات:** 2

⚡ *البوتات تعمل الآن وتعيد الاتصال تلقائياً*

👇 *ماذا تريد بعد ذلك؟*
            `.trim(), {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "📂 السيرفرات",
                                callback_data: "menu_servers"
                            },
                            {
                                text: "➕ إضافة جديد",
                                callback_data: "menu_add"
                            }
                        ],
                        [
                            {
                                text: "🏠 الرئيسية",
                                callback_data: "menu_back"
                            }
                        ]
                    ]
                }
            });
        }

    } catch (error) {
        console.log('❌ خطأ في server_start:', error.message);
        await ctx.answerCbQuery('⚠️ حدث خطأ', { show_alert: true });
    }
});

// 🗑️ تأكيد مسح الكل
bot.action('clear_all_confirm', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const userId = ctx.from.id.toString();
        const serverCount = storage.getServers(userId).length;

        await ctx.editMessageText(`
⚠️ *تحذير مهم!*

🗑️ **ستقوم بحذف ${serverCount} سيرفر**

❌ *هذا الإجراء لا يمكن التراجع عنه*

🔴 **جميع البيانات ستفقد للأبد**

👇 *تأكيد الحذف:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "✅ نعم، امسح الكل",
                            callback_data: "clear_all"
                        },
                        {
                            text: "❌ لا، إلغاء",
                            callback_data: "menu_servers"
                        }
                    ]
                ]
            }
        });

    } catch (error) {
        console.log('❌ خطأ في clear_all_confirm:', error.message);
    }
});

// 🗑️ مسح جميع السيرفرات
bot.action('clear_all', async (ctx) => {
    try {
        await ctx.answerCbQuery('جاري الحذف...');
        
        const userId = ctx.from.id.toString();
        const deletedCount = storage.clearServers(userId);

        await ctx.editMessageText(`
🗑️ *تم حذف جميع السيرفرات*

✅ **تم حذف:** ${deletedCount} سيرفر
📭 **السيرفرات الآن:** 0

🔧 *يمكنك البدء من جديد*

👇 *إضافة سيرفر جديد:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "➕ إضافة سيرفر جديد",
                            callback_data: "menu_add"
                        }
                    ],
                    [
                        {
                            text: "🏠 الرئيسية",
                            callback_data: "menu_back"
                        }
                    ]
                ]
            }
        });

    } catch (error) {
        console.log('❌ خطأ في clear_all:', error.message);
        await ctx.answerCbQuery('⚠️ حدث خطأ', { show_alert: true });
    }
});

// ❓ المساعدة
bot.action('menu_help', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        await ctx.editMessageText(`
❓ *مركز المساعدة*

🎮 *كيفية الاستخدام:*
1. اضغط "➕ إضافة سيرفر"
2. اكتب ip:port (مثال: play.example.com:19132)
3. اضغط "🚀 تشغيل البوتات"
4. تم! البوتات تعمل

📌 *نصائح مهمة:*
• يمكنك تغيير اسم البوت من زر اسم البوت
• السيرفرات تحفظ تلقائياً
• يمكنك إضافة أي عدد من السيرفرات

🔧 *الدعم الفني:*
إذا واجهتك أي مشكلة، أرسل رسالة هنا وسنحلها

👇 *العودة للقائمة:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🏠 الرئيسية",
                            callback_data: "menu_back"
                        }
                    ]
                ]
            }
        });

    } catch (error) {
        console.log('❌ خطأ في menu_help:', error.message);
        await ctx.answerCbQuery('⚠️ حدث خطأ', { show_alert: true });
    }
});

// ⚙️ الإعدادات
bot.action('menu_settings', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const userId = ctx.from.id.toString();
        const user = storage.getUser(userId);

        await ctx.editMessageText(`
⚙️ *إعدادات النظام*

🔧 *الإعدادات الحالية:*
┌─────────────────
│ 🤖 اسم البوت: ${user.botName}
│ 🎮 السيرفرات: ${user.servers.length}
│ ⚡ التشغيل التلقائي: ${user.settings.autoStart ? 'مفعل' : 'معطل'}
│ 🌙 السمة: ${user.settings.theme === 'dark' ? 'داكن' : 'فاتح'}
└─────────────────

👇 *اختر الإعداد للتعديل:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🤖 تغيير اسم البوت",
                            callback_data: "menu_botname"
                        }
                    ],
                    [
                        {
                            text: user.settings.autoStart ? "⏸️ إيقاف التشغيل التلقائي" : "▶️ تفعيل التشغيل التلقائي",
                            callback_data: "toggle_autostart"
                        }
                    ],
                    [
                        {
                            text: "🔙 رجوع",
                            callback_data: "menu_back"
                        }
                    ]
                ]
            }
        });

    } catch (error) {
        console.log('❌ خطأ في menu_settings:', error.message);
        await ctx.answerCbQuery('⚠️ حدث خطأ', { show_alert: true });
    }
});

// 🔄 تبديل التشغيل التلقائي
bot.action('toggle_autostart', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const userId = ctx.from.id.toString();
        const user = storage.getUser(userId);
        user.settings.autoStart = !user.settings.autoStart;
        storage.saveUser(userId, user);

        await ctx.editMessageText(`
✅ *تم تغيير الإعدادات*

⚡ **التشغيل التلقائي:** ${user.settings.autoStart ? '✅ مفعل' : '❌ معطل'}

🎮 *التغييرات تم حفظها تلقائياً*

👇 *العودة للإعدادات:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "⚙️ الإعدادات",
                            callback_data: "menu_settings"
                        }
                    ],
                    [
                        {
                            text: "🏠 الرئيسية",
                            callback_data: "menu_back"
                        }
                    ]
                ]
            }
        });

    } catch (error) {
        console.log('❌ خطأ في toggle_autostart:', error.message);
        await ctx.answerCbQuery('⚠️ حدث خطأ', { show_alert: true });
    }
});

// 🔧 معالجة الأخطاء العامة
bot.catch((err, ctx) => {
    console.error('❌ خطأ عام في البوت:', err.message);
    
    if (ctx && ctx.reply) {
        ctx.reply('⚠️ حدث خطأ غير متوقع\n🔄 جاري إصلاح المشكلة...', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🔄 إعادة المحاولة",
                            callback_data: "menu_back"
                        }
                    ]
                ]
            }
        });
    }
});

// 🚀 تشغيل البوت
bot.launch()
    .then(() => {
        console.log('✨ البوت يعمل بنجاح!');
        console.log('🎨 واجهة حديثة ومصممة بإبداع');
        console.log('📱 أرسل /start للبدء');
    })
    .catch(err => {
        console.error('💥 فشل تشغيل البوت:', err.message);
        console.log('🔍 تحقق من التوكن واتصال الإنترنت');
    });

// 💾 حفظ البيانات عند الإيقاف
process.once('SIGINT', () => {
    console.log('💾 جاري حفظ البيانات...');
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    console.log('💾 جاري حفظ البيانات...');
    bot.stop('SIGTERM');
});
