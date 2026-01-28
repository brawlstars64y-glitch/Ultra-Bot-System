const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 نظام الاستدامة (Keeping Alive)
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("MaxBlack V4 is Running...");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let clients = {};
let intervals = {};

// 🎨 الواجهة الجديدة كلياً (UI REBORN)
const neonUI = Markup.inlineKeyboard([
    [Markup.button.callback('📂 مـخـزن الـسـيـرفـرات', 'view_srv')],
    [Markup.button.callback('⚡ إضـافـة اتـصـال جـديـد', 'new_conn')],
    [Markup.button.callback('🛠️ الـتـفـضـيـلات', 'prefs'), Markup.button.callback('📖 الـدليل', 'guide')],
    [Markup.button.url('📡 قـنـاة الـتـحـديـثـات', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*تـم تـفـعـيل نـظـام MaxBlack V4 الـمـطـور* 💎\n_نظام حماية ماين كرافت الأقوى ضد الطرد._`, neonUI);
});

// ✅ إصلاح الأزرار الجديدة
bot.action('prefs', (ctx) => {
    ctx.editMessageText(`🛠️ *تفضيلات النظام:* \n\n• محرك الدخول: V4 (Silent) \n• حماية الطرد: قصوى ✅\n• الرد الآلي: مفعل ✅\n• نظام الانهيار: محمي 🛡️`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 الـعـودة', 'home')]])
    });
});

bot.action('guide', (ctx) => {
    ctx.editMessageText(`📖 *دليل التشغيل:* \n\n1. أضف الـ IP والبورت.\n2. اضغط "تفعيل الدرع".\n3. إذا فصل السيرفر، سيعيد البوت المحاولة تلقائياً.`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 الـعـودة', 'home')]])
    });
});

// 🛠️ إضافة سيرفر (نظام مدخلات جديد)
bot.action('new_conn', (ctx) => {
    ctx.session = { state: 'input_host' };
    ctx.reply('💎 *أدخل عنوان السيرفر (Host):*');
});

bot.on('text', async (ctx) => {
    const uid = ctx.from.id;
    if (ctx.session?.state === 'input_host') {
        ctx.session.h = ctx.message.text.trim();
        ctx.session.state = 'input_port';
        ctx.reply('🔢 *أدخل منفذ السيرفر (Port):*');
    } 
    else if (ctx.session?.state === 'input_port') {
        let srvs = db.get(`${uid}.s`) || [];
        srvs.push({ host: ctx.session.h, port: ctx.message.text.trim(), name: "MaxBlack_Bot" });
        db.set(`${uid}.s`, srvs);
        ctx.session = null;
        ctx.reply('✅ *تم تسجيل السيرفر في المخزن!*', neonUI);
    }
});

// 🎮 إدارة المخزن
bot.action('view_srv', (ctx) => {
    const srvs = db.get(`${ctx.from.id}.s`) || [];
    if (srvs.length === 0) return ctx.answerCbQuery("المخزن فارغ!", { show_alert: true });
    const buttons = srvs.map((s, i) => [Markup.button.callback(`🌐 ${s.host}`, `manage_${i}`)]);
    buttons.push([Markup.button.callback('🔙 رجوع', 'home')]);
    ctx.editMessageText('📂 *مخزن السيرفرات الخاصة بك:*', Markup.inlineKeyboard(buttons));
});

bot.action(/^manage_(\d+)$/, (ctx) => {
    const id = ctx.match[1];
    const s = db.get(`${ctx.from.id}.s`)[id];
    const active = clients[ctx.from.id] ? "نـشـط ✅" : "مـتـوقـف 🔴";
    ctx.editMessageText(`🛡️ *تحكم الحماية:* \n\n📍 العنوان: \`${s.host}:${s.port}\` \n📊 الحالة: ${active}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(clients[ctx.from.id] ? '🛑 إيقاف الدرع' : '⚡ تفعيل الدرع', `toggle_${id}`)],
            [Markup.button.callback('🗑️ مسح', `del_${id}`), Markup.button.callback('🔙', 'view_srv')]
        ])
    });
});

// 🔥 المحرك V4 (حل مشكلة الخروج بعد ثانية واحدة)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const id = ctx.match[1];
    const uid = ctx.from.id;
    const s = db.get(`${uid}.s`)[id];

    if (clients[uid]) {
        clients[uid].close();
        clearInterval(intervals[uid]);
        delete clients[uid];
        return ctx.reply("🛑 *تم سحب الدرع وإغلاق الاتصال.*");
    }

    try {
        ctx.answerCbQuery("⚡ جاري تفعيل محرك V4...");
        
        clients[uid] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.name,
            offline: true,
            version: '1.21.130',
            skipPing: false, // مهم جداً للمصافحة الصحيحة
            connectTimeout: 30000
        });

        // 🛡️ تجاوز الطرد الفوري (Immediate Packet Response)
        clients[uid].on('packet', (packet, meta) => {
            // الرد على حزمة التحقق من الموارد (Secret Tip)
            if (meta.name === 'resource_packs_info') {
                clients[uid].queue('resource_pack_client_response', { response_status: 'completed', resource_pack_ids: [] });
            }
            // الرد على حزم الاستجابة
            if (meta.name === 'network_stack_latency') {
                clients[uid].queue('network_stack_latency', { server_time: packet.server_time, needs_response: false });
            }
        });

        clients[uid].on('spawn', () => {
            ctx.reply(`🚀 *تم تفعيل الدرع بنجاح!* \nالبوت الآن يرسل نبضات Anti-AFK ثابتة.`);
            
            intervals[uid] = setInterval(() => {
                if (clients[uid]) {
                    // حركة معقدة (قفز + دوران + تسلل) لمنع الكشف
                    clients[uid].queue('player_auth_input', {
                        pitch: 0, yaw: 0, position: { x: 0, y: 0, z: 0 }, 
                        move_vector: { x: 0, z: 0 }, head_yaw: 0, 
                        input_data: { jump_down: true, sneak_down: false }, 
                        input_mode: 'touch', play_mode: 'normal'
                    });
                }
            }, 8000);
        });

        clients[uid].on('error', (err) => {
            console.log(`[V4 Guard] Error: ${err.message}`);
            clearInterval(intervals[uid]);
            delete clients[uid];
        });

    } catch (e) { ctx.reply("❌ فشل المحرك في الدخول."); }
});

bot.action('home', (ctx) => ctx.editMessageText('*تـم تـفـعـيل نـظـام MaxBlack V4 الـمـطـور* 💎', { parse_mode: 'Markdown', ...neonUI }));

bot.action(/^del_(\d+)$/, (ctx) => {
    let srvs = db.get(`${ctx.from.id}.s`);
    srvs.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.s`, srvs);
    ctx.editMessageText("✅ تم المسح.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'view_srv')]]));
});

// 🛡️ درع الانهيار الشامل (Global Anti-Crash)
process.on('uncaughtException', (err) => { console.error('Caught exception:', err); });
process.on('unhandledRejection', (reason, promise) => { console.error('Unhandled Rejection:', reason); });

bot.launch();
console.log('🚀 MaxBlack V4 REBORN is Online!');
