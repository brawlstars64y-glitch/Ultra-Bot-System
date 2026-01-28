const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 محرك الاستدامة ومنع توقف الخدمة (Railway)
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("نظام MaxBlack Ultra: الحماية مفعلة ✅");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let activeClients = {};
let afkIntervals = {};

// 🎨 الواجهة الرئيسية (نفس تصميم الصور التي أرفقتها)
const mainUI = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'list_srv')], //
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_srv')],     //
    [Markup.button.callback('⚙️ إعـدادات الـنـظـام', 'settings'), Markup.button.callback('❓ المـسـاعـدة', 'help')], //
    [Markup.button.url('👨‍💻 المـطـور', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*مرحباً بك، أنا هنا لحماية سيرفرك من قطع الاتصال* 🛡️`, mainUI);
});

// ⚙️ إصلاح زر إعدادات النظام
bot.action('settings', (ctx) => {
    ctx.editMessageText(`⚙️ *إعدادات الحماية الذكية:*\n\n• حماية الانهيار: مدمجة ✅\n• نظام Anti-AFK: متطور (حركة + قفز) ✅\n• محاكاة الجهاز: Samsung S24 Ultra 📱`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع للقائمة', 'home')]])
    });
});

// ❓ إصلاح زر المساعدة
bot.action('help', (ctx) => {
    ctx.editMessageText(`❓ *دليل البقاء نشطاً:*\n\n1. أضف السيرفر بصيغة IP ثم Port.\n2. شغل الاتصال من قائمة "سيرفراتي".\n3. سيقوم البوت بالتحرك والقفز تلقائياً لمنع طرده.`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع للقائمة', 'home')]])
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
        ctx.reply('🔢 *جميل! الآن أرسل البورت (Port):*');
    } 
    else if (ctx.session?.step === 'get_port') {
        let servers = db.get(`${userId}.servers`) || [];
        servers.push({ host: ctx.session.tempHost, port: ctx.message.text.trim(), bot_name: "MaxBlack_Pro" });
        db.set(`${userId}.servers`, servers);
        ctx.session = null;
        ctx.reply('✅ *تم حفظ السيرفر بنجاح!*', mainUI);
    }
});

// 🎮 قائمة السيرفرات
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
    ctx.editMessageText(`📊 *تحكم بالسيرفر رقم ${parseInt(idx)+1}*\n🌐 \`${s.host}:${s.port}\`\nالحالة: ${status}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[ctx.from.id] ? '🛑 إيقاف الاتصال' : '▶️ تشغيل الاتصال', `toggle_${idx}`)], //
            [Markup.button.callback('🗑️ حذف السيرفر', `del_${idx}`)], //
            [Markup.button.callback('🔙 رجوع لسيرفراتي', 'list_srv')] //
        ])
    });
});

// ▶️ المحرك النهائي (حماية الانهيار + دوران + قفز + رسائل)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const idx = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[idx];

    if (activeClients[userId]) {
        activeClients[userId].close();
        clearInterval(afkIntervals[userId]);
        delete activeClients[userId];
        return ctx.reply("🛑 *تم فصل الحماية وإيقاف البوت.*");
    }

    try {
        ctx.answerCbQuery("⏳ جاري تفعيل بروتوكول الحماية والاقتحام...");
        
        activeClients[userId] = bedrock.createClient({
            host: s.host, port: parseInt(s.port), username: s.bot_name,
            offline: true, version: '1.21.130', skipPing: true,
            profiles: { platform: 1, deviceModel: 'Samsung S24 Ultra' }
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *تم تثبيت الاتصال! البوت يتحرك ويقفز الآن لمنع الطرد.*`);
            
            // 🔄 نظام النبض الحركي المركب (دوران + قفز + دردشة)
            let tick = 0;
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    tick++;
                    // 1. حركة دوران خفيفة (تغيير الـ Yaw)
                    activeClients[userId].queue('player_auth_input', {
                        pitch: 0, yaw: (tick * 10) % 360, 
                        position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0, z: 0 },
                        head_yaw: (tick * 10) % 360, input_data: { jump_down: tick % 2 === 0 }, 
                        input_mode: 'touch', play_mode: 'normal'
                    });

                    // 2. إرسال رسالة دردشة كل 40 ثانية
                    if (tick % 4 === 0) {
                        activeClients[userId].queue('text', { 
                            type: 'chat', needs_translation: false, source_name: s.bot_name, 
                            xuid: '', platform_chat_id: '', message: '🛡️ Connection Active' 
                        });
                    }
                }
            }, 10000); // تحديث الحركة كل 10 ثوانٍ لضمان النشاط الكامل
        });

        // 🛡️ حماية الانهيار (Crash Safe) لمنع خروج البوت من التليجرام
        activeClients[userId].on('error', (err) => {
            console.log(`[Shield] Connection Error: ${err.message}`);
            delete activeClients[userId];
            clearInterval(afkIntervals[userId]);
        });

    } catch (e) { ctx.reply("❌ فشل الاتصال، تأكد من بيانات السيرفر."); }
});

bot.action('home', (ctx) => ctx.editMessageText('*مرحباً بك، أنا هنا لحماية سيرفرك من قطع الاتصال* 🛡️', { parse_mode: 'Markdown', ...mainUI }));

bot.action(/^del_(\d+)$/, (ctx) => {
    let servers = db.get(`${ctx.from.id}.servers`);
    servers.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.servers`, servers);
    ctx.editMessageText("✅ تم حذف السيرفر.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'list_srv')]]));
});

bot.launch();
console.log('🚀 نظام MaxBlack Ultra المتكامل يعمل الآن!');
