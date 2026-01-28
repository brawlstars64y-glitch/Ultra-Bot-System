const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 سيرفر Railway لضمان العمل 24 ساعة ومنع توقف الخدمة
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("💎 نظام MaxBlack Pro يعمل بأعلى كفاءة وحماية");
}).listen(process.env.PORT || 3000);

// 🛡️ إعدادات البوت وقاعدة البيانات
const token = process.env.BOT_TOKEN || '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const tgBot = new Telegraf(token);

// تفعيل نظام الجلسات (Sessions) لإدارة خطوات الإدخال
tgBot.use(session());

const CHANNELS = [
    { id: '@minecrafmodss12', link: 'https://t.me/minecrafmodss12' },
    { id: '@aternosbot24', link: 'https://t.me/aternosbot24' }
];
const DEVELOPER_LINK = 'https://t.me/uuuaaw';

let activeClients = {};
let afkIntervals = {};

// 🔍 فحص الاشتراك الإجباري
async function checkAllSubscriptions(ctx) {
    for (const channel of CHANNELS) {
        try {
            const member = await ctx.telegram.getChatMember(channel.id, ctx.from.id);
            const status = ['member', 'administrator', 'creator'];
            if (!status.includes(member.status)) return false;
        } catch (e) { return false; }
    }
    return true;
}

// ⌨️ القوائم الرئيسية
const mainButtons = (ctx) => Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'my_servers')],
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_server')],
    [Markup.button.callback('⚙️ إعـدادات الـنـظـام', 'settings')],
    [Markup.button.url('👨‍💻 المـطـور (الدعم الفني)', DEVELOPER_LINK)]
]);

// 🚀 أوامر البداية
tgBot.start(async (ctx) => {
    if (await checkAllSubscriptions(ctx)) {
        ctx.replyWithMarkdown(`👋 *أهلاً بك يا بطل في نظام MaxBlack Pro*\n🛡️ *تم تفعيل نظام حماية الانهيار و Anti-AFK تلقائياً.*`, mainButtons(ctx));
    } else {
        ctx.reply('⚠️ *يجب الاشتراك في القنوات لتفعيل البوت:*', Markup.inlineKeyboard([
            [Markup.button.url('📢 القناة الأولى', CHANNELS[0].link)],
            [Markup.button.url('📢 القناة الثانية', CHANNELS[1].link)],
            [Markup.button.callback('✅ تم الاشتراك', 'main_menu')]
        ]));
    }
});

tgBot.action('main_menu', async (ctx) => {
    if (await checkAllSubscriptions(ctx)) {
        ctx.editMessageText('🔮 *قائمة التحكم الرئيسية:*', { parse_mode: 'Markdown', ...mainButtons(ctx) });
    } else {
        ctx.answerCbQuery('❌ اشترك أولاً!', { show_alert: true });
    }
});

// 📁 نظام السيرفرات
tgBot.action('my_servers', async (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length === 0) return ctx.answerCbQuery("❌ لا توجد سيرفرات!", { show_alert: true });

    let keyboard = servers.map((s, i) => [Markup.button.callback(`${i + 1}. 🌐 ${s.host}`, `manage_srv_${i}`)]);
    keyboard.push([Markup.button.callback('🔙 رجوع', 'main_menu')]);
    ctx.editMessageText('🎮 *قائمة سيرفراتك:*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboard) });
});

tgBot.action('add_server', (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length >= 3) return ctx.answerCbQuery("⚠️ وصلت للحد الأقصى (3)!", { show_alert: true });
    ctx.reply('📥 *أرسل الآن عنوان السيرفر (IP) فقط:*');
    ctx.session = { step: 'waiting_host' };
});

