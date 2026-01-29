const { Telegraf, session, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

// استدامة Railway
http.createServer((req, res) => res.end("System Online ✅")).listen(process.env.PORT || 3000);

const bot = new Telegraf("8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ");
bot.use(session());

let userData = {};
let activeClients = {};

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
    await ctx.reply(`🎮 نظام ماكس بلاك جاهز\nاسم البوت: ${userData[uid].botName}`, getMenu(uid));
});

bot.action('add', (ctx) => {
    userData[ctx.from.id].step = 'get_ip';
    ctx.answerCbQuery();
    ctx.reply("📝 أرسل الـ IP والبورت (مثال play.atarnos.me:12345):");
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
        } else {
            await ctx.reply("❌ أرسل التنسيق الصحيح ip:port");
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
    
    await ctx.editMessageText(`📍 السيرفر: ${s.ip}\n📊 الحالة: ${status}`, Markup.inlineKeyboard([
        [Markup.button.callback(activeClients[key] ? '🛑 خروج' : '▶️ دخول الآن', `toggle_${idx}`)],
        [Markup.button.callback('🗑️ حذف', `del_${idx}`), Markup.button.callback('🔙 عودة', 'list')]
    ]));
});

bot.action(/^toggle_(\d+)$/, async (ctx) => {
    const uid = ctx.from.id;
    const idx = ctx.match[1];
    const s = userData[uid].servers[idx];
    const key = `${uid}_${idx}`;

    if (activeClients[key]) {
        try { activeClients[key].close(); } catch(e) {}
        delete activeClients[key];
        ctx.answerCbQuery("🔴 تم الفصل");
    } else {
        await ctx.answerCbQuery("⏳ جاري محاولة الدخول...");
        try {
            activeClients[key] = bedrock.createClient({
                host: s.ip,
                port: s.port,
                username: userData[uid].botName,
                offline: true,
                version: false, // اكتشاف تلقائي للإصدار
                connectTimeout: 30000
            });

            activeClients[key].on('spawn', () => {
                ctx.reply(`✅ البوت داخل السيرفر الآن: ${s.ip}`);
            });

            activeClients[key].on('error', (err) => {
                delete activeClients[key];
                ctx.reply(`❌ فشل: ${err.message}`);
            });

        } catch (e) { ctx.reply("❌ خطأ في المحرك"); }
    }
    bot.start(ctx);
});

bot.action('status', async (ctx) => {
    const uid = ctx.from.id.toString();
    let live = 0;
    for (let k in activeClients) if (k.startsWith(uid)) live++;
    ctx.answerCbQuery();
    await ctx.reply(`📊 تقريرك:\n- السيرفرات: ${userData[uid]?.servers?.length || 0}\n- المتصلة الآن: ${live}`);
});

bot.action('home', (ctx) => bot.start(ctx));
bot.action('name', (ctx) => { userData[ctx.from.id].step = 'name'; ctx.answerCbQuery(); ctx.reply("أرسل الاسم الجديد:"); });
bot.action(/^del_(\d+)$/, (ctx) => { userData[ctx.from.id].servers.splice(ctx.match[1], 1); bot.start(ctx); });

bot.launch({ dropPendingUpdates: true });
