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

const CHANNELS = [
    { id: '@minecrafmodss12', link: 'https://t.me/minecrafmodss12' },
    { id: '@aternosbot24', link: 'https://t.me/aternosbot24' }
];
const DEVELOPER_LINK = 'https://t.me/uuuaaw';

let activeClients = {};

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

const mainButtons = (ctx) => Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'my_servers')],
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_server')],
    [Markup.button.callback('⚙️ إعـدادات الـنـظـام', 'settings')],
    [Markup.button.url('👨‍💻 المـطـور (الدعم الفني)', DEVELOPER_LINK)]
]);

tgBot.start(async (ctx) => {
    if (await checkAllSubscriptions(ctx)) {
        ctx.replyWithMarkdown(`👋 *أهلاً بكِ يا بطلة في نظام MaxBlack المطور*`, mainButtons(ctx));
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
        ctx.answerCbQuery('❌ اشتركِ أولاً!', { show_alert: true });
    }
});

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
    if (servers.length >= 3) return ctx.answerCbQuery("⚠️ وصلتِ للحد الأقصى (3)!", { show_alert: true });
    ctx.reply('📥 *أرسل البيانات بصيغة (IP:PORT):*\n⚠️ *مثال:* `play.example.com:19132`');
    db.set(`${ctx.from.id}.state`, 'waiting_srv');
});

tgBot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const msg = ctx.message.text;
    if (db.get(`${userId}.state`) === 'waiting_srv') {
        if (msg.includes(':')) {
            const [h, p] = msg.split(':');
            let servers = db.get(`${userId}.servers`) || [];
            servers.push({ host: h.trim(), port: p.trim(), bot_name: `Max_${Math.floor(Math.random()*999)}` });
            db.set(`${userId}.servers`, servers);
            db.set(`${userId}.state`, null);
            ctx.reply(`✅ *تم حفظ السيرفر بنجاح!*`);
        }
    }
});

tgBot.action(/^manage_srv_(\d+)$/, (ctx) => {
    const index = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[index];
    ctx.editMessageText(`📊 *تحكم بالسيرفر:* \`${s.host}:${s.port}\``, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('▶️ تشغيل (دعم الكل)', `start_srv_${index}`), Markup.button.callback('🛑 إيقاف', `stop_srv_${index}`)],
            [Markup.button.callback('🗑️ حذف', `del_srv_${index}`), Markup.button.callback('🔙', 'my_servers')]
        ])
    });
});

// 🚀 التشغيل المطور (دعم إصدارات + Anti-AFK + حماية)
tgBot.action(/^start_srv_(\d+)$/, async (ctx) => {
    const index = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[index];

    if (activeClients[userId]) {
        try { activeClients[userId].close(); } catch(e) {}
    }

    ctx.reply(`⏳ *جاري الاتصال الذكي بـ ${s.host}...*`);

    try {
        // bedrock-protocol سيقوم تلقائياً بعمل Handshake لمعرفة الإصدار
        activeClients[userId] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.bot_name,
            offline: true,
            skipPing: false // للسماح بجلب الإصدار تلقائياً
        });

        // 🛡️ نظام عدم الانهيار (Error Handling)
        activeClients[userId].on('error', (err) => {
            console.log(`[Error] ${userId}: ${err.message}`);
            ctx.reply(`⚠️ *انقطع الاتصال:* السيرفر قد يكون مغلقاً أو الإصدار غير مدعوم.`);
            delete activeClients[userId];
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *تم الدخول بنجاح!* \n🛡️ *نظام Anti-AFK مفعل.*`);
            
            // 🔄 نظام Anti-AFK: حركة بسيطة كل 30 ثانية
            const afkInterval = setInterval(() => {
                if (activeClients[userId]) {
                    activeClients[userId].queue('player_auth_input', {
                        pitch: 0, yaw: 0, position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0, z: 0.1 }, 
                        head_yaw: 0, input_data: 0, input_mode: 'keyboard', interaction_mode: 'touch'
                    });
                } else {
                    clearInterval(afkInterval);
                }
            }, 30000);
        });

        activeClients[userId].on('kick', (reason) => {
            ctx.reply(`👢 *تم طرد البوت:* ${reason.message}`);
            delete activeClients[userId];
        });

    } catch (e) {
        ctx.reply("❌ فشل بدء تشغيل النظام.");
    }
});

tgBot.action(/^stop_srv_(\d+)$/, (ctx) => {
    if (activeClients[ctx.from.id]) {
        activeClients[ctx.from.id].close();
        delete activeClients[ctx.from.id];
    }
    ctx.answerCbQuery("🛑 تم إيقاف البوت");
});

tgBot.action(/^del_srv_(\d+)$/, (ctx) => {
    let servers = db.get(`${ctx.from.id}.servers`);
    servers.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.servers`, servers);
    ctx.editMessageText("✅ تم الحذف.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'my_servers')]]));
});

// 🛡️ منع انهيار العملية بالكامل عند حدوث خطأ غير متوقع
process.on('uncaughtException', (err) => {
    console.error('CRITICAL ERROR:', err);
});

tgBot.launch({ polling: { dropPendingUpdates: true } });
console.log('🚀 MaxBlack Pro is Running!');
