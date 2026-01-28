const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 محرك الاستدامة
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("نظام MaxBlack Infinity: يعمل بكامل طاقته ✅");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let clients = {};
let intervals = {};

// 🎨 الواجهة الملكية (الترتيب المعتمد)
const royalUI = Markup.inlineKeyboard([
    [Markup.button.callback('🛡️ تـأمين سـيرفر جـديد', 'add_new')], 
    [Markup.button.callback('🔱 مـنـصة الـتـحـكـم', 'dashboard')], 
    [Markup.button.callback('💎 الـمـمـيزات', 'features'), Markup.button.callback('🆘 الـدعم', 'support')],
    [Markup.button.url('👤 الـمـبـرمـج', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*🔱 نظام MaxBlack Infinity المطور*\n_الآن جميع الأزرار والمميزات تعمل بنجاح!_`, royalUI);
});

// ✅ إصلاح جذري لزر الـمـمـيزات (Features)
bot.action('features', (ctx) => {
    ctx.answerCbQuery("جاري عرض المميزات...").catch(() => {});
    const text = `💎 *مـمـيزات نـظام MaxBlack Infinity:*

• *Anti-AFK:* نظام نبض حركي يمنع الطرد للخمول 🔄
• *Auto-Response:* الرد الفوري على حزم السيرفر لمنع الـ Left ⚡
• *No-Crash:* درع حماية يمنع انهيار البوت نهائياً 🛡️
• *Fixed Identity:* الدخول باسم ثابت ومستقر 🆔
• *High Speed:* استجابة فورية للأوامر دون تأخير 🚀`;

    ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 الـعودة لـلقائمة', 'home')]])
    }).catch((e) => {
        // إذا فشل التعديل، نرسل رسالة جديدة
        ctx.replyWithMarkdown(text, Markup.inlineKeyboard([[Markup.button.callback('🔙 الـعودة لـلقائمة', 'home')]]));
    });
});

// ✅ إصلاح زر الدعم (Support)
bot.action('support', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText(`🆘 *قـسـم الـدعم والـمساعدة:* \n\nتأكد أن السيرفر لا يتطلب تسجيل دخول (Login) يدوي، وأن نسخة السيرفر متوافقة مع البروتوكول الحديث. البوت محمي من الانهيار والتعارض.`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 الـعودة لـلقائمة', 'home')]])
    }).catch(() => {});
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
        ctx.reply('✅ *تمت الإضافة للمنصة بنجاح!*', royalUI);
    }
});

// 📊 المنصة
bot.action('dashboard', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const srvs = db.get(`${ctx.from.id}.s`) || [];
    if (srvs.length === 0) return ctx.reply("⚠️ المنصة خالية حالياً!", royalUI);
    const buttons = srvs.map((s, i) => [Markup.button.callback(`🌍 ${s.host}`, `manage_${i}`)]);
    buttons.push([Markup.button.callback('🔙 رجوع', 'home')]);
    ctx.editMessageText('🔱 *مـنـصة الـتـحـكـم بـسيرفراتك:*', Markup.inlineKeyboard(buttons)).catch(() => {});
});

bot.action(/^manage_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const id = ctx.match[1];
    const s = db.get(`${ctx.from.id}.s`)[id];
    const active = clients[ctx.from.id] ? "مـتـصل ✅" : "مـفـصول 🔴";
    ctx.editMessageText(`🛡️ *إدارة الـحماية لـلسيرفر:* \n\n📍 العنوان: \`${s.host}:${s.port}\` \n📊 الحالة: ${active}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(clients[ctx.from.id] ? '🛑 إيقاف الـحماية' : '⚡ تـشغيل الـحماية', `toggle_${id}`)],
            [Markup.button.callback('🗑️ حـذف الـسيرفر', `del_${id}`), Markup.button.callback('🔙', 'dashboard')]
        ])
    }).catch(() => {});
});

// 🔥 المحرك Infinity (المحسّن)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const id = ctx.match[1];
    const uid = ctx.from.id;
    const s = db.get(`${uid}.s`)[id];

    if (clients[uid]) {
        clients[uid].close();
        clearInterval(intervals[uid]);
        delete clients[uid];
        return ctx.reply("🛑 *تم إيقاف اتصال الحماية.*");
    }

    try {
        clients[uid] = bedrock.createClient({
            host: s.host, port: parseInt(s.port), username: s.n,
            offline: true, version: '1.21.130', skipPing: false, connectTimeout: 30000
        });

        clients[uid].on('packet', (packet, meta) => {
            if (meta.name === 'resource_packs_info') {
                clients[uid].queue('resource_pack_client_response', { response_status: 'completed', resource_pack_ids: [] });
            }
        });

        clients[uid].on('spawn', () => {
            ctx.reply(`🚀 *تـم الـتـشغيل! الـبوت الآن يـحمي الـسيرفر.*`);
            intervals[uid] = setInterval(() => {
                if (clients[uid]) {
                    clients[uid].queue('player_auth_input', {
                        pitch: 0, yaw: 0, position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0, z: 0 },
                        head_yaw: 0, input_data: { jump_down: true }, input_mode: 'touch', play_mode: 'normal'
                    });
                }
            }, 10000);
        });

        clients[uid].on('error', () => { delete clients[uid]; clearInterval(intervals[uid]); });
    } catch (e) { ctx.reply("❌ عذراً، فشل الاتصال."); }
});

bot.action('home', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText('*🔱 نظام MaxBlack Infinity جاهز للخدمة*', { parse_mode: 'Markdown', ...royalUI }).catch(() => {});
});

bot.action(/^del_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    let s = db.get(`${ctx.from.id}.s`);
    s.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.s`, s);
    ctx.editMessageText("✅ تم حذف السيرفر بنجاح.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'dashboard')]]));
});

// 🛡️ درع الحماية الشامل
process.on('uncaughtException', (err) => { console.error('Anti-Crash Error:', err); });

bot.launch({ dropPendingUpdates: true });
console.log('🚀 MaxBlack Infinity Reborn is Ready!');
