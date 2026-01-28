const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');
const crypto = require('crypto');

// 🌐 محرك الاستدامة
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("نظام الحماية القصوى يعمل ✅");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let activeClients = {};
let afkIntervals = {};

// 🎨 الواجهة الرئيسية (مطابقة لصورتك)
const mainUI = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'list_srv')],
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_srv')],
    [Markup.button.callback('⚙️ إعـدادات الـنـظـام', 'settings'), Markup.button.callback('❓ المـسـاعـدة', 'help')], //
    [Markup.button.url('👨‍💻 المـطـور', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*مرحباً بك، أنا هنا لحماية سيرفرك من قطع الاتصال* 🛡️`, mainUI);
});

// ✅ إصلاح الأزرار (Settings & Help)
bot.action('settings', (ctx) => {
    ctx.editMessageText(`⚙️ *إعدادات النظام المصلحة:*\n\n• الإصدار: تلقائي (جميع الإصدارات) 🔄\n• حماية الانهيار: مدمجة 🛡️\n• محرك Anti-Bot: متخطى ✅`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'home')]])
    });
});

bot.action('help', (ctx) => {
    ctx.editMessageText(`❓ *دليل حل مشكلة الخروج:* \n\n1️⃣ تأكد أن السيرفر "Cracked" (بدون حساب مايكروسوفت).\n2️⃣ إذا طردك السيرفر، جرب تغيير اسم البوت.\n3️⃣ نظام Anti-AFK يعمل تلقائياً عند الدخول.`, {
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
        // اسم عشوائي في كل مرة لمنع الحظر
        servers.push({ host: ctx.session.tempHost, port: ctx.message.text.trim(), bot_name: "Max_" + crypto.randomBytes(2).toString('hex') });
        db.set(`${userId}.servers`, servers);
        ctx.session = null;
        ctx.reply('✅ *تم الحفظ!*', mainUI);
    }
});

// 📁 إدارة السيرفرات
bot.action('list_srv', (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length === 0) return ctx.answerCbQuery("❌ لا توجد سيرفرات!", { show_alert: true });
    const kb = servers.map((s, i) => [Markup.button.callback(`🌐 ${s.host}`, `manage_${i}`)]);
    kb.push([Markup.button.callback('🔙 رجوع', 'home')]);
    ctx.editMessageText('🎮 *سيرفراتك المضافة:*', Markup.inlineKeyboard(kb));
});

bot.action(/^manage_(\d+)$/, (ctx) => {
    const idx = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[idx];
    const status = activeClients[ctx.from.id] ? "متصل ✅" : "مفصول 🔴";
    ctx.editMessageText(`📊 *إدارة السيرفر:*\n🌐 \`${s.host}:${s.port}\`\nالحالة: ${status}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[ctx.from.id] ? '🛑 إيقاف' : '▶️ تشغيل', `toggle_${idx}`)],
            [Markup.button.callback('🗑️ حذف', `del_${idx}`), Markup.button.callback('🔙', 'list_srv')]
        ])
    });
});

// ▶️ المحرك النهائي لحل مشكلة "Joined/Left"
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const idx = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[idx];

    if (activeClients[userId]) {
        activeClients[userId].close();
        clearInterval(afkIntervals[userId]);
        delete activeClients[userId];
        return ctx.reply("🛑 *تم إيقاف الحماية.*");
    }

    try {
        ctx.answerCbQuery("⏳ جاري تثبيت الاتصال...");
        
        activeClients[userId] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.bot_name,
            offline: true,
            skipPing: false, // تركه false ليقوم السيرفر بالتعرف الصحيح
            connectTimeout: 60000,
            // 📱 بيانات جهاز حقيقي بالكامل لتخطي نظام الطرد
            profiles: {
                platform: 1, 
                deviceModel: 'SM-S928B', // Samsung S24 Ultra
                currentTick: 0
            }
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *البوت استقر بنجاح!* \n🛡️ نظام Anti-AFK والحماية من الانهيار نشط.`);
            
            let tick = 0;
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    tick++;
                    activeClients[userId].queue('player_auth_input', {
                        pitch: 0, yaw: (tick * 10) % 360, 
                        position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0, z: 0 },
                        head_yaw: (tick * 10) % 360, input_data: { jump_down: tick % 2 === 0 }, 
                        input_mode: 'touch', play_mode: 'normal'
                    });
                }
            }, 10000);
        });

        activeClients[userId].on('error', (err) => {
            delete activeClients[userId];
            clearInterval(afkIntervals[userId]);
        });

    } catch (e) { ctx.reply("❌ فشل الاتصال بالسيرفر."); }
});

bot.action('home', (ctx) => ctx.editMessageText('*مرحباً بك، أنا هنا لحماية سيرفرك من قطع الاتصال* 🛡️', { parse_mode: 'Markdown', ...mainUI }));

bot.action(/^del_(\d+)$/, (ctx) => {
    let servers = db.get(`${ctx.from.id}.servers`);
    servers.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.servers`, servers);
    ctx.editMessageText("✅ تم الحذف.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'list_srv')]]));
});

bot.launch();
console.log('🚀 نظام الحماية الشامل يعمل الآن!');
