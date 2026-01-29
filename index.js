const { Telegraf, session, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

// نظام الاستدامة لـ Railway
http.createServer((req, res) => res.end('MaxBlack Bot is Online ✅')).listen(process.env.PORT || 3000);

const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// تفعيل الجلسات لحل مشاكل إدخال البيانات
bot.use(session());

// تخزين العملاء النشطين (البوتات داخل السيرفرات)
let activeClients = {};

// 🏁 قائمة التحكم الرئيسية
const mainMenu = (userId) => {
    const serverCount = data[userId]?.servers?.length || 0;
    return Markup.inlineKeyboard([
        [Markup.button.callback('➕ إضافة سيرفر', 'add'), Markup.button.callback(`📂 السيرفرات (${serverCount})`, 'list')],
        [Markup.button.callback('✏️ تغيير اسم البوت', 'change_name')],
        [Markup.button.url('👤 المبرمج', 'https://t.me/uuuaaw')]
    ]);
};

let data = {};

bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!data[userId]) {
        data[userId] = { servers: [], botName: "MaxBlack_Bot", step: null };
    }
    await ctx.reply(`🎮 أهلاً بك يا ${ctx.from.first_name} في بوت حماية السيرفرات!\n\nاسم البوت الحالي: ${data[userId].botName}`, mainMenu(userId));
});

// ➕ إضافة سيرفر
bot.action('add', async (ctx) => {
    const userId = ctx.from.id.toString();
    data[userId].step = 'waiting_ip';
    await ctx.answerCbQuery();
    await ctx.editMessageText("📝 أرسل IP السيرفر والبورت بهذا الشكل:\n\n `play.example.com:19132`", { parse_mode: 'Markdown' });
});

// ✏️ تغيير الاسم
bot.action('change_name', async (ctx) => {
    const userId = ctx.from.id.toString();
    data[userId].step = 'waiting_name';
    await ctx.answerCbQuery();
    await ctx.reply("✏️ أرسل اسم البوت الجديد (بدون مسافات):");
});

// 📂 عرض السيرفرات
bot.action('list', async (ctx) => {
    const userId = ctx.from.id.toString();
    const servers = data[userId]?.servers || [];
    await ctx.answerCbQuery();

    if (servers.length === 0) {
        return ctx.editMessageText("📭 لا توجد سيرفرات مضافة حالياً.", mainMenu(userId));
    }

    let msg = "📂 قائمة سيرفراتك:\n";
    const buttons = servers.map((s, i) => [Markup.button.callback(`🌍 ${s.ip}:${s.port}`, `manage_${i}`)]);
    buttons.push([Markup.button.callback('🏠 القائمة الرئيسية', 'home')]);

    await ctx.editMessageText(msg, Markup.inlineKeyboard(buttons));
});

// ⚙️ إدارة سيرفر محدد
bot.action(/^manage_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id.toString();
    const index = ctx.match[1];
    const server = data[userId].servers[index];
    const isRunning = activeClients[`${userId}_${index}`] ? "متصل ✅" : "مفصول 🔴";

    await ctx.editMessageText(`🛠️ إدارة السيرفر: ${server.ip}\n📊 الحالة: ${isRunning}`, Markup.inlineKeyboard([
        [Markup.button.callback(activeClients[`${userId}_${index}`] ? '🛑 إيقاف' : '⚡ تشغيل الاقتحام', `toggle_${index}`)],
        [Markup.button.callback('🗑️ حذف السيرفر', `delete_${index}`)],
        [Markup.button.callback('🔙 عودة', 'list')]
    ]));
});

// 🔥 محرك التشغيل والإيقاف (يدعم جميع الإصدارات)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id.toString();
    const index = ctx.match[1];
    const server = data[userId].servers[index];
    const key = `${userId}_${index}`;

    if (activeClients[key]) {
        activeClients[key].close();
        delete activeClients[key];
        await ctx.answerCbQuery("🛑 تم إيقاف البوت");
    } else {
        await ctx.answerCbQuery("⏳ جاري الدخول...");
        try {
            activeClients[key] = bedrock.createClient({
                host: server.ip,
                port: parseInt(server.port),
                username: data[userId].botName,
                offline: true,
                version: false, // اكتشاف تلقائي لجميع الإصدارات
                skipPing: false
            });

            activeClients[key].on('spawn', () => {
                ctx.reply(`✅ البوت دخل السيرفر الآن: ${server.ip}`);
            });

            activeClients[key].on('error', (err) => {
                delete activeClients[key];
                ctx.reply(`❌ خطأ: ${err.message}`);
            });
        } catch (e) {
            ctx.reply("❌ فشل المحرك في الاتصال.");
        }
    }
    // تحديث الواجهة
    ctx.deleteMessage();
    bot.start(ctx);
});

// 🗑️ حذف سيرفر
bot.action(/^delete_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id.toString();
    const index = ctx.match[1];
    data[userId].servers.splice(index, 1);
    await ctx.answerCbQuery("🗑️ تم الحذف");
    ctx.deleteMessage();
    bot.start(ctx);
});

// 🏠 العودة للرئيسية
bot.action('home', (ctx) => {
    ctx.answerCbQuery();
    ctx.deleteMessage();
    bot.start(ctx);
});

// ✉️ معالجة النصوص المرسلة (IP أو اسم)
bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const step = data[userId]?.step;

    if (step === 'waiting_ip') {
        const text = ctx.message.text.trim();
        if (text.includes(':')) {
            const [ip, port] = text.split(':');
            data[userId].servers.push({ ip, port, id: Date.now() });
            data[userId].step = null;
            await ctx.reply("✅ تم إضافة السيرفر بنجاح!", mainMenu(userId));
        } else {
            await ctx.reply("❌ تنسيق خاطئ! أرسل الـ IP والبورت هكذا `ip:port`", { parse_mode: 'Markdown' });
        }
    } 
    else if (step === 'waiting_name') {
        data[userId].botName = ctx.message.text.trim();
        data[userId].step = null;
        await ctx.reply(`✅ تم تغيير اسم البوت إلى: ${data[userId].botName}`, mainMenu(userId));
    }
});

// تشغيل
bot.launch({ dropPendingUpdates: true })
    .then(() => console.log('🚀 MaxBlack Bot is Ready!'))
    .catch(err => console.log('❌ Error:', err.message));

// درع الحماية من الانهيار
process.on('uncaughtException', e => console.log('Critical Error:', e));
process.on('unhandledRejection', e => console.log('Critical Error:', e));
