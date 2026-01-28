const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 محرك الاستدامة
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("نظام MaxBlack Infinity: محرك الاقتحام يعمل ✅");
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
    ctx.replyWithMarkdown(`*🔱 نظام MaxBlack Infinity - محرك الاقتحام*\n_تم تحديث البروتوكول لاكتشاف الإصدارات تلقائياً._`, royalUI);
});

// ✅ المميزات المصلحة
bot.action('features', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText(`💎 *المميزات المصلحة:* \n\n• اكتشاف الإصدار تلقائياً (Auto-Version) 🔄\n• تخطي جدران الحماية (Anti-Bot Bypass) 🛡️\n• الرد الفوري على طلبات الموارد ✅\n• ثبات الهوية باسم MaxBlack_Bot 🆔`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 عودة', 'home')]])
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
        ctx.reply('✅ *تم حفظ السيرفر بنجاح!*', royalUI);
    }
});

// 📊 المنصة
bot.action('dashboard', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const srvs = db.get(`${ctx.from.id}.s`) || [];
    if (srvs.length === 0) return ctx.reply("⚠️ لا توجد سيرفرات!", royalUI);
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
            [Markup.button.callback(clients[ctx.from.id] ? '🛑 إيقاف' : '⚡ تفعيل الاقتحام', `toggle_${id}`)],
            [Markup.button.callback('🗑️ حذف', `del_${id}`), Markup.button.callback('🔙', 'dashboard')]
        ])
    }).catch(() => {});
});

// 🔥 المحرك النهائي المصلح (الحل الجذري)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const id = ctx.match[1];
    const uid = ctx.from.id;
    const s = db.get(`${uid}.s`)[id];

    if (clients[uid]) {
        clients[uid].close();
        clearInterval(intervals[uid]);
        delete clients[uid];
        return ctx.reply("🛑 *تم سحب البوت.*");
    }

    try {
        ctx.reply("⏳ جاري تحليل الإصدار والاقتحام...");

        // 🛡️ الخيار version: false يجعل البوت يكتشف الإصدار تلقائياً
        clients[uid] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.n,
            offline: true,
            version: false, 
            skipPing: false,
            connectTimeout: 60000
        });

        // التعامل مع حزم الدخول الحرجة
        clients[uid].on('packet', (packet, meta) => {
            // الرد الفوري على حزم الموارد (Resource Packs) - أهم سبب للطرد
            if (meta.name === 'resource_packs_info') {
                clients[uid].queue('resource_pack_client_response', { 
                    response_status: 'completed', 
                    resource_pack_ids: [] 
                });
            }
            // الرد على حزم التأخير لمنع الطرد السريع
            if (meta.name === 'network_stack_latency') {
                clients[uid].queue('network_stack_latency', { 
                    server_time: packet.server_time, 
                    needs_response: false 
                });
            }
        });

        clients[uid].on('spawn', () => {
            ctx.reply(`🚀 *نجح الاقتحام! البوت داخل السيرفر الآن.*`);
            intervals[uid] = setInterval(() => {
                if (clients[uid]) {
                    // حركة قفز للتأكيد على النشاط
                    clients[uid].queue('player_auth_input', {
                        pitch: 0, yaw: 0, position: { x: 0, y: 0, z: 0 }, move_vector: { x: 0, z: 0 },
                        head_yaw: 0, input_data: { jump_down: true }, input_mode: 'touch', play_mode: 'normal'
                    });
                }
            }, 10000);
        });

        clients[uid].on('error', (err) => {
            console.log(`[Error]: ${err.message}`);
            delete clients[uid];
            clearInterval(intervals[uid]);
        });

    } catch (e) { ctx.reply("❌ فشل الاقتحام. تأكد من الـ IP."); }
});

bot.action('home', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.editMessageText('*🔱 نظام MaxBlack Infinity المطور*', { parse_mode: 'Markdown', ...royalUI }).catch(() => {});
});

// درع الحماية الشامل
process.on('uncaughtException', (err) => { console.error('Safe Catch:', err); });

bot.launch({ dropPendingUpdates: true });
console.log('🚀 Final Attack Engine is Online!');
