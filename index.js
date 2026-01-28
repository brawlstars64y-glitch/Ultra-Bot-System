const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

/* Railway Keep Alive */
http.createServer((req, res) => res.end('MaxBlack Bot')).listen(process.env.PORT || 3000);

/* Telegram Bot */
const bot = new Telegraf('8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU');

/* ✅ تحسين الجلسات */
bot.use(session({
    getSessionKey: (ctx) => `${ctx.from.id}:${ctx.chat.id}`,
    defaultSession: () => ({
        servers: [],
        currentServer: null,
        step: null
    })
}));

// متغيرات عامة
let clients = new Map();
let afkIntervals = new Map();

/* 🎮 القوائم */
function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('➕ إضافة سيرفر', 'add_server')],
        [Markup.button.callback('📋 السيرفرات', 'list_servers')],
        [Markup.button.callback('🗑️ حذف', 'delete_server')],
        [Markup.button.callback('▶️ دخول', 'connect')],
        [Markup.button.callback('⏹️ خروج', 'disconnect')],
        [Markup.button.callback('⚙️ AFK', 'afk_settings')],
        [Markup.button.callback('📊 الحالة', 'status')]
    ]);
}

function serversMenu(servers, action = 'select') {
    const buttons = servers.map((server, index) => [
        Markup.button.callback(`📌 ${server.name}`, `${action}_${index}`)
    ]);
    buttons.push([Markup.button.callback('🔙 رجوع', 'back_main')]);
    return Markup.inlineKeyboard(buttons);
}

/* 🚀 بدء البوت */
bot.start((ctx) => {
    ctx.reply('🎮 **MaxBlack Bot**\nاختر من القائمة:', { 
        parse_mode: 'Markdown',
        reply_markup: mainMenu().reply_markup 
    });
});

/* ➕ إضافة سيرفر */
bot.action('add_server', (ctx) => {
    ctx.answerCbQuery();
    ctx.session.step = 'name';
    ctx.reply('📝 اسم السيرفر:');
});

/* 📋 قائمة السيرفرات */
bot.action('list_servers', (ctx) => {
    ctx.answerCbQuery();
    if (!ctx.session.servers?.length) {
        return ctx.reply('⚠️ لا توجد سيرفرات.', { reply_markup: mainMenu().reply_markup });
    }
    ctx.reply('📋 اختر سيرفر:', { 
        reply_markup: serversMenu(ctx.session.servers).reply_markup 
    });
});

/* 🔙 رجوع */
bot.action('back_main', (ctx) => {
    ctx.answerCbQuery();
    ctx.session.step = null;
    ctx.reply('🏠 القائمة الرئيسية:', { reply_markup: mainMenu().reply_markup });
});

/* 🔘 اختيار سيرفر */
bot.action(/select_(\d+)/, (ctx) => {
    const index = parseInt(ctx.match[1]);
    ctx.answerCbQuery();
    if (ctx.session.servers?.[index]) {
        ctx.session.currentServer = ctx.session.servers[index];
        ctx.reply(`✅ تم اختيار: ${ctx.session.currentServer.name}`);
    }
});

/* ✍️ معالجة الرسائل */
bot.on('text', async (ctx) => {
    if (!ctx.session.step) return;

    const text = ctx.message.text.trim();

    switch (ctx.session.step) {
        case 'name':
            ctx.session.tempServer = { name: text };
            ctx.session.step = 'ip';
            ctx.reply('🌐 IP السيرفر:');
            break;

        case 'ip':
            ctx.session.tempServer.host = text;
            ctx.session.step = 'port';
            ctx.reply('🔢 Port السيرفر:');
            break;

        case 'port':
            const port = parseInt(text);
            if (isNaN(port) || port < 1 || port > 65535) {
                return ctx.reply('⚠️ أدخل رقم بين 1 و 65535:');
            }
            ctx.session.tempServer.port = port;
            ctx.session.step = 'username';
            ctx.reply('👤 اسم البوت:');
            break;

        case 'username':
            ctx.session.tempServer.username = text;
            
            // إضافة السيرفر
            if (!ctx.session.servers) ctx.session.servers = [];
            ctx.session.servers.push({
                ...ctx.session.tempServer,
                id: Date.now()
            });
            
            ctx.session.step = null;
            ctx.session.tempServer = null;
            
            ctx.reply(`✅ تم إضافة السيرفر!`, { 
                reply_markup: mainMenu().reply_markup 
            });
            break;
    }
});

