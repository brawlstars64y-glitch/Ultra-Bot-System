const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 نظام الاستدامة لضمان العمل 24/7
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("نظام MaxBlack Ultra شغال بأعلى كفاءة 💎");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let activeClients = {};
let afkIntervals = {};

// 🎨 الواجهة الرئيسية المبسطة
const mainUI = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'list_srv')],
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_srv')],
    [Markup.button.callback('⚙️ إعـدادات الـنـظـام', 'settings'), Markup.button.callback('❓ المـسـاعـدة', 'help')],
    [Markup.button.url('👨‍💻 المـطـور', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*• مرحباً بك في بوت بلاير* 🔮\n*عملي هو ابقاء سيرفرك الخاص بـ ماين كرافت شغال بدون توقف 24/7* 🔔`, mainUI);
});

// 🛠️ إضافة سيرفر جديد
bot.action('add_srv', (ctx) => {
    ctx.session = { step: 'host' };
    ctx.reply('📥 *أرسل الآن عنوان السيرفر والآي بي (مثال example.me:19132):*');
});

bot.on('text', async (ctx) => {
    if (ctx.session?.step === 'host') {
        const input = ctx.message.text.trim().replace(/https?:\/\//, '').split('/')[0];
        if (input.includes(':')) {
            const [h, p] = input.split(':');
            let servers = db.get(`${ctx.from.id}.servers`) || [];
            servers.push({ host: h.trim(), port: p.trim(), bot_name: "MaxBlack" });
            db.set(`${ctx.from.id}.servers`, servers);
            ctx.session = null;
            ctx.reply('✅ *تم حفظ السيرفر بنجاح يا بطل!*', mainUI);
        } else {
            ctx.reply("❌ أرسل الصيغة صحيحة `IP:PORT`", {parse_mode:'Markdown'});
        }
    }
});

bot.action('list_srv', (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length === 0) return ctx.answerCbQuery("❌ لا توجد سيرفرات!", { show_alert: true });
    const kb = servers.map((s, i) => [Markup.button.callback(`🌐 ${s.host}`, `manage_${i}`)]);
    kb.push([Markup.button.callback('🔙 رجوع', 'home')]);
    ctx.editMessageText('🎮 *قائمة سيرفراتك:*', Markup.inlineKeyboard(kb));
});

// ⚙️ واجهة التحكم النهائية (تم حذف الأزرار بناءً على طلبك)
bot.action(/^manage_(\d+)$/, (ctx) => {
    const idx = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[idx];
    const isOnline = activeClients[ctx.from.id] ? "شغال ✅" : "متوقف 🔴";

    ctx.editMessageText(`*تحكم بالسيرفر رقم ${parseInt(idx)+1}* 📊\n--------------------------\n🌐 *العنوان:* \`${s.host}:${s.port}\`\n📊 *الحالة:* ${isOnline}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[ctx.from.id] ? '🛑 إيقاف الاتصال' : '▶️ تشغيل الاتصال', `toggle_${idx}`)],
            [Markup.button.callback('🗑️ حذف السيرفر', `del_${idx}`)],
            [Markup.button.callback('🔙 رجوع لسيرفراتي', 'list_srv')]
        ])
    });
});

// ▶️ محرك الاتصال الشامل (يدعم جميع الإصدارات)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const idx = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[idx];

    if (activeClients[userId]) {
        activeClients[userId].close();
        clearInterval(afkIntervals[userId]);
        delete activeClients[userId];
        return ctx.reply("🛑 *تم فصل الاتصال.*");
    }

    try {
        ctx.answerCbQuery("⏳ جاري الاتصال بكافة الإصدارات...");
        
        activeClients[userId] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.bot_name,
            offline: true,
            // 🌍 دعم جميع الإصدارات: البوت سيحاول التعرف على نسخة السيرفر تلقائياً
            skipPing: false, 
            connectTimeout: 25000
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *أبشر يا بطل! تم الاتصال بنجاح بنظام الحماية الشامل.*`);
            
            // 🔄 نظام Anti-AFK
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    activeClients[userId].queue('text', { 
                        type: 'chat', needs_translation: false, source_name: s.bot_name, 
                        xuid: '', platform_chat_id: '', message: '🛡️ MaxBlack System Active' 
                    });
                }
            }, 45000);
        });

        activeClients[userId].on('error', (err) => {
            console.log("Error: " + err.message);
            delete activeClients[userId];
            clearInterval(afkIntervals[userId]);
        });

    } catch (e) { ctx.reply("❌ فشل الدخول، تأكد من أن السيرفر يعمل."); }
});

bot.action('home', (ctx) => ctx.editMessageText('🔮 *القائمة الرئيسية:*', { parse_mode: 'Markdown', ...mainUI }));

bot.launch();
console.log('🚀 نظام MaxBlack الشامل يعمل الآن!');
