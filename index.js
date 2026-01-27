const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 سيرفر Railway لإبقاء البوت حياً 24 ساعة
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.write("💎 نظام MaxBlack يعمل بأعلى كفاءة");
    res.end();
}).listen(process.env.PORT || 3000);

// 🛡️ الحماية: جلب التوكن من المتغيرات البيئية
const token = process.env.BOT_TOKEN || '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const tgBot = new Telegraf(token);

// 📢 إعداد القنوات وحساب المطور
const CHANNELS = [
    { id: '@minecrafmodss12', link: 'https://t.me/minecrafmodss12' },
    { id: '@aternosbot24', link: 'https://t.me/aternosbot24' }
];
const DEVELOPER_LINK = 'https://t.me/uuuaaw';

let activeClients = {};

// 🔍 دالة فحص الاشتراك
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

const mainButtons = (ctx) => Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'my_servers')],
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_server')],
    [Markup.button.callback('⚙️ إعـدادات الـنـظـام', 'settings')],
    [Markup.button.url('👨‍💻 المـطـور (الدعم الفني)', DEVELOPER_LINK)]
]);

tgBot.start(async (ctx) => {
    if (await checkAllSubscriptions(ctx)) {
        ctx.replyWithMarkdown(`👋 *أهلاً بك يا بطل في نظام MaxBlack*`, mainButtons(ctx));
    } else {
        ctx.reply('⚠️ *يجب الاشتراك في القنوات أولاً:*', Markup.inlineKeyboard([
            [Markup.button.url('📢 القناة الأولى', CHANNELS[0].link)],
            [Markup.button.url('📢 القناة الثانية', CHANNELS[1].link)],
            [Markup.button.callback('✅ تم الاشتراك', 'main_menu')]
        ]));
    }
});

// --- نظام السيرفرات المتعددة (الحد الأقصى 3) ---
tgBot.action('my_servers', async (ctx) => {
    const userId = ctx.from.id;
    const servers = db.get(`${userId}.servers`) || [];
    
    if (servers.length === 0) return ctx.answerCbQuery("❌ ليس لديك سيرفرات محفوظة!", { show_alert: true });

    let keyboard = servers.map((s, index) => [Markup.button.callback(`${index + 1}. 🌐 ${s.host}:${s.port}`, `manage_srv_${index}`)]);
    keyboard.push([Markup.button.callback('🔙 رجوع', 'main_menu')]);

    ctx.editMessageText('🎮 *قائمة سيرفراتك المحفوظة (أقصى عدد 3):*', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(keyboard)
    });
});

tgBot.action('add_server', async (ctx) => {
    const userId = ctx.from.id;
    const servers = db.get(`${userId}.servers`) || [];
    
    if (servers.length >= 3) {
        return ctx.answerCbQuery("⚠️ وصلت للحد الأقصى (3 سيرفرات)!", { show_alert: true });
    }
    ctx.reply('📥 *أرسل بيانات السيرفر بصيغة (IP:PORT):*');
    db.set(`${userId}.state`, 'waiting_srv');
});

tgBot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const msg = ctx.message.text;
    const state = db.get(`${userId}.state`);

    if (state === 'waiting_srv' && msg.includes(':')) {
        const [h, p] = msg.split(':');
        let servers = db.get(`${userId}.servers`) || [];
        servers.push({ host: h, port: p, bot_name: "MaxBlack" });
        db.set(`${userId}.servers`, servers);
        db.set(`${userId}.state`, null);
        ctx.reply('✅ *تمت إضافة السيرفر رقم ' + servers.length + ' بنجاح!*');
    }
});

// إدارة سيرفر محدد
tgBot.action(/^manage_srv_(\d+)$/, async (ctx) => {
    const index = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[index];

    const panel = `📊 *تحكم بالسيرفر رقم ${parseInt(index)+1}:*\n🌐 *العنوان:* \`${s.host}:${s.port}\`\n🤖 *الاسم:* \`${s.bot_name}\``;
    
    ctx.editMessageText(panel, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('▶️ تشغيل', `start_srv_${index}`), Markup.button.callback('🛑 إيقاف', `stop_srv_${index}`)],
            [Markup.button.callback('🗑️ حذف السيرفر', `del_srv_${index}`)],
            [Markup.button.callback('🔙 رجوع للقائمة', 'my_servers')]
        ])
    });
});

tgBot.action(/^del_srv_(\d+)$/, (ctx) => {
    const index = ctx.match[1];
    let servers = db.get(`${ctx.from.id}.servers`);
    servers.splice(index, 1);
    db.set(`${ctx.from.id}.servers`, servers);
    ctx.answerCbQuery("🗑️ تم الحذف");
    ctx.editMessageText("✅ تم حذف السيرفر.", Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'my_servers')]]));
});

tgBot.launch({ polling: { dropPendingUpdates: true } });
