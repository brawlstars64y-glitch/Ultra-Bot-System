const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 نظام حماية الانهيار والبقاء متصلاً على Railway
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("نظام MaxBlack يعمل بأعلى كفاءة 24/7 💎");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let activeClients = {};
let afkIntervals = {};
let startTime = {};

// 📢 القنوات المطلوبة للاشتراك
const CHANNELS = [
    { id: '@minecrafmodss12', link: 'https://t.me/minecrafmodss12' },
    { id: '@aternosbot24', link: 'https://t.me/aternosbot24' }
];

// 🔍 فحص الاشتراك
async function checkSub(ctx) {
    for (const ch of CHANNELS) {
        try {
            const member = await ctx.telegram.getChatMember(ch.id, ctx.from.id);
            if (!['member', 'administrator', 'creator'].includes(member.status)) return false;
        } catch (e) { return false; }
    }
    return true;
}

// 🏠 القائمة الرئيسية (بصيغة المذكر)
const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سيرفراتي', 'my_servers'), Markup.button.callback('➕ إضافة سيرفر', 'add_server')],
    [Markup.button.callback('❓ طريقة الاستخدام', 'how_to_use')]
]);

bot.start(async (ctx) => {
    if (await checkSub(ctx)) {
        ctx.replyWithMarkdown(`*• مرحباً بك يا بطل في بوت بلاير* 🔮\n*مهمتي إبقاء سيرفرك شغالاً بدون توقف 24/7 مع حماية كاملة* 🔔`, mainMenu);
    } else {
        ctx.reply('⚠️ *يجب عليك الاشتراك في القنوات أولاً لتفعيل البوت:*', Markup.inlineKeyboard([
            [Markup.button.url('📢 القناة 1', CHANNELS[0].link), Markup.button.url('📢 القناة 2', CHANNELS[1].link)],
            [Markup.button.callback('✅ تم الاشتراك', 'verify_sub')]
        ]));
    }
});

bot.action('verify_sub', async (ctx) => {
    if (await checkSub(ctx)) {
        ctx.editMessageText(`*• مرحباً بك يا بطل في بوت بلاير* 🔮\n*اختر ما تريد من القائمة أدناه:*`, { parse_mode: 'Markdown', ...mainMenu });
    } else {
        ctx.answerCbQuery('❌ اشترك في القنوات أولاً!', { show_alert: true });
    }
});

// ➕ إضافة سيرفر (نظام مبرمج بالكامل)
bot.action('add_server', (ctx) => {
    ctx.session = { state: 'get_host' };
    ctx.reply('📥 *أرسل الآن عنوان السيرفر (IP):*');
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const state = ctx.session?.state;

    if (state === 'get_host') {
        ctx.session.host = ctx.message.text;
        ctx.session.state = 'get_port';
        ctx.reply('🔢 *أرسل الآن البورت (Port):*');
    } else if (state === 'get_port') {
        ctx.session.port = ctx.message.text;
        ctx.session.state = 'get_name';
        ctx.reply('🤖 *أرسل الاسم الذي تريده للبوت:*');
    } else if (state === 'get_name') {
        let servers = db.get(`${userId}.servers`) || [];
        servers.push({ host: ctx.session.host, port: ctx.session.port, bot_name: ctx.message.text });
        db.set(`${userId}.servers`, servers);
        ctx.session.state = null;
        ctx.reply('✅ *تم حفظ سيرفرك بنجاح! اذهب لقائمة سيرفراتي لتشغيله.*', mainMenu);
    }
});

// 🎮 عرض السيرفرات والتحكم بها
bot.action('my_servers', (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length === 0) return ctx.answerCbQuery("❌ لا توجد سيرفرات مضافة!", { show_alert: true });
    
    const kb = servers.map((s, i) => [Markup.button.callback(`🌐 ${s.host}:${s.port}`, `manage_${i}`)]);
    kb.push([Markup.button.callback('🔙 رجوع', 'verify_sub')]);
    ctx.editMessageText('🎮 *قائمة سيرفراتك المحفوظة:*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(kb) });
});

bot.action(/^manage_(\d+)$/, (ctx) => {
    const index = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[index];
    const isOnline = activeClients[ctx.from.id] ? "شغال ✅" : "متوقف 🔴";

    ctx.editMessageText(`*إدارة السيرفر - لوحة التحكم*\n--------------------------\n🌐 *العنوان:* \`${s.host}:${s.port}\`\n🤖 *اسم البوت:* \`${s.bot_name}\`\n📊 *الحالة:* ${isOnline}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[ctx.from.id] ? '🛑 إيقاف البوت' : '▶️ تشغيل البوت', `toggle_${index}`)],
            [Markup.button.callback('🗑️ حذف السيرفر', `del_${index}`)],
            [Markup.button.callback('🔙 رجوع', 'my_servers')]
        ])
    });
});

// 🛡️ نظام التشغيل مع Anti-AFK وحماية الانهيار
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const index = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[index];

    if (activeClients[userId]) {
        activeClients[userId].close();
        clearInterval(afkIntervals[userId]);
        delete activeClients[userId];
        return ctx.reply("🔴 تم إيقاف البوت بنجاح.");
    }

    try {
        // حماية الانهيار: تنظيف العنوان
        const host = s.host.trim().replace(/https?:\/\//, '').split('/')[0];
        
        activeClients[userId] = bedrock.createClient({
            host: host, port: parseInt(s.port), username: s.bot_name, offline: true, version: '1.21.130'
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *البوت دخل السيرفر! تم تفعيل نظام Anti-AFK لحمايتك من الطرد 🛡️*`);
            
            // نظام Anti-AFK
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    activeClients[userId].queue('text', { type: 'chat', needs_translation: false, source_name: s.bot_name, xuid: '', platform_chat_id: '', message: '🛡️ MaxBlack Active' });
                }
            }, 50000);
        });

        activeClients[userId].on('error', (err) => {
            delete activeClients[userId];
            clearInterval(afkIntervals[userId]);
        });
    } catch (e) { ctx.reply("❌ حدث خطأ في الاتصال، تأكد من بياناتك."); }
});

bot.action('how_to_use', (ctx) => {
    ctx.replyWithMarkdown(`*📖 طريقة الاستخدام يا بطل:*\n\n1️⃣ اضغط "إضافة سيرفر" وأدخل البيانات.\n2️⃣ اذهب إلى "سيرفراتي" واختر سيرفرك.\n3️⃣ اضغط "تشغيل البوت" وسيتم تفعيل حماية Anti-AFK تلقائياً.`, mainMenu);
});

bot.launch();
console.log("🚀 Ultra Bot Started in Male Format!");
