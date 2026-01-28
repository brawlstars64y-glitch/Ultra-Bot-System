const { Telegraf } = require('telegraf');
const express = require('express');
const mineflayer = require('mineflayer');

// 🔐 التوكن من متغيرات البيئة (مهم!)
const TOKEN = process.env.TELEGRAM_TOKEN || "ضع_توكنك_هنا";

// 📢 قنوات الاشتراك الإجباري
const REQUIRED_CHANNELS = process.env.REQUIRED_CHANNELS ? 
    process.env.REQUIRED_CHANNELS.split(',') : 
    ["vsyfyk", "N_NHGER", "sjxhhdbx72"];

// 🌐 تهيئة Express
const app = express();
const PORT = process.env.PORT || 3000;

// 🛠️ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📊 مسار الصحة الرئيسي (مطلوب لـ Railway)
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Pedrock Minecraft Bot',
        uptime: process.uptime(),
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        channels: REQUIRED_CHANNELS
    });
});

// 🎨 واجهة ويب مبسطة
app.get('/dashboard', (req, res) => {
    const totalBots = Object.values(global.activeBots || {}).reduce((sum, bots) => sum + bots.length, 0);
    const totalServers = Object.values(global.userData || {}).reduce((sum, user) => sum + user.servers.length, 0);
    const totalUsers = Object.keys(global.userData || {}).length;
    
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>بيدروك بوت - يعمل على Railway</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    color: white;
                    margin: 0;
                    padding: 20px;
                    min-height: 100vh;
                }
                .container {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    text-align: center;
                    padding: 40px 0;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 60px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #00d4ff;
                    margin-bottom: 10px;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 40px 0;
                }
                .stat-card {
                    background: rgba(255, 255, 255, 0.07);
                    padding: 25px;
                    border-radius: 15px;
                    text-align: center;
                    border: 1px solid rgba(0, 212, 255, 0.1);
                }
                .stat-number {
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: #00d4ff;
                    margin: 10px 0;
                }
                .status-badge {
                    display: inline-block;
                    background: #00ff88;
                    color: #000;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-weight: bold;
                    margin-top: 10px;
                }
                .channels {
                    background: rgba(0, 212, 255, 0.05);
                    padding: 25px;
                    border-radius: 15px;
                    margin: 30px 0;
                }
                .channel-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.05);
                    margin: 10px 0;
                    border-radius: 10px;
                }
                .btn {
                    background: linear-gradient(90deg, #00d4ff, #0099ff);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 50px;
                    text-decoration: none;
                    font-weight: bold;
                    display: inline-block;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    color: #888;
                    font-size: 0.9rem;
                }
                @media (max-width: 768px) {
                    .stats { grid-template-columns: 1fr; }
                    .container { padding: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🤖</div>
                    <h1>بيدروك بوت المتقدم</h1>
                    <p>نظام إدارة سيرفرات ماينكرافت يعمل على Railway</p>
                    <div class="status-badge">🟢 نشط</div>
                </div>
                
                <div class="stats">
                    <div class="stat-card">
                        <div>🤖 البوتات النشطة</div>
                        <div class="stat-number">${totalBots}</div>
                    </div>
                    <div class="stat-card">
                        <div>🌐 السيرفرات</div>
                        <div class="stat-number">${totalServers}</div>
                    </div>
                    <div class="stat-card">
                        <div>👥 المستخدمين</div>
                        <div class="stat-number">${totalUsers}</div>
                    </div>
                    <div class="stat-card">
                        <div>⏰ وقت التشغيل</div>
                        <div class="stat-number">${Math.floor(process.uptime() / 3600)}h</div>
                    </div>
                </div>
                
                <div class="channels">
                    <h3 style="color: #00d4ff; margin-bottom: 20px;">📢 قنوات الاشتراك المطلوبة</h3>
                    ${REQUIRED_CHANNELS.map(channel => `
                        <div class="channel-item">
                            <div>
                                <strong>@${channel}</strong>
                                <div style="color: #aaa; font-size: 0.9rem;">انضم لاستخدام البوت</div>
                            </div>
                            <a href="https://t.me/${channel}" class="btn" target="_blank">انضم</a>
                        </div>
                    `).join('')}
                </div>
                
                <div style="text-align: center; margin: 40px 0;">
                    <h3>🚀 كيفية البدء</h3>
                    <p style="margin: 20px 0; line-height: 1.8;">
                        1. انضم للقنوات أعلاه<br>
                        2. افتح بوت التلجرام<br>
                        3. أرسل <strong>/start</strong><br>
                        4. ابدأ بإضافة سيرفراتك
                    </p>
                </div>
                
                <div class="footer">
                    <p>© 2024 بيدروك بوت | يعمل على <strong>Railway</strong></p>
                    <p style="margin-top: 10px;">النسخة 3.0.0 | وقت الخادم: ${new Date().toLocaleString('ar-SA')}</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// 📈 API للإحصائيات
app.get('/api/stats', (req, res) => {
    const stats = {
        activeBots: Object.values(global.activeBots || {}).reduce((sum, bots) => sum + bots.length, 0),
        totalServers: Object.values(global.userData || {}).reduce((sum, user) => sum + user.servers.length, 0),
        totalUsers: Object.keys(global.userData || {}).length,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        channels: REQUIRED_CHANNELS,
        timestamp: new Date().toISOString()
    };
    res.json(stats);
});

// ❤️ نقطة الصحة (مهمة لـ Railway)
app.get('/health', (req, res) => {
    const botStatus = global.bot ? 'connected' : 'disconnected';
    res.json({
        status: 'healthy',
        bot: botStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// 🔧 إعادة التشغيل (للمشرف)
app.post('/restart', (req, res) => {
    const auth = req.headers.authorization;
    if (auth !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.json({ message: 'Restarting bot...' });
    setTimeout(() => {
        console.log('🔄 إعادة تشغيل البوت...');
        process.exit(0);
    }, 1000);
});

// 🚀 تشغيل الخادم
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 الخادم يعمل على المنفذ: ${PORT}`);
    console.log(`🌐 رابط الواجهة: http://localhost:${PORT}`);
    console.log(`📊 رابط الإحصائيات: http://localhost:${PORT}/api/stats`);
    console.log(`❤️ رابط الصحة: http://localhost:${PORT}/health`);
    console.log(`📢 القنوات المطلوبة: ${REQUIRED_CHANNELS.map(c => `@${c}`).join(', ')}`);
});

// 🗃️ تهيئة التخزين العالمي
global.userData = {};
global.activeBots = {};
global.bot = null;

// 🔍 دالة التحقق من الاشتراك
async function checkSubscription(userId) {
    if (!global.bot) return { subscribed: false, details: [] };
    
    const results = [];
    for (const channel of REQUIRED_CHANNELS) {
        try {
            const member = await global.bot.telegram.getChatMember(`@${channel}`, userId);
            const isMember = ['member', 'administrator', 'creator'].includes(member.status);
            results.push({ channel: `@${channel}`, isMember, status: member.status });
            
            // تأخير بسيط لتجنب rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            console.error(`❌ خطأ في التحقق من @${channel}:`, error.message);
            results.push({ channel: `@${channel}`, isMember: false, status: 'error', error: error.message });
        }
    }
    
    const subscribed = results.every(r => r.isMember);
    const missing = results.filter(r => !r.isMember).map(r => r.channel);
    
    return { subscribed, details: results, missingChannels: missing };
}

// 🤖 إنشاء بوت ماينكرافت
function createMinecraftBot(ip, port, botName) {
    try {
        console.log(`🤖 جاري إنشاء بوت: ${botName} -> ${ip}:${port}`);
        
        const mcBot = mineflayer.createBot({
            host: ip,
            port: port || 19132,
            username: botName,
            version: '1.21.132',
            auth: 'offline',
            viewDistance: 'tiny',
            colors: false
        });

        mcBot.on('login', () => {
            console.log(`✅ ${botName} دخل السيرفر`);
        });

        mcBot.on('spawn', () => {
            console.log(`📍 ${botName} ظهر في العالم`);
            
            // حركات دورية بسيطة
            const interval = setInterval(() => {
                if (mcBot.entity) {
                    mcBot.setControlState('jump', true);
                    setTimeout(() => mcBot.setControlState('jump', false), 300);
                    mcBot.look(Math.random() * 360, 0);
                }
            }, 60000);
            
            // حفظ الـ interval للإيقاف لاحقاً
            mcBot._activityInterval = interval;
        });

        mcBot.on('end', (reason) => {
            console.log(`🔌 ${botName} انقطع: ${reason || 'لا سبب'}`);
            
            // تنظيف الـ interval
            if (mcBot._activityInterval) {
                clearInterval(mcBot._activityInterval);
            }
            
            // إعادة الاتصال بعد 30 ثانية
            setTimeout(() => {
                console.log(`🔄 محاولة إعادة ${botName}...`);
                const newBot = createMinecraftBot(ip, port, botName);
                
                // استبدال البوت في التخزين
                for (const serverId in global.activeBots) {
                    const index = global.activeBots[serverId]?.indexOf(mcBot);
                    if (index > -1 && newBot) {
                        global.activeBots[serverId][index] = newBot;
                        console.log(`✅ تمت إعادة ${botName}`);
                        break;
                    }
                }
            }, 30000);
        });

        mcBot.on('error', (err) => {
            console.log(`⚠️ ${botName}: ${err.message}`);
        });

        return mcBot;
        
    } catch (error) {
        console.error(`💥 فشل إنشاء ${botName}:`, error.message);
        return null;
    }
}

// 🎯 نظام البوت الرئيسي
async function initializeBot() {
    try {
        console.log('🤖 جاري تهيئة بوت التلجرام...');
        
        // التحقق من التوكن
        if (!TOKEN || TOKEN === "ضع_توكنك_هنا") {
            throw new Error('❌ التوكن غير موجود! أضف TELEGRAM_TOKEN في متغيرات البيئة');
        }
        
        global.bot = new Telegraf(TOKEN);
        
        // معالج الأخطاء
        global.bot.catch((err, ctx) => {
            console.error('❌ خطأ في البوت:', err.message);
            console.error('التفاصيل:', err.stack);
        });

        // 🏁 أمر البدء
        global.bot.start(async (ctx) => {
            try {
                console.log(`👤 مستخدم جديد: ${ctx.from.first_name} (${ctx.from.id})`);
                
                const userId = ctx.from.id.toString();
                
                // تهيئة بيانات المستخدم
                if (!global.userData[userId]) {
                    global.userData[userId] = {
                        name: ctx.from.first_name,
                        username: ctx.from.username,
                        servers: [],
                        joined: new Date().toISOString(),
                        lastActive: new Date().toISOString()
                    };
                }
                
                // التحقق من الاشتراك
                const subscription = await checkSubscription(userId);
                
                if (!subscription.subscribed) {
                    const buttons = REQUIRED_CHANNELS.map(channel => [{
                        text: `📍 @${channel}`,
                        url: `https://t.me/${channel}`
                    }]);
                    
                    buttons.push([{ text: '✅ تحقق من الاشتراك', callback_data: 'check_subscription' }]);
                    
                    await ctx.reply(`
🔒 *مطلوب اشتراك*

مرحباً ${ctx.from.first_name}!

للاستخدام يجب الاشتراك في القنوات التالية:

${REQUIRED_CHANNELS.map((ch, i) => `${i+1}. @${ch}`).join('\n')}

${subscription.missingChannels.length > 0 ? 
`\n❌ *غير مشترك في:*\n${subscription.missingChannels.join('\n')}` : ''}

👇 *انضم ثم اضغط تحقق:*
                    `.trim(), {
                        parse_mode: 'Markdown',
                        reply_markup: { inline_keyboard: buttons }
                    });
                    return;
                }
                
                // عرض القائمة الرئيسية
                const keyboard = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "➕ إضافة سيرفر", callback_data: "add_server" },
                                { text: "📋 سيرفراتي", callback_data: "my_servers" }
                            ],
                            [
                                { text: "🚀 تشغيل بوتات", callback_data: "start_bots" },
                                { text: "⏹️ إيقاف بوتات", callback_data: "stop_bots" }
                            ],
                            [
                                { text: "📊 الإحصائيات", callback_data: "stats" },
                                { text: "🆘 المساعدة", callback_data: "help" }
                            ]
                        ]
                    }
                };
                
                await ctx.reply(`
🎮 *مرحباً ${ctx.from.first_name}!*

✅ *تم التحقق من اشتراكاتك بنجاح*

✨ *بوت بيدروك المتقدم*
نظام إدارة سيرفرات ماينكرافت

👇 *اختر من القائمة:*
                `.trim(), {
                    parse_mode: 'Markdown',
                    ...keyboard
                });
                
            } catch (error) {
                console.error('❌ خطأ في /start:', error);
                await ctx.reply('❌ حدث خطأ، حاول مرة أخرى لاحقاً');
            }
        });

        // 🔄 تحقق من الاشتراك
        global.bot.action('check_subscription', async (ctx) => {
            await ctx.answerCbQuery('جاري التحقق...');
            const userId = ctx.from.id.toString();
            const subscription = await checkSubscription(userId);
            
            if (subscription.subscribed) {
                await ctx.editMessageText(`
✅ *مبروك!*

تم التحقق من اشتراكاتك بنجاح.

أرسل /start للبدء.
                `.trim(), { parse_mode: 'Markdown' });
            } else {
                await ctx.answerCbQuery('❌ ما زلت غير مشترك', { show_alert: true });
            }
        });

        // ➕ إضافة سيرفر
        global.bot.action('add_server', async (ctx) => {
            await ctx.answerCbQuery();
            
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🌐 pedrock.net", callback_data: "server_pedrock.net_19132" },
                            { text: "🎮 mc.example.com", callback_data: "server_mc.example.com_19132" }
                        ],
                        [
                            { text: "✏️ إدخال مخصص", callback_data: "custom_server" }
                        ],
                        [
                            { text: "🔙 رجوع", callback_data: "main_menu" }
                        ]
                    ]
                }
            };
            
            await ctx.editMessageText(`
📝 *إضافة سيرفر جديد*

👇 *اختر من القائمة:*

أو اضغط "إدخال مخصص" لكتابة IP خاص بك

💡 *مثال:* play.myserver.com
            `.trim(), {
                parse_mode: 'Markdown',
                ...keyboard
            });
        });

        // معالجة السيرفرات الجاهزة
        global.bot.action(/^server_/, async (ctx) => {
            await ctx.answerCbQuery();
            const data = ctx.callbackQuery.data.replace('server_', '');
            const [ip, port] = data.split('_');
            
            const userId = ctx.from.id.toString();
            if (!global.userData[userId]) return;
            
            // إضافة السيرفر
            const server = {
                id: Date.now(),
                name: `سيرفر ${ip.split('.')[0]}`,
                ip: ip,
                port: parseInt(port) || 19132,
                added: new Date().toLocaleString('ar-SA')
            };
            
            global.userData[userId].servers.push(server);
            
            // عرض خيارات
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "▶️ تشغيل بوت", callback_data: `start_${server.id}_1` },
                            { text: "▶️ تشغيل 2 بوت", callback_data: `start_${server.id}_2` }
                        ],
                        [
                            { text: "➕ إضافة آخر", callback_data: "add_server" },
                            { text: "📋 سيرفراتي", callback_data: "my_servers" }
                        ]
                    ]
                }
            };
            
            await ctx.editMessageText(`
✅ *تمت الإضافة بنجاح!*

📛 ${server.name}
🌐 ${ip}:${server.port}
🎮 الإصدار: 1.21.132

👇 *اختر الإجراء:*
            `.trim(), {
                parse_mode: 'Markdown',
                ...keyboard
            });
        });

        // إدخال مخصص
        global.bot.action('custom_server', async (ctx) => {
            await ctx.answerCbQuery();
            await ctx.editMessageText(`
✏️ *الإدخال المخصص*

أرسل IP السيرفر:

🌐 *مثال:* play.myserver.com

أو مع البورت:
🌐 *مثال:* play.myserver.com 19133

👇 *اكتب الآن:*
            `.trim(), { parse_mode: 'Markdown' });
            
            const userId = ctx.from.id.toString();
            const handler = async (nextCtx) => {
                if (nextCtx.from.id.toString() === userId) {
                    const text = nextCtx.message.text.trim();
                    
                    // تجاهل الأوامر
                    if (text.startsWith('/')) {
                        global.bot.off('text', handler);
                        return;
                    }
                    
                    const parts = text.split(' ');
                    const ip = parts[0];
                    const port = parts[1] ? parseInt(parts[1]) : 19132;
                    
                    if (ip.includes('.')) {
                        // إضافة السيرفر
                        const server = {
                            id: Date.now(),
                            name: `سيرفر ${ip.split('.')[0]}`,
                            ip: ip,
                            port: port,
                            added: new Date().toLocaleString('ar-SA')
                        };
                        
                        if (!global.userData[userId]) {
                            global.userData[userId] = { servers: [] };
                        }
                        
                        global.userData[userId].servers.push(server);
                        
                        await nextCtx.reply(`
✅ *تم!*

🎮 ${server.name}
🌐 ${ip}:${port}

يمكنك الآن تشغيل البوتات.
                        `.trim(), { parse_mode: 'Markdown' });
                        
                        global.bot.off('text', handler);
                    } else {
                        await nextCtx.reply('❌ IP غير صالح\nمثال: play.example.com');
                    }
                }
            };
            
            global.bot.on('text', handler);
        });

        // 📋 سيرفراتي
        global.bot.action('my_servers', async (ctx) => {
            await ctx.answerCbQuery();
            const userId = ctx.from.id.toString();
            const servers = global.userData[userId]?.servers || [];
            
            if (servers.length === 0) {
                await ctx.editMessageText(`
📭 *لا توجد سيرفرات*

لم تقم بإضافة أي سيرفرات بعد.

👇 *لإضافة أول سيرفر:*
                `.trim(), {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "➕ إضافة سيرفر", callback_data: "add_server" }]
                        ]
                    }
                });
                return;
            }
            
            let message = `📋 *سيرفراتك (${servers.length})*\n\n`;
            
            servers.forEach((server, index) => {
                const botCount = global.activeBots[server.id]?.length || 0;
                message += `*${index+1}. ${server.name}*\n`;
                message += `🌐 ${server.ip}:${server.port}\n`;
                message += `🤖 ${botCount} بوت نشط\n\n`;
            });
            
            const serverButtons = servers.map(server => {
                const botCount = global.activeBots[server.id]?.length || 0;
                return [{
                    text: `🎮 ${server.name} (${botCount})`,
                    callback_data: `manage_${server.id}`
                }];
            });
            
            serverButtons.push([{ text: "➕ إضافة جديد", callback_data: "add_server" }]);
            
            await ctx.editMessageText(message, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: serverButtons }
            });
        });

        // 🚀 تشغيل البوتات
        global.bot.action(/^start_/, async (ctx) => {
            await ctx.answerCbQuery('جاري التشغيل...');
            const data = ctx.callbackQuery.data.split('_');
            const serverId = data[1];
            const count = parseInt(data[2]) || 1;
            const userId = ctx.from.id.toString();
            
            const servers = global.userData[userId]?.servers || [];
            const server = servers.find(s => s.id == serverId);
            
            if (server) {
                // إيقاف البوتات القديمة
                if (global.activeBots[server.id]) {
                    global.activeBots[server.id].forEach(bot => {
                        try { bot.quit(); } catch {}
                    });
                }
                
                // تشغيل بوتات جديدة
                global.activeBots[server.id] = [];
                for (let i = 1; i <= count; i++) {
                    const botName = `Player${i}_${Date.now().toString().slice(-4)}`;
                    const mcBot = createMinecraftBot(server.ip, server.port, botName);
                    if (mcBot) {
                        global.activeBots[server.id].push(mcBot);
                    }
                }
                
                await ctx.answerCbQuery(`✅ تم تشغيل ${count} بوت`, { show_alert: true });
                
                // تحديث الرسالة
                setTimeout(() => {
                    ctx.callbackQuery.data = 'my_servers';
                    global.bot.action('my_servers')(ctx);
                }, 500);
            }
        });

        // 🛑 إيقاف جميع البوتات
        global.bot.action('stop_bots', async (ctx) => {
            await ctx.answerCbQuery('جاري الإيقاف...');
            const userId = ctx.from.id.toString();
            const servers = global.userData[userId]?.servers || [];
            
            let stopped = 0;
            servers.forEach(server => {
                if (global.activeBots[server.id]) {
                    global.activeBots[server.id].forEach(bot => {
                        try { 
                            bot.quit();
                            stopped++;
                        } catch {}
                    });
                    delete global.activeBots[server.id];
                }
            });
            
            await ctx.answerCbQuery(`🛑 أوقفت ${stopped} بوت`, { show_alert: true });
            
            // تحديث الرسالة
            setTimeout(() => {
                ctx.callbackQuery.data = 'my_servers';
                global.bot.action('my_servers')(ctx);
            }, 500);
        });

        // 📊 الإحصائيات
        global.bot.action('stats', async (ctx) => {
            await ctx.answerCbQuery();
            const userId = ctx.from.id.toString();
            const servers = global.userData[userId]?.servers || [];
            const totalBots = servers.reduce((sum, server) => sum + (global.activeBots[server.id]?.length || 0), 0);
            
            await ctx.editMessageText(`
📊 *إحصائيات حسابك*

👤 الاسم: ${ctx.from.first_name}
📅 منذ: ${new Date(global.userData[userId]?.joined).toLocaleDateString('ar-SA') || 'اليوم'}

📈 *النشاط:*
🌐 السيرفرات: ${servers.length}
🤖 البوتات النشطة: ${totalBots}
⚡ نسبة النشاط: ${servers.length > 0 ? Math.round((totalBots / (servers.length * 2)) * 100) : 0}%

🏆 *إحصائيات النظام:*
👥 إجمالي المستخدمين: ${Object.keys(global.userData).length}
🤖 إجمالي البوتات: ${Object.values(global.activeBots).reduce((sum, bots) => sum + bots.length, 0)}
⏰ وقت التشغيل: ${Math.floor(process.uptime() / 3600)} ساعة
            `.trim(), {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🔄 تحديث", callback_data: "stats" }],
                        [{ text: "🔙 رجوع", callback_data: "main_menu" }]
                    ]
                }
            });
        });

        // 🆘 المساعدة
        global.bot.action('help', async (ctx) => {
            await ctx.answerCbQuery();
            
            await ctx.editMessageText(`
🆘 *مركز المساعدة*

❓ *كيفية الاستخدام:*
1. انضم للقنوات المطلوبة
2. أرسل /start
3. أضف سيرفر
4. شغل البوتات

📌 *الأوامر السريعة:*
┌─────────────────
│ /start - لوحة التحكم
│ /add - إضافة سيرفر
│ /servers - سيرفراتي
│ /stats - إحصائياتي
└─────────────────

🔗 *القنوات المطلوبة:*
${REQUIRED_CHANNELS.map((ch, i) => `${i+1}. @${ch}`).join('\n')}

💡 *نصائح:*
• يمكنك إضافة أكثر من سيرفر
• البوتات تعيد الاتصال تلقائياً
• النظام يعمل 24/7 على Railway
            `.trim(), {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🔙 رجوع", callback_data: "main_menu" }]
                    ]
                }
            });
        });

        // 🔙 القائمة الرئيسية
        global.bot.action('main_menu', async (ctx) => {
            await ctx.answerCbQuery();
            ctx.callbackQuery.data = null;
            global.bot.start(ctx);
        });

        // 🚀 تشغيل بوتات للجميع
        global.bot.action('start_bots', async (ctx) => {
            await ctx.answerCbQuery('جاري التشغيل...');
            const userId = ctx.from.id.toString();
            const servers = global.userData[userId]?.servers || [];
            
            let totalBots = 0;
            servers.forEach(server => {
                if (!global.activeBots[server.id] || global.activeBots[server.id].length === 0) {
                    global.activeBots[server.id] = [];
                    for (let i = 1; i <= 2; i++) {
                        const botName = `Player${i}_${Date.now().toString().slice(-4)}`;
                        const mcBot = createMinecraftBot(server.ip, server.port, botName);
                        if (mcBot) {
                            global.activeBots[server.id].push(mcBot);
                            totalBots++;
                        }
                    }
                }
            });
            
            await ctx.answerCbQuery(`🚀 تم تشغيل ${totalBots} بوت`, { show_alert: true });
            
            // تحديث الرسالة
            setTimeout(() => {
                ctx.callbackQuery.data = 'my_servers';
                global.bot.action('my_servers')(ctx);
            }, 500);
        });

        // 🏁 تشغيل البوت
        await global.bot.launch({
            dropPendingUpdates: true,
            allowedUpdates: ['message', 'callback_query']
        });
        
        console.log('✅ بوت التلجرام يعمل بنجاح!');
        console.log('🤖 أرسل /start للبدء');
        
        // إرسال رسالة بدء التشغيل للمشرف
        if (process.env.ADMIN_ID) {
            try {
                await global.bot.telegram.sendMessage(process.env.ADMIN_ID, 
                    `🚀 النظام يعمل على Railway!\n\n` +
                    `📊 الحالة: نشط\n` +
                    `⏰ الوقت: ${new Date().toLocaleString('ar-SA')}\n` +
                    `🔗 الرابط: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'N/A'}\n` +
                    `📢 القنوات: ${REQUIRED_CHANNELS.map(c => `@${c}`).join(', ')}`
                );
            } catch (error) {
                console.log('⚠️ لم يتم إرسال إشعار المشرف:', error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ فشل تشغيل بوت التلجرام:', error.message);
        console.error('Stack:', error.stack);
        
        // إعادة المحاولة بعد 30 ثانية
        setTimeout(initializeBot, 30000);
    }
}

// 🏁 بدء التشغيل
console.log('🚀 بدء تشغيل نظام بيدروك لـ Railway...');
console.log('🔧 التحقق من التوكن:', TOKEN ? '✅ موجود' : '❌ مفقود');
console.log('📢 القنوات:', REQUIRED_CHANNELS);

// بدء البوت
setTimeout(initializeBot, 2000);

// 🔄 الحفاظ على النشاط
setInterval(() => {
    if (!global.bot) {
        console.log('🔄 إعادة تشغيل البوت...');
        initializeBot();
    }
    
    // تنظيف البوتات الميتة
    for (const serverId in global.activeBots) {
        global.activeBots[serverId] = global.activeBots[serverId].filter(bot => {
            try {
                return bot._client && bot._client.connected;
            } catch {
                return false;
            }
        });
    }
    
    // تحديث وقت النشاط للمستخدمين
    const now = new Date().toISOString();
    Object.keys(global.userData).forEach(userId => {
        if (global.userData[userId]) {
            global.userData[userId].lastActive = now;
        }
    });
    
}, 60000); // كل دقيقة

// 🛑 معالجة الإغلاق
process.on('SIGTERM', () => {
    console.log('🔴 إشارة SIGTERM - إيقاف النظام...');
    gracefulShutdown();
});

process.on('SIGINT', () => {
    console.log('🔴 إشارة SIGINT - إيقاف النظام...');
    gracefulShutdown();
});

process.on('uncaughtException', (error) => {
    console.error('🚨 خطأ غير متوقع:', error.message);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 وعد مرفوض غير معالج:', reason);
});

// 🔧 إيقاف نظيف
function gracefulShutdown() {
    console.log('⏳ جاري إيقاف جميع البوتات...');
    
    // إيقاف بوتات ماينكرافت
    for (const serverId in global.activeBots) {
        global.activeBots[serverId]?.forEach(bot => {
            try {
                if (bot._activityInterval) {
                    clearInterval(bot._activityInterval);
                }
                bot.quit();
            } catch {}
        });
    }
    
    // إيقاف بوت التلجرام
    if (global.bot) {
        global.bot.stop();
    }
    
    // إيقاف خادم الويب
    server.close(() => {
        console.log('✅ تم إيقاف النظام بنجاح');
        process.exit(0);
    });
    
    // وقت الانتظار القصوى
    setTimeout(() => {
        console.log('⚠️ إيقاف قسري...');
        process.exit(1);
    }, 10000);
}
