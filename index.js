const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 نظام الاستدامة لضمان العمل 24/7 (Railway)
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("نظام MaxBlack يعمل بأقصى حماية 🛡️");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let activeClients = {};
let afkIntervals = {};

// 🔍 قنوات الاشتراك الإجباري
const CHANNELS = [
    { id: '@minecrafmodss12', link: 'https://t.me/minecrafmodss12' },
    { id: '@aternosbot24', link: 'https://t.me/aternosbot24' }
];

// 🎨 الواجهة الرئيسية الاحترافية
const mainUI = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'list_srv')],
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_srv')],
    [Markup.button.callback('⚙️ إعـدادات الـنـظـام', 'settings'), Markup.button.callback('❓ المـسـاعـدة', 'help')],
    [Markup.button.url('👨‍💻 المـطـور', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*• مرحباً بك يا بطل في بوت بلاير* 🔮\n*مهمتي إبقاء سيرفرك شغالاً 24/7 مع حماية كاملة* 🛡️`, mainUI);
});

// 🛠️ نظام الإضافة (IP ثم Port) لضمان الدقة
bot.action('add_srv', (ctx) => {
    ctx.session = { step: 'get_host' };
    ctx.reply('📥 *أرسل الآن عنوان السيرفر (IP) فقط:*');
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    if (ctx.session?.step === 'get_host') {
        ctx.session.tempHost = ctx.message.text.trim().replace(/https?:\/\//, '').split('/')[0];
        ctx.session.step = 'get_port';
        ctx.reply('🔢 *جميل! الآن أرسل البورت (Port):*');
    } 
    else if (ctx.session?.step === 'get_port') {
        let servers = db.get(`${userId}.servers`) || [];
        servers.push({ host: ctx.session.tempHost, port: ctx.message.text.trim(), bot_name: "MaxBlack" });
        db.set(`${userId}.servers`, servers);
        ctx.session = null;
        ctx.reply('✅ *تم الحفظ بنجاح!*', mainUI);
    }
});

bot.action('list_srv', (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length === 0) return ctx.answerCbQuery("❌ لا توجد سيرفرات!", { show_alert: true });
    const kb = servers.map((s, i) => [Markup.button.callback(`🌐 ${s.host}`, `manage_${i}`)]);
    kb.push([Markup.button.callback('🔙 رجوع', 'home')]);
    ctx.editMessageText('🎮 *سيرفراتك المضافة:*', Markup.inlineKeyboard(kb));
});

// ⚙️ واجهة التحكم النهائية
bot.action(/^manage_(\d+)$/, (ctx) => {
    const idx = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[idx];
    const status = activeClients[ctx.from.id] ? "شغال ✅" : "متوقف 🔴";

    ctx.editMessageText(`*تحكم بالسيرفر رقم ${parseInt(idx)+1}* 📊\n--------------------------\n🌐 *العنوان:* \`${s.host}:${s.port}\`\n📊 *الحالة:* ${status}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[ctx.from.id] ? '🛑 إيقاف الاتصال' : '▶️ تشغيل الاتصال', `toggle_${idx}`)],
            [Markup.button.callback('🗑️ حذف السيرفر', `del_${idx}`)],
            [Markup.button.callback('🔙 رجوع لسيرفراتي', 'list_srv')]
        ])
    });
});

// ▶️ المحرك الجبار (1.21.130 + Anti-AFK + Crash Protect)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const idx = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[idx];

    if (activeClients[userId]) {
        activeClients[userId].close();
        clearInterval(afkIntervals[userId]);
        delete activeClients[userId];
        return ctx.reply("🛑 *تم فصل الاتصال بنجاح.*");
    }

    try {
        ctx.answerCbQuery("⏳ جاري الاقتحام وتفعيل الحماية...");
        
        activeClients[userId] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.bot_name,
            offline: true,
            version: '1.21.130',
            skipPing: true, // تخطي البنج لضمان الدخول المباشر
            connectTimeout: 30000
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *أبشر يا بطل! البوت دخل السيرفر الآن.*`);
            
            // 💬 رسالة ترحيبية فور الدخول
            activeClients[userId].queue('text', { 
                type: 'chat', needs_translation: false, source_name: s.bot_name, 
                xuid: '', platform_chat_id: '', message: 'MaxBlack System Active 🛡️' 
            });

            // 🔄 نظام Anti-AFK المطور (حركة ورسائل كل 45 ثانية)
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    activeClients[userId].queue('text', { 
                        type: 'chat', needs_translation: false, source_name: s.bot_name, 
                        xuid: '', platform_chat_id: '', message: '🛡️ Protection Pulse' 
                    });
                }
            }, 45000);
        });

        // 🛡️ معالجة الأخطاء لمنع انهيار البوت (Crash Protection)
        activeClients[userId].on('error', (err) => {
            console.log(`[Error] ${userId}: ${err.message}`);
            if (activeClients[userId]) activeClients[userId].close();
            delete activeClients[userId];
            clearInterval(afkIntervals[userId]);
        });

    } catch (e) { ctx.reply("❌ حدث خطأ، تأكد من بيانات السيرفر."); }
});

bot.action('home', (ctx) => ctx.editMessageText('🔮 *القائمة الرئيسية:*', { parse_mode: 'Markdown', ...mainUI }));

bot.launch();
console.log('🚀 نظام MaxBlack الاحترافي يعمل الآن!');
