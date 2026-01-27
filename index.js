const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const editJsonFile = require("edit-json-file");

let db = editJsonFile(`${__dirname}/database.json`, { autosave: true });
const tgBot = new Telegraf('8574351688:AAGoLUdUDDa3xxlDPVmma5wezaYQXZNBFuU');

// إعداد القنوات
const CHANNELS = [
    { id: '@minecrafmodss12', link: 'https://t.me/minecrafmodss12' },
    { id: '@aternosbot24', link: 'https://t.me/aternosbot24' }
];

let activeClients = {};

// دالة فحص الاشتراك في القناتين
async function checkAllSubscriptions(ctx) {
    for (const channel of CHANNELS) {
        try {
            const member = await ctx.telegram.getChatMember(channel.id, ctx.from.id);
            const status = ['member', 'administrator', 'creator'];
            if (!status.includes(member.status)) return false;
        } catch (e) {
            console.log(`خطأ فحص القناة ${channel.id}: ربما البوت ليس مسؤولاً.`);
            return false;
        }
    }
    return true;
}

// أزرار الاشتراك المزدوج
const subButtons = Markup.inlineKeyboard([
    [Markup.button.url('📢 القناة الأولى (Minecraft)', CHANNELS[0].link)],
    [Markup.button.url('📢 القناة الثانية (Updates)', CHANNELS[1].link)],
    [Markup.button.callback('✅ تم الاشتراك في القناتين', 'main_menu')]
]);

const mainButtons = (ctx) => Markup.inlineKeyboard([
    [Markup.button.callback('🎮 سـيـرفـراتـي المـحـفـوظـة', 'my_servers')],
    [Markup.button.callback('➕ إضـافـة سـيـرفـر جـديـد', 'add_server')],
    [Markup.button.callback('⚙️ إعـدادات الـنـظـام', 'settings')]
]);

// الأوامر الأساسية
tgBot.start(async (ctx) => {
    const isSubbed = await checkAllSubscriptions(ctx);
    if (isSubbed) {
        ctx.replyWithMarkdownV2(`👋 *أهلاً بك يا بطل في نظام MaxBlack*\n🚀 *سيرفراتك محمية بخصوصية تامة*`, mainButtons(ctx));
    } else {
        ctx.reply('⚠️ *عذراً عزيزي، يجب عليك الاشتراك في القناتين أدناه لتتمكن من استخدام البوت:*', { parse_mode: 'MarkdownV2', ...subButtons });
    }
});

tgBot.action('main_menu', async (ctx) => {
    if (await checkAllSubscriptions(ctx)) {
        ctx.editMessageText('🔮 *قـائـمـة الـتـحـكـم الـرئـيـسـيـة:*', { parse_mode: 'MarkdownV2', ...mainButtons(ctx) });
    } else {
        ctx.answerCbQuery('❌ لم تشترك في كلتا القناتين بعد!', { show_alert: true });
    }
});

tgBot.action('my_servers', async (ctx) => {
    if (!(await checkAllSubscriptions(ctx))) return;
    const userId = ctx.from.id;
    const h = db.get(`${userId}.host`);
    const p = db.get(`${userId}.port`);
    const name = db.get(`${userId}.bot_name`) || "MaxBlack";
    
    if (!h) return ctx.answerCbQuery("❌ أضف سيرفراً أولاً!", { show_alert: true });

    const panel = `
📊 *تـفـاصـيـل سـيـرفـرك الـخـاص:*
━━━━━━━━━━━━━━
🌐 *الـعـنـوان:* \`${h}\`
🔌 *الـبـورت:* \`${p}\`
🤖 *اسـم البـوت:* \`${name}\`
🎮 *الإصـدار:* \`1.21.130\`
━━━━━━━━━━━━━━`;

    ctx.editMessageText(panel, {
        parse_mode: 'MarkdownV2',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('▶️ تـشـغـيـل', 'start_bot'), Markup.button.callback('🛑 إيـقـاف', 'stop_bot')],
            [Markup.button.callback('🗑️ حـذف', 'delete_server'), Markup.button.callback('🔙 رجـوع', 'main_menu')]
        ])
    });
});

tgBot.on('text', async (ctx) => {
    if (!(await checkAllSubscriptions(ctx))) return;
    const userId = ctx.from.id;
    const msg = ctx.message.text;

    if (msg.includes(':')) {
        const [h, p] = msg.split(':');
        db.set(`${userId}.host`, h); db.set(`${userId}.port`, p);
        ctx.reply('✅ *تم حفظ بياناتك الخاصة بنجاح!*');
    } else if (!msg.startsWith('/')) {
        db.set(`${userId}.bot_name`, msg);
        ctx.reply(`✅ *تم تغيير اسم بوتك الخاص إلى:* ${msg}`);
    }
});

// ميزات التشغيل والإعدادات (نفس الكود السابق مع userId)
tgBot.action('settings', (ctx) => {
    ctx.editMessageText('⚙️ *الإعدادات:*', Markup.inlineKeyboard([[Markup.button.callback('🤖 تغيير الاسم', 'change_name')], [Markup.button.callback('🔙 رجوع', 'main_menu')]]));
});

tgBot.action('add_server', (ctx) => ctx.reply('📥 *أرسل البيانات (IP:PORT):*'));
tgBot.action('change_name', (ctx) => ctx.reply('📝 *أرسل اسم البوت الجديد:*'));

tgBot.action('start_bot', async (ctx) => {
    const userId = ctx.from.id;
    const h = db.get(`${userId}.host`); const p = db.get(`${userId}.port`);
    const name = db.get(`${userId}.bot_name`) || "MaxBlack";
    ctx.reply(`⏳ *جاري تشغيل بوتك [ ${name} ]...*`);
    if (activeClients[userId]) try { activeClients[userId].close(); } catch (e) {}
    activeClients[userId] = bedrock.createClient({ host: h, port: parseInt(p), username: name, offline: true, version: '1.21.130' });
    activeClients[userId].on('spawn', () => ctx.reply(`✅ *بوتك متصل الآن بنجاح!*`));
});

tgBot.action('stop_bot', (ctx) => {
    const userId = ctx.from.id;
    if (activeClients[userId]) { activeClients[userId].close(); delete activeClients[userId]; ctx.reply('🛑 *تم الإيقاف.*'); }
});

tgBot.action('delete_server', (ctx) => {
    db.unset(`${ctx.from.id}.host`); db.unset(`${ctx.from.id}.port`);
    ctx.reply('🗑️ *تم الحذف.*');
});

tgBot.launch();
console.log('🚀 نظام الاشتراك المزدوج والخصوصية يعمل الآن...');
