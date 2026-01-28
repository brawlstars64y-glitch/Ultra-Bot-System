const { Telegraf } = require('telegraf');
const mineflayer = require('mineflayer');

// ⚠️ التوكن - تغييره لاحقاً
const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// قاعدة بيانات السيرفرات (تخزين مؤقت)
let userServers = {};
let activeBots = {};

// واجهة إضافة سيرفر
async function showAddServerMenu(ctx, userId) {
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🌍 إضافة سيرفر جديد", callback_data: "add_new_server" }],
                [{ text: "📋 سيرفراتي", callback_data: "my_servers" }],
                [{ text: "🚀 تشغيل البوتات", callback_data: "start_bots" }],
                [{ text: "🛑 إيقاف البوتات", callback_data: "stop_bots" }]
            ]
        }
    };
    
    await ctx.reply(`🎮 *لوحة تحكم سيرفرات بيدروك*
    
📌 *مميزات النظام:*
✅ دعم إصدارات بيدروك 1.21.x
✅ إضافة سيرفرات متعددة
✅ تشغيل بوتات لكل سيرفر
✅ واجهة سهلة الاستخدام

👇 اختر من الأزرار أدناه:`, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// إنشاء بوت لسيرفر
function createServerBot(serverId, serverInfo, botName) {
    try {
        const botInstance = mineflayer.createBot({
            host: serverInfo.host,
            port: serverInfo.port,
            username: botName || `PedrockBot_${Date.now()}`,
            version: serverInfo.version || '1.21.132',
            auth: 'offline'
        });

        botInstance.on('login', () => {
            console.log(`✅ ${botInstance.username} دخل ${serverInfo.name}`);
        });

        botInstance.on('spawn', () => {
            console.log(`📍 ${botInstance.username} ظهر في ${serverInfo.name}`);
            
            // حركات دورية
            setInterval(() => {
                if (botInstance.entity) {
                    // حركات عشوائية
                    const actions = ['jump', 'forward', 'back', 'left', 'right'];
                    const action = actions[Math.floor(Math.random() * actions.length)];
                    
                    if (action === 'jump') {
                        botInstance.setControlState('jump', true);
                        setTimeout(() => botInstance.setControlState('jump', false), 300);
                    } else {
                        botInstance.setControlState(action, true);
                        setTimeout(() => botInstance.setControlState(action, false), 1000);
                    }
                    
                    // تحريك الرأس
                    botInstance.look(Math.random() * 360, Math.random() * 30);
                }
            }, 60000); // كل دقيقة
        });

        botInstance.on('end', () => {
            console.log(`🔌 ${botInstance.username} انقطع - إعادة الاتصال...`);
            setTimeout(() => {
                createServerBot(serverId, serverInfo, botInstance.username);
            }, 15000);
        });

        botInstance.on('error', (err) => {
            console.log(`⚠️ خطأ في ${botInstance.username}:`, err.message);
        });

        return botInstance;
    } catch (err) {
        console.log('❌ فشل إنشاء بوت:', err.message);
        return null;
    }
}

// أمر البدء
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    
    // تهيئة المستخدم الجديد
    if (!userServers[userId]) {
        userServers[userId] = {
            username: username,
            servers: [],
            createdAt: new Date().toISOString()
        };
    }
    
    await ctx.reply(`🎮 *أهلاً ${username}!*
    
مرحباً بك في نظام إدارة سيرفرات بيدروك!

📡 *ماذا يمكنك فعل؟:*
1. إضافة سيرفرات بيدروك
2. إدارة سيرفراتك
3. تشغيل بوتات وهمية
4. مراقبة سيرفراتك`, {
        parse_mode: 'Markdown'
    });
    
    await showAddServerMenu(ctx, userId);
});

// معالجة الأزرار
bot.action('add_new_server', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    
    await ctx.reply(`📝 *إضافة سيرفر جديد*
    
أرسل معلومات السيرفر بالشكل التالي:

🌐 *التنسيق:*
اسم السيرفر
الايبي (IP)
البورت (Port)
الإصدار (مثال: 1.21.132)

📌 *مثال:*
سيرفر الإبداع
play.pedrock.com
19132
1.21.130

👇 أرسل المعلومات الآن:`, {
        parse_mode: 'Markdown'
    });
    
    // الانتظار لإدخال السيرفر
    bot.on('text', async (nextCtx) => {
        const text = nextCtx.message.text;
        const userId = nextCtx.from.id;
        
        if (text.includes('\n')) {
            const lines = text.split('\n');
            if (lines.length >= 4) {
                const serverInfo = {
                    id: Date.now(),
                    name: lines[0].trim(),
                    host: lines[1].trim(),
                    port: parseInt(lines[2].trim()) || 19132,
                    version: lines[3].trim() || '1.21.132',
                    addedAt: new Date().toISOString()
                };
                
                // حفظ السيرفر
                if (!userServers[userId]) {
                    userServers[userId] = { servers: [] };
                }
                
                userServers[userId].servers.push(serverInfo);
                
                await nextCtx.reply(`✅ *تمت إضافة السيرفر بنجاح!*
                
📛 الاسم: ${serverInfo.name}
🌐 الأيبي: ${serverInfo.host}
🔌 البورت: ${serverInfo.port}
🎮 الإصدار: ${serverInfo.version}

📌 *اختر ماذا تريد فعل:*`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "🤖 تشغيل بوتات", callback_data: `start_${serverInfo.id}` },
                                { text: "❌ حذف", callback_data: `delete_${serverInfo.id}` }
                            ],
                            [{ text: "📋 العودة للقائمة", callback_data: "back_to_menu" }]
                        ]
                    }
                });
            }
        }
    });
});

