const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 نظام الاستدامة لضمان عدم توقف البوت في الاستضافة
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("MaxBlack V5: نظام الحماية القصوى قيد التشغيل ✅");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let clients = {};
let intervals = {};

// 🎨 الواجهة الملكية المعتمدة (بالترتيب المطلوب)
const royalUI = Markup.inlineKeyboard([
    [Markup.button.callback('🛡️ تـأمين سـيرفر جـديد', 'add_new')], 
    [Markup.button.callback('🔱 مـنـصة الـتـحـكـم', 'dashboard')], 
    [Markup.button.callback('💎 الـمـمـيزات', 'features'), Markup.button.callback('🆘 الـدعم', 'support')],
    [Markup.button.url('👤 الـمـبـرمـج', 'https://t.me/uuuaaw')]
]);

bot.start((ctx) => {
    ctx.replyWithMarkdown(`*🔱 مرحباً بك في إصدار الإنقاذ V5*\n_تم تحديث البروتوكول لتخطي أنظمة الحماية ومنع الطرد._`, royalUI);
});

// ✅ إصلاح زر المميزات (Features) ليظهر فوراً
bot.action('features', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const featText = `💎 *مـمـيزات الـنسخة V5 الـمحدثة:*
• تخطي فلاتر الـ Anti-Bot الحديثة ✅
• دعم تلقائي لـلإصدارات (1.20 - 1.21) 🔄
• الرد الـتلقائي على حزم الـموارد 📦
• حـماية الـجمود (Anti-Freeze) 🛡️`;
    ctx.editMessageText(featText, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 عودة', 'home')]])
    }).catch(() => {});
});

// 🛠️ إضافة سيرفر
bot.action('add_new', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    ctx.session = { step: 'host' };
    ctx.reply('📡 *أرسل عنوان السيرفر (IP/Host):*');
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
        ctx.reply('✅ *تم الحفظ بنجاح! اذهب للمنصة لتشغيل البوت.*', royalUI);
    }
});

// 📊 المنصة
bot.action('dashboard', (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const srvs = db.get(`${ctx.from.id}.s`) || [];
    if (srvs.length === 0) return ctx.reply("⚠️ لا توجد سيرفرات مضافة!", royalUI);
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
            [Markup.button.callback(clients[ctx.from.id] ? '🛑 إيقاف الاتصال' : '⚡ تفعيل الاقتحام', `toggle_${id}`)],
            [Markup.button.callback('🗑️ حذف', `del_${id}`), Markup.button.callback('🔙', 'dashboard')]
        ])
    }).catch(() => {});
});

// 🔥 المحرك V5 (الحل النهائي لمشكلة عدم الدخول)
bot.action(/^toggle_(\d+)$/, async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const id = ctx.match[1];
    const uid = ctx.from.id;
    const s = db.get(`${uid}.s`)[id];

    if (clients[uid]) {
        clients[uid].close();
        clearInterval(intervals[uid]);
        delete clients[uid];
        return ctx.reply("🛑 *تم إخراج البوت من السيرفر.*");
    }

    try {
        ctx.reply("⏳ جاري محاكاة لاعب حقيقي للدخول...");
        
        clients[uid] = bedrock.createClient({
            host: s.host,
            port: parseInt(s.port),
            username: s.n,
            offline: true,
            version: '1.21.130', // إصدار ثابت ومقبول عالمياً
            skipPing: false,
            connectTimeout: 60000, // وقت أطول لضمان الاستجابة
            flow: 'standard', // محاكاة التدفق الطبيعي للبيانات
            profiles: {
                platform: 1, // تظاهر بأنه Android
                deviceModel: 'SM-G998B' // Samsung S21 Ultra
            }
        });

        // 🛡️ تجاوز أنظمة الـ Anti-Bot عن طريق الرد الفوري على كل طلبات السيرفر
        clients[uid].on('packet', (packet, meta) => {
            // 1. الرد على طلب حزم الموارد (Resource Packs)
            if (meta.name === 'resource_packs_info') {
                clients[uid].queue('resource_pack_client_response', { 
                    response_status: 'completed', 
                    resource_pack_ids: [] 
                });
            }
            // 2. الرد على حزم الـ Latency لمنع الطرد السريع
            if (meta.name === 'network_stack_latency') {
                clients[uid].queue('network_stack_latency', { 
                    server_time: packet.server_time, 
                    needs_response: false 
                });
            }
        });

        // 3. تأكيد الظهور داخل السيرفر (Spawn)
        clients[uid].on('spawn', () => {
            ctx.reply(`🚀 *نجح الاقتحام! البوت الآن داخل اللعبة.*`);
            
            // نظام الـ Anti-AFK المتقدم (حركات عشوائية بسيطة لمنع الرصد)
            intervals[uid] = setInterval(() => {
                if (clients[uid]) {
                    clients[uid].queue('player_auth_input', {
                        pitch: 0, yaw: (Math.random() * 360), 
                        position: { x: 0, y: 0, z: 0 }, 
                        move_vector: { x: 0, z: 0 },
                        head_yaw: (Math.random() * 360), 
                        input_data: { jump_down: true, sneak_down: false }, 
                        input_mode: 'touch', play_mode: 'normal'
                    });
                }
            }, 12000);
        });

        clients[uid].on('error', (err) => {
            console.error(`[MC Error]: ${err.message}`);
            delete clients[uid];
            clearInterval(intervals[uid]);
        });

    } catch (e) {
        ctx.reply("❌ السيرفر محمي جداً أو مغلق حالياً.");
    }
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

// 🛡️ درع الحماية من الانهيار
process.on('uncaughtException', (err) => { console.error('Safe Catch:', err); });
process.on('unhandledRejection', (reason) => { console.error('Safe Rejection:', reason); });

bot.launch({ dropPendingUpdates: true });
console.log('🚀 MaxBlack V5 Ultimate is Running!');
