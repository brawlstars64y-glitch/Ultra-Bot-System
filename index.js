const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 نظام الاستدامة لضمان العمل 24/7
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("نظام MaxBlack Ultra يعمل بنجاح 💎");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let activeClients = {};
let afkIntervals = {};

// 🎨 الواجهة الرئيسية المعدلة
const mainUI = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'list_srv')],
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_srv')],
    [Markup.button.callback('⚙️ إعـدادات الـنـظـام', 'settings'), Markup.button.callback('❓ المـسـاعـدة', 'help')],
    [Markup.button.url('👨‍💻 المـطـور', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    // الواجهة الجديدة كما طلبت يا بطل
    ctx.replyWithMarkdown(`*مرحباً بك، أنا هنا لحماية سيرفرك من قطع الاتصال* 🛡️`, mainUI);
});

// ⚙️ إعدادات النظام
bot.action('settings', (ctx) => {
    ctx.editMessageText(`⚙️ *إعدادات الحماية:*\n\n• حماية الاتصال: مفعلة ✅\n• نظام Anti-AFK: مفعل ✅\n• إصدار البروتوكول: 1.21.130`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'home')]])
    });
});

// ❓ المساعدة
bot.action('help', (ctx) => {
    ctx.editMessageText(`❓ *كيفية الاستخدام:*\n\n1. أضف سيرفرك (IP ثم Port).\n2. ادخل لقائمة سيرفراتي.\n3. اضغط "تشغيل" وسأقوم بالباقي لحماية السيرفر.`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'home')]])
    });
});

// 🛠️ إضافة سيرفر
bot.action('add_srv', (ctx) => {
    ctx.session = { step: 'get_host' };
    ctx.reply('📥 *أرسل الآن عنوان السيرفر (IP) فقط:*');
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    if (ctx.session?.step === 'get_host') {
        ctx.session.tempHost = ctx.message.text.trim().replace(/https?:\/\//, '').split('/')[0];
        ctx.session.step = 'get_port';
        ctx.reply('🔢 *أرسل الآن البورت (Port):*');
    } 
    else if (ctx.session?.step === 'get_port') {
        let servers = db.get(`${userId}.servers`) || [];
        servers.push({ host: ctx.session.tempHost, port: ctx.message.text.trim(), bot_name: "MaxBlack_Pro" });
        db.set(`${userId}.servers`, servers);
        ctx.session = null;
        ctx.reply('✅ *تم حفظ السيرفر!*', mainUI);
    }
});

bot.action('list_srv', (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length === 0) return ctx.answerCbQuery("❌ لا توجد سيرفرات!", { show_alert: true });
    const kb = servers.map((s, i) => [Markup.button.callback(`🌐 ${s.host}`, `manage_${i}`)]);
    kb.push([Markup.button.callback('🔙 رجوع', 'home')]);
    ctx.editMessageText('🎮 *اختر السيرفر:*', Markup.inlineKeyboard(kb));
});

bot.action(/^manage_(\d+)$/, (ctx) => {
    const idx = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[idx];
    const status = activeClients[ctx.from.id] ? "متصل ✅" : "مفصول 🔴";
    ctx.editMessageText(`📊 *حالة الحماية للسيرفر:*\n🌐 \`${s.host}:${s.port}\`\nالحالة: ${status}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[ctx.from.id] ? '🛑 إيقاف' : '▶️ تشغيل', `toggle_${idx}`)],
            [Markup.button.callback('🗑️ حذف', `del_${idx}`), Markup.button.callback('🔙', 'list_srv')]
        ])
    });
});

// ▶️ المحرك
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const idx = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[idx];

    if (activeClients[userId]) {
        activeClients[userId].close();
        clearInterval(afkIntervals[userId]);
        delete activeClients[userId];
        return ctx.reply("🛑 *تم فصل الحماية.*");
    }

    try {
        ctx.answerCbQuery("⏳ جاري الاتصال والحماية...");
        activeClients[userId] = bedrock.createClient({
            host: s.host, port: parseInt(s.port), username: s.bot_name,
            offline: true, version: '1.21.130', skipPing: true,
            profiles: { platform: 1, deviceModel: 'Samsung S24 Ultra' }
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *تم تثبيت الاتصال بنجاح! البوت الآن يحمي سيرفرك.*`);
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    activeClients[userId].queue('text', { type: 'chat', needs_translation: false, source_name: s.bot_name, xuid: '', platform_chat_id: '', message: '🛡️ Connection Protected' });
                }
            }, 35000);
        });

        activeClients[userId].on('error', (err) => {
            delete activeClients[userId];
            clearInterval(afkIntervals[userId]);
        });
    } catch (e) { ctx.reply("❌ حدث خطأ في الاتصال."); }
});

bot.action('home', (ctx) => ctx.editMessageText('*مرحباً بك، أنا هنا لحماية سيرفرك من قطع الاتصال* 🛡️', { parse_mode: 'Markdown', ...mainUI }));

bot.action(/^del_(\d+)$/, (ctx) => {
    let servers = db.get(`${ctx.from.id}.servers`);
    servers.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.servers`, servers);
    ctx.editMessageText("✅ تم الحذف.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'list_srv')]]));
});

bot.launch();
console.log('🚀 البوت شغال بالواجهة الجديدة!');
