const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 محرك الاستدامة ومنع تجمد الاستضافة
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("MaxBlack Infinity: Online & Shielded ✅");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let clients = {};
let intervals = {};

// 🎨 الواجهة الملكية الجديدة كلياً (واجهة فخمة ومختلفة)
const royalUI = Markup.inlineKeyboard([
    [Markup.button.callback('🔱 مـنـصة الـتـحـكـم', 'dashboard')],
    [Markup.button.callback('🛡️ تـأمين سـيرفر جـديد', 'add_new')],
    [Markup.button.callback('💎 الـمـمـيزات', 'features'), Markup.button.callback('🆘 الـدعم', 'support')],
    [Markup.button.url('👤 الـمـبـرمـج', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*🔱 أهلاً بك في نظام MaxBlack Infinity*\n_تم سحق كافة الأخطاء السابقة والرد الآن فوري!_`, royalUI);
});

// ✅ إصلاح الأزرار الجديدة (المميزات والدعم)
bot.action('features', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText(`💎 *مميزات النسخة اللانهائية:*\n\n• تخطي طرد السيرفر الفوري ✅\n• نظام Anti-AFK حركي معقد 🔄\n• درع الانهيار الشامل 🛡️\n• اسم ثابت: MaxBlack_Bot 🆔`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 عودة', 'home')]])
    });
});

bot.action('support', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText(`🆘 *قسم المساعدة:* \n\nإذا لم يدخل البوت، تأكد أن السيرفر يقبل دخول "النسخ المكركة". البوت محمي من الانهيار تماماً.`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 عودة', 'home')]])
    });
});

// 🛠️ إضافة سيرفر
bot.action('add_new', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.session = { step: 'host' };
    ctx.reply('📡 *أرسل عنوان السيرفر (IP):*');
});

bot.on('text', async (ctx) => {
    const uid = ctx.from.id;
    if (ctx.session?.step === 'host') {
        ctx.session.h = ctx.message.text.trim();
        ctx.session.step = 'port';
        ctx.reply('🔢 *أرسل البورت (Port):*');
    } else if (ctx.session?.step === 'port') {
        let s = db.get(`${uid}.s`) || [];
        s.push({ host: ctx.session.h, port: ctx.message.text.trim(), n: "MaxBlack_Bot" });
        db.set(`${uid}.s`, s);
        ctx.session = null;
        ctx.reply('✅ *تم التأمين وإضافة السيرفر للمنصة!*', royalUI);
    }
});

// 📊 المنصة
bot.action('dashboard', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const srvs = db.get(`${ctx.from.id}.s`) || [];
    if (srvs.length === 0) return ctx.reply("⚠️ المنصة خالية!", royalUI);
    const buttons = srvs.map((s, i) => [Markup.button.callback(`🌍 ${s.host}`, `manage_${i}`)]);
    buttons.push([Markup.button.callback('🔙 رجوع', 'home')]);
    ctx.editMessageText('🔱 *منصة التحكم بسيرفراتك:*', Markup.inlineKeyboard(buttons));
});

bot.action(/^manage_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const id = ctx.match[1];
    const s = db.get(`${ctx.from.id}.s`)[id];
    const active = clients[ctx.from.id] ? "مـتـصل ✅" : "مـفـصول 🔴";
    ctx.editMessageText(`🛡️ *إدارة الحماية:* \n📍 \`${s.host}:${s.port}\` \n📊 الحالة: ${active}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(clients[ctx.from.id] ? '🛑 إيقاف' : '⚡ تشغيل', `toggle_${id}`)],
            [Markup.button.callback('🗑️ حذف', `del_${id}`), Markup.button.callback('🔙', 'dashboard')]
        ])
    });
});

// 🔥 المحرك Infinity (تجاوز الـ Left وحل مشكلة عدم الرد)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const id = ctx.match[1];
    const uid = ctx.from.id;
    const s = db.get(`${uid}.s`)[id];

    if (clients[uid]) {
        clients[uid].close();
        clearInterval(intervals[uid]);
        delete clients[uid];
        return ctx.reply("🛑 *تم الفصل.*");
    }

    try {
        clients[uid] = bedrock.createClient({
            host: s.host, port: parseInt(s.port), username: s.n,
            offline: true, version: '1.21.130', skipPing: false, connectTimeout: 30000
        });

        // 🛡️ السر البرمجي لتجاوز "Left the game" (الرد على الموارد فورا)
        clients[uid].on('packet', (packet, meta) => {
            if (meta.name === 'resource_packs_info') {
                clients[uid].queue('resource_pack_client_response', { response_status: 'completed', resource_pack_ids: [] });
            }
        });

        clients[uid].on('spawn', () => {
            ctx.reply(`🚀 *تم الاختراق والتثبيت بنجاح!*`);
            intervals[uid] = setInterval(() => {
                if (clients[uid]) {
                    clients[uid].queue('player_auth_input', {
                        pitch: 0, yaw: 0, position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0, z: 0 },
                        head_yaw: 0, input_data: { jump_down: true }, input_mode: 'touch', play_mode: 'normal'
                    });
                }
            }, 10000);
        });

        clients[uid].on('error', (err) => { delete clients[uid]; clearInterval(intervals[uid]); });
    } catch (e) { ctx.reply("❌ فشل المحرك."); }
});

bot.action('home', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText('*🔱 نظام MaxBlack Infinity جاهز للخدمة*', { parse_mode: 'Markdown', ...royalUI });
});

bot.action(/^del_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    let s = db.get(`${ctx.from.id}.s`);
    s.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.s`, s);
    ctx.editMessageText("✅ تم المسح.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'dashboard')]]));
});

// 🛡️ درع الحماية من الانهيار
process.on('uncaughtException', (err) => { console.error('Shielded Crash:', err); });

// ⚡ أهم سطر لحل مشكلة "لا يرد" (يمسح أي تعارض قديم)
bot.launch({ dropPendingUpdates: true });
console.log('🚀 MaxBlack Infinity is Online & Ready!');
