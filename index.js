const { Telegraf } = require('telegraf');
const express = require('express');
const fs = require('fs');

// خادم بسيط
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.json({ status: 'online' }));
app.listen(PORT, () => console.log(`🚀 الخادم يعمل`));

// البوت
const TOKEN = process.env.TELEGRAM_TOKEN || "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// تخزين
const STORAGE_FILE = 'mc_data.json';
let userData = {};

// تحميل البيانات
if (fs.existsSync(STORAGE_FILE)) {
    try {
        const data = fs.readFileSync(STORAGE_FILE, 'utf8');
        userData = JSON.parse(data);
        console.log(`📂 تم تحميل ${Object.keys(userData).length} مستخدم`);
    } catch (error) {
        console.log('📭 إنشاء ملف تخزين جديد');
        userData = {};
    }
}

// حفظ البيانات
function saveData() {
    try {
        fs.writeFileSync(STORAGE_FILE, JSON.stringify(userData));
        console.log('💾 تم الحفظ');
    } catch (error) {
        console.log('⚠️ خطأ في الحفظ:', error.message);
    }
}

// 🏁 القائمة الرئيسية
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    
    if (!userData[userId]) {
        userData[userId] = {
            name: ctx.from.first_name,
            botName: "Player",
            servers: []
        };
        saveData();
    }
    
    const serverCount = userData[userId].servers.length;
    
    const menu = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "➕ أضف سيرفر", callback_data: "add_server" },
                    { text: `📋 سيرفراتي (${serverCount})`, callback_data: "my_servers" }
                ],
                [
                    { text: "✏️ تغيير اسم البوت", callback_data: "change_bot_name" }
                ]
            ]
        }
    };
    
    await ctx.reply(`
🎮 *مرحباً ${ctx.from.first_name}!*

🤖 *اسم البوت:* ${userData[userId].botName}
📊 *السيرفرات:* ${serverCount}

👇 *اختر:*
    `.trim(), {
        parse_mode: 'Markdown',
        ...menu
    });
});

// ➕ إضافة سيرفر
bot.action('add_server', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const userId = ctx.from.id.toString();
        userData[userId].waitingForIP = true;
        saveData();
        
        await ctx.editMessageText(`
📝 *أضف سيرفر جديد*

✏️ *اكتب:* ip:port

🌐 *مثال:* play.example.com:19132

👇 *اكتب الآن:*
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
    } catch (error) {
        console.log('❌ خطأ في add_server:', error.message);
        await ctx.answerCbQuery('حدث خطأ، حاول مرة أخرى', { show_alert: true });
    }
});

// 📋 سيرفراتي - تم الإصلاح هنا
bot.action('my_servers', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const userId = ctx.from.id.toString();
        
        // التأكد من وجود بيانات المستخدم
        if (!userData[userId]) {
            userData[userId] = {
                name: ctx.from.first_name,
                botName: "Player",
                servers: []
            };
            saveData();
        }
        
        const servers = userData[userId].servers || [];
        
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
                            { text: "➕ أضف سيرفر الآن", callback_data: "add_server" }
                        ],
                        [
                            { text: "🏠 الرئيسية", callback_data: "main_menu" }
                        ]
                    ]
                }
            });
            return;
        }
        
        // بناء رسالة السيرفرات
        let message = `📋 *سيرفراتك (${servers.length})*\n\n`;
        
        servers.forEach((server, index) => {
            message += `*${index + 1}. ${server.name || `سيرفر ${index + 1}`}*\n`;
            message += `🌐 ${server.ip}:${server.port}\n`;
            message += `📅 ${server.added || 'مؤخراً'}\n\n`;
        });
        
        // إنشاء أزرار بسيطة
        const buttons = [];
        
        // زر لكل سيرفر
        servers.forEach((server) => {
            buttons.push([
                {
                    text: `🎮 ${server.name || server.ip}`,
                    callback_data: `view_${server.id}`
                }
            ]);
        });
        
        // أزرار إضافية
        buttons.push([
            { text: "➕ أضف جديد", callback_data: "add_server" },
            { text: "🗑️ مسح الكل", callback_data: "delete_all_confirm" }
        ]);
        
        buttons.push([{ text: "🏠 الرئيسية", callback_data: "main_menu" }]);
        
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: buttons
            }
        });
        
    } catch (error) {
        console.log('❌ خطأ في my_servers:', error.message);
        console.log('تفاصيل الخطأ:', error.stack);
        
        try {
            await ctx.editMessageText(`
⚠️ *حدث خطأ في تحميل السيرفرات*

🔄 *جاري إصلاح المشكلة...*

👇 *حاول مرة أخرى:*
            `.trim(), {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🔄 حاول مرة أخرى", callback_data: "my_servers" }
                        ],
                        [
                            { text: "🏠 الرئيسية", callback_data: "main_menu" }
                        ]
                    ]
                }
            });
        } catch (e) {
            // إذا فشل editMessageText
            await ctx.answerCbQuery('❌ حدث خطأ، أرسل /start', { show_alert: true });
        }
    }
});

// ✏️ تغيير اسم البوت
bot.action('change_bot_name', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const userId = ctx.from.id.toString();
        const currentName = userData[userId] ? userData[userId].botName : "Player";
        
        userData[userId].waitingForBotName = true;
        saveData();
        
        await ctx.editMessageText(`
✏️ *تغيير اسم البوت*

🤖 *الاسم الحالي:* ${currentName}

📝 *اكتب الاسم الجديد:*

👇 *اكتب الآن:*
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
    } catch (error) {
        console.log('❌ خطأ في change_bot_name:', error.message);
        await ctx.answerCbQuery('حدث خطأ', { show_alert: true });
    }
});

