const { Telegraf, session, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

// نظام منع توقف البوت على Railway
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("نظام ماكس بلاك يعمل بنجاح ✅");
}).listen(process.env.PORT || 3000);

const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// ✅ حل مشكلة الإضافة: تهيئة الجلسة لربط البيانات بالمستخدم
bot.use(session({
    getSessionKey: (ctx) => ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`
}));

let activeClients = {};
let userData = {}; // لتخزين السيرفرات في الذاكرة

// 🎨 القائمة الرئيسية بالعربي
const mainMenu = (userId) => {
    const servers = userData[userId]?.servers?.length || 0;
    return Markup.inlineKeyboard([
        [Markup.button.callback('➕ إضافة سيرفر', 'add_server'), Markup.button.callback(`📂 سيرفراتك (${servers})`, 'list_servers')],
        [Markup.button.callback('✏️ اسم البوت', 'edit_name'), Markup.button.callback('📊 الحالة', 'status')],
        [Markup.button.url('👤 المبرمج', 'https://t.me/uuuaaw')]
    ]);
};

bot.start(async (ctx) => {
    const uid = ctx.from.id.toString();
    if (!userData[uid]) userData[uid] = { servers: [], botName: "MaxBlack_Bot", step: null };
    await ctx.reply(`👋 أهلاً بك يا ${ctx.from.first_name}\nفي نظام التحكم بسيرفرات ماين كرافت (Bedrock)`, mainMenu(uid));
});

// ➕ إضافة سيرفر (إصلاح Ip/0)
bot.action('add_server', async (ctx) => {
    userData[ctx.from.id].step = 'get_ip';
    await ctx.answerCbQuery();
    await ctx.editMessageText("📝 أرسل IP السيرفر والبورت هكذا:\n\n `play.example.com:19132`", { parse_mode: 'Markdown' });
});

// 📂 عرض السيرفرات
bot.action('list_servers', async (ctx) => {
    const uid = ctx.from.id;
    const servers = userData[uid]?.servers || [];
    if (servers.length === 0) return ctx.answerCbQuery("📭 لا توجد سيرفرات!");

    const buttons = servers.map((s, i) => [Markup.button.callback(`🌍 ${s.ip}:${s.port}`, `manage_${i}`)]);
    buttons.push([Markup.button.callback('🏠 رجوع', 'home')]);
    
    await ctx.editMessageText("📂 اختر سيرفر لإدارته:", Markup.inlineKeyboard(buttons));
});

// ⚙️ إدارة السيرفر والدخول (جميع الإصدارات)
bot.action(/^manage_(\d+)$/, async (ctx) => {
    const index = ctx.match[1];
    const server = userData[ctx.from.id].servers[index];
    const isOnline = activeClients[`${ctx.from.id}_${index}`] ? "متصل ✅" : "مفصول 🔴";

    await ctx.editMessageText(`🛠️ السيرفر: \`${server.ip}:${server.port}\`\n📊 الحالة: ${isOnline}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[`${ctx.from.id}_${index}`] ? '⏹️ إيقاف' : '▶️ دخول', `toggle_${index}`)],
            [Markup.button.callback('🗑️ حذف', `del_${index}`), Markup.button.callback('🔙', 'list_servers')]
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
        await ctx.answerCbQuery("🔴 تم الفصل");
    } else {
        await ctx.answerCbQuery("⏳ جاري الدخول...");
        try {
            activeClients[key] = bedrock.createClient({
                host: s.ip, port: parseInt(s.port),
                username: userData[uid].botName, offline: true,
                version: '1.21.50', // دعم التحويل التلقائي
                skipPing: false
            });
            activeClients[key].on('spawn', () => ctx.reply(`✅ دخل البوت سيرفر: ${s.ip}`));
            activeClients[key].on('error', (e) => {
                delete activeClients[key];
                ctx.reply(`❌ خطأ: ${e.message}`);
            });
        } catch (err) { ctx.reply("❌ فشل المحرك."); }
    }
    bot.start(ctx);
});

// ✉️ معالجة النصوص (الاسم و IP)
bot.on('text', async (ctx) => {
    const uid = ctx.from.id;
    const step = userData[uid]?.step;

    if (step === 'get_ip') {
        const parts = ctx.message.text.split(':');
        if (parts.length === 2) {
            userData[uid].servers.push({ ip: parts[0].trim(), port: parts[1].trim() });
            userData[uid].step = null;
            await ctx.reply("✅ تم الحفظ!", mainMenu(uid));
        } else {
            await ctx.reply("❌ خطأ! مثال: `play.com:19132`", { parse_mode: 'Markdown' });
        }
    } else if (step === 'get_name') {
        userData[uid].botName = ctx.message.text.trim();
        userData[uid].step = null;
        await ctx.reply(`✅ الاسم الجديد: ${userData[uid].botName}`, mainMenu(uid));
    }
});

bot.action('edit_name', (ctx) => {
    userData[ctx.from.id].step = 'get_name';
    ctx.reply("✏️ أرسل اسم البوت الجديد:");
});

bot.action('home', (ctx) => bot.start(ctx));

bot.action(/^del_(\d+)$/, (ctx) => {
    userData[ctx.from.id].servers.splice(ctx.match[1], 1);
    bot.start(ctx);
});

// 🛡️ تشغيل نظيف بدون تكرار (Conflict 409)
bot.launch({ dropPendingUpdates: true });
console.log('🚀 MaxBlack Ultra is Ready!');
