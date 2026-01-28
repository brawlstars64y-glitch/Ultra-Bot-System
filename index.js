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

// 🎨 الواجهة الرئيسية (Scannable UI)
const mainUI = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'list_srv')],
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_srv')],
    [Markup.button.callback('⚙️ إعـدادات الـنـظـام', 'settings'), Markup.button.callback('❓ المـسـاعـدة', 'help')],
    [Markup.button.url('👨‍💻 المـطـور', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*مرحباً بك، أنا هنا لحماية سيرفرك من قطع الاتصال* 🛡️`, mainUI);
});

// ⚙️ إصلاح زر الإعدادات
bot.action('settings', (ctx) => {
    ctx.editMessageText(`⚙️ *إعدادات الحماية:*\n\n• حماية الانهيار: مفعلة ✅\n• نظام Anti-AFK: (حركة + قفز) ✅\n• محرك الاستجابة: فوري ⚡`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'home')]])
    });
});

// ❓ إصلاح زر المساعدة
bot.action('help', (ctx) => {
    ctx.editMessageText(`❓ *دليل حل المشاكل:*\n\n1. أضف السيرفر (IP:PORT).\n2. تأكد أن السيرفر إصدار 1.21.130.\n3. إذا خرج البوت، جرب تغيير اسمه في الإعدادات.`, {
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
        servers.push({ host: ctx.session.tempHost, port: ctx.message.text.trim(), bot_name: "MaxBlack_" + Math.floor(Math.random() * 999) });
        db.set(`${userId}.servers`, servers);
        ctx.session = null;
        ctx.reply('✅ *تم حفظ السيرفر!*', mainUI);
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
    ctx.editMessageText(`📊 *حالة الحماية للسيرفر:*\n🌐 \`${s.host}:${s.port}\`\nالحالة: ${status}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[ctx.from.id] ? '🛑 إيقاف' : '▶️ تشغيل', `toggle_${idx}`)],
            [Markup.button.callback('🗑️ حذف', `del_${idx}`), Markup.button.callback('🔙', 'list_srv')]
        ])
    });
});

// ▶️ المحرك الجديد (حل مشكلة الخروج السريع)
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
        ctx.answerCbQuery("⏳ جاري تثبيت الحماية...");
        
        activeClients[userId] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.bot_name,
            offline: true,
            version: '1.21.130',
            skipPing: true, // تخطي البنج للدخول المباشر
            connectTimeout: 30000,
            profiles: { platform: 1, deviceModel: 'Samsung S24 Ultra' }
        });

        // ⚡ نظام الاستجابة الفورية (يمنع الطرد السريع)
        activeClients[userId].on('packet', (packet, meta) => {
            if (meta.name === 'network_stack_latency') {
                // الرد فوراً على حزم التأخير لضمان بقاء الجلسة
                activeClients[userId].queue('network_stack_latency', { server_time: packet.server_time, needs_response: false });
            }
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *تم تثبيت الاتصال بنجاح! البوت الآن يحمي السيرفر.*`);
            
            // 🔄 نظام Anti-AFK فوري
            let tick = 0;
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    tick++;
                    // حركة خفيفة كل 10 ثواني (دوران + قفز)
                    activeClients[userId].queue('player_auth_input', {
                        pitch: 0, yaw: (tick * 15) % 360, 
                        position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0, z: 0 },
                        head_yaw: (tick * 15) % 360, input_data: { jump_down: tick % 2 === 0 }, 
                        input_mode: 'touch', play_mode: 'normal'
                    });
                }
            }, 10000);
        });

        activeClients[userId].on('error', (err) => {
            console.log(`[Error] ${userId}: ${err.message}`);
            delete activeClients[userId];
            clearInterval(afkIntervals[userId]);
        });

    } catch (e) { ctx.reply("❌ خطأ في الاتصال."); }
});

bot.action('home', (ctx) => ctx.editMessageText('*مرحباً بك، أنا هنا لحماية سيرفرك من قطع الاتصال* 🛡️', { parse_mode: 'Markdown', ...mainUI }));

bot.action(/^del_(\d+)$/, (ctx) => {
    let servers = db.get(`${ctx.from.id}.servers`);
    servers.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.servers`, servers);
    ctx.editMessageText("✅ تم الحذف.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'list_srv')]]));
});

bot.launch();
console.log('🚀 نظام MaxBlack Ultra المطور يعمل الآن!');
