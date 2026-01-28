const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 سيرفر Railway لضمان العمل 24 ساعة
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("💎 نظام MaxBlack يعمل بأعلى كفاءة");
}).listen(process.env.PORT || 3000);

// 🛡️ إعدادات البوت وقاعدة البيانات
const token = process.env.BOT_TOKEN || '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

const CHANNELS = [
    { id: '@minecrafmodss12', link: 'https://t.me/minecrafmodss12' },
    { id: '@aternosbot24', link: 'https://t.me/aternosbot24' }
];

let activeClients = {};

// 🔍 فحص الاشتراك الإجباري
async function isSubscribed(ctx) {
    try {
        for (const chan of CHANNELS) {
            const member = await ctx.telegram.getChatMember(chan.id, ctx.from.id);
            if (['left', 'kicked'].includes(member.status)) return false;
        }
        return true;
    } catch (e) {
        return true; 
    }
}

// ⌨️ القوائم الرئيسية (بصيغة المذكر)
const mainButtons = () => Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'my_servers')],
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_server')],
    [Markup.button.callback('⚙️ إعـدادات الـنـظـام', 'settings')],
    [Markup.button.url('👨‍💻 المـطـور', 'https://t.me/uuuaaw')]
]);

// 🚀 أوامر البداية
bot.start(async (ctx) => {
    if (await isSubscribed(ctx)) {
        await ctx.replyWithMarkdown(`👋 *أهلاً بك يا بطل في نظام MaxBlack المطور*`, mainButtons());
    } else {
        await ctx.reply('⚠️ *يجب الاشتراك في القنوات أولاً لتفعيل البوت:*', Markup.inlineKeyboard([
            [Markup.button.url('📢 القناة الأولى', CHANNELS[0].link)],
            [Markup.button.url('📢 القناة الثانية', CHANNELS[1].link)],
            [Markup.button.callback('✅ تم الاشتراك', 'main_menu')]
        ]));
    }
});

bot.action('main_menu', async (ctx) => {
    if (await isSubscribed(ctx)) {
        await ctx.editMessageText('🔮 *قائمة التحكم الرئيسية:*', { parse_mode: 'Markdown', ...mainButtons() });
    } else {
        await ctx.answerCbQuery('❌ اشترك أولاً!', { show_alert: true });
    }
});

// 📁 نظام السيرفرات
bot.action('my_servers', async (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length === 0) return ctx.answerCbQuery("❌ لا توجد سيرفرات!", { show_alert: true });

    const buttons = servers.map((s, i) => [Markup.button.callback(`🌐 ${s.host}:${s.port}`, `manage_srv_${i}`)]);
    buttons.push([Markup.button.callback('🔙 رجوع', 'main_menu')]);
    
    await ctx.editMessageText('🎮 *قائمة سيرفراتك المحفوظة:*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
});

bot.action('add_server', async (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length >= 3) return ctx.answerCbQuery("⚠️ وصلت للحد الأقصى (3)!", { show_alert: true });
    
    ctx.session = { state: 'waiting_srv' };
    await ctx.reply('📥 *أرسل بيانات السيرفر بصيغة (IP:PORT):*');
});

// 📝 معالجة النصوص
bot.on('text', async (ctx) => {
    if (ctx.session?.state === 'waiting_srv') {
        const text = ctx.message.text;
        if (text.includes(':')) {
            const [host, port] = text.split(':');
            let servers = db.get(`${ctx.from.id}.servers`) || [];
            servers.push({ host: host.trim(), port: port.trim(), bot_name: `Max_${Math.floor(Math.random()*999)}` });
            db.set(`${ctx.from.id}.servers`, servers);
            ctx.session.state = null;
            await ctx.reply('✅ *تم حفظ السيرفر بنجاح!*', mainButtons());
        } else {
            await ctx.reply('❌ الصيغة خاطئة! أرسلها هكذا `host:port`');
        }
    }
});

// ⚙️ نظام التشغيل (دعم الكل + Anti-AFK + حماية)
bot.action(/^manage_srv_(\d+)$/, async (ctx) => {
    const index = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[index];
    await ctx.editMessageText(`📊 *إدارة السيرفر:* \n\`${s.host}:${s.port}\``, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('▶️ تشغيل', `start_srv_${index}`), Markup.button.callback('🛑 إيقاف', `stop_srv_${index}`)],
            [Markup.button.callback('🗑️ حذف', `del_srv_${index}`), Markup.button.callback('🔙', 'my_servers')]
        ])
    });
});

bot.action(/^start_srv_(\d+)$/, async (ctx) => {
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[ctx.match[1]];

    await ctx.reply(`⏳ *جاري محاولة الاتصال...*`);

    if (activeClients[userId]) {
        try { activeClients[userId].close(); } catch(e){}
    }

    try {
        activeClients[userId] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.bot_name,
            offline: true,
            version: false // كشف تلقائي للإصدار
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *بوتك دخل السيرفر الآن!* \n🛡️ *نظام Anti-AFK نشط.*`);
            
            // نظام Anti-AFK
            const interval = setInterval(() => {
                if (activeClients[userId]) {
                    activeClients[userId].write('player_auth_input', {
                        pitch: 0, yaw: 0, position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0, z: 0.1 }, 
                        head_yaw: 0, input_data: 0, input_mode: 'keyboard', interaction_mode: 'touch'
                    });
                } else { clearInterval(interval); }
            }, 30000);
        });

        activeClients[userId].on('error', (err) => {
            ctx.reply(`❌ *فشل الاتصال:* السيرفر مغلق أو العنوان خطأ.`);
            delete activeClients[userId];
        });

    } catch (e) {
        await ctx.reply("❌ حدث خطأ غير متوقع في النظام.");
    }
});

bot.action(/^stop_srv_(\d+)$/, (ctx) => {
    if (activeClients[ctx.from.id]) {
        activeClients[ctx.from.id].close();
        delete activeClients[ctx.from.id];
        ctx.answerCbQuery("🛑 تم إيقاف البوت");
    } else {
        ctx.answerCbQuery("⚠️ البوت متوقف بالفعل");
    }
});

bot.action(/^del_srv_(\d+)$/, (ctx) => {
    let servers = db.get(`${ctx.from.id}.servers`);
    servers.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.servers`, servers);
    ctx.editMessageText("✅ تم الحذف.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'my_servers')]]));
});

// 🛡️ حماية ضد الانهيار (Anti-Crash)
process.on('uncaughtException', (err) => console.error('Error:', err));
process.on('unhandledRejection', (res) => console.error('Reject:', res));

bot.launch({ polling: { dropPendingUpdates: true } }).then(() => console.log("🚀 MaxBlack Ready!"));