// 🏠 العودة للرئيسية
bot.action('main_menu', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        // استخدام start بدلاً من editMessageText
        ctx.callbackQuery = null;
        ctx.message = { ...ctx.callbackQuery.message, text: '/start' };
        await bot.handleUpdate({ 
            ...ctx.update, 
            message: { 
                ...ctx.callbackQuery.message, 
                text: '/start',
                entities: [{ type: 'bot_command', offset: 0, length: 6 }]
            }
        });
    } catch (error) {
        console.log('❌ خطأ في main_menu:', error.message);
        await ctx.answerCbQuery('حدث خطأ، أرسل /start', { show_alert: true });
    }
});

// 📨 استقبال الرسائل النصية
bot.on('text', async (ctx) => {
    try {
        const userId = ctx.from.id.toString();
        const text = ctx.message.text.trim();
        
        if (!userData[userId]) {
            userData[userId] = {
                name: ctx.from.first_name,
                botName: "Player",
                servers: []
            };
        }
        
        // إذا كان ينتظر إضافة سيرفر
        if (userData[userId].waitingForIP) {
            delete userData[userId].waitingForIP;
            
            if (text.includes(':') && text.split(':').length === 2) {
                const [ip, portStr] = text.split(':');
                const port = parseInt(portStr);
                
                if (ip && port && port > 0 && port < 65536) {
                    const server = {
                        id: Date.now(),
                        ip: ip,
                        port: port,
                        added: new Date().toLocaleString('ar-SA'),
                        name: `سيرفر ${userData[userId].servers.length + 1}`
                    };
                    
                    if (!Array.isArray(userData[userId].servers)) {
                        userData[userId].servers = [];
                    }
                    
                    userData[userId].servers.push(server);
                    saveData();
                    
                    await ctx.reply(`
✅ *تم إضافة السيرفر!*

🎮 ${server.name}
🌐 ${ip}:${port}

👇 *اضغط لرؤية سيرفراتك:*
                    `.trim(), {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "📋 سيرفراتي", callback_data: "my_servers" }
                                ]
                            ]
                        }
                    });
                } else {
                    await ctx.reply('❌ *بورت غير صحيح*\nمثال: play.example.com:19132', {
                        parse_mode: 'Markdown'
                    });
                }
            } else {
                await ctx.reply('❌ *تنسيق خاطئ*\nيجب أن يكون: ip:port', {
                    parse_mode: 'Markdown'
                });
            }
        }
        
        // إذا كان ينتظر تغيير اسم البوت
        else if (userData[userId].waitingForBotName) {
            delete userData[userId].waitingForBotName;
            
            if (text.length > 2 && text.length < 20) {
                userData[userId].botName = text;
                saveData();
                
                await ctx.reply(`
✅ *تم تغيير اسم البوت!*

🤖 **الاسم الجديد:** ${text}

👇 *العودة للقائمة:*
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
                await ctx.reply('❌ *الاسم يجب أن يكون بين 3 و 20 حرف*', {
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
🌐 *تلقيت:* ${text}

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

// ➕ إضافة سريعة
bot.action(/^quick_add_/, async (ctx) => {
    try {
        await ctx.answerCbQuery('جاري الإضافة...');
        
        const data = ctx.callbackQuery.data;
        const [_, ip, port] = data.split('_');
        
        const userId = ctx.from.id.toString();
        
        const server = {
            id: Date.now(),
            ip: ip,
            port: parseInt(port),
            added: new Date().toLocaleString('ar-SA'),
            name: `سيرفر ${userData[userId] ? userData[userId].servers.length + 1 : 1}`
        };
        
        if (!userData[userId]) {
            userData[userId] = {
                name: ctx.from.first_name,
                botName: "Player",
                servers: []
            };
        }
        
        userData[userId].servers.push(server);
        saveData();
        
        await ctx.editMessageText(`
✅ *تمت الإضافة السريعة!*

🎮 ${server.name}
🌐 ${ip}:${port}

👇 *لرؤية جميع سيرفراتك:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📋 سيرفراتي", callback_data: "my_servers" }
                    ]
                ]
            }
        });
    } catch (error) {
        console.log('❌ خطأ في quick_add:', error.message);
        await ctx.answerCbQuery('حدث خطأ', { show_alert: true });
    }
});

