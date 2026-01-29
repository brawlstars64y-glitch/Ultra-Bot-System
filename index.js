const { Telegraf, session, Markup } = require('telegraf');
const http = require('http');

// 🌐 محرك الاستدامة ومنع الكراش على Railway
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("MaxBlack System: Active ✅");
}).listen(process.env.PORT || 3000);

// محاولة استدعاء المكتبة مع حماية
let bedrock;
try {
    bedrock = require('bedrock-protocol');
} catch (e) {
    console.error("❌ مكتبة bedrock-protocol غير مثبتة!");
}

const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// ✅ نظام الجلسات (Session) لحفظ البيانات ومنع خطأ Ip/0
bot.use(session({
    getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`
}));

let activeClients = {}; // لتخزين البوتات المتصلة
let userData = {};      // لتخزين بيانات السيرفرات

// 🎨 القائمة الرئيسية
const mainMenu = (userId) => {
    const serversCount = userData[userId]?.servers?.length || 0;
    return Markup.inlineKeyboard([
        [Markup.button.callback('➕ إضافة سيرفر', 'add_server'), Markup.button.callback(`📂 السيرفرات (${serversCount})`, 'list_servers')],
        [Markup.button.callback('✏️ تغيير الاسم', 'edit_name'), Markup.button.callback('📊 الحالة', 'status')]
    ]);
};

bot.start(async (ctx) => {
    const uid = ctx.from.id.toString();
    if (!userData[uid]) userData[uid] = { servers: [], botName: "MaxBlack_Player", step: null };
    await ctx.reply(`👋 أهلاً بك في نظام ماكس بلاك\n\nاسم البوت الحالي: ${userData[uid].botName}`, mainMenu(uid));
});

// 🛠️ إضافة سيرفر
bot.action('add_server', async (ctx) => {
    const uid = ctx.from.id.toString();
    if (!userData[uid]) userData[uid] = { servers: [], botName: "MaxBlack_Player", step: null };
    userData[uid].step = 'get_ip';
    await ctx.answerCbQuery();
    await ctx.reply("📝 أرسل IP السيرفر والبورت هكذا:\n\n `play.example.com:19132`", { parse_mode: 'Markdown' });
});

// ✉️ معالجة النصوص
bot.on('text', async (ctx) => {
    const uid = ctx.from.id.toString();
    if (!userData[uid]) return;

    if (userData[uid].step === 'get_ip') {
        const input = ctx.message.text.trim();
        if (input.includes(':')) {
            const [ip, port] = input.split(':');
            userData[uid].servers.push({ ip, port: port || 19132 });
            userData[uid].step = null;
            await ctx.reply("✅ تم حفظ السيرفر!", mainMenu(uid));
        } else {
            await ctx.reply("❌ تنسيق خاطئ! أرسل `ip:port`", { parse_mode: 'Markdown' });
        }
    } else if (userData[uid].step === 'get_name') {
        userData[uid].botName = ctx.message.text.trim();
        userData[uid].step = null;
        await ctx.reply(`✅ تم تغيير الاسم لـ: ${userData[uid].botName}`, mainMenu(uid));
    }
});

// 📂 إدارة السيرفرات
bot.action('list_servers', async (ctx) => {
    const uid = ctx.from.id.toString();
    const servers = userData[uid]?.servers || [];
    if (servers.length === 0) return ctx.answerCbQuery("📭 لا توجد سيرفرات!");

    const btns = servers.map((s, i) => [Markup.button.callback(`🌍 ${s.ip}:${s.port}`, `manage_${i}`)]);
    btns.push([Markup.button.callback('🏠 رجوع', 'home')]);
    await ctx.editMessageText("📂 اختر سيرفرك:", Markup.inlineKeyboard(btns));
});

bot.action(/^manage_(\d+)$/, async (ctx) => {
    const idx = ctx.match[1];
    const uid = ctx.from.id.toString();
    const s = userData[uid].servers[idx];
    const key = `${uid}_${idx}`;
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
    const uid = ctx.from.id.toString();
    const idx = ctx.match[1];
    const s = userData[uid].servers[idx];
    const key = `${uid}_${idx}`;

    if (activeClients[key]) {
        activeClients[key].close();
        delete activeClients[key];
        await ctx.answerCbQuery("🛑 تم الإيقاف");
    } else {
        if (!bedrock) return ctx.reply("❌ المكتبة ناقصة!");
        await ctx.answerCbQuery("⏳ جاري الدخول...");
        try {
            activeClients[key] = bedrock.createClient({
                host: s.ip, port: parseInt(s.port),
                username: userData[uid].botName, offline: true,
                version: '1.21.50'
            });
            activeClients[key].on('spawn', () => ctx.reply(`🚀 دخل البوت: ${s.ip}`));
            activeClients[key].on('error', (e) => { delete activeClients[key]; ctx.reply(`❌ فشل: ${e.message}`); });
        } catch (err) { ctx.reply("❌ خطأ محرك."); }
    }
    bot.start(ctx);
});

// ✅ إصلاح زر الحالة (يعمل الآن 100%)
bot.action('status', async (ctx) => {
    const uid = ctx.from.id.toString();
    const totalServers = userData[uid]?.servers?.length || 0;
    
    // حساب عدد البوتات المتصلة حالياً لهذا المستخدم
    let connectedCount = 0;
    for (let key in activeClients) {
        if (key.startsWith(`${uid}_`)) connectedCount++;
    }

    const report = `📊 *تقرير الحالة الخاص بك:*\n\n` +
                   `🔹 السيرفرات المضافة: ${totalServers}\n` +
                   `🔹 البوتات النشطة الآن: ${connectedCount}\n` +
                   `🔹 اسم البوت المستخدم: ${userData[uid]?.botName || 'غير محدد'}`;

    await ctx.answerCbQuery();
    await ctx.replyWithMarkdown(report, mainMenu(uid));
});

// 🗑️ حذف وعودة
bot.action(/^del_(\d+)$/, (ctx) => {
    const uid = ctx.from.id.toString();
    userData[uid].servers.splice(ctx.match[1], 1);
    bot.start(ctx);
});

bot.action('home', (ctx) => bot.start(ctx));

bot.action('edit_name', (ctx) => {
    const uid = ctx.from.id.toString();
    userData[uid].step = 'get_name';
    ctx.reply("✏️ أرسل اسم البوت الجديد:");
});

// 🛡️ تشغيل نظيف
bot.launch({ dropPendingUpdates: true });

process.on('uncaughtException', (err) => console.error('SafeGuard:', err));
process.on('unhandledRejection', (reason) => console.error('SafeGuard:', reason));
