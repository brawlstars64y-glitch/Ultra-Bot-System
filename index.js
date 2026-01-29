const { Telegraf, session, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

// لضمان استقرار البوت على Railway ومنع الإغلاق
http.createServer((req, res) => res.end("MaxBlack Ultra Survival ✅")).listen(process.env.PORT || 3000);

const bot = new Telegraf("8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ");
bot.use(session());

let userData = {};
let activeClients = {};
let afkIntervals = {};

const getMenu = (uid) => {
    const servers = userData[uid]?.servers?.length || 0;
    return Markup.inlineKeyboard([
        [Markup.button.callback('➕ إضافة سيرفر', 'add'), Markup.button.callback(`📂 سيرفراتك (${servers})`, 'list')],
        [Markup.button.callback('✏️ اسم البوت', 'name'), Markup.button.callback('📊 الحالة', 'status')]
    ]);
};

bot.start(async (ctx) => {
    const uid = ctx.from.id.toString();
    userData[uid] = userData[uid] || { servers: [], botName: "Max_Player", step: null };
    await ctx.reply(`🎮 نظام الاقتحام الأقصى (1.21.130)\n🛡️ نظام البقاء (Anti-AFK): مفعّل بأقصى قوة`, getMenu(uid));
});

bot.action('add', (ctx) => {
    userData[ctx.from.id].step = 'get_ip';
    ctx.answerCbQuery();
    ctx.reply("📝 أرسل الـ IP والبورت (ip:port):");
});

bot.on('text', async (ctx) => {
    const uid = ctx.from.id.toString();
    const user = userData[uid];
    if (!user || !user.step) return;

    if (user.step === 'get_ip') {
        const input = ctx.message.text.trim();
        if (input.includes(':')) {
            const [ip, port] = input.split(':');
            user.servers.push({ ip: ip.trim(), port: parseInt(port.trim()) || 19132 });
            user.step = null;
            await ctx.reply("✅ تم حفظ السيرفر", getMenu(uid));
        }
    } else if (user.step === 'name') {
        user.botName = ctx.message.text.trim();
        user.step = null;
        await ctx.reply("✅ تم تغيير الاسم", getMenu(uid));
    }
});

bot.action('list', async (ctx) => {
    const uid = ctx.from.id;
    const servers = userData[uid]?.servers || [];
    if (servers.length === 0) return ctx.answerCbQuery("القائمة فارغة!");
    const btns = servers.map((s, i) => [Markup.button.callback(`🌍 ${s.ip}:${s.port}`, `manage_${i}`)]);
    btns.push([Markup.button.callback('🏠 رجوع', 'home')]);
    await ctx.editMessageText("📂 اختر سيرفرك للاقتحام:", Markup.inlineKeyboard(btns));
});

bot.action(/^manage_(\d+)$/, async (ctx) => {
    const idx = ctx.match[1];
    const s = userData[ctx.from.id].servers[idx];
    const key = `${ctx.from.id}_${idx}`;
    const status = activeClients[key] ? "متصل ✅" : "مفصول 🔴";
    
    await ctx.editMessageText(`📍 سيرفر: ${s.ip}\n📊 الحالة: ${status}`, Markup.inlineKeyboard([
        [Markup.button.callback(activeClients[key] ? '🛑 طرد البوت' : '▶️ دخول الآن', `toggle_${idx}`)],
        [Markup.button.callback('🗑️ حذف', `del_${idx}`), Markup.button.callback('🔙 عودة', 'list')]
    ]));
});

// 🔥 محرك الدخول مع نظام الحماية المتطور
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const uid = ctx.from.id;
    const idx = ctx.match[1];
    const s = userData[uid].servers[idx];
    const key = `${uid}_${idx}`;

    if (activeClients[key]) {
        if (afkIntervals[key]) clearInterval(afkIntervals[key]);
        try { activeClients[key].close(); } catch(e) {}
        delete activeClients[key];
        ctx.answerCbQuery("🔴 تم الخروج");
    } else {
        await ctx.answerCbQuery("⏳ جاري الاقتحام...");
        try {
            activeClients[key] = bedrock.createClient({
                host: s.ip,
                port: s.port,
                username: userData[uid].botName,
                offline: true,
                version: '1.21.130',
                connectTimeout: 40000
            });

            activeClients[key].on('spawn', () => {
                ctx.reply(`🚀 البوت دخل السيرفر بنجاح!\n🛡️ نظام الحماية من الطرد يعمل الآن.`);

                // ✅ نظام Anti-AFK المتطور: يرسل حزم حركة "حقيقية" للسيرفر
                afkIntervals[key] = setInterval(() => {
                    if (activeClients[key]) {
                        // إرسال حزمة حركة بسيطة كل 8 ثوانٍ لإبقاء الجلسة نشطة
                        activeClients[key].queue('move_player', {
                            runtime_id: activeClients[key].entityId,
                            position: { x: 0, y: 0, z: 0 },
                            pitch: 0, yaw: 0, head_yaw: 0,
                            mode: 'normal', on_ground: true, rode_runtime_id: 0,
                            teleport_cause: 0, tick: 0
                        });
                        // حزمة تفاعل وهمية
                        activeClients[key].queue('player_auth_input', {
                            pitch: 0, yaw: 0, position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0.1, z: 0.1 },
                            head_yaw: 0, input_data: { jump_down: true }, input_mode: 'touch', play_mode: 'normal'
                        });
                    }
                }, 8000);
            });

            activeClients[key].on('error', (err) => {
                if (afkIntervals[key]) clearInterval(afkIntervals[key]);
                delete activeClients[key];
                ctx.reply(`❌ تم طرد البوت أو فشل الدخول: ${err.message}`);
            });

            activeClients[key].on('disconnect', (packet) => {
                if (afkIntervals[key]) clearInterval(afkIntervals[key]);
                delete activeClients[key];
                ctx.reply(`🔴 السيرفر قطع الاتصال: ${packet.reason || 'ركلة تلقائية'}`);
            });

        } catch (e) { ctx.reply("❌ عطل في المحرك"); }
    }
    bot.start(ctx);
});

bot.action('status', async (ctx) => {
    const uid = ctx.from.id.toString();
    let live = 0;
    for (let k in activeClients) if (k.startsWith(uid)) live++;
    ctx.answerCbQuery();
    await ctx.reply(`📊 حالتك:\n- السيرفرات: ${userData[uid]?.servers?.length || 0}\n- المتصلة الآن: ${live}`);
});

bot.action('home', (ctx) => bot.start(ctx));
bot.action('name', (ctx) => { userData[ctx.from.id].step = 'name'; ctx.answerCbQuery(); ctx.reply("أرسل الاسم الجديد:"); });
bot.action(/^del_(\d+)$/, (ctx) => { userData[ctx.from.id].servers.splice(ctx.match[1], 1); bot.start(ctx); });

bot.launch({ dropPendingUpdates: true });
