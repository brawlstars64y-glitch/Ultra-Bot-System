const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 نظام الاستدامة الذكي (لضمان العمل 24/7 على Railway)
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("💎 نظام MaxBlack Ultra يعمل بأعلى كفاءة");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let activeClients = {};
let afkIntervals = {};
let uptimes = {};

// 🎨 الواجهة الاحترافية (تصميم القائمة الرئيسية)
const mainUI = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'list_srv')],
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_srv')],
    [Markup.button.callback('⚙️ إعـدادات الـنـظـام', 'settings'), Markup.button.callback('❓ المـسـاعـدة', 'help')],
    [Markup.button.url('👨‍💻 المـطـور (MaxBlack)', 'https://t.me/uuuaaw')]
]);

// 🚀 بداية التشغيل
bot.start((ctx) => {
    ctx.replyWithMarkdown(`*• مرحباً بك في بوت بلاير* 🔮\n*عملي هو ابقاء سيرفرك الخاص بـ ماين كرافت شغال بدون توقف 24/7* 🔔\n\n*اختر ماتريد من القائمة:*`, mainUI);
});

// 🛠️ نظام إضافة السيرفر وحماية الانهيار (تنظيف البيانات)
bot.action('add_srv', (ctx) => {
    ctx.session = { step: 'host' };
    ctx.reply('📥 *أرسل الآن عنوان السيرفر (IP):*');
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    if (ctx.session?.step === 'host') {
        // حماية الانهيار: تنظيف العنوان من الروابط فوراً
        ctx.session.tempHost = ctx.message.text.trim().replace(/https?:\/\//, '').split('/')[0];
        ctx.session.step = 'port';
        ctx.reply('🔢 *أرسل الآن البورت (Port):*');
    } else if (ctx.session?.step === 'port') {
        ctx.session.tempPort = ctx.message.text.trim();
        ctx.session.step = 'name';
        ctx.reply('🤖 *أرسل الاسم الذي تريده للبوت:*');
    } else if (ctx.session?.step === 'name') {
        let servers = db.get(`${userId}.servers`) || [];
        servers.push({ host: ctx.session.tempHost, port: ctx.session.tempPort, bot_name: ctx.message.text.trim() });
        db.set(`${userId}.servers`, servers);
        ctx.session = null;
        ctx.reply('✅ *تم حفظ السيرفر بنجاح يا بطل!*', mainUI);
    }
});

// 📁 عرض السيرفرات وإدارة التحكم
bot.action('list_srv', (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length === 0) return ctx.answerCbQuery("❌ لا يوجد سيرفرات!", { show_alert: true });
    
    const kb = servers.map((s, i) => [Markup.button.callback(`🌐 ${s.host}`, `manage_${i}`)]);
    kb.push([Markup.button.callback('🔙 رجوع', 'home')]);
    ctx.editMessageText('🎮 *قائمة سيرفراتك المحفوظة:*', Markup.inlineKeyboard(kb));
});

// ⚙️ لوحة التحكم الاحترافية (مطابقة لطلبك)
bot.action(/^manage_(\d+)$/, (ctx) => {
    const idx = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[idx];
    const status = activeClients[ctx.from.id] ? "شغال ✅" : "متوقف 🔴";

    ctx.editMessageText(`*تحكم بالسيرفر رقم ${parseInt(idx)+1}* 📊\n--------------------------\n🌐 *العنوان:* \`${s.host}:${s.port}\`\n🤖 *البوت:* \`${s.bot_name}\`\n📊 *الحالة:* ${status}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[ctx.from.id] ? '🛑 إيقاف الاتصال' : '▶️ تشغيل الاتصال', `toggle_${idx}`)],
            [Markup.button.callback('ℹ️ معلومات حية', `info`), Markup.button.callback('✏️ تغيير الاسم', `rename`)],
            [Markup.button.callback('⏱️ مدة التشغيل', `uptime`)],
            [Markup.button.callback('🔔 الإشعارات: ON', `notif`), Markup.button.callback('🔄 تلقائي: ON', `auto`)],
            [Markup.button.callback('🗑️ حذف السيرفر', `del_${idx}`)],
            [Markup.button.callback('🔙 رجوع لسيرفراتي', 'list_srv')]
        ])
    });
});

// ▶️ المحرك الذكي للتشغيل (حل مشكلة فشل الاتصال)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const idx = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[idx];

    if (activeClients[userId]) {
        activeClients[userId].close();
        clearInterval(afkIntervals[userId]);
        delete activeClients[userId];
        return ctx.reply("🔴 *تم فصل البوت بنجاح.*");
    }

    try {
        ctx.answerCbQuery("⏳ جاري محاولة الدخول...");
        
        // إعدادات اتصال متطورة لضمان تجاوز أخطاء aternos وغيرها
        activeClients[userId] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.bot_name,
            offline: true,
            version: '1.21.130',
            skipPing: true, // تخطي البنج لسرعة الدخول
            connectTimeout: 15000
        });

        activeClients[userId].on('spawn', () => {
            uptimes[userId] = Date.now();
            ctx.reply(`✅ *أبشر يا بطل! بوتك دخل السيرفر الآن.*\n🛡️ *نظام Anti-AFK والحماية من الانهيار مفعل.*`);
            
            // 🔄 نظام Anti-AFK المطور (حركة خفيفة كل 45 ثانية)
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
            console.log("Protected Error: " + err.message);
            delete activeClients[userId];
            clearInterval(afkIntervals[userId]);
        });

    } catch (e) { ctx.reply("❌ *خطأ:* تأكد من بيانات السيرفر وأنه يعمل حالياً."); }
});

// ⏱️ ميزة مدة التشغيل
bot.action('uptime', (ctx) => {
    const userId = ctx.from.id;
    if (!uptimes[userId]) return ctx.answerCbQuery("❌ البوت غير متصل حالياً!", {show_alert:true});
    const diff = Math.floor((Date.now() - uptimes[userId]) / 1000);
    ctx.answerCbQuery(`⏱️ البوت يعمل منذ: ${Math.floor(diff/60)} دقيقة و ${diff%60} ثانية`, {show_alert:true});
});

bot.action('home', (ctx) => ctx.editMessageText('🔮 *قائمة التحكم الرئيسية:*', { parse_mode: 'Markdown', ...mainUI }));

bot.launch();
console.log('🚀 نظام MaxBlack Ultra الاحترافي يعمل الآن!');
