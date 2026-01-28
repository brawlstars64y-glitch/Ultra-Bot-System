const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 نظام الاستدامة لضمان العمل 24/7
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("نظام MaxBlack Ultra v3: يعمل بأعلى كفاءة 🛡️");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let activeClients = {};
let afkIntervals = {};

// 🎨 الواجهة الرئيسية (Scannable & Clean)
const mainUI = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'list_srv')],
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_srv')],
    [Markup.button.callback('⚙️ إعـدادات الـنـظـام', 'settings'), Markup.button.callback('❓ المـسـاعـدة', 'help')],
    [Markup.button.url('👨‍💻 المـطـور', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*مرحباً بك، أنا هنا لحماية سيرفرك من قطع الاتصال* 🛡️`, mainUI);
});

// ✅ إصلاح زر إعدادات النظام
bot.action('settings', (ctx) => {
    ctx.editMessageText(`⚙️ *إعدادات النظام الحالية:* \n\n• *نظام الاتصال:* مستقر (1.21.130) ✅\n• *حماية الانهيار:* مفعلة 🛡️\n• *نظام Anti-AFK:* نبض حركي كامل 🔄\n• *الهوية:* اسم ثابت ✅`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع للقائمة', 'home')]])
    });
});

// ✅ إصلاح زر المساعدة
bot.action('help', (ctx) => {
    ctx.editMessageText(`❓ *دليل حل مشاكل الدخول:* \n\n1️⃣ تأكد أن السيرفر "Cracked" ولا يحتاج حساب مايكروسوفت.\n2️⃣ البوت يدخل تلقائياً ويقوم بالقفز لمنع الطرد.\n3️⃣ إذا لم يدخل البوت، تأكد من صحة الـ IP والبورت.`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع للقائمة', 'home')]])
    });
});

// 🛠️ إضافة سيرفر جديد
bot.action('add_srv', (ctx) => {
    ctx.session = { step: 'get_host' };
    ctx.reply('📥 *أرسل الآن عنوان السيرفر (IP) فقط:*');
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    if (ctx.session?.step === 'get_host') {
        ctx.session.tempHost = ctx.message.text.trim();
        ctx.session.step = 'get_port';
        ctx.reply('🔢 *جميل! أرسل الآن البورت (Port):*');
    } 
    else if (ctx.session?.step === 'get_port') {
        let servers = db.get(`${userId}.servers`) || [];
        servers.push({ 
            host: ctx.session.tempHost, 
            port: ctx.message.text.trim(), 
            bot_name: "MaxBlack_Bot" 
        });
        db.set(`${userId}.servers`, servers);
        ctx.session = null;
        ctx.reply('✅ *تم حفظ السيرفر بنجاح!*', mainUI);
    }
});

// 🎮 إدارة السيرفرات
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
    ctx.editMessageText(`📊 *إدارة الحماية:* \n🌐 \`${s.host}:${s.port}\` \nالحالة: ${status}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[ctx.from.id] ? '🛑 إيقاف الحماية' : '▶️ تشغيل الحماية', `toggle_${idx}`)],
            [Markup.button.callback('🗑️ حذف السيرفر', `del_${idx}`)],
            [Markup.button.callback('🔙 رجوع', 'list_srv')]
        ])
    });
});

// ▶️ المحرك الجديد كلياً (إصلاح مشكلة عدم الدخول)
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
        ctx.answerCbQuery("⏳ جاري الاقتحام وتثبيت الاتصال...");
        
        activeClients[userId] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.bot_name,
            offline: true,
            version: '1.21.130', // العودة للإصدار الأكثر استقراراً للدخول
            skipPing: true,
            connectTimeout: 30000,
            profiles: {
                platform: 1, 
                deviceModel: 'Samsung S24 Ultra' 
            }
        });

        // نظام النبض الحركي الفوري (Anti-AFK)
        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *تم الدخول بنجاح!* \n🛡️ نظام Anti-AFK والحماية نشط الآن.`);
            
            let tick = 0;
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    tick++;
                    // حركة قفز ودوران خفيفة لإثبات النشاط
                    activeClients[userId].queue('player_auth_input', {
                        pitch: 0, yaw: (tick * 10) % 360, 
                        position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0, z: 0 },
                        head_yaw: (tick * 10) % 360, input_data: { jump_down: tick % 2 === 0 }, 
                        input_mode: 'touch', play_mode: 'normal'
                    });
                }
            }, 10000);
        });

        // حماية الانهيار
        activeClients[userId].on('error', (err) => {
            console.log(`[Shield] Error: ${err.message}`);
            delete activeClients[userId];
            clearInterval(afkIntervals[userId]);
        });

    } catch (e) { ctx.reply("❌ فشل الدخول للسيرفر. تأكد من البيانات."); }
});

bot.action('home', (ctx) => ctx.editMessageText('*مرحباً بك، أنا هنا لحماية سيرفرك من قطع الاتصال* 🛡️', { parse_mode: 'Markdown', ...mainUI }));

bot.action(/^del_(\d+)$/, (ctx) => {
    let servers = db.get(`${ctx.from.id}.servers`);
    servers.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.servers`, servers);
    ctx.editMessageText("✅ تم حذف السيرفر.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'list_srv')]]));
});

bot.launch();
console.log('🚀 نظام MaxBlack Ultra v3 جاهز للعمل!');
