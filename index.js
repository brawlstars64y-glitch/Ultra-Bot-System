const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 محرك الاستدامة
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("نظام MaxBlack Infinity: محرك الدخول القسري يعمل ✅");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let clients = {};
let intervals = {};

const royalUI = Markup.inlineKeyboard([
    [Markup.button.callback('🛡️ تـأمين سـيرفر جـديد', 'add_new')], 
    [Markup.button.callback('🔱 مـنـصة الـتـحـكـم', 'dashboard')], 
    [Markup.button.callback('💎 الـمـمـيزات', 'features'), Markup.button.callback('🆘 الـدعم', 'support')],
    [Markup.button.url('👤 الـمـبـرمـج', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*🔱 نظام MaxBlack Infinity*\n_تم تحديث محرك الدخول لضمان ظهور البوت داخل اللعبة._`, royalUI);
});

// ✅ المميزات
bot.action('features', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText(`💎 *المميزات المصلحة:* \n\n• دخول قسري (Forced Join) 🚀\n• توافق تلقائي مع الإصدارات 🔄\n• الرد على حزم الموارد (Resource Packs) ✅\n• ثبات الهوية باسم MaxBlack_Bot 🆔`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 عودة', 'home')]])
    }).catch(() => {});
});

bot.action('support', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText(`🆘 *مساعدة:* \nإذا لم يظهر البوت، تأكد من أن السيرفر "Offline Mode" أو "Cracked".`, {
        parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🔙 عودة', 'home')]])
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
        ctx.reply('✅ *تم حفظ السيرفر!*', royalUI);
    }
});

// 📊 المنصة
bot.action('dashboard', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const srvs = db.get(`${ctx.from.id}.s`) || [];
    if (srvs.length === 0) return ctx.reply("⚠️ المنصة خالية!", royalUI);
    const buttons = srvs.map((s, i) => [Markup.button.callback(`🌍 ${s.host}`, `manage_${i}`)]);
    buttons.push([Markup.button.callback('🔙 رجوع', 'home')]);
    ctx.editMessageText('🔱 *منصة التحكم:*', Markup.inlineKeyboard(buttons)).catch(() => {});
});

bot.action(/^manage_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const id = ctx.match[1];
    const s = db.get(`${ctx.from.id}.s`)[id];
    const active = clients[ctx.from.id] ? "مـتـصل ✅" : "مـفـصول 🔴";
    ctx.editMessageText(`🛡️ *إدارة السيرفر:* \n📍 \`${s.host}:${s.port}\` \n📊 الحالة: ${active}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(clients[ctx.from.id] ? '🛑 إيقاف' : '⚡ تشغيل القسري', `toggle_${id}`)],
            [Markup.button.callback('🗑️ حذف', `del_${id}`), Markup.button.callback('🔙', 'dashboard')]
        ])
    }).catch(() => {});
});

// 🔥 المحرك الجديد (Forced Connect Engine)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const id = ctx.match[1];
    const uid = ctx.from.id;
    const s = db.get(`${uid}.s`)[id];

    if (clients[uid]) {
        clients[uid].close();
        clearInterval(intervals[uid]);
        delete clients[uid];
        return ctx.reply("🛑 *تم إخراج البوت.*");
    }

    try {
        ctx.reply("⏳ جاري محاولة الدخول القسري...");
        
        clients[uid] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.n,
            offline: true,
            // 🔄 الحل: ترك الإصدار تلقائي أو استخدام أحدث إصدار مستقر
            skipPing: false, 
            connectTimeout: 45000,
            // إضافة بيانات جهاز لرفع نسبة القبول
            profiles: { platform: 1, deviceModel: 'Android' }
        });

        // الاستجابة لحزم السيرفر لضمان عدم الطرد قبل الظهور
        clients[uid].on('packet', (packet, meta) => {
            if (meta.name === 'resource_packs_info') {
                clients[uid].queue('resource_pack_client_response', { response_status: 'completed', resource_pack_ids: [] });
            }
        });

        clients[uid].on('spawn', () => {
            ctx.reply(`✅ *البوت متصل الآن وظهر داخل السيرفر!*`);
            intervals[uid] = setInterval(() => {
                if (clients[uid]) {
                    // حركة مستمرة للتأكيد للسيرفر أن البوت لاعب حقيقي
                    clients[uid].queue('player_auth_input', {
                        pitch: 0, yaw: 0, position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0, z: 0 },
                        head_yaw: 0, input_data: { jump_down: true }, input_mode: 'touch', play_mode: 'normal'
                    });
                }
            }, 10000);
        });

        clients[uid].on('error', (err) => {
            console.log("Connect Error: " + err.message);
            delete clients[uid];
            clearInterval(intervals[uid]);
        });

    } catch (e) { ctx.reply("❌ السيرفر رفض الاتصال."); }
});

bot.action('home', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText('*🔱 نظام MaxBlack Infinity المطور*', { parse_mode: 'Markdown', ...royalUI }).catch(() => {});
});

bot.action(/^del_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    let s = db.get(`${ctx.from.id}.s`);
    s.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.s`, s);
    ctx.editMessageText("✅ تم الحذف.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'dashboard')]]));
});

process.on('uncaughtException', (err) => { console.error('Safe Catch:', err); });

bot.launch({ dropPendingUpdates: true });
console.log('🚀 Forced Engine is Ready!');
