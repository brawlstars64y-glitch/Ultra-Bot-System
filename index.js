const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// نظام منع تجمد الاستضافة
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("MaxBlack V6: Aternos Shield Active ✅");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());
let clients = {};
let intervals = {};

// الواجهة الملكية (الترتيب الذي طلبته)
const royalUI = Markup.inlineKeyboard([
    [Markup.button.callback('🛡️ تـأمين سـيرفر جـديد', 'add_new')], 
    [Markup.button.callback('🔱 مـنـصة الـتـحـكـم', 'dashboard')], 
    [Markup.button.callback('💎 الـمـمـيزات', 'features'), Markup.button.callback('🆘 الـدعم', 'support')],
    [Markup.button.url('👤 الـمـبـرمـج', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*🔱 محرك V6 مخصص لسيرفرات Aternos*\n_تم ضبط الإعدادات لتتوافق مع وضع (مكركة) ✅_`, royalUI);
});

// المميزات
bot.action('features', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText(`💎 *مميزات V6 المخصصة:* \n\n• تخطي طرد Aternos الفوري ✅\n• دعم وضع "مكركة" بالكامل 🛡️\n• محاكاة لاعب حقيقي (Android) 📱`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 عودة', 'home')]])
    });
});

// إضافة سيرفر
bot.action('add_new', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.session = { step: 'host' };
    ctx.reply('📡 *أرسل IP السيرفر (بدون البورت):*');
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
        ctx.reply('✅ *تم الحفظ! شغل البوت من المنصة الآن.*', royalUI);
    }
});

// المنصة
bot.action('dashboard', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const srvs = db.get(`${ctx.from.id}.s`) || [];
    if (srvs.length === 0) return ctx.reply("⚠️ لا يوجد سيرفرات!", royalUI);
    const buttons = srvs.map((s, i) => [Markup.button.callback(`🌍 ${s.host}`, `manage_${i}`)]);
    buttons.push([Markup.button.callback('🔙 رجوع', 'home')]);
    ctx.editMessageText('🔱 *منصة التحكم:*', Markup.inlineKeyboard(buttons));
});

bot.action(/^manage_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const id = ctx.match[1];
    const s = db.get(`${ctx.from.id}.s`)[id];
    const active = clients[ctx.from.id] ? "متصل ✅" : "مفصول 🔴";
    ctx.editMessageText(`🛡️ *إدارة السيرفر:* \n📍 \`${s.host}:${s.port}\` \n📊 الحالة: ${active}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(clients[ctx.from.id] ? '🛑 إيقاف' : '⚡ تشغيل الاقتحام', `toggle_${id}`)],
            [Markup.button.callback('🗑️ حذف', `del_${id}`), Markup.button.callback('🔙', 'dashboard')]
        ])
    });
});

// 🔥 المحرك V6 (Aternos Destroyer)
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
        ctx.reply("⏳ جاري الاقتحام وتخطي حماية Aternos...");
        
        clients[uid] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.n,
            offline: true,
            version: false, // اكتشاف تلقائي للإصدار
            skipPing: false,
            connectTimeout: 60000,
            profiles: { platform: 1 } // محاكاة Android لزيادة القبول
        });

        // 🛡️ السر: الرد الفوري على كل طلبات السيرفر
        clients[uid].on('packet', (packet, meta) => {
            if (meta.name === 'resource_packs_info') {
                clients[uid].queue('resource_pack_client_response', { 
                    response_status: 'completed', resource_pack_ids: [] 
                });
            }
            // منع الـ Kick بسبب اللاغ أو عدم الاستجابة
            if (meta.name === 'network_stack_latency') {
                clients[uid].queue('network_stack_latency', { 
                    server_time: packet.server_time, needs_response: false 
                });
            }
        });

        clients[uid].on('spawn', () => {
            ctx.reply(`✅ *نجح الاتصال! البوت داخل سيرفر Aternos الآن.*`);
            intervals[uid] = setInterval(() => {
                if (clients[uid]) {
                    // حركة وهمية مستمرة للبقاء
                    clients[uid].queue('player_auth_input', {
                        pitch: 0, yaw: 0, position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0, z: 0 },
                        head_yaw: 0, input_data: { jump_down: true }, input_mode: 'touch', play_mode: 'normal'
                    });
                }
            }, 10000);
        });

        clients[uid].on('error', (err) => {
            console.log("Aternos Error: " + err.message);
            delete clients[uid];
            clearInterval(intervals[uid]);
        });

    } catch (e) { ctx.reply("❌ فشل الاقتحام."); }
});

bot.action('home', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText('*🔱 نظام MaxBlack Infinity V6*', { parse_mode: 'Markdown', ...royalUI });
});

bot.action(/^del_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    let s = db.get(`${ctx.from.id}.s`);
    s.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.s`, s);
    ctx.editMessageText("✅ تم الحذف.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'dashboard')]]));
});

// درع الحماية من الانهيار
process.on('uncaughtException', (err) => { console.error('Shielded:', err); });

bot.launch({ dropPendingUpdates: true });
console.log('🚀 V6 Aternos Edition is Online!');