// ❌ تجاهل
bot.action('ignore', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        await ctx.deleteMessage();
    } catch (error) {
        console.log('❌ خطأ في ignore:', error.message);
    }
});

// 🗑️ تأكيد مسح الكل
bot.action('delete_all_confirm', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const userId = ctx.from.id.toString();
        const serverCount = userData[userId] ? userData[userId].servers.length : 0;
        
        if (serverCount === 0) {
            await ctx.answerCbQuery('لا توجد سيرفرات', { show_alert: true });
            return;
        }
        
        await ctx.editMessageText(`
⚠️ *تحذير!*

🗑️ **ستقوم بحذف ${serverCount} سيرفر**

❌ *لا يمكن التراجع عن هذا الإجراء*

👇 *تأكيد الحذف:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ نعم، امسح الكل", callback_data: "delete_all" },
                        { text: "❌ إلغاء", callback_data: "my_servers" }
                    ]
                ]
            }
        });
    } catch (error) {
        console.log('❌ خطأ في delete_all_confirm:', error.message);
    }
});

// 🗑️ مسح جميع السيرفرات
bot.action('delete_all', async (ctx) => {
    try {
        await ctx.answerCbQuery('جاري الحذف...');
        
        const userId = ctx.from.id.toString();
        const serverCount = userData[userId] ? userData[userId].servers.length : 0;
        
        if (userData[userId]) {
            userData[userId].servers = [];
            saveData();
        }
        
        await ctx.editMessageText(`
🗑️ *تم حذف جميع السيرفرات*

✅ **تم حذف:** ${serverCount} سيرفر
📭 **السيرفرات الآن:** 0

👇 *لإضافة سيرفر جديد:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "➕ أضف سيرفر", callback_data: "add_server" }
                    ]
                ]
            }
        });
    } catch (error) {
        console.log('❌ خطأ في delete_all:', error.message);
    }
});

// 🔧 معالجة الأخطاء العامة
bot.catch((err, ctx) => {
    console.error('❌ خطأ في البوت:', err.message);
    console.error('Stack:', err.stack);
    
    if (ctx && ctx.reply) {
        ctx.reply('⚠️ حدث خطأ غير متوقع، جرب مرة أخرى', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔄 إعادة المحاولة", callback_data: "main_menu" }
                    ]
                ]
            }
        });
    }
});

// 🚀 تشغيل البوت
bot.launch()
    .then(() => {
        console.log('✅ البوت يعمل!');
        console.log('📱 أرسل /start للبدء');
    })
    .catch(err => {
        console.error('💥 فشل تشغيل البوت:', err.message);
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