/* ▶️ دخول للسيرفر */
bot.action('connect', async (ctx) => {
    ctx.answerCbQuery();
    
    if (!ctx.session.currentServer) {
        return ctx.reply('⚠️ اختر سيرفراً أولاً.');
    }

    const server = ctx.session.currentServer;
    const serverKey = `${server.host}:${server.port}`;

    if (clients.has(serverKey)) {
        return ctx.reply('⚠️ البوت متصل بالفعل.');
    }

    ctx.reply(`⏳ جاري الدخول إلى ${server.name}...`);

    try {
        const client = bedrock.createClient({
            host: server.host,
            port: server.port,
            username: server.username || `Bot_${Date.now()}`,
            offline: true,
            skipPing: true,
            connectTimeout: 15000,
            version: false
        });

        clients.set(serverKey, { client, server: server.name, connectedAt: new Date() });

        client.on('spawn', () => {
            ctx.reply(`🟢 تم الاتصال بـ ${server.name}!`);
            
            // تشغيل AFK
            const interval = setInterval(() => {
                if (client) {
                    try {
                        client.queue('player_auth_input', {
                            pitch: 0,
                            yaw: Math.random() * 360 - 180,
                            position: { x: 0, y: 0, z: 0 },
                            move_vector: { x: 0, z: 0 },
                            head_yaw: 0,
                            input_data: { jump_down: true },
                            input_mode: 'touch',
                            play_mode: 'normal'
                        });
                    } catch (e) {}
                }
            }, 15000);

            afkIntervals.set(serverKey, interval);
        });

        client.on('error', (err) => {
            ctx.reply(`❌ فشل الاتصال: ${err.message}`);
            cleanup(serverKey);
        });

        client.on('disconnect', () => {
            ctx.reply(`🔴 تم فصل البوت من ${server.name}`);
            cleanup(serverKey);
        });

    } catch (error) {
        ctx.reply(`❌ خطأ: ${error.message}`);
    }
});

/* ⏹️ خروج */
bot.action('disconnect', (ctx) => {
    ctx.answerCbQuery();
    
    if (!ctx.session.currentServer) {
        return ctx.reply('⚠️ اختر سيرفراً أولاً.');
    }

    const server = ctx.session.currentServer;
    const serverKey = `${server.host}:${server.port}`;

    if (!clients.has(serverKey)) {
        return ctx.reply('⚠️ البوت غير متصل.');
    }

    const connection = clients.get(serverKey);
    connection.client.close();
    cleanup(serverKey);
    
    ctx.reply(`🛑 تم إخراج البوت.`);
});

/* ⚙️ إعدادات AFK */
bot.action('afk_settings', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('⚙️ إعدادات AFK:', {
        reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback('▶️ تشغيل AFK', 'afk_on'), 
             Markup.button.callback('⏸️ إيقاف AFK', 'afk_off')],
            [Markup.button.callback('🔙 رجوع', 'back_main')]
        ]).reply_markup
    });
});

bot.action('afk_on', (ctx) => {
    ctx.answerCbQuery();
    
    if (!ctx.session.currentServer) {
        return ctx.reply('⚠️ اختر سيرفراً أولاً.');
    }

    const server = ctx.session.currentServer;
    const serverKey = `${server.host}:${server.port}`;

    if (!clients.has(serverKey)) {
        return ctx.reply('⚠️ البوت غير متصل.');
    }

    if (afkIntervals.has(serverKey)) {
        return ctx.reply('⚠️ AFK مفعل بالفعل.');
    }

    const connection = clients.get(serverKey);
    const interval = setInterval(() => {
        if (connection.client) {
            try {
                connection.client.queue('player_auth_input', {
                    pitch: 0,
                    yaw: Math.random() * 360 - 180,
                    position: { x: 0, y: 0, z: 0 },
                    move_vector: { x: 0, z: 0 },
                    head_yaw: 0,
                    input_data: { jump_down: true },
                    input_mode: 'touch',
                    play_mode: 'normal'
                });
            } catch (e) {}
        }
    }, 15000);

    afkIntervals.set(serverKey, interval);
    ctx.reply('✅ تم تفعيل AFK');
});

