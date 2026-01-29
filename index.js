const { Telegraf, session, Markup } = require('telegraf');
const http = require('http');

// 🌐 منع توقف البوت على Railway
http.createServer((req, res) => {
    res.end("Bot is Running ✅");
}).listen(process.env.PORT || 3000);

const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// تحميل المكتبة بحذر شديد
let bedrock;
try {
    bedrock = require('bedrock-protocol');
} catch (e) {
    console.log("⚠️ مكتبة bedrock-protocol غير موجودة");
}

// تهيئة الجلسة والبيانات
bot.use(session());
let userData = {};
let activeClients = {};

// القائمة
const menu = (uid) => {
    const count = userData[uid]?.servers?.length || 0;
    return Markup.inlineKeyboard([
        [Markup.button.callback('➕ إضافة سيرفر', 'add'), Markup.button.callback(`📂 السيرفرات (${count})`, 'list')],
        [Markup.button.callback('✏️ الاسم', 'name'), Markup.button.callback('📊 الحالة', 'status')]
    ]);
};

bot.start(async (ctx) => {
    const uid = ctx.from.id.toString();
    userData[uid] = userData[uid] || { servers: [], botName: "Max_Player", step: null };
    await ctx.reply(`👋 أهلاً بك! البوت شغال الآن.\nاسمك المسجل: ${userData[uid].botName}`, menu(uid));
});

// إضافة سيرفر
bot.action('add', async (ctx) => {
    const uid = ctx.from.id.toString();
    userData[uid].step = 'get_ip';
    await ctx.answerCbQuery();
    await ctx.reply("أرسل IP السيرفر والبورت (مثال play.com:19132):");
});

// معالجة الرسائل
bot.on('text', async (ctx) => {
    const uid = ctx.from.id.toString();
    const user = userData[uid];
    if (!user || !user.step) return;

    if (user.step === 'get_ip') {
        if (ctx.message.text.includes(':')) {
            const [ip, port] = ctx.message.text.split(':');
            user.servers.push({ ip: ip.trim(), port: port.trim() });
            user.step = null;
            await ctx.reply("✅ تمت الإضافة!", menu(uid));
        } else {
            await ctx.reply("❌ أرسل التنسيق الصحيح ip:port");
        }
    } else if (user.step === 'name') {
        user.botName = ctx.message.text.trim();
        user.step = null;
        await ctx.reply("✅ تم تغيير الاسم", menu(uid));
    }
});

// الحالة (أصلحتها لك تماماً)
bot.action('status', async (ctx) => {
    const uid = ctx.from.id.toString();
    let live = 0;
    for (let key in activeClients) if (key.startsWith(uid)) live++;
    
    await ctx.answerCbQuery();
    await ctx.reply(`📊 تقريرك:\n- سيرفرات مخزنة: ${userData[uid]?.servers?.length || 0}\n- بوتات متصلة الآن: ${live}`);
});

bot.action('name', (ctx) => {
    userData[ctx.from.id].step = 'name';
    ctx.answerCbQuery();
    ctx.reply("أرسل اسم البوت الجديد:");
});

bot.action('list', async (ctx) => {
    const uid = ctx.from.id;
    const servers = userData[uid]?.servers || [];
    if (servers.length === 0) return ctx.answerCbQuery("القائمة فارغة!");
    const btns = servers.map((s, i) => [Markup.button.callback(`${s.ip}:${s.port}`, `manage_${i}`)]);
    await ctx.editMessageText("سيرفراتك:", Markup.inlineKeyboard(btns));
});

// تشغيل البوت مع تنظيف الرسائل القديمة (أهم سطر للرد)
bot.launch({ dropPendingUpdates: true });

// درع الحماية من الكراش
process.on('uncaughtException', (e) => console.log('Error Handled:', e.message));
