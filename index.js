const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

/* Railway Keep Alive */
http.createServer((req, res) => res.end('MaxBlack Bot')).listen(process.env.PORT || 3000);

/* Telegram Bot */
const bot = new Telegraf('8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU');

/* 📋 إصدارات Minecraft المدعومة */
const SUPPORTED_VERSIONS = [
    // الإصدارات 1.21.x
    '1.21.132', '1.21.131', '1.21.130', '1.21.120', '1.21.110', '1.21.100', '1.21.90', '1.21.80', '1.21.70', '1.21.60', '1.21.50', '1.21.40', '1.21.30', '1.21.20', '1.21.10', '1.21.0',
    // الإصدارات 1.20.x
    '1.20.80', '1.20.75', '1.20.70', '1.20.62', '1.20.60', '1.20.55', '1.20.50', '1.20.45', '1.20.42', '1.20.41', '1.20.40', '1.20.32', '1.20.30', '1.20.28', '1.20.26', '1.20.22', '1.20.21', '1.20.20', '1.20.18', '1.20.16', '1.20.15', '1.20.14', '1.20.12', '1.20.11', '1.20.10', '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20.0'
];

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
        [Markup.button.callback('🎮 الإصدار', 'version_menu')],
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

/* 🎮 قائمة الإصدارات */
function versionMenu() {
    const rows = [];
    const chunkSize = 3;
    
    // عرض آخر 12 إصدار
    const recentVersions = SUPPORTED_VERSIONS.slice(0, 12);
    
    for (let i = 0; i < recentVersions.length; i += chunkSize) {
        const chunk = recentVersions.slice(i, i + chunkSize);
        const buttons = chunk.map(version => 
            Markup.button.callback(version, `version_${version}`)
        );
        rows.push(buttons);
    }
    
    rows.push([
        Markup.button.callback('🔄 اكتشاف تلقائي', 'version_auto'),
        Markup.button.callback('🔙 رجوع', 'back_main')
    ]);
    
    return Markup.inlineKeyboard(rows);
}

