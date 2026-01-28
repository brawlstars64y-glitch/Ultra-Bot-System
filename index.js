const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 محرك الاستدامة (Railway Keep-Alive)
// هذا الجزء يضمن بقاء البوت حياً ولا يغلق بواسطة Railway
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("💎 نظام MaxBlack Ultra: الحالة [يعمل بأقصى كفاءة]");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let activeClients = {};
let afkIntervals = {};

// 🎨 الواجهة الاحترافية المبسطة (Scannable UI)
const mainButtons = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'list_srv')],
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_srv')],
    [Markup.button.callback('⚙️ الإعـدادات', 'settings'), Markup.button.callback('❓ المـسـاعـدة', 'help')],
    [Markup.button.url('👨‍💻 المـطـور', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*• مرحباً بك يا بطل في نظام الاقتحام* 🔮\n*تم ضبط المحرك على إصدار 1.21.130 مع حماية Anti-AFK* 🛡️`, mainButtons);
});

// 🛠️ نظام إضافة السيرفر الذكي (خطوة بخطوة)
bot.action('add_srv', (ctx) => {
    ctx.session = { step: 'get_host' };
    ctx.reply('📥 *أرسل الآن عنوان السيرفر (IP) فقط:*');
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    if (ctx.session?.step === 'get_host') {
        // حماية الانهيار: تنقية الآي بي من أي شوائب أو روابط
        ctx.session.tempHost = ctx.message.text.trim().replace(/https?:\/\//, '').split('/')[0];
        ctx.session.step = 'get_port';
        ctx.reply('🔢 *أرسل الآن البورت (Port) الخاص بالسيرفر:*');
    } 
    else if (ctx.session?.step === 'get_port') {
        const portInput = ctx.message.text.trim();
        let servers = db.get(`${userId}.servers`) || [];
        servers.push({ host: ctx.session.tempHost, port: portInput, bot_name: "MaxBlack_Pro" });
        db.set(`${userId}.servers`, servers);
        ctx.session = null;
        ctx.reply('✅ *تم الحفظ بنجاح! السيرفر جاهز للاقتحام.*', mainButtons);
    }
});

// 📁 قائمة السيرفرات
bot.action('list_srv', (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length === 0) return ctx.answerCbQuery("❌ لا يوجد سيرفرات محفظوظة!", { show_alert: true });
    
    const kb = servers.map((s, i) => [Markup.button.callback(`🌐 ${s.host}`, `manage_${i}`)]);
    kb.push([Markup.button.callback('🔙 رجوع للقائمة', 'home')]);
    ctx.editMessageText('🎮 *اختر السيرفر الذي تريد تشغيل البوت فيه:*', Markup.inlineKeyboard(kb));
});

// ⚙️ لوحة التحكم بالسيرفر
bot.action(/^manage_(\d+)$/, (ctx) => {
    const idx = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[idx];
    const isOnline = activeClients[ctx.from.id] ? "شغال ✅" : "متوقف 🔴";

    ctx.editMessageText(`*تحكم بالسيرفر* 📊\n--------------------------\n🌐 *العنوان:* \`${s.host}:${s.port}\`\n📊 *الحالة الآن:* ${isOnline}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[ctx.from.id] ? '🛑 إيقاف البوت' : '▶️ تشغيل البوت', `toggle_${idx}`)],
            [Markup.button.callback('🗑️ حذف من القائمة', `del_${idx}`)],
            [Markup.button.callback('🔙 رجوع', 'list_srv')]
        ])
    });
});

// ▶️ محرك الاقتحام (The Bruteforce Engine)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const idx = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[idx];

    if (activeClients[userId]) {
        activeClients[userId].close();
        clearInterval(afkIntervals[userId]);
        delete activeClients[userId];
        return ctx.reply("🛑 *تم إيقاف البوت وفصل الاتصال.*");
    }

    try {
        ctx.answerCbQuery("⏳ جاري الاقتحام (إصدار 1.21.130)...");
        
        // إعدادات اتصال هجومية لتجاوز الرفض
        activeClients[userId] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.bot_name,
            offline: true,
            version: '1.21.130',
            skipPing: true, // تخطي فحص الحالة للدخول المباشر
            connectTimeout: 35000, // مهلة كافية للسيرفرات البطيئة
            onMsaCode: (code) => console.log(code) // للأمان
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *أبشر يا بطل! البوت داخل السيرفر الآن.*\n🛡️ *نظام Anti-AFK يعمل بقوة.*`);
            
            // 💬 رسالة إعلان الدخول
            activeClients[userId].queue('text', { 
                type: 'chat', needs_translation: false, source_name: s.bot_name, 
                xuid: '', platform_chat_id: '', message: '🛡️ MaxBlack Anti-AFK System Connected' 
            });

            // 🔄 نظام Anti-AFK (حركة ورسائل دورية لمنع الطرد)
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    activeClients[userId].queue('text', { 
                        type: 'chat', needs_translation: false, source_name: s.bot_name, 
                        xuid: '', platform_chat_id: '', message: '💎 Keep-Alive Heartbeat' 
                    });
                }
            }, 40000);
        });

        // 🛡️ حماية الانهيار (Crash Safe)
        activeClients[userId].on('error', (err) => {
            console.error(`[Error] ${userId}: ${err.message}`);
            delete activeClients[userId];
            clearInterval(afkIntervals[userId]);
        });

    } catch (e) { ctx.reply("❌ فشل الدخول، تأكد من بيانات السيرفر."); }
});

bot.action('home', (ctx) => ctx.editMessageText('🔮 *القائمة الرئيسية:*', { parse_mode: 'Markdown', ...mainButtons }));

// 🗑️ حذف السيرفر
bot.action(/^del_(\d+)$/, (ctx) => {
    let servers = db.get(`${ctx.from.id}.servers`);
    servers.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.servers`, servers);
    ctx.editMessageText("✅ تم الحذف بنجاح.", Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'list_srv')]]));
});

bot.launch();
console.log('🚀 نظام MaxBlack Ultra الجديد كلياً يعمل الآن!');