bot.action('afk_off', (ctx) => {
    ctx.answerCbQuery();
    
    if (!ctx.session.currentServer) {
        return ctx.reply('⚠️ اختر سيرفراً أولاً.');
    }

    const server = ctx.session.currentServer;
    const serverKey = `${server.host}:${server.port}`;

    if (afkIntervals.has(serverKey)) {
        clearInterval(afkIntervals.get(serverKey));
        afkIntervals.delete(serverKey);
        ctx.reply('✅ تم إيقاف AFK');
    } else {
        ctx.reply('⚠️ AFK غير مفعل.');
    }
});

/* 🗑️ حذف سيرفر */
bot.action('delete_server', (ctx) => {
    ctx.answerCbQuery();
    
    if (!ctx.session.servers?.length) {
        return ctx.reply('⚠️ لا توجد سيرفرات.', { reply_markup: mainMenu().reply_markup });
    }
    
    ctx.reply('🗑️ اختر سيرفر للحذف:', {
        reply_markup: serversMenu(ctx.session.servers, 'delete').reply_markup
    });
});

bot.action(/delete_(\d+)/, (ctx) => {
    const index = parseInt(ctx.match[1]);
    ctx.answerCbQuery();
    
    if (ctx.session.servers?.[index]) {
        const server = ctx.session.servers[index];
        const serverKey = `${server.host}:${server.port}`;
        
        // إغلاق الاتصال إن وجد
        if (clients.has(serverKey)) {
            const connection = clients.get(serverKey);
            connection.client.close();
            cleanup(serverKey);
        }
        
        // حذف السيرفر
        ctx.session.servers.splice(index, 1);
        
        // إذا كان محذوفاً هو الحالي
        if (ctx.session.currentServer?.host === server.host && 
            ctx.session.currentServer?.port === server.port) {
            ctx.session.currentServer = null;
        }
        
        ctx.reply(`🗑️ تم حذف: ${server.name}`, { 
            reply_markup: mainMenu().reply_markup 
        });
    }
});

/* 📊 الحالة */
bot.action('status', (ctx) => {
    ctx.answerCbQuery();
    
    let status = '📊 **حالة البوت:**\n\n';
    
    if (ctx.session.currentServer) {
        const server = ctx.session.currentServer;
        const serverKey = `${server.host}:${server.port}`;
        
        status += `**السيرفر المختار:** ${server.name}\n`;
        status += `📍 ${server.host}:${server.port}\n`;
        
        if (clients.has(serverKey)) {
            const connection = clients.get(serverKey);
            const uptime = Math.floor((new Date() - connection.connectedAt) / 1000);
            const minutes = Math.floor(uptime / 60);
            const hours = Math.floor(minutes / 60);
            
            let uptimeText = '';
            if (hours > 0) uptimeText += `${hours} س `;
            if (minutes % 60 > 0) uptimeText += `${minutes % 60} د `;
            uptimeText += `${uptime % 60} ث`;
            
            status += `🟢 **متصل** (${uptimeText})\n`;
            status += `⏱️ **AFK:** ${afkIntervals.has(serverKey) ? 'مفعل' : 'معطل'}\n`;
        } else {
            status += '🔴 **غير متصل**\n';
        }
    } else {
        status += '⚠️ **لا يوجد سيرفر مختار**\n';
    }
    
    status += `\n**إحصاءات:**\n`;
    status += `📋 السيرفرات: ${ctx.session.servers?.length || 0}\n`;
    status += `🔗 اتصالات: ${clients.size}\n`;
    
    ctx.reply(status, { 
        parse_mode: 'Markdown',
        reply_markup: mainMenu().reply_markup 
    });
});

/* 🧹 تنظيف الاتصال */
function cleanup(serverKey) {
    if (afkIntervals.has(serverKey)) {
        clearInterval(afkIntervals.get(serverKey));
        afkIntervals.delete(serverKey);
    }
    clients.delete(serverKey);
}

/* 🛠️ معالجة الأخطاء */
process.on('uncaughtException', (error) => {
    console.error('⚠️ خطأ غير معالج:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ وعد مرفوض:', reason);
});

/* 🚀 تشغيل البوت */
bot.launch({
    dropPendingUpdates: true,
    allowedUpdates: ['message', 'callback_query']
}).then(() => {
    console.log('✅✅✅ MaxBlack Bot يعمل! ✅✅✅');
    console.log('🚀 جاهز للاستخدام');
    console.log('===========================');
});