/* 🚀 بدء البوت */
bot.start((ctx) => {
    ctx.reply(`🎮 **MaxBlack Bot**\n✅ يدعم ${SUPPORTED_VERSIONS.length} إصدار\n📍 من ${SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length-1]} إلى ${SUPPORTED_VERSIONS[0]}`, { 
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

/* 🎮 قائمة الإصدارات */
bot.action('version_menu', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply('🎮 اختر إصدار Minecraft:', { 
        reply_markup: versionMenu().reply_markup 
    });
});

/* 🎮 اختيار إصدار */
bot.action(/version_(.+)/, (ctx) => {
    const version = ctx.match[1];
    ctx.answerCbQuery(`تم تعيين الإصدار ${version === 'auto' ? 'اكتشاف تلقائي' : version}`);
    
    if (!ctx.session.currentServer) {
        return ctx.reply('⚠️ اختر سيرفراً أولاً.');
    }
    
    // تحديث السيرفر بالإصدار الجديد
    const server = ctx.session.currentServer;
    const serverIndex = ctx.session.servers.findIndex(s => 
        s.host === server.host && s.port === server.port
    );
    
    if (serverIndex !== -1) {
        if (version === 'auto') {
            ctx.session.servers[serverIndex].version = false;
            ctx.session.currentServer.version = false;
        } else {
            ctx.session.servers[serverIndex].version = version;
            ctx.session.currentServer.version = version;
        }
        
        ctx.reply(`✅ تم تحديث الإصدار إلى: ${version === 'auto' ? 'اكتشاف تلقائي' : version}`, {
            reply_markup: mainMenu().reply_markup
        });
    }
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
        const versionInfo = ctx.session.currentServer.version ? 
            `🎮 الإصدار: ${ctx.session.currentServer.version}` : 
            '🔄 الإصدار: اكتشاف تلقائي';
        
        ctx.reply(`✅ تم اختيار:\n📌 ${ctx.session.currentServer.name}\n📍 ${ctx.session.currentServer.host}:${ctx.session.currentServer.port}\n${versionInfo}`);
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
            
            // إضافة السيرفر مع إصدار افتراضي (اكتشاف تلقائي)
            if (!ctx.session.servers) ctx.session.servers = [];
            ctx.session.servers.push({
                ...ctx.session.tempServer,
                id: Date.now(),
                version: false // اكتشاف تلقائي افتراضي
            });
            
            ctx.session.step = null;
            ctx.session.tempServer = null;
            
            ctx.reply(`✅ تم إضافة السيرفر!\n🔄 الإصدار: اكتشاف تلقائي`, { 
                reply_markup: mainMenu().reply_markup 
            });
            break;
    }
});

/* ▶️ دخول للسيرفر مع دعم الإصدارات */
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

    const versionText = server.version ? server.version : 'اكتشاف تلقائي';
    ctx.reply(`⏳ جاري الدخول إلى ${server.name}...\n🎮 الإصدار: ${versionText}`);

    try {
        // إعداد خيارات الاتصال
        const options = {
            host: server.host,
            port: server.port,
            username: server.username || `Bot_${Date.now()}`,
            offline: true,
            skipPing: true,
            connectTimeout: 15000,
            profilesFolder: './profiles'
        };

        // تحديد الإصدار
        if (server.version) {
            options.version = server.version;
            console.log(`🎮 استخدام الإصدار المحدد: ${server.version}`);
        } else {
            options.version = false; // اكتشاف تلقائي
            console.log('🔄 اكتشاف الإصدار تلقائياً');
        }

        const client = bedrock.createClient(options);

        clients.set(serverKey, { 
            client, 
            server: server.name, 
            connectedAt: new Date(),
            version: client.version || 'جاري الاتصال...'
        });

        client.on('spawn', () => {
            const connectedVersion = client.version || 'غير معروف';
            console.log(`✅ اتصال ناجح: ${server.name} (${connectedVersion})`);
            
            // تحديث الإصدار المتصل
            const connection = clients.get(serverKey);
            if (connection) connection.version = connectedVersion;
            
            ctx.reply(`🟢 **تم الاتصال!**\n📌 ${server.name}\n🎮 الإصدار: ${connectedVersion}\n✅ البوت الآن داخل اللعبة`);
            
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
            console.error(`❌ خطأ اتصال: ${err.message}`);
            
            let errorMessage = `❌ فشل الاتصال بـ ${server.name}\nالسبب: ${err.message}`;
            
            // اقتراحات للإصلاح
            if (err.message.includes('version') || err.message.includes('unsupported')) {
                errorMessage += '\n\n💡 **جرب:**\n1. اذهب إلى 🎮 الإصدار\n2. اختر إصداراً مختلفاً\n3. حاول الاتصال مرة أخرى';
            }
            
            ctx.reply(errorMessage);
            cleanup(serverKey);
        });

        client.on('disconnect', () => {
            console.log(`🔴 انقطع الاتصال: ${server.name}`);
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
    
    ctx.reply(`🛑 تم إخراج البوت من ${server.name}`);
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
        status += `🎮 **الإصدار:** ${server.version ? server.version : 'اكتشاف تلقائي'}\n\n`;
        
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
            status += `🎮 **المتصل:** ${connection.version || 'غير معروف'}\n`;
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
    status += `🎮 إصدارات مدعومة: ${SUPPORTED_VERSIONS.length}\n`;
    status += `📍 من ${SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length-1]} إلى ${SUPPORTED_VERSIONS[0]}`;
    
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
    console.log(`🎮 يدعم ${SUPPORTED_VERSIONS.length} إصدار`);
    console.log(`📍 من ${SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length-1]} إلى ${SUPPORTED_VERSIONS[0]}`);
    console.log('🚀 جاهز للاستخدام');
    console.log('===========================');
});