// 📝 معالجة النصوص بنظام حماية الانهيار
tgBot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const msg = ctx.message.text.trim();

    if (ctx.session?.step === 'waiting_host') {
        // حماية الانهيار: تنقية العنوان من الروابط
        const cleanHost = msg.replace(/https?:\/\//, '').split('/')[0];
        ctx.session.tempHost = cleanHost;
        ctx.session.step = 'waiting_port';
        ctx.reply(`✅ تم حفظ العنوان: \`${cleanHost}\`\n🔢 *أرسل الآن البورت (Port):*`, { parse_mode: 'Markdown' });
    } 
    else if (ctx.session?.step === 'waiting_port') {
        const port = msg;
        let servers = db.get(`${userId}.servers`) || [];
        servers.push({ host: ctx.session.tempHost, port: port, bot_name: "MaxBlack_Bot" });
        db.set(`${userId}.servers`, servers);
        ctx.session = null;
        ctx.reply('✅ *تم حفظ السيرفر بنجاح يا بطل!*', mainButtons(ctx));
    }
});

// ⚙️ إدارة السيرفرات والتشغيل
tgBot.action(/^manage_srv_(\d+)$/, (ctx) => {
    const index = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[index];
    const isRunning = activeClients[ctx.from.id] ? "شغال ✅" : "متوقف 🔴";
    
    ctx.editMessageText(`📊 *تحكم بالسيرفر:* \`${s.host}:${s.port}\`\nحالة البوت: ${isRunning}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('▶️ تشغيل', `start_srv_${index}`), Markup.button.callback('🛑 إيقاف', `stop_srv_${index}`)],
            [Markup.button.callback('🗑️ حذف', `del_srv_${index}`), Markup.button.callback('🔙', 'my_servers')]
        ])
    });
});

// ▶️ المحرك مع Anti-AFK وحماية الانهيار
tgBot.action(/^start_srv_(\d+)$/, async (ctx) => {
    const index = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[index];

    if (activeClients[userId]) return ctx.answerCbQuery("⚠️ البوت يعمل بالفعل!");

    ctx.reply(`⏳ *جاري الاقتحام وتفعيل الحماية لـ ${s.host}...*`);

    try {
        activeClients[userId] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.bot_name,
            offline: true,
            version: '1.21.130',
            skipPing: true,
            connectTimeout: 30000
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *أبشر! بوتك دخل السيرفر الآن.*\n🛡️ *تم تفعيل نظام Anti-AFK لضمان عدم الطرد.*`);
            
            // 🔄 نظام Anti-AFK (إرسال حركة/رسالة كل 45 ثانية)
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    activeClients[userId].queue('text', { 
                        type: 'chat', needs_translation: false, source_name: s.bot_name, 
                        xuid: '', platform_chat_id: '', message: '🛡️ MaxBlack Anti-AFK Active' 
                    });
                }
            }, 45000);
        });

        // 🛡️ معالجة الأخطاء لمنع انهيار البوت (Crash Protection)
        activeClients[userId].on('error', (err) => {
            console.log(`[Crash Protect] Error for ${userId}: ${err.message}`);
            if (activeClients[userId]) activeClients[userId].close();
            delete activeClients[userId];
            clearInterval(afkIntervals[userId]);
        });

    } catch (e) { 
        ctx.reply("❌ حدث خطأ غير متوقع في محرك الاتصال."); 
    }
});

tgBot.action(/^stop_srv_(\d+)$/, (ctx) => {
    const userId = ctx.from.id;
    if (activeClients[userId]) { 
        activeClients[userId].close(); 
        delete activeClients[userId]; 
        clearInterval(afkIntervals[userId]);
        ctx.answerCbQuery("🛑 تم إيقاف البوت");
    } else {
        ctx.answerCbQuery("❌ البوت غير شغال أصلاً!");
    }
});

tgBot.action(/^del_srv_(\d+)$/, (ctx) => {
    let servers = db.get(`${ctx.from.id}.servers`);
    servers.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.servers`, servers);
    ctx.editMessageText("✅ تم الحذف بنجاح.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'my_servers')]]));
});

// التعامل مع الأخطاء العالمية لمنع توقف الكود تماماً
process.on('uncaughtException', (err) => {
    console.error('⚠️ خطأ عالمي محمي:', err);
});

tgBot.launch({ polling: { dropPendingUpdates: true } });
console.log('🚀 نظام MaxBlack Pro المحمي يعمل الآن!');
