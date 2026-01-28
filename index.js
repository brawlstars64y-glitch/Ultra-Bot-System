const { Telegraf, Markup, session } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");
const http = require('http');

// 🌐 سيرفر Railway لمنع الانهيار وضمان العمل 24/7
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end("نظام MaxBlack Pro يعمل بنجاح 💎");
}).listen(process.env.PORT || 3000);

const token = '8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU';
const db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const bot = new Telegraf(token);

bot.use(session());

let activeClients = {};
let afkIntervals = {};

// ⌨️ القائمة الرئيسية (تضم إعدادات النظام والمساعدة)
const mainButtons = Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سيرفراتي المحفوظة', 'my_servers')],
    [Markup.button.callback('➕ إضافة سيرفر جديد', 'add_server')],
    [Markup.button.callback('⚙️ إعدادات النظام', 'settings'), Markup.button.callback('❓ المساعدة', 'help')],
    [Markup.button.url('👨‍💻 المطور', 'https://t.me/uuuaaw')]
]);

// 🚀 أوامر البداية
bot.start((ctx) => {
    ctx.replyWithMarkdown(`👋 *أهلاً بك يا بطل في نظام MaxBlack Pro المطور*`, mainButtons);
});

// ⚙️ تفعيل زر إعدادات النظام
bot.action('settings', (ctx) => {
    const userId = ctx.from.id;
    const notif = db.get(`${userId}.notif`) !== false ? "مفعلة ✅" : "معطلة ❌";
    const auto = db.get(`${userId}.auto`) === true ? "مفعل ✅" : "معطل ❌";

    ctx.editMessageText(`⚙️ *إعدادات النظام العامة:*\n\n🔔 الإشعارات: ${notif}\n🔄 التشغيل التلقائي: ${auto}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔔 تبديل الإشعارات', 'toggle_notif'), Markup.button.callback('🔄 تبديل التلقائي', 'toggle_auto')],
            [Markup.button.callback('🔙 رجوع', 'back_home')]
        ])
    });
});

// ❓ تفعيل زر المساعدة
bot.action('help', (ctx) => {
    ctx.editMessageText(`❓ *دليل المساعدة يا بطل:*\n\n1. أضف سيرفرك عبر زر "إضافة سيرفر".\n2. اذهب إلى "سيرفراتي" واضغط تشغيل.\n3. سيقوم النظام تلقائياً بتفعيل Anti-AFK لحمايتك من الطرد.\n\n*ملاحظة:* تأكد من كتابة IP السيرفر بدون http.`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'back_home')]])
    });
});

// 🛡️ معالجة إضافة السيرفر وحماية الانهيار
bot.action('add_server', (ctx) => {
    ctx.session = { state: 'waiting_srv' };
    ctx.reply('📥 *أرسل البيانات بصيغة IP:PORT (مثال: example.me:19132)*');
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    if (ctx.session?.state === 'waiting_srv') {
        const input = ctx.message.text.trim();
        // حماية الانهيار: تنظيف العنوان فوراً
        const cleanHost = input.replace(/https?:\/\//, '').split('/')[0];
        
        if (cleanHost.includes(':')) {
            const [h, p] = cleanHost.split(':');
            let servers = db.get(`${userId}.servers`) || [];
            servers.push({ host: h.trim(), port: p.trim(), bot_name: "MaxBlack" });
            db.set(`${userId}.servers`, servers);
            ctx.session.state = null;
            ctx.reply('✅ *تم حفظ السيرفر بنجاح يا بطل!*', mainButtons);
        } else {
            ctx.reply("❌ تنسيق خاطئ! استخدم الصيغة التالية: `IP:PORT`", { parse_mode: 'Markdown' });
        }
    }
});

// 📁 إدارة وتشغيل السيرفرات مع Anti-AFK
bot.action('my_servers', (ctx) => {
    const servers = db.get(`${ctx.from.id}.servers`) || [];
    if (servers.length === 0) return ctx.answerCbQuery("❌ لا توجد سيرفرات!", { show_alert: true });
    
    const kb = servers.map((s, i) => [Markup.button.callback(`🌐 ${s.host}`, `manage_${i}`)]);
    kb.push([Markup.button.callback('🔙 رجوع', 'back_home')]);
    ctx.editMessageText('🎮 *اختر سيرفرك للتحكم به:*', Markup.inlineKeyboard(kb));
});

bot.action(/^manage_(\d+)$/, (ctx) => {
    const index = ctx.match[1];
    const s = db.get(`${ctx.from.id}.servers`)[index];
    const status = activeClients[ctx.from.id] ? "شغال ✅" : "متوقف 🔴";

    ctx.editMessageText(`📊 *تحكم بالسيرفر رقم ${parseInt(index)+1}*\n\n🌐 العنوان: \`${s.host}:${s.port}\`\n📊 الحالة: ${status}`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('▶️ تشغيل الاتصال', `start_${index}`)],
            [Markup.button.callback('🛑 إيقاف', `stop`), Markup.button.callback('🗑️ حذف', `del_${index}`)],
            [Markup.button.callback('🔙 رجوع لسيرفراتي', 'my_servers')]
        ])
    });
});

bot.action(/^start_(\d+)$/, async (ctx) => {
    const index = ctx.match[1];
    const userId = ctx.from.id;
    const s = db.get(`${userId}.servers`)[index];

    try {
        if (activeClients[userId]) activeClients[userId].close();
        
        activeClients[userId] = bedrock.createClient({
            host: s.host, port: parseInt(s.port), username: s.bot_name, offline: true, version: '1.21.130'
        });

        activeClients[userId].on('spawn', () => {
            ctx.reply(`✅ *بوتك دخل السيرفر الآن! تم تفعيل نظام Anti-AFK بنجاح.*`);
            
            // 🔄 نظام Anti-AFK
            afkIntervals[userId] = setInterval(() => {
                if (activeClients[userId]) {
                    activeClients[userId].queue('text', { type: 'chat', needs_translation: false, source_name: s.bot_name, xuid: '', platform_chat_id: '', message: '🛡️ Stay Online Protection' });
                }
            }, 50000);
        });

        activeClients[userId].on('error', (err) => {
            clearInterval(afkIntervals[userId]);
            delete activeClients[userId];
        });
    } catch (e) { ctx.reply("❌ فشل الاتصال، تأكد من البيانات."); }
});

bot.action('stop', (ctx) => {
    const userId = ctx.from.id;
    if (activeClients[userId]) {
        activeClients[userId].close();
        clearInterval(afkIntervals[userId]);
        delete activeClients[userId];
    }
    ctx.answerCbQuery("🔴 تم الإيقاف");
});

bot.action('back_home', (ctx) => ctx.editMessageText('👋 *قائمة التحكم الرئيسية:*', { parse_mode: 'Markdown', ...mainButtons }));

bot.launch();
console.log('🚀 نظام MaxBlack Pro المطور يعمل بكامل طاقته!');
