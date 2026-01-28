const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 نظام الاستدامة ومنع التجمد
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("نظام MaxBlack Ultra: المحاكاة البشرية تعمل بنجاح ✅");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());
let clients = {};
let intervals = {};

// 🎨 الواجهة الملكية الفخمة (الترتيب المعتمد)
const royalUI = Markup.inlineKeyboard([
    [Markup.button.callback('🛡️ تـأمين سـيرفر جـديد', 'add_new')], 
    [Markup.button.callback('🔱 مـنـصة الـتـحـكـم', 'dashboard')], 
    [Markup.button.callback('💎 الـمـمـيزات', 'features'), Markup.button.callback('🆘 الـدعم', 'support')],
    [Markup.button.url('👤 الـمـبـرمـج', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*🔱 مرحباً بك في نظام MaxBlack Ultra*\n_تم تفعيل بروتوكول المحاكاة الشامل لتخطي الطرد نهائياً._`, royalUI);
});

// ✅ ميزة المميزات (تعمل الآن 100%)
bot.action('features', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText(`💎 *مميزات Ultra المتقدمة:* \n\n• محاكاة أجهزة Xbox/Mobile لضمان الدخول 🎮\n• نظام الرد على الـ Latency (تخطي طرد السرعة) ⚡\n• منع طرد الـ Idle بحركات عشوائية 🔄\n• توافق تام مع سيرفرات Aternos المكركة 🛡️`, {
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
        ctx.reply('🔢 *أرسل منفذ السيرفر (Port):*');
    } else if (ctx.session?.step === 'port') {
        let s = db.get(`${uid}.s`) || [];
        s.push({ host: ctx.session.h, port: ctx.message.text.trim(), n: "MaxBlack_Bot" });
        db.set(`${uid}.s`, s);
        ctx.session = null;
        ctx.reply('✅ *تم تسجيل السيرفر بنجاح!*', royalUI);
    }
});

// 📊 المنصة
bot.action('dashboard', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const srvs = db.get(`${ctx.from.id}.s`) || [];
    if (srvs.length === 0) return ctx.reply("⚠️ لا توجد سيرفرات!", royalUI);
    const buttons = srvs.map((s, i) => [Markup.button.callback(`🌍 ${s.host}`, `manage_${i}`)]);
    buttons.push([Markup.button.callback('🔙 رجوع', 'home')]);
    ctx.editMessageText('🔱 *منصة التحكم الذكي:*', Markup.inlineKeyboard(buttons));
});

bot.action(/^manage_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const id = ctx.match[1];
    const s = db.get(`${ctx.from.id}.s`)[id];
    const active = clients[ctx.from.id] ? "نـشـط ✅" : "مـعـطل 🔴";
    ctx.editMessageText(`🛡️ *إدارة الحماية:* \n📍 \`${s.host}:${s.port}\` \n📊 الحالة: ${active}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback(clients[ctx.from.id] ? '🛑 إيقاف البوت' : '⚡ تفعيل الاقتحام', `toggle_${id}`)],
            [Markup.button.callback('🗑️ حذف', `del_${id}`), Markup.button.callback('🔙', 'dashboard')]
        ])
    });
});

// 🔥 المحرك الخارق (Ultra Simulation Engine)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const id = ctx.match[1];
    const uid = ctx.from.id;
    const s = db.get(`${uid}.s`)[id];

    if (clients[uid]) {
        clients[uid].close();
        clearInterval(intervals[uid]);
        delete clients[uid];
        return ctx.reply("🛑 *تم سحب البوت بنجاح.*");
    }

    try {
        ctx.reply("⏳ جاري محاكاة الهوية واقتحام السيرفر...");
        
        clients[uid] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.n,
            offline: true,
            version: false, // اكتشاف تلقائي للإصدار
            skipPing: false,
            connectTimeout: 60000,
            // 🛡️ سر البوت الناجح: محاكاة منصة PlayStation/Xbox لزيادة الثقة
            profiles: {
                platform: 2, // محاكاة تامة لمنصة ألعاب
                deviceModel: 'PlayStation 5' 
            }
        });

        clients[uid].on('packet', (packet, meta) => {
            // الرد الفوري على حزم الموارد (حل مشكلة Left game)
            if (meta.name === 'resource_packs_info') {
                clients[uid].queue('resource_pack_client_response', { 
                    response_status: 'completed', resource_pack_ids: [] 
                });
            }
            // الرد على حزم الشبكة لمنع طرد "التعليق"
            if (meta.name === 'network_stack_latency') {
                clients[uid].queue('network_stack_latency', { 
                    server_time: packet.server_time, needs_response: false 
                });
            }
        });

        clients[uid].on('spawn', () => {
            ctx.reply(`🚀 *نجح الاختراق! البوت الآن لاعب حقيقي داخل السيرفر.*`);
            
            // نظام Anti-AFK حركي (قفز وتدوير) ليظهر كلاعب حقيقي
            intervals[uid] = setInterval(() => {
                if (clients[uid]) {
                    clients[uid].queue('player_auth_input', {
                        pitch: 0, yaw: Math.random() * 360, 
                        position: { x: 0, y: 0, z: 0 }, 
                        move_vector: { x: 0, z: 0 },
                        head_yaw: Math.random() * 360, 
                        input_data: { jump_down: true }, 
                        input_mode: 'touch', play_mode: 'normal'
                    });
                }
            }, 10000);
        });

        clients[uid].on('error', (err) => {
            delete clients[uid];
            clearInterval(intervals[uid]);
        });

    } catch (e) { ctx.reply("❌ فشل الاقتحام."); }
});

bot.action('home', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText('*🔱 نظام MaxBlack Ultra جاهز للخدمة*', { parse_mode: 'Markdown', ...royalUI });
});

bot.action(/^del_(\d+)$/, (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    let s = db.get(`${ctx.from.id}.s`);
    s.splice(ctx.match[1], 1);
    db.set(`${ctx.from.id}.s`, s);
    ctx.editMessageText("✅ تم الحذف.", Markup.inlineKeyboard([[Markup.button.callback('🔙', 'dashboard')]]));
});

process.on('uncaughtException', (err) => { console.error('Safe Shield:', err); });

bot.launch({ dropPendingUpdates: true });
console.log('🚀 MaxBlack Ultra is Online!');
