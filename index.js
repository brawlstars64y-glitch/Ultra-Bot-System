const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 سيرفر Railway لمنع توقف البوت
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.write("💎 نظام Ultra-Bot يعمل بأعلى كفاءة");
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

// 🔍 التحقق من الاشتراك
async function checkSub(ctx) {
    for (const ch of CHANNELS) {
        try {
            const member = await ctx.telegram.getChatMember(ch.id, ctx.from.id);
            if (!['member', 'administrator', 'creator'].includes(member.status)) return false;
        } catch (e) { return false; }
    }
    return true;
}

// 🏠 الواجهة الرئيسية
const mainMenuButtons = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سيرفراتي', 'my_servers'), Markup.button.callback('➕ إضافة سيرفر', 'add_server')],
    [Markup.button.callback('❓ طريقة الاستخدام', 'how_to_use')]
]);

// 🚀 بداية البوت
tgBot.start(async (ctx) => {
    if (await checkSub(ctx)) {
        ctx.replyWithMarkdown(`*• مرحباً بك في بوت بلاير* 🔮\n*عملي هو ابقاء سيرفرك الخاص بـ ماين كرافت شغال بدون توقف 24/7* 🔔\n\n*اختر ماتريد من القائمة:*`, mainMenuButtons);
    } else {
        ctx.reply('⚠️ *يجب الاشتراك في القنوات أولاً لتشغيل البوت:*', Markup.inlineKeyboard([
            [Markup.button.url('📢 القناة الأولى', CHANNELS[0].link)],
            [Markup.button.url('📢 القناة الثانية', CHANNELS[1].link)],
            [Markup.button.callback('✅ تم الاشتراك', 'start_verify')]
        ]));
    }
});

tgBot.action('start_verify', async (ctx) => {
    if (await checkSub(ctx)) {
        ctx.editMessageText(`*• مرحباً بك في بوت بلاير* 🔮\n*عملي هو ابقاء سيرفرك الخاص بـ ماين كرافت شغال بدون توقف 24/7* 🔔`, { parse_mode: 'Markdown', ...mainMenuButtons });
    } else {
        ctx.answerCbQuery('❌ اشتركي في القنوات أولاً!', { show_alert: true });
    }
});

// 📁 عرض السيرفرات (تم إصلاح الربط هنا)
tgBot.action('my_servers', async (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length === 0) return ctx.answerCbQuery("❌ لا توجد سيرفرات مضافة!", { show_alert: true });
    
    const kb = servers.map((s, i) => [Markup.button.callback(`🌐 ${s.host}:${s.port}`, `manage_${i}`)]);
    kb.push([Markup.button.callback('🔙 رجوع', 'main_menu')]);
    ctx.editMessageText('🎮 *قائمة سيرفراتك المحفوظة:*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(kb) });
});

// ⚙️ لوحة تحكم السيرفر (مثل الصورة تماماً)
tgBot.action(/^manage_(\d+)$/, (ctx) => {
    const index = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[index];
    const status = activeClients[ctx.from.id] ? "شغال ✅" : "متوقف 🔴";
    
    ctx.editMessageText(`*إدارة ${parseInt(index)+1} - S*\n--------------------------\n🏷️ *name_label: S - ${parseInt(index)+1}*\n🌐 *العنوان:* \`${s.host}:${s.port}\`\n📋 *نوع السيرفر: BEDROCK*\n🤖 *اسم البوت:* \`${s.bot_name}\`\n📊 *الحالة:* ${status}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('▶️ تشغيل البوت', `start_srv_${index}`)],
            [Markup.button.callback('ℹ️ معلومات حية', `info_${index}`), Markup.button.callback('✏️ تغيير اسم البوت', `rename_${index}`)],
            [Markup.button.callback('⏱️ مدة التشغيل', `uptime_${index}`)],
            [Markup.button.callback('🔔 الإشعارات: مفعلة', `notif_${index}`), Markup.button.callback('🔄 التشغيل التلقائي: معطل', `auto_${index}`)],
            [Markup.button.callback('🗑️ حذف السيرفر', `del_srv_${index}`)],
            [Markup.button.callback('🔙 رجوع لسيرفراتي', 'my_servers')]
        ])
    });
});

// ▶️ نظام التشغيل و Anti-AFK
tgBot.action(/^start_srv_(\d+)$/, async (ctx) => {
    const index = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[index];

    ctx.answerCbQuery("⏳ جاري الاتصال...");
    
    try {
        if (activeClients[userId]) activeClients[userId].close();
        if (afkIntervals[userId]) clearInterval(afkIntervals[userId]);

        // تنظيف العنوان من أي بروتوكول زائد
        const cleanHost = s.host.replace(/https?:\/\//, '').split('/')[0];

        activeClients[userId] = bedrock.createClient({
            host: cleanHost, port: parseInt(s.port), username: s.bot_name, offline: true, version: '1.21.130'
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ تم دخول السيرفر! نظام Anti-AFK نشط الآن 🛡️`);
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    activeClients[userId].queue('text', {
                        type: 'chat', needs_translation: false, source_name: s.bot_name,
                        xuid: '', platform_chat_id: '', message: '🛡️ Anti-AFK Active'
                    });
                }
            }, 50000);
        });

        activeClients[userId].on('error', (err) => {
            ctx.reply(`❌ حدث خطأ: السيرفر مغلق أو العنوان غير صحيح.`);
            if (activeClients[userId]) activeClients[userId].close();
            clearInterval(afkIntervals[userId]);
        });
    } catch (e) { ctx.reply("❌ فشل تشغيل البوت."); }
});

// ➕ إضافة سيرفر
tgBot.action('add_server', (ctx) => {
    ctx.reply('📥 *أرسلي بيانات السيرفر بصيغة IP:PORT:*');
    db.set(`${ctx.from.id}.state`, 'wait');
});

tgBot.on('text', async (ctx) => {
    if (db.get(`${ctx.from.id}.state`) === 'wait') {
        const msg = ctx.message.text;
        if (!msg.includes(':')) return ctx.reply("⚠️ استخدمي التنسيق الصحيح IP:PORT");
        
        const [h, p] = msg.split(':');
        let srvs = db.get(`${ctx.from.id}.servers`) || [];
        srvs.push({ host: h.trim(), port: p.trim(), bot_name: "MaxBlack" });
        db.set(`${ctx.from.id}.servers`, srvs);
        db.set(`${ctx.from.id}.state`, null);
        ctx.reply("✅ تم الحفظ! اذهبي إلى 'سيرفراتي' للتشغيل.", mainMenuButtons);
    }
});

// 🗑️ حذف السيرفر
tgBot.action(/^del_srv_(\d+)$/, (ctx) => {
    let srvs = db.get(`${ctx.from.id}.servers`);
    srvs.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.servers`, srvs);
    ctx.editMessageText("✅ تم حذف السيرفر بنجاح.", Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'my_servers')]]));
});

tgBot.launch();
console.log('🚀 نظام Ultra-Bot المصلح يعمل الآن!');
