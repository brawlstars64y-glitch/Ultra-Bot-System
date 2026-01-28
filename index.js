const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 سيرفر Railway لمنع النوم وحماية الانهيار
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.write("💎 نظام MaxBlack يعمل بأعلى كفاءة 24/7");
    res.end();
}).listen(process.env.PORT || 3000);

const token = process.env.BOT_TOKEN || '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const tgBot = new Telegraf(token);

const CHANNELS = [
    { id: '@minecrafmodss12', link: 'https://t.me/minecrafmodss12' },
    { id: '@aternosbot24', link: 'https://t.me/aternosbot24' }
];

let activeClients = {};
let afkIntervals = {};

// 🔍 فحص الاشتراك الإجباري
async function checkAllSubscriptions(ctx) {
    for (const channel of CHANNELS) {
        try {
            const member = await ctx.telegram.getChatMember(channel.id, ctx.from.id);
            if (!['member', 'administrator', 'creator'].includes(member.status)) return false;
        } catch (e) { return false; }
    }
    return true;
}

// ⌨️ القوائم الرئيسية (واجهة محسنة)
const mainButtons = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سيرفراتي المحفوظة', 'my_servers')],
    [Markup.button.callback('➕ إضافة سيرفر جديد', 'add_server')],
    [Markup.button.callback('⚙️ إعدادات النظام', 'settings'), Markup.button.callback('❓ المساعدة', 'help')],
    [Markup.button.url('👨‍💻 المطور', 'https://t.me/uuuaaw')]
]);

// 🚀 أوامر البداية
tgBot.start(async (ctx) => {
    if (await checkAllSubscriptions(ctx)) {
        ctx.replyWithMarkdown(`👋 *أهلاً بك يا بطل في نظام MaxBlack Pro*\n\n*مهمتي إبقاء سيرفرك متصلاً وحمايته من الطرد.*`, mainButtons);
    } else {
        ctx.reply('⚠️ *يجب عليك الاشتراك في القنوات أولاً:*', Markup.inlineKeyboard([
            [Markup.button.url('📢 القناة 1', CHANNELS[0].link), Markup.button.url('📢 القناة 2', CHANNELS[1].link)],
            [Markup.button.callback('✅ تم الاشتراك', 'main_menu')]
        ]));
    }
});

// 📁 نظام السيرفرات
tgBot.action('my_servers', async (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length === 0) return ctx.answerCbQuery("❌ لا يوجد سيرفرات مضافة!", { show_alert: true });
    
    const kb = servers.map((s, i) => [Markup.button.callback(`🌐 ${s.host}:${s.port}`, `manage_srv_${i}`)]);
    kb.push([Markup.button.callback('🔙 رجوع', 'main_menu')]);
    ctx.editMessageText('🎮 *اختر السيرفر الذي تريد التحكم به:*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(kb) });
});

tgBot.action('add_server', (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length >= 3) return ctx.answerCbQuery("⚠️ الحد الأقصى 3 سيرفرات!", { show_alert: true });
    ctx.reply('📥 *أرسل البيانات بصيغة IP:PORT*\n*مثال:* `play.example.com:19132`');
    db.set(`${ctx.from.id}.state`, 'waiting_srv');
});

// 🛡️ معالجة النصوص وحل مشكلة الانهيار (تنظيف الروابط)
tgBot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    if (db.get(`${userId}.state`) === 'waiting_srv') {
        let msg = ctx.message.text.trim();
        // حماية الانهيار: تنظيف العنوان من الروابط والرموز الزائدة
        const hostClean = msg.replace(/https?:\/\//, '').split('/')[0];
        
        if (hostClean.includes(':')) {
            const [h, p] = hostClean.split(':');
            let servers = db.get(`${userId}.servers`) || [];
            servers.push({ host: h.trim(), port: p.trim(), bot_name: "MaxBlack_Bot" });
            db.set(`${userId}.servers`, servers);
            db.set(`${userId}.state`, null);
            ctx.reply(`✅ *تم حفظ السيرفر بنجاح يا بطل!*`, mainButtons);
        } else {
            ctx.reply("⚠️ *خطأ:* يرجى إرسال الآي بي والبورت مفصولين بنقطتين `:`");
        }
    }
});

// ⚙️ لوحة التحكم بالسيرفر
tgBot.action(/^manage_srv_(\d+)$/, (ctx) => {
    const index = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[index];
    const status = activeClients[ctx.from.id] ? "متصل ✅" : "منقطع 🔴";

    ctx.editMessageText(`🛠️ *لوحة تحكم السيرفر*\n--------------------------\n🌐 *العنوان:* \`${s.host}:${s.port}\`\n🤖 *البوت:* \`${s.bot_name}\`\n📊 *الحالة:* ${status}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('▶️ تشغيل الاتصال', `start_srv_${index}`)],
            [Markup.button.callback('🛑 إيقاف', `stop_srv_${index}`), Markup.button.callback('🗑️ حذف', `del_srv_${index}`)],
            [Markup.button.callback('🔙 رجوع', 'my_servers')]
        ])
    });
});

// ▶️ تشغيل البوت مع نظام Anti-AFK وحل مشكلة الدخول
tgBot.action(/^start_srv_(\d+)$/, async (ctx) => {
    const index = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[index];

    ctx.answerCbQuery("⏳ جاري محاولة الدخول...");

    try {
        if (activeClients[userId]) activeClients[userId].close();
        if (afkIntervals[userId]) clearInterval(afkIntervals[userId]);

        // إعدادات اتصال Bedrock لضمان الدخول
        activeClients[userId] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.bot_name,
            offline: true,
            version: '1.21.130',
            connectTimeout: 10000 // مهلة 10 ثواني للاتصال
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *أبشر! بوتك [ ${s.bot_name} ] دخل السيرفر الآن.*\n🛡️ *تم تفعيل نظام Anti-AFK بنجاح.*`);
            
            // 🔄 نظام Anti-AFK (إرسال إشارة حياة كل 50 ثانية لمنع الطرد)
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    activeClients[userId].queue('text', {
                        type: 'chat', needs_translation: false, source_name: s.bot_name,
                        xuid: '', platform_chat_id: '', message: '🛡️ MaxBlack Anti-AFK Active'
                    });
                }
            }, 50000);
        });

        // حماية الانهيار: معالجة الأخطاء دون توقف البوت
        activeClients[userId].on('error', (err) => {
            console.log(`[Error Protected]: ${err.message}`);
            if (activeClients[userId]) activeClients[userId].close();
            delete activeClients[userId];
            clearInterval(afkIntervals[userId]);
        });

    } catch (e) { ctx.reply("❌ *خطأ:* تأكد من أن السيرفر يعمل ومن صحة العنوان."); }
});

tgBot.action(/^stop_srv_(\d+)$/, (ctx) => {
    const userId = ctx.from.id;
    if (activeClients[userId]) {
        activeClients[userId].close();
        delete activeClients[userId];
        clearInterval(afkIntervals[userId]);
    }
    ctx.answerCbQuery("🔴 تم الإيقاف");
});

tgBot.action(/^del_srv_(\d+)$/, (ctx) => {
    let servers = db.get(`${ctx.from.id}.servers`);
    servers.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.servers`, servers);
    ctx.editMessageText("✅ تم حذف السيرفر بنجاح.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'my_servers')]]));
});

tgBot.launch({ polling: { dropPendingUpdates: true } });
console.log('🚀 نظام MaxBlack المطور يعمل الآن بكفاءة!');
