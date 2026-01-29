const { Telegraf, session, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

// استدامة العمل على Railway
http.createServer((req, res) => res.end("Anti-AFK System Active 🛡️")).listen(process.env.PORT || 3000);

const bot = new Telegraf("8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ");
bot.use(session());

let userData = {};
let activeClients = {};
let afkIntervals = {}; // لتخزين مؤقتات منع الطرد

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
    await ctx.reply(`🎮 نظام ماكس بلاك (1.21.130)\n🛡️ نظام Anti-AFK: مفعّل تلقائياً`, getMenu(uid));
});

bot.action('add', (ctx) => {
    userData[ctx.from.id].step = 'get_ip';
    ctx.answerCbQuery();
    ctx.reply("📝 أرسل الـ IP وبورت السيرفر (ip:port):");
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
    await ctx.editMessageText("📂 اختر سيرفرك:", Markup.inlineKeyboard(btns));
});

bot.action(/^manage_(\d+)$/, async (ctx) => {
    const idx = ctx.match[1];
    const s = userData[ctx.from.id].servers[idx];
    const key = `${ctx.from.id}_${idx}`;
    const status = activeClients[key] ? "متصل ✅" : "مفصول 🔴";
    
    await ctx.editMessageText(`📍 سيرفر: ${s.ip}\n📊 الحالة: ${status}`, Markup.inlineKeyboard([
        [Markup.button.callback(activeClients[key] ? '🛑 خروج' : '▶️ دخول الآن', `toggle_${idx}`)],
        [Markup.button.callback('🗑️ حذف', `del_${idx}`), Markup.button.callback('🔙 عودة', 'list')]
    ]));
});

// 🔥 محرك الدخول مع Anti-AFK
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const uid = ctx.from.id;
    const idx = ctx.match[1];
    const s = userData[uid].servers[idx];
    const key = `${uid}_${idx}`;

    if (activeClients[key]) {
        if (afkIntervals[key]) clearInterval(afkIntervals[key]);
        activeClients[key].close();
        delete activeClients[key];
        ctx.answerCbQuery("🔴 تم الفصل");
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
                ctx.reply(`🚀 كفو! البوت دخل السيرفر.\n🛡️ تم تفعيل Anti-AFK (التحرك التلقائي).`);

                // نظام Anti-AFK: إرسال حزم حركة وهمية كل 10 ثوانٍ
                afkIntervals[key] = setInterval(() => {
                    if (activeClients[key]) {
                        activeClients[key].queue('player_auth_input', {
                            pitch: 0, yaw: 0, position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0.1, z: 0.1 },
                            head_yaw: 0, input_data: { jump_down: true }, input_mode: 'touch', play_mode: 'normal'
                        });
                    }
                }, 10000);
            });

            activeClients[key].on('error', (err) => {
                if (afkIntervals[key]) clearInterval(afkIntervals[key]);
                delete activeClients[key];
                ctx.reply(`❌ فشل: ${err.message}`);
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
    await ctx.reply(`📊 تقرير الحالة:\n- السيرفرات: ${userData[uid]?.servers?.length || 0}\n- النشطة الآن: ${live}`);
});

bot.action('home', (ctx) => bot.start(ctx));
bot.action('name', (ctx) => { userData[ctx.from.id].step = 'name'; ctx.answerCbQuery(); ctx.reply("أرسل اسم البوت الجديد:"); });
bot.action(/^del_(\d+)$/, (ctx) => { userData[ctx.from.id].servers.splice(ctx.match[1], 1); bot.start(ctx); });

bot.launch({ dropPendingUpdates: true });
