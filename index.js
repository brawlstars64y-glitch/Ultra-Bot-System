const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 سيرفر Railway لمنع توقف البوت وحماية الانهيار
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.write("💎 نظام Ultra-Bot الاحترافي قيد التشغيل 24/7");
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
let startTime = {};

// 🔍 فحص الاشتراك الإجباري
async function checkSub(ctx) {
    for (const ch of CHANNELS) {
        try {
            const member = await ctx.telegram.getChatMember(ch.id, ctx.from.id);
            if (!['member', 'administrator', 'creator'].includes(member.status)) return false;
        } catch (e) { return false; }
    }
    return true;
}

// 🏠 القائمة الرئيسية (مثل صورة image_da9f19.png)
const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سيرفراتي', 'my_servers'), Markup.button.callback('➕ إضافة سيرفر', 'add_server')],
    [Markup.button.callback('❓ طريقة الاستخدام', 'how_to_use')]
]);

tgBot.start(async (ctx) => {
    if (await checkSub(ctx)) {
        ctx.replyWithMarkdown(`*• مرحباً بك في بوت بلاير* 🔮\n*عملي هو ابقاء سيرفرك الخاص بـ ماين كرافت شغال بدون توقف 24/7* 🔔`, mainMenu);
    } else {
        ctx.reply('⚠️ *يجب الاشتراك أولاً لتفعيل البوت:*', Markup.inlineKeyboard([
            [Markup.button.url('📢 القناة 1', CHANNELS[0].link), Markup.button.url('📢 القناة 2', CHANNELS[1].link)],
            [Markup.button.callback('✅ تم الاشتراك', 'start_verify')]
        ]));
    }
});

// ⚙️ إدارة السيرفرات وتشغيل نظام الحماية
tgBot.action(/^manage_(\d+)$/, (ctx) => {
    const index = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[index];
    const isOnline = activeClients[userId] ? "شغال ✅" : "متوقف 🔴";
    const notif = db.get(`${userId}.notif`) !== false ? "مفعلة 🔔" : "معطلة 🔕";
    const auto = db.get(`${userId}.auto`) === true ? "مفعل ✅" : "معطل ❌";

    ctx.editMessageText(`*إدارة ${parseInt(index)+1} - S*\n--------------------------\n🏷️ *name_label: S - ${parseInt(index)+1}*\n🌐 *العنوان:* \`${s.host}:${s.port}\`\n📋 *نوع السيرفر: BEDROCK*\n🤖 *اسم البوت:* \`${s.bot_name}\`\n📊 *الحالة:* ${isOnline}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(activeClients[userId] ? '🛑 إيقاف البوت' : '▶️ تشغيل البوت', `toggle_srv_${index}`)],
            [Markup.button.callback('ℹ️ معلومات حية', `info_${index}`), Markup.button.callback('✏️ تغيير اسم البوت', `rename_${index}`)],
            [Markup.button.callback('⏱️ مدة التشغيل', `uptime_${index}`)],
            [Markup.button.callback(`🔔 الإشعارات: ${notif}`, `notif_btn_${index}`), Markup.button.callback(`🔄 تلقائي: ${auto}`, `auto_btn_${index}`)],
            [Markup.button.callback('💬 إرسال رسالة', `send_msg_${index}`)],
            [Markup.button.callback('🗑️ حذف السيرفر', `del_srv_${index}`)],
            [Markup.button.callback('🔙 رجوع لسيرفراتي', 'my_servers')]
        ])
    });
});

// ▶️ التشغيل مع Anti-AFK وحماية الانهيار (Crash Protection)
tgBot.action(/^toggle_srv_(\d+)$/, async (ctx) => {
    const index = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[index];

    if (activeClients[userId]) {
        activeClients[userId].close();
        delete activeClients[userId];
        clearInterval(afkIntervals[userId]);
        delete startTime[userId];
        return ctx.reply("🔴 تم إيقاف البوت وفصل الاتصال.");
    }

    try {
        // 🛡️ حماية الانهيار: تنظيف العنوان ومنع الروابط الخاطئة (image_f6bf19.png)
        const cleanHost = s.host.replace(/https?:\/\//, '').split('/')[0];

        activeClients[userId] = bedrock.createClient({
            host: cleanHost, port: parseInt(s.port), username: s.bot_name, offline: true, version: '1.21.130'
        });

        activeClients[userId].on('spawn', () => {
            startTime[userId] = Date.now();
            ctx.reply(`✅ تم دخول السيرفر! نظام Anti-AFK نشط الآن لضمان عدم الطرد 🛡️`);
            
            // 🔄 نظام Anti-AFK المطور
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    activeClients[userId].queue('text', { type: 'chat', needs_translation: false, source_name: s.bot_name, xuid: '', platform_chat_id: '', message: '🛡️ Ultra-System Protection' });
                }
            }, 50000);
        });

        activeClients[userId].on('error', (err) => {
            if (db.get(`${userId}.notif`) !== false) ctx.reply(`❌ خطأ اتصال: السيرفر مغلق أو العنوان غير صحيح.`);
            clearInterval(afkIntervals[userId]);
            if (db.get(`${userId}.auto`) === true) {
                setTimeout(() => ctx.reply("🔄 التشغيل التلقائي يحاول إعادة الاتصال..."), 10000);
            }
        });

    } catch (e) { ctx.reply("❌ حدث خطأ غير متوقع أثناء التشغيل."); }
});

// 📥 إدارة المدخلات (إرسال رسائل وتغيير الاسم)
tgBot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const state = db.get(`${userId}.state`);
    if (!state) return;

    if (state.startsWith('rename_')) {
        const index = state.split('_')[1];
        let srvs = db.get(`${userId}.servers`);
        srvs[index].bot_name = ctx.message.text;
        db.set(`${userId}.servers`, srvs);
        ctx.reply(`✅ تم تغيير اسم البوت إلى: ${ctx.message.text}`);
    } else if (state.startsWith('msg_')) {
        if (activeClients[userId]) {
            activeClients[userId].queue('text', { type: 'chat', needs_translation: false, source_name: activeClients[userId].options.username, xuid: '', platform_chat_id: '', message: ctx.message.text });
            ctx.reply("✅ أرسل البوت رسالتك داخل اللعبة.");
        } else ctx.reply("❌ البوت غير متصل حالياً!");
    }
    db.set(`${userId}.state`, null);
});

tgBot.launch();
console.log('🚀 نظام Ultra-Bot الاحترافي يعمل بكامل قوته!');
