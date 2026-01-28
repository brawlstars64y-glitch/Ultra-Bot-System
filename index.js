const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 سيرفر Railway لضمان العمل 24 ساعة
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.write("💎 نظام MaxBlack يعمل بأعلى كفاءة");
    res.end();
}).listen(process.env.PORT || 3000);

// 🛡️ إعدادات البوت وقاعدة البيانات
const token = process.env.BOT_TOKEN || '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const tgBot = new Telegraf(token);

// 📢 قائمة القنوات (تم إضافة القناة الثالثة)
const CHANNELS = [
    { id: '@minecrafmodss12', link: 'https://t.me/minecrafmodss12' },
    { id: '@aternosbot24', link: 'https://t.me/aternosbot24' },
    { id: '@Player_bo', link: 'https://t.me/Player_bo' } // القناة الجديدة
];
const DEVELOPER_LINK = 'https://t.me/uuuaaw';

let activeClients = {};

// 🔍 فحص الاشتراك الإجباري في جميع القنوات
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

// 🚀 أوامر البداية مع واجهة الاشتراك الثلاثية
tgBot.start(async (ctx) => {
    if (await checkAllSubscriptions(ctx)) {
        ctx.replyWithMarkdown(`👋 *أهلاً بك يا بطل في نظام MaxBlack*`, mainButtons(ctx));
    } else {
        ctx.reply('⚠️ *يجب الاشتراك في القنوات الثلاث لتفعيل البوت:*', Markup.inlineKeyboard([
            [Markup.button.url('📢 القناة الأولى', CHANNELS[0].link)],
            [Markup.button.url('📢 القناة الثانية', CHANNELS[1].link)],
            [Markup.button.url('📢 القناة الثالثة', CHANNELS[2].link)],
            [Markup.button.callback('✅ تم الاشتراك في الكل', 'main_menu')]
        ]));
    }
});

tgBot.action('main_menu', async (ctx) => {
    if (await checkAllSubscriptions(ctx)) {
        ctx.editMessageText('🔮 *قائمة التحكم الرئيسية:*', { parse_mode: 'Markdown', ...mainButtons(ctx) });
    } else {
        ctx.answerCbQuery('❌ لم تشترك في جميع القنوات بعد!', { show_alert: true });
    }
});

// 📁 نظام السيرفرات المتعددة (الحد الأقصى 3)
tgBot.action('my_servers', async (ctx) => {
    const userId = ctx.from.id;
    const servers = db.get(`${userId}.servers`) || [];
    if (servers.length === 0) return ctx.answerCbQuery("❌ لا توجد سيرفرات!", { show_alert: true });

    let keyboard = servers.map((s, i) => [Markup.button.callback(`${i + 1}. 🌐 ${s.host}:${s.port}`, `manage_srv_${i}`)]);
    keyboard.push([Markup.button.callback('🔙 رجوع', 'main_menu')]);
    ctx.editMessageText('🎮 *قائمة سيرفراتك (الأقصى 3):*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(keyboard) });
});

tgBot.action('add_server', (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length >= 3) return ctx.answerCbQuery("⚠️ وصلت للحد الأقصى (3)!", { show_alert: true });
    ctx.reply('📥 *أرسل البيانات بصيغة (IP:PORT):*\n⚠️ *مثال:* `play.example.com:19132`');
    db.set(`${ctx.from.id}.state`, 'waiting_srv');
});

// 📝 معالجة النصوص وحماية المدخلات من الروابط
tgBot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const msg = ctx.message.text;
    if (db.get(`${userId}.state`) === 'waiting_srv') {
        if (msg.includes('://') || msg.includes('https')) {
            return ctx.reply("❌ *خطأ:* أرسل العنوان بدون روابط!");
        }
        if (msg.includes(':')) {
            const [h, p] = msg.split(':');
            let servers = db.get(`${userId}.servers`) || [];
            servers.push({ host: h.trim(), port: p.trim(), bot_name: "MaxBlack" });
            db.set(`${userId}.servers`, servers);
            db.set(`${userId}.state`, null);
            ctx.reply(`✅ *تم حفظ السيرفر رقم ${servers.length}*`);
        }
    }
});

// ⚙️ إدارة السيرفرات والتشغيل
tgBot.action(/^manage_srv_(\d+)$/, (ctx) => {
    const index = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[index];
    ctx.editMessageText(`📊 *تحكم بالسيرفر (${parseInt(index)+1}):*\n🌐 \`${s.host}:${s.port}\`\n🤖 \`${s.bot_name}\``, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('▶️ تشغيل', `start_srv_${index}`), Markup.button.callback('🛑 إيقاف', `stop_srv_${index}`)],
            [Markup.button.callback('🗑️ حذف', `del_srv_${index}`), Markup.button.callback('🔙', 'my_servers')]
        ])
    });
});

tgBot.action(/^start_srv_(\d+)$/, async (ctx) => {
    const index = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[index];
    ctx.reply(`⏳ *جاري محاولة الاتصال بـ ${s.host}...*`);

    try {
        if (activeClients[userId]) activeClients[userId].close();
        activeClients[userId] = bedrock.createClient({
            host: s.host, port: parseInt(s.port), username: s.bot_name, offline: true, version: '1.21.130'
        });
        activeClients[userId].on('spawn', () => ctx.reply(`✅ *بوتك [ ${s.bot_name} ] دخل السيرفر!*`));
        activeClients[userId].on('error', (err) => {
            ctx.reply(`❌ *فشل:* السيرفر مغلق أو العنوان غير صحيح.`);
            if (activeClients[userId]) activeClients[userId].close();
        });
    } catch (e) { ctx.reply("❌ حدث خطأ في البيانات."); }
});

tgBot.action(/^stop_srv_(\d+)$/, (ctx) => {
    if (activeClients[ctx.from.id]) { activeClients[ctx.from.id].close(); delete activeClients[ctx.from.id]; }
    ctx.answerCbQuery("🛑 تم الإيقاف");
});

tgBot.action(/^del_srv_(\d+)$/, (ctx) => {
    let servers = db.get(`${ctx.from.id}.servers`);
    servers.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.servers`, servers);
    ctx.editMessageText("✅ تم الحذف.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'my_servers')]]));
});

tgBot.launch({ polling: { dropPendingUpdates: true } });
console.log('🚀 نظام MaxBlack المطور مع الاشتراك الثلاثي يعمل الآن!');