// عرض سيرفراتي
bot.action('my_servers', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    
    if (!userServers[userId] || userServers[userId].servers.length === 0) {
        await ctx.editMessageText(`📭 *لا توجد سيرفرات*
        
لم تقم بإضافة أي سيرفرات بعد.
اضغط على "إضافة سيرفر جديد" لبدء الإضافة.`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🌍 إضافة سيرفر", callback_data: "add_new_server" }],
                    [{ text: "🔙 رجوع", callback_data: "back_to_menu" }]
                ]
            }
        });
        return;
    }
    
    let message = `📋 *سيرفراتي (${userServers[userId].servers.length})*\n\n`;
    
    userServers[userId].servers.forEach((server, index) => {
        const hasBots = activeBots[server.id] ? `🤖 ${activeBots[server.id].length} بوت` : '🛑 بدون بوتات';
        message += `${index + 1}. *${server.name}*
🌐 ${server.host}:${server.port}
🎮 ${server.version}
${hasBots}\n\n`;
    });
    
    // أزرار السيرفرات
    const buttons = userServers[userId].servers.map(server => [
        { 
            text: `🚀 ${server.name}`, 
            callback_data: `server_${server.id}` 
        }
    ]);
    
    buttons.push([{ text: "🔙 رجوع", callback_data: "back_to_menu" }]);
    
    await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: buttons
        }
    });
});

// عرض تفاصيل سيرفر
bot.action(/^server_/, async (ctx) => {
    await ctx.answerCbQuery();
    const serverId = ctx.match.input.split('_')[1];
    const userId = ctx.from.id;
    
    const server = userServers[userId].servers.find(s => s.id == serverId);
    
    if (!server) {
        await ctx.editMessageText("❌ السيرفر غير موجود", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔙 رجوع", callback_data: "my_servers" }]
                ]
            }
        });
        return;
    }
    
    const serverBots = activeBots[serverId] || [];
    
    await ctx.editMessageText(`🎮 *${server.name}*
    
📡 *المعلومات:*
🌐 الأيبي: ${server.host}
🔌 البورت: ${server.port}
🎮 الإصدار: ${server.version}
📅 أضيف في: ${new Date(server.addedAt).toLocaleDateString()}

🤖 *البوتات النشطة:* ${serverBots.length}`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🤖 تشغيل 2 بوت", callback_data: `start2_${serverId}` },
                    { text: "🤖 تشغيل 5 بوت", callback_data: `start5_${serverId}` }
                ],
                [
                    { text: serverBots.length > 0 ? "🛑 إيقاف البوتات" : "⚡ لا توجد بوتات", 
                      callback_data: `stop_${serverId}`,
                      disabled: serverBots.length === 0 }
                ],
                [
                    { text: "✏️ تعديل", callback_data: `edit_${serverId}` },
                    { text: "🗑️ حذف", callback_data: `delete_${serverId}` }
                ],
                [{ text: "🔙 رجوع", callback_data: "my_servers" }]
            ]
        }
    });
});

// تشغيل البوتات
bot.action(/^start/, async (ctx) => {
    await ctx.answerCbQuery();
    const parts = ctx.match.input.split('_');
    const count = parts[0] === 'start2' ? 2 : parts[0] === 'start5' ? 5 : 1;
    const serverId = parts[1];
    const userId = ctx.from.id;
    
    const server = userServers[userId].servers.find(s => s.id == serverId);
    
    if (!server) {
        await ctx.reply("❌ السيرفر غير موجود");
        return;
    }
    
    await ctx.editMessageText(`🚀 جاري تشغيل ${count} بوت لسيرفر ${server.name}...`);
    
    // إيقاف البوتات القديمة إن وجدت
    if (activeBots[serverId]) {
        activeBots[serverId].forEach(bot => {
            try { bot.quit(); } catch {}
        });
    }
    
    // إنشاء بوتات جديدة
    activeBots[serverId] = [];
    for (let i = 1; i <= count; i++) {
        setTimeout(() => {
            const botInstance = createServerBot(serverId, server, `${server.name}_Bot${i}`);
            if (botInstance) {
                activeBots[serverId].push(botInstance);
            }
        }, i * 3000);
    }
    
    setTimeout(async () => {
        await ctx.editMessageText(`✅ *تم تشغيل البوتات بنجاح!*
        
🎮 السيرفر: ${server.name}
🤖 عدد البوتات: ${count}
🌐 ${server.host}:${server.port}

✅ البوتات تعمل الآن وستبقى نشطة 24/7`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📋 العودة للسيرفر", callback_data: `server_${serverId}` }],
                    [{ text: "🏠 الرئيسية", callback_data: "back_to_menu" }]
                ]
            }
        });
    }, count * 3000 + 2000);
});

