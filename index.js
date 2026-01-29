const { Telegraf, session, Markup } = require('telegraf');
const http = require('http');

// 🌐 محرك الاستدامة ومنع الكراش على Railway
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("MaxBlack System: Active ✅");
}).listen(process.env.PORT || 3000);

// محاولة استدعاء المكتبة مع حماية من الانهيار إذا كانت ناقصة
let bedrock;
try {
    bedrock = require('bedrock-protocol');
} catch (e) {
    console.error("❌ مكتبة bedrock-protocol غير مثبتة! يرجى تثبيتها.");
}

const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// ✅ نظام الجلسات المطور لمنع ضياع البيانات (حل مشكلة Ip/0)
bot.use(session({
    getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`
}));

let activeClients = {};
let userData = {};

// 🎨 القائمة الرئيسية العربية
const mainMenu = (userId) => {
    const serversCount = userData[userId]?.servers?.length || 0;
    return Markup.inlineKeyboard([
        [Markup.button.callback('➕ إضافة سيرفر', 'add_server'), Markup.button.callback(`📂 السيرفرات (${serversCount})`, 'list_servers')],
        [Markup.button.callback('✏️ تغيير الاسم', 'edit_name'), Markup.button.callback('📊 الحالة', 'status')],
        [Markup.button.url('👤 المبرمج', 'https://t.me/uuuaaw')]
    ]);
};

bot.start(async (ctx) => {
    const uid = ctx.from.id.toString();
    if (!userData[uid]) userData[uid] = { servers: [], botName: "MaxBlack_Player", step: null };
    await ctx.reply(`👋 أهلاً بك في نظام ماكس بلاك\n\nاسم البوت الحالي: ${userData[uid].botName}`, mainMenu(uid));
});

// 🛠️ إضافة سيرفر (حل مشكلة التعليق والكرش)
bot.action('add_server', async (ctx) => {
    userData[ctx.from.id].step = 'get_ip';
    await ctx.answerCbQuery();
    await ctx.editMessageText("📝 أرسل IP السيرفر والبورت معاً هكذا:\n\n `play.example.com:19132`", { parse_mode: 'Markdown' });
});

bot.on('text', async (ctx) => {
    const uid = ctx.from.id;
    if (!userData[uid]) return;

    if (userData[uid].step === 'get_ip') {
        const input = ctx.message.text.trim();
        if (input.includes(':')) {
            const [ip, port] = input.split(':');
            userData[uid].servers.push({ ip, port: port || 19132 });
            userData[uid].step = null;
            await ctx.reply("✅ تم حفظ السيرفر بنجاح!", mainMenu(uid));
        } else {
            await ctx.reply("❌ تنسيق خاطئ! يجب أن يكون `ip:port`", { parse_mode: 'Markdown' });
        }
    } else if (userData[uid].step === 'get_name') {
        userData[uid].botName = ctx.message.text.trim();
        userData[uid].step = null;
        await ctx.reply(`✅ تم تغيير الاسم إلى: ${userData[uid].botName}`, mainMenu(uid));
    }
});

// 📂 إدارة السيرفرات والدخول (جميع الإصدارات)
bot.action('list_servers', async (ctx) => {
    const uid = ctx.from.id;
    const servers = userData[uid]?.servers || [];
    if (servers.length === 0) return ctx.answerCbQuery("📭 لا توجد سيرفرات مضافة.");

    const btns = servers.map((s, i) => [Markup.button.callback(`🌍 ${s.ip}:${s.port}`, `manage_${i}`)]);
    btns.push([Markup.button.callback('🏠 رجوع', 'home')]);
    await ctx.editMessageText("📂 اختر سيرفرك:", Markup.inlineKeyboard(btns));
});

bot.action(/^manage_(\d+)$/, async (ctx) => {
    const idx = ctx.match[1];
    const s = userData[ctx.from.id].servers[idx];
    const key = `${ctx.from.id}_${idx}`;
    const status = activeClients[key] ? "متصل ✅" : "مفصول 🔴";

    await ctx.editMessageText(`🛠️ السيرفر: \`${s.ip}:${s.port}\`\n📊 الحالة: ${status}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[key] ? '🛑 إيقاف' : '▶️ تشغيل', `toggle_${idx}`)],
            [Markup.button.callback('🗑️ حذف', `del_${idx}`), Markup.button.callback('🔙', 'list_servers')]
        ])
    });
});

bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const uid = ctx.from.id;
    const idx = ctx.match[1];
    const s = userData[uid].servers[idx];
    const key = `${uid}_${idx}`;

    if (activeClients[key]) {
        activeClients[key].close();
        delete activeClients[key];
        await ctx.answerCbQuery("🛑 تم الإيقاف");
    } else {
        if (!bedrock) return ctx.reply("❌ المحرك معطل (المكتبة ناقصة)!");
        await ctx.answerCbQuery("⏳ جاري الدخول...");
        try {
            activeClients[key] = bedrock.createClient({
                host: s.ip, port: parseInt(s.port),
                username: userData[uid].botName, offline: true,
                version: '1.21.50', // دعم الإصدارات الحديثة وتلقائي
                connectTimeout: 30000
            });

            activeClients[key].on('spawn', () => ctx.reply(`🚀 البوت دخل السيرفر: ${s.ip}`));
            activeClients[key].on('error', (e) => {
                delete activeClients[key];
                ctx.reply(`❌ فشل: ${e.message}`);
            });
        } catch (err) { ctx.reply("❌ خطأ في المحرك."); }
    }
    bot.start(ctx);
});

// 🗑️ حذف وعودة
bot.action(/^del_(\d+)$/, (ctx) => {
    userData[ctx.from.id].servers.splice(ctx.match[1], 1);
    bot.start(ctx);
});

bot.action('home', (ctx) => bot.start(ctx));

bot.action('edit_name', (ctx) => {
    userData[ctx.from.id].step = 'get_name';
    ctx.reply("✏️ أرسل اسم البوت الجديد:");
});

// 🛡️ معالجة الـ Conflict 409 لمنع توقف البوت في Railway
bot.launch({ dropPendingUpdates: true });

// 🛡️ درع حماية شامل لمنع الكراش النهائي
process.on('uncaughtException', (err) => console.error('Anti-Crash Protection:', err));
process.on('unhandledRejection', (reason) => console.error('Anti-Crash Protection:', reason));
