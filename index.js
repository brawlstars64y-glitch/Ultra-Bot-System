const { Telegraf, session, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

// 🌐 نظام الاستدامة لـ Railway ومنع توقف البوت
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("MaxBlack Ultra: Online ✅");
}).listen(process.env.PORT || 3000);

const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// ✅ تهيئة الجلسة لضمان حفظ بيانات السيرفر لكل مستخدم بشكل مستقل
bot.use(session({
    getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`
}));

// تخزين العملاء والبيانات في الذاكرة
let activeClients = {};
let userData = {};

// 🎨 قائمة التحكم الرئيسية
const mainMenu = (userId) => {
    const serverCount = userData[userId]?.servers?.length || 0;
    return Markup.inlineKeyboard([
        [Markup.button.callback('➕ إضافة سيرفر جديد', 'add_server')],
        [Markup.button.callback(`📂 قائمة السيرفرات (${serverCount})`, 'list_servers')],
        [Markup.button.callback('✏️ تغيير اسم البوت', 'change_bot_name')],
        [Markup.button.url('👤 المبرمج', 'https://t.me/uuuaaw')]
    ]);
};

bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!userData[userId]) {
        userData[userId] = { servers: [], botName: "MaxBlack_Player", step: null };
    }
    await ctx.reply(`🎮 أهلاً بك في نظام MaxBlack Ultra!\n\nاسم البوت الحالي: ${userData[userId].botName}`, mainMenu(userId));
});

// 🛠️ إضافة سيرفر جديد
bot.action('add_server', async (ctx) => {
    const userId = ctx.from.id.toString();
    userData[userId].step = 'waiting_ip_port';
    await ctx.answerCbQuery();
    await ctx.editMessageText("📝 أرسل IP السيرفر والبورت معاً (مثال: `play.example.com:19132`)", { parse_mode: 'Markdown' });
});

// 📂 عرض وإدارة السيرفرات
bot.action('list_servers', async (ctx) => {
    const userId = ctx.from.id.toString();
    const servers = userData[userId]?.servers || [];
    await ctx.answerCbQuery();

    if (servers.length === 0) {
        return ctx.editMessageText("📭 لا توجد سيرفرات مضافة حالياً.", mainMenu(userId));
    }

    const buttons = servers.map((s, i) => [Markup.button.callback(`🌍 ${s.ip}:${s.port}`, `manage_${i}`)]);
    buttons.push([Markup.button.callback('🏠 القائمة الرئيسية', 'home')]);

    await ctx.editMessageText("📂 اختر سيرفر لإدارته:", Markup.inlineKeyboard(buttons));
});

// ⚙️ نافذة التحكم بالسيرفر
bot.action(/^manage_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id.toString();
    const index = ctx.match[1];
    const server = userData[userId].servers[index];
    const clientKey = `${userId}_${index}`;
    const status = activeClients[clientKey] ? "متصل ✅" : "مفصول 🔴";

    await ctx.editMessageText(`🛠️ إدارة السيرفر: \`${server.ip}:${server.port}\`\n📊 الحالة الحالية: ${status}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[clientKey] ? '⏹️ إيقاف البوت' : '▶️ دخول السيرفر', `toggle_${index}`)],
            [Markup.button.callback('🗑️ حذف من القائمة', `delete_${index}`)],
            [Markup.button.callback('🔙 عودة للقائمة', 'list_servers')]
        ])
    });
});

// 🚀 محرك الدخول (يدعم جميع الإصدارات)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id.toString();
    const index = ctx.match[1];
    const server = userData[userId].servers[index];
    const clientKey = `${userId}_${index}`;

    if (activeClients[clientKey]) {
        activeClients[clientKey].close();
        delete activeClients[clientKey];
        await ctx.answerCbQuery("🛑 تم فصل البوت");
    } else {
        await ctx.answerCbQuery("⏳ جاري الاقتحام...");
        try {
            activeClients[clientKey] = bedrock.createClient({
                host: server.ip,
                port: parseInt(server.port),
                username: userData[userId].botName,
                offline: true,
                version: '1.21.50', // يدعم التحويل التلقائي للإصدار
                connectTimeout: 30000,
                skipPing: false
            });

            activeClients[clientKey].on('spawn', () => {
                ctx.reply(`✅ نجح الاقتحام! البوت داخل السيرفر: ${server.ip}`);
            });

            activeClients[clientKey].on('error', (err) => {
                delete activeClients[clientKey];
                ctx.reply(`❌ خطأ في الاتصال: ${err.message}`);
            });

            activeClients[clientKey].on('disconnect', () => {
                delete activeClients[clientKey];
                ctx.reply(`🔴 تم فصل البوت عن: ${server.ip}`);
            });
        } catch (e) {
            ctx.reply("❌ فشل تشغيل محرك الاقتحام.");
        }
    }
    // تحديث الواجهة تلقائياً
    bot.start(ctx);
});

// 🗑️ حذف سيرفر
bot.action(/^delete_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id.toString();
    const index = ctx.match[1];
    userData[userId].servers.splice(index, 1);
    await ctx.answerCbQuery("🗑️ تم الحذف من القائمة");
    bot.start(ctx);
});

// ✏️ معالجة إدخال النصوص
bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const step = userData[userId]?.step;

    if (step === 'waiting_ip_port') {
        const text = ctx.message.text.trim();
        if (text.includes(':')) {
            const [ip, port] = text.split(':');
            userData[userId].servers.push({ ip, port: parseInt(port) || 19132 });
            userData[userId].step = null;
            await ctx.reply("✅ تم حفظ السيرفر بنجاح!", mainMenu(userId));
        } else {
            await ctx.reply("❌ تنسيق خاطئ! يجب كتابة IP وبورت (مثال: `play.com:19132`)", { parse_mode: 'Markdown' });
        }
    } else if (step === 'waiting_bot_name') {
        userData[userId].botName = ctx.message.text.trim();
        userData[userId].step = null;
        await ctx.reply(`✅ تم تغيير اسم البوت إلى: ${userData[userId].botName}`, mainMenu(userId));
    }
});

// 🏠 عودة للرئيسية
bot.action('home', (ctx) => {
    ctx.answerCbQuery();
    bot.start(ctx);
});

// ✏️ طلب تغيير الاسم
bot.action('change_bot_name', async (ctx) => {
    const userId = ctx.from.id.toString();
    userData[userId].step = 'waiting_bot_name';
    await ctx.answerCbQuery();
    await ctx.reply("✏️ أرسل اسم البوت الجديد:");
});

// 🛡️ معالجة خطأ الـ Conflict 409 الظاهر في سجلاتك
bot.launch({ dropPendingUpdates: true })
    .then(() => console.log('🚀 MaxBlack System is Active!'))
    .catch(err => console.error('Bot Launch Error:', err));

// منع انهيار البوت عند حدوث أخطاء غير متوقعة
process.on('uncaughtException', (err) => console.error('Caught exception:', err));
process.on('unhandledRejection', (reason, promise) => console.error('Unhandled Rejection:', reason));