// إيقاف البوتات
bot.action(/^stop_/, async (ctx) => {
    await ctx.answerCbQuery();
    const serverId = ctx.match.input.split('_')[1];
    const userId = ctx.from.id;
    
    const server = userServers[userId].servers.find(s => s.id == serverId);
    
    if (!server) {
        await ctx.reply("❌ السيرفر غير موجود");
        return;
    }
    
    if (activeBots[serverId] && activeBots[serverId].length > 0) {
        // إيقاف جميع البوتات
        activeBots[serverId].forEach(bot => {
            try { bot.quit(); } catch {}
        });
        activeBots[serverId] = [];
        
        await ctx.editMessageText(`✅ *تم إيقاف جميع البوتات*
        
🎮 السيرفر: ${server.name}
🛑 توقف: جميع البوتات`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📋 العودة للسيرفر", callback_data: `server_${serverId}` }],
                    [{ text: "🏠 الرئيسية", callback_data: "back_to_menu" }]
                ]
            }
        });
    }
});

// حذف سيرفر
bot.action(/^delete_/, async (ctx) => {
    await ctx.answerCbQuery();
    const serverId = ctx.match.input.split('_')[1];
    const userId = ctx.from.id;
    
    // إيقاف البوتات إن وجدت
    if (activeBots[serverId]) {
        activeBots[serverId].forEach(bot => {
            try { bot.quit(); } catch {}
        });
        delete activeBots[serverId];
    }
    
    // حذف السيرفر
    userServers[userId].servers = userServers[userId].servers.filter(s => s.id != serverId);
    
    await ctx.editMessageText(`🗑️ *تم حذف السيرفر بنجاح*
    
✅ تم إزالة السيرفر من قائمتك
🛑 تم إيقاف جميع البوتات المرتبطة به`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: "📋 سيرفراتي", callback_data: "my_servers" }],
                [{ text: "🏠 الرئيسية", callback_data: "back_to_menu" }]
            ]
        }
    });
});

// العودة للقائمة
bot.action('back_to_menu', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    await ctx.deleteMessage();
    await showAddServerMenu(ctx, userId);
});

// تشغيل البوتات لجميع السيرفرات
bot.action('start_bots', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    
    if (!userServers[userId] || userServers[userId].servers.length === 0) {
        await ctx.reply("❌ لا توجد سيرفرات لبدء البوتات");
        return;
    }
    
    await ctx.editMessageText("🚀 جاري تشغيل البوتات لجميع السيرفرات...");
    
    let startedCount = 0;
    for (const server of userServers[userId].servers) {
        if (!activeBots[server.id] || activeBots[server.id].length === 0) {
            activeBots[server.id] = [];
            for (let i = 1; i <= 2; i++) {
                const botInstance = createServerBot(server.id, server, `${server.name}_AutoBot${i}`);
                if (botInstance) {
                    activeBots[server.id].push(botInstance);
                }
            }
            startedCount++;
        }
    }
    
    await ctx.editMessageText(`✅ *تم تشغيل البوتات*
    
🎮 عدد السيرفرات: ${userServers[userId].servers.length}
🤖 تم البدء في: ${startedCount} سيرفر
✅ البوتات تعمل الآن على جميع السيرفرات`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: "📋 سيرفراتي", callback_data: "my_servers" }],
                [{ text: "🏠 الرئيسية", callback_data: "back_to_menu" }]
            ]
        }
    });
});

// إيقاف جميع البوتات
bot.action('stop_bots', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    
    let stoppedCount = 0;
    for (const serverId in activeBots) {
        if (activeBots[serverId].length > 0) {
            activeBots[serverId].forEach(bot => {
                try { bot.quit(); } catch {}
            });
            activeBots[serverId] = [];
            stoppedCount++;
        }
    }
    
    await ctx.editMessageText(`🛑 *تم إيقاف جميع البوتات*
    
✅ تم إيقاف: ${stoppedCount} سيرفر
🛑 جميع البوتات متوقفة الآن`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: "📋 سيرفراتي", callback_data: "my_servers" }],
                [{ text: "🏠 الرئيسية", callback_data: "back_to_menu" }]
            ]
        }
    });
});

// تشغيل البوت
console.log('🚀 بدء تشغيل نظام إدارة سيرفرات بيدروك...');
bot.launch()
    .then(() => {
        console.log('✅ النظام يعمل بنجاح!');
    })
    .catch(err => {
        console.error('❌ خطأ:', err);
    });

// إغلاق نظيف
process.once('SIGINT', () => {
    console.log('\n🛑 إيقاف النظام...');
    
    // إيقاف جميع البوتات
    for (const serverId in activeBots) {
        activeBots[serverId].forEach(bot => {
            try { bot.quit(); } catch {}
        });
    }
    
    bot.stop('SIGINT');
    process.exit(0);
});
