const { Telegraf } = require('telegraf');
const express = require('express');
const mineflayer = require('mineflayer');

// 🔐 توكن البوت (غير هذا!)
const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";

// 📢 قنوات الاشتراك الإجباري
const REQUIRED_CHANNELS = ["vsyfyk", "N_NHGER", "sjxhhdbx72"];

// 🌐 خادم ويب
const app = express();
const PORT = process.env.PORT || 3000;

// 🎨 صفحة ويب بتصميم حديث
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🚀 بوت بيدروك المتقدم</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                
                body {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    color: #fff;
                    min-height: 100vh;
                    padding: 20px;
                }
                
                .glass-container {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    max-width: 800px;
                    margin: 40px auto;
                    padding: 40px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    animation: fadeIn 0.8s ease-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                }
                
                .logo {
                    font-size: 48px;
                    margin-bottom: 15px;
                    color: #00d4ff;
                }
                
                h1 {
                    font-size: 2.5rem;
                    background: linear-gradient(90deg, #00d4ff, #0099ff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 10px;
                }
                
                .tagline {
                    color: #a0a0c0;
                    font-size: 1.2rem;
                    margin-bottom: 30px;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 30px 0;
                }
                
                .stat-card {
                    background: rgba(255, 255, 255, 0.07);
                    border-radius: 15px;
                    padding: 20px;
                    text-align: center;
                    border: 1px solid rgba(0, 212, 255, 0.1);
                    transition: transform 0.3s, border-color 0.3s;
                }
                
                .stat-card:hover {
                    transform: translateY(-5px);
                    border-color: #00d4ff;
                }
                
                .stat-icon {
                    font-size: 30px;
                    color: #00d4ff;
                    margin-bottom: 10px;
                }
                
                .stat-number {
                    font-size: 2rem;
                    font-weight: bold;
                    margin: 10px 0;
                }
                
                .stat-label {
                    color: #a0a0c0;
                    font-size: 0.9rem;
                }
                
                .channels-section {
                    background: rgba(0, 212, 255, 0.05);
                    border-radius: 15px;
                    padding: 25px;
                    margin: 30px 0;
                }
                
                .channel-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 10px 0;
                    transition: background 0.3s;
                }
                
                .channel-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .btn {
                    display: inline-block;
                    background: linear-gradient(90deg, #00d4ff, #0099ff);
                    color: white;
                    padding: 12px 25px;
                    border-radius: 50px;
                    text-decoration: none;
                    font-weight: bold;
                    transition: transform 0.3s, box-shadow 0.3s;
                    border: none;
                    cursor: pointer;
                }
                
                .btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 20px rgba(0, 212, 255, 0.3);
                }
                
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    color: #707090;
                    font-size: 0.9rem;
                }
                
                .badge {
                    display: inline-block;
                    background: rgba(0, 212, 255, 0.2);
                    color: #00d4ff;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    margin: 0 5px;
                }
                
                @media (max-width: 768px) {
                    .glass-container {
                        padding: 20px;
                        margin: 20px auto;
                    }
                    
                    h1 {
                        font-size: 2rem;
                    }
                    
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div class="glass-container">
                <div class="header">
                    <div class="logo">🤖</div>
                    <h1>بيدروك بوت المتقدم</h1>
                    <p class="tagline">نظام متكامل لإدارة سيرفرات ماينكرافت بيدروك</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">🚀</div>
                        <div class="stat-number">24/7</div>
                        <div class="stat-label">تشغيل مستمر</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🤖</div>
                        <div class="stat-number" id="botCount">0</div>
                        <div class="stat-label">بوت نشط</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🌐</div>
                        <div class="stat-number" id="serverCount">0</div>
                        <div class="stat-label">سيرفر مضاف</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-number">1.21.x</div>
                        <div class="stat-label">إصدار بيدروك</div>
                    </div>
                </div>
                
                <div class="channels-section">
                    <h3 style="margin-bottom: 20px; color: #00d4ff;">
                        <i class="fas fa-bell"></i> قنوات الاشتراك المطلوبة
                    </h3>
                    
                    <div class="channel-item">
                        <div>
                            <strong>مودات دينار</strong>
                            <div style="color: #a0a0c0; font-size: 0.9rem; margin-top: 5px;">
                                مودات ومسابقات حصرية
                            </div>
                        </div>
                        <a href="https://t.me/vsyfyk" class="btn" target="_blank">
                            <i class="fab fa-telegram"></i> انضم الآن
                        </a>
                    </div>
                    
                    <div class="channel-item">
                        <div>
                            <strong>ترويج سيرفرات</strong>
                            <div style="color: #a0a0c0; font-size: 0.9rem; margin-top: 5px;">
                                ترويج وشارك سيرفرك
                            </div>
                        </div>
                        <a href="https://t.me/N_NHGER" class="btn" target="_blank">
                            <i class="fab fa-telegram"></i> انضم الآن
                        </a>
                    </div>
                    
                    <div class="channel-item">
                        <div>
                            <strong>قناة تعليمية</strong>
                            <div style="color: #a0a0c0; font-size: 0.9rem; margin-top: 5px;">
                                شروحات ومعلومات تقنية
                            </div>
                        </div>
                        <a href="https://t.me/sjxhhdbx72" class="btn" target="_blank">
                            <i class="fab fa-telegram"></i> انضم الآن
                        </a>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 40px;">
                    <h3 style="margin-bottom: 20px; color: #fff;">كيفية البدء</h3>
                    <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin-bottom: 30px;">
                        <span class="badge">1. انضم للقنوات</span>
                        <span class="badge">2. افتح البوت</span>
                        <span class="badge">3. أضف سيرفر</span>
                        <span class="badge">4. شغل البوتات</span>
                    </div>
                    
                    <a href="https://t.me/your_bot_username" class="btn" style="padding: 15px 40px; font-size: 1.1rem;">
                        <i class="fab fa-telegram"></i> افتح البوت الآن
                    </a>
                </div>
                
                <div class="footer">
                    <p>© 2024 بيدروك بوت المتقدم | يعمل على تقنية Node.js و Telegram API</p>
                    <p style="margin-top: 10px;">
                        <span style="color: #00ff88;">🟢 حالة النظام: نشط</span> | 
                        <span id="uptime">وقت التشغيل: 0:00</span>
                    </p>
                </div>
            </div>
            
            <script>
                // تحديث الإحصائيات
                function updateStats() {
                    fetch('/api/stats')
                        .then(response => response.json())
                        .then(data => {
                            document.getElementById('botCount').textContent = data.activeBots || 0;
                            document.getElementById('serverCount').textContent = data.totalServers || 0;
                            document.getElementById('uptime').textContent = 'وقت التشغيل: ' + formatUptime(data.uptime || 0);
                        })
                        .catch(error => console.error('Error fetching stats:', error));
                }
                
                function formatUptime(seconds) {
                    const hours = Math.floor(seconds / 3600);
                    const minutes = Math.floor((seconds % 3600) / 60);
                    return `${hours}:${minutes.toString().padStart(2, '0')}`;
                }
                
                // تحديث أولي وتحديث كل 10 ثواني
                updateStats();
                setInterval(updateStats, 10000);
                
                // تأثيرات عند التمرير
                const cards = document.querySelectorAll('.stat-card');
                cards.forEach(card => {
                    card.addEventListener('mouseenter', () => {
                        card.style.transform = 'translateY(-5px)';
                    });
                    
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'translateY(0)';
                    });
                });
            </script>
        </body>
        </html>
    `);
});

// 📊 API للإحصائيات
app.get('/api/stats', (req, res) => {
    const totalBots = Object.values(activeBots).reduce((sum, bots) => sum + bots.length, 0);
    const totalServers = Object.values(userData).reduce((sum, user) => sum + user.servers.length, 0);
    const totalUsers = Object.keys(userData).length;
    
    res.json({
        activeBots: totalBots,
        totalServers: totalServers,
        totalUsers: totalUsers,
        uptime: process.uptime(),
        status: 'active',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🎨 واجهة الويب تعمل على: http://localhost:${PORT}`);
    console.log(`📊 API الإحصائيات: http://localhost:${PORT}/api/stats`);
});

// 🗃️ تخزين البيانات
let userData = {};
let activeBots = {};
let bot = null;

// 🔗 دالة إنشاء قوالب واجهة
function createModernInterface(userId, ctx = null) {
    const user = userData[userId];
    const servers = user?.servers || [];
    
    const interfaceData = {
        user: {
            name: ctx?.from?.first_name || user?.name || 'مستخدم',
            id: userId,
            serverCount: servers.length,
            botCount: servers.reduce((sum, s) => sum + (activeBots[s.id]?.length || 0), 0)
        },
        servers: servers.map(server => ({
            id: server.id,
            name: server.name,
            ip: server.ip,
            port: server.port,
            bots: activeBots[server.id]?.length || 0,
            status: activeBots[server.id]?.length > 0 ? 'نشط' : 'متوقف'
        })),
        stats: {
            totalBots: Object.values(activeBots).reduce((sum, bots) => sum + bots.length, 0),
            totalUsers: Object.keys(userData).length,
            uptime: process.uptime()
        }
    };
    
    return interfaceData;
}

// 🎨 عرض الواجهة الرئيسية
async function showMainDashboard(ctx) {
    const userId = ctx.from.id;
    const interfaceData = createModernInterface(userId, ctx);
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "➕ إضافة سيرفر", callback_data: "add_server" },
                    { text: "📋 سيرفراتي", callback_data: "my_servers" }
                ],
                [
                    { text: "🚀 البوتات النشطة", callback_data: "active_bots" },
                    { text: "⚡ إدارة سريعة", callback_data: "quick_manage" }
                ],
                [
                    { text: "📊 إحصائياتي", callback_data: "my_stats" },
                    { text: "🎮 تشغيل جميع", callback_data: "start_all" }
                ],
                [
                    { text: "🔧 الإعدادات", callback_data: "settings" },
                    { text: "🆘 المساعدة", callback_data: "help" }
                ]
            ]
        }
    };
    
    await ctx.reply(`
🎮 *لوحة التحكم - ${interfaceData.user.name}*

📊 *إحصائياتك الشخصية:*
┌─────────────────
│ 🤖 البوتات: ${interfaceData.user.botCount}
│ 🌐 السيرفرات: ${interfaceData.user.serverCount}
│ ⚡ الحالة: ${interfaceData.user.botCount > 0 ? 'نشط' : 'جاهز'}
└─────────────────

👇 *اختر من القائمة:*
    `, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// 🎯 نظام إضافة سيرفر بتصميم حديث
async function showAddServerWizard(ctx, step = 1, data = {}) {
    const userId = ctx.from.id;
    
    if (step === 1) {
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🌐 pedrock.net", callback_data: "wizard_choose_pedrock.net_19132" },
                        { text: "🎮 mc.pedrock.com", callback_data: "wizard_choose_mc.pedrock.com_19132" }
                    ],
                    [
                        { text: "⚡ play.example.com", callback_data: "wizard_choose_play.example.com_19132" },
                        { text: "🚀 server.mc", callback_data: "wizard_choose_server.mc_19132" }
                    ],
                    [
                        { text: "✏️ كتابة مخصص", callback_data: "wizard_custom" }
                    ],
                    [
                        { text: "🔙 رجوع", callback_data: "main_dashboard" }
                    ]
                ]
            }
        };
        
        await ctx.editMessageText(`
📝 *مرحباً في معالج إضافة السيرفر*

🔹 *الخطوة 1: اختر سيرفر*

👇 *سيرفرات مقترحة:*

أو اضغط "كتابة مخصص" لإدخال IP خاص بك

📌 *سيأخذك المعالج عبر 3 خطوات بسيطة*
        `, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    }
    else if (step === 2) {
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🚀 تشغيل 1 بوت", callback_data: `wizard_finish_${data.ip}_${data.port}_1` },
                        { text: "⚡ تشغيل 2 بوت", callback_data: `wizard_finish_${data.ip}_${data.port}_2` }
                    ],
                    [
                        { text: "🔧 إعدادات متقدمة", callback_data: `wizard_advanced_${data.ip}_${data.port}` },
                        { text: "➕ إضافة فقط", callback_data: `wizard_addonly_${data.ip}_${data.port}` }
                    ],
                    [
                        { text: "↩️ خطوة للخلف", callback_data: "add_server" }
                    ]
                ]
            }
        };
        
        await ctx.editMessageText(`
✅ *الخطوة 2: تأكيد الإضافة*

📋 *معلومات السيرفر:*
┌─────────────────
│ 🌐 IP: ${data.ip}
│ 🔌 البورت: ${data.port}
│ 🎮 الإصدار: 1.21.132
│ 🤖 الحالة: جاهز للإضافة
└─────────────────

👇 *اختر الإجراء المطلوب:*
        `, {
            parse_mode: 'Markdown',
            ...keyboard
        });
    }
}

// 🤖 إنشاء بوت مع واجهة محسنة
function createModernBot(ip, port, name, userId) {
    try {
        const botName = `Player_${name}_${Date.now().toString().slice(-6)}`;
        
        const mcBot = mineflayer.createBot({
            host: ip,
            port: port,
            username: botName,
            version: '1.21.132',
            auth: 'offline',
            viewDistance: 'tiny',
            colors: false
        });

        mcBot.on('login', () => {
            console.log(`🎮 ${botName} دخل ${ip}:${port}`);
        });

        mcBot.on('spawn', () => {
            console.log(`📍 ${botName} ظهر في العالم`);
            
            // نظام حركة ذكي
            setInterval(() => {
                if (mcBot.entity) {
                    // حركات متنوعة
                    const actions = [
                        () => { mcBot.setControlState('jump', true); setTimeout(() => mcBot.setControlState('jump', false), 300); },
                        () => { mcBot.look(Math.random() * 360, Math.random() * 20 - 10); },
                        () => { 
                            const directions = ['forward', 'back', 'left', 'right'];
                            const dir = directions[Math.floor(Math.random() * directions.length)];
                            mcBot.setControlState(dir, true);
                            setTimeout(() => mcBot.setControlState(dir, false), 800);
                        }
                    ];
                    
                    const action = actions[Math.floor(Math.random() * actions.length)];
                    action();
                }
            }, 45000); // كل 45 ثانية
        });

        mcBot.on('end', (reason) => {
            console.log(`🔌 ${botName} انقطع: ${reason || 'لا سبب'}`);
            
            // إعادة اتصال ذكية
            setTimeout(() => {
                if (Object.values(activeBots).flat().includes(mcBot)) {
                    console.log(`🔄 إعادة ${botName}...`);
                    const newBot = createModernBot(ip, port, name, userId);
                    
                    // استبدال البوت القديم
                    for (const serverId in activeBots) {
                        const index = activeBots[serverId].indexOf(mcBot);
                        if (index > -1 && newBot) {
                            activeBots[serverId][index] = newBot;
                            break;
                        }
                    }
                }
            }, 10000);
        });

        mcBot.on('error', (err) => {
            console.log(`⚠️ ${botName}: ${err.message}`);
        });

        return mcBot;
    } catch (err) {
        console.log(`❌ فشل إنشاء ${name}:`, err.message);
        return null;
    }
}

// 🚀 تهيئة البوت مع واجهة حديثة
async function initializeModernBot() {
    try {
        bot = new Telegraf(TOKEN);
        
        // 🌟 بداية النظام
        bot.start(async (ctx) => {
            const userId = ctx.from.id;
            
            // إنشاء حساب للمستخدم
            if (!userData[userId]) {
                userData[userId] = {
                    name: ctx.from.first_name,
                    username: ctx.from.username,
                    servers: [],
                    joined: new Date().toISOString(),
                    settings: {
                        autoReconnect: true,
                        defaultBots: 2,
                        theme: 'dark'
                    }
                };
            }
            
            // عرض شاشة الترحيب
            const welcomeKeyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🚀 ابدأ الآن", callback_data: "get_started" },
                            { text: "📺 مشاهدة الشرح", callback_data: "watch_tutorial" }
                        ],
                        [
                            { text: "🔗 قنواتنا", callback_data: "our_channels" },
                            { text: "⭐ المميزات", callback_data: "features" }
                        ]
                    ]
                }
            };
            
            await ctx.reply(`
✨ *مرحباً بك في بيدروك بوت المتقدم!*

🎮 *نظام متكامل لإدارة سيرفرات ماينكرافت بيدروك*

✅ *مميزات النظام:*
┌─────────────────
│ 🤖 بوتات ذكية 24/7
│ 🎨 واجهة حديثة وسهلة
│ 🔄 إعادة اتصال تلقائية
│ 📊 إحصائيات متقدمة
│ ⚡ أداء عالي السرعة
└─────────────────

👇 *اضغط "ابدأ الآن" للانتقال للوحة التحكم*
            `, {
                parse_mode: 'Markdown',
                ...welcomeKeyboard
            });
        });

        // 🎯 معالج الأزرار الرئيسي
        bot.action('get_started', async (ctx) => {
            await ctx.answerCbQuery();
            await showMainDashboard(ctx);
        });

        bot.action('main_dashboard', async (ctx) => {
            await ctx.answerCbQuery();
            await showMainDashboard(ctx);
        });

        // ➕ إضافة سيرفر
        bot.action('add_server', async (ctx) => {
            await ctx.answerCbQuery();
            await showAddServerWizard(ctx, 1);
        });

        // معالج السحار (Wizard)
        bot.action(/^wizard_choose_/, async (ctx) => {
            await ctx.answerCbQuery();
            const data = ctx.callbackQuery.data.replace('wizard_choose_', '');
            const [ip, port] = data.split('_');
            
            await showAddServerWizard(ctx, 2, { ip, port });
        });

        bot.action('wizard_custom', async (ctx) => {
            await ctx.answerCbQuery();
            await ctx.editMessageText(`
📝 *الكتابة المخصصة*

أرسل IP السيرفر:
🌐 *مثال:* play.myserver.com

أو مع البورت:
🌐 *مثال:* play.myserver.com 19133

✏️ *اكتب الآن:*
            `, { parse_mode: 'Markdown' });
            
            const userId = ctx.from.id;
            const handler = async (nextCtx) => {
                if (nextCtx.from.id === userId) {
                    const text = nextCtx.message.text.trim();
                    
                    if (text.startsWith('/')) {
                        bot.off('text', handler);
                        return;
                    }
                    
                    const parts = text.split(' ');
                    const ip = parts[0];
                    const port = parts[1] ? parseInt(parts[1]) : 19132;
                    
                    if (ip.includes('.')) {
                        await showAddServerWizard(nextCtx, 2, { ip, port });
                        bot.off('text', handler);
                    } else {
                        await nextCtx.reply('❌ IP غير صالح\nمثال صحيح: play.example.com');
                    }
                }
            };
            
            bot.on('text', handler);
        });

        // إنهاء المعالج
        bot.action(/^wizard_finish_/, async (ctx) => {
            await ctx.answerCbQuery('جاري الإضافة...');
            const data = ctx.callbackQuery.data.replace('wizard_finish_', '');
            const [ip, port, botCount] = data.split('_');
            
            const userId = ctx.from.id;
            if (!userData[userId]) userData[userId] = { servers: [] };
            
            // إضافة السيرفر
            const server = {
                id: Date.now(),
                name: `سيرفر ${ip.split('.')[0]}`,
                ip: ip,
                port: parseInt(port),
                added: new Date().toLocaleString('ar-SA'),
                status: 'active'
            };
            
            userData[userId].servers.push(server);
            
            // تشغيل البوتات
            const count = parseInt(botCount);
            activeBots[server.id] = [];
            
            for (let i = 1; i <= count; i++) {
                const mcBot = createModernBot(ip, port, `Bot${i}`, userId);
                if (mcBot) activeBots[server.id].push(mcBot);
            }
            
            // عرض نتيجة النجاح
            const successKeyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🎮 إدارة السيرفر", callback_data: `manage_${server.id}` },
                            { text: "➕ إضافة جديد", callback_data: "add_server" }
                        ],
                        [
                            { text: "📋 كل السيرفرات", callback_data: "my_servers" },
                            { text: "🏠 الرئيسية", callback_data: "main_dashboard" }
                        ]
                    ]
                }
            };
            
            await ctx.editMessageText(`
🎉 *تمت العملية بنجاح!*

✅ *تم إضافة السيرفر:*
┌─────────────────
│ 📛 الاسم: ${server.name}
│ 🌐 IP: ${ip}:${port}
│ 🤖 البوتات: ${count} بوت نشط
│ ⏰ الوقت: ${server.added}
└─────────────────

🚀 *البوتات تعمل الآن وتعيد الاتصال تلقائياً*

👇 *اختر الإجراء التالي:*
            `, {
                parse_mode: 'Markdown',
                ...successKeyboard
            });
        });

        // 📋 سيرفراتي
        bot.action('my_servers', async (ctx) => {
            await ctx.answerCbQuery();
            const userId = ctx.from.id;
            const servers = userData[userId]?.servers || [];
            
            if (servers.length === 0) {
                await ctx.editMessageText(`
📭 *لا توجد سيرفرات*

لم تقم بإضافة أي سيرفرات بعد.

👇 *لإضافة أول سيرفر:*`, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "➕ إضافة سيرفر الآن", callback_data: "add_server" }],
                            [{ text: "🔙 رجوع", callback_data: "main_dashboard" }]
                        ]
                    }
                });
                return;
            }
            
            // إنشاء أزرار السيرفرات
            const serverButtons = servers.map(server => {
                const botCount = activeBots[server.id]?.length || 0;
                const status = botCount > 0 ? '🟢' : '⚪';
                
                return [{
                    text: `${status} ${server.name} (${botCount} بوت)`,
                    callback_data: `server_${server.id}`
                }];
            });
            
            // أزرار التحكم
            serverButtons.push([
                { text: "➕ إضافة جديد", callback_data: "add_server" },
                { text: "🚀 تشغيل الكل", callback_data: "start_all" }
            ]);
            
            serverButtons.push([{ text: "🔙 رجوع", callback_data: "main_dashboard" }]);
            
            await ctx.editMessageText(`
📋 *سيرفراتك (${servers.length})*

${servers.map((server, i) => {
    const bots = activeBots[server.id]?.length || 0;
    const status = bots > 0 ? '🟢' : '⚪';
    return `${i+1}. ${status} ${server.name}\n   🌐 ${server.ip}:${server.port}\n   🤖 ${bots} بوت\n`;
}).join('\n')}

👇 *اختر سيرفر للإدارة:*
            `, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: serverButtons }
            });
        });

        // إدارة سيرفر معين
        bot.action(/^server_/, async (ctx) => {
            await ctx.answerCbQuery();
            const serverId = ctx.callbackQuery.data.split('_')[1];
            const userId = ctx.from.id;
            
            const servers = userData[userId]?.servers || [];
            const server = servers.find(s => s.id == serverId);
            
            if (!server) {
                await ctx.answerCbQuery('❌ السيرفر غير موجود', { show_alert: true });
                return;
            }
            
            const botCount = activeBots[server.id]?.length || 0;
            
            const serverKeyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: `🤖 ${botCount} بوت`, callback_data: `server_bots_${server.id}` },
                            { text: botCount > 0 ? "⏹️ إيقاف" : "▶️ تشغيل", 
                              callback_data: botCount > 0 ? `stop_${server.id}` : `start_${server.id}_2` }
                        ],
                        [
                            { text: "✏️ تعديل", callback_data: `edit_${server.id}` },
                            { text: "🗑️ حذف", callback_data: `delete_${server.id}` }
                        ],
                        [
                            { text: "📊 إحصائيات", callback_data: `stats_${server.id}` },
                            { text: "🔧 متقدم", callback_data: `advanced_${server.id}` }
                        ],
                        [
                            { text: "↩️ رجوع", callback_data: "my_servers" }
                        ]
                    ]
                }
            };
            
            await ctx.editMessageText(`
🎮 *إدارة السيرفر: ${server.name}*

📋 *المعلومات:*
┌─────────────────
│ 🌐 IP: ${server.ip}
│ 🔌 البورت: ${server.port}
│ 🤖 البوتات: ${botCount} نشط
│ 📅 مضاف: ${server.added}
│ ⚡ الحالة: ${botCount > 0 ? 'نشط' : 'متوقف'}
└─────────────────

👇 *خيارات التحكم:*
            `, {
                parse_mode: 'Markdown',
                ...serverKeyboard
            });
        });

        // تشغيل سيرفر
        bot.action(/^start_/, async (ctx) => {
            await ctx.answerCbQuery('جاري التشغيل...');
            const data = ctx.callbackQuery.data.split('_');
            const serverId = data[1];
            const count = data[2] ? parseInt(data[2]) : 2;
            
            const userId = ctx.from.id;
            const servers = userData[userId]?.servers || [];
            const server = servers.find(s => s.id == serverId);
            
            if (server) {
                // إيقاف القديم
                if (activeBots[server.id]) {
                    activeBots[server.id].forEach(b => b.quit());
                }
                
                // تشغيل جديد
                activeBots[server.id] = [];
                for (let i = 1; i <= count; i++) {
                    const mcBot = createModernBot(server.ip, server.port, `Bot${i}`, userId);
                    if (mcBot) activeBots[server.id].push(mcBot);
                }
                
                await ctx.answerCbQuery(`✅ تم تشغيل ${count} بوت`, { show_alert: true });
                
                // تحديث الرسالة
                const callbackData = `server_${server.id}`;
                ctx.callbackQuery.data = callbackData;
                await bot.action(callbackData)(ctx);
            }
        });

        // 🏁 تشغيل الكل
        bot.action('start_all', async (ctx) => {
            await ctx.answerCbQuery('جاري تشغيل جميع السيرفرات...');
            const userId = ctx.from.id;
            const servers = userData[userId]?.servers || [];
            
            let totalBots = 0;
            for (const server of servers) {
                if (!activeBots[server.id] || activeBots[server.id].length === 0) {
                    activeBots[server.id] = [];
                    for (let i = 1; i <= 2; i++) {
                        const mcBot = createModernBot(server.ip, server.port, `Bot${i}`, userId);
                        if (mcBot) {
                            activeBots[server.id].push(mcBot);
                            totalBots++;
                        }
                    }
                }
            }
            
            await ctx.answerCbQuery(`🚀 تم تشغيل ${totalBots} بوت جديد`, { show_alert: true });
            await showMainDashboard(ctx);
        });

        // 📊 إحصائياتي
        bot.action('my_stats', async (ctx) => {
            await ctx.answerCbQuery();
            const userId = ctx.from.id;
            const interfaceData = createModernInterface(userId, ctx);
            
            await ctx.editMessageText(`
📊 *إحصائياتك الشخصية*

🎮 *نظرة عامة:*
┌─────────────────
│ 👤 الاسم: ${interfaceData.user.name}
│ 📅 منذ: ${new Date(userData[userId]?.joined).toLocaleDateString('ar-SA')}
│ 🌐 السيرفرات: ${interfaceData.user.serverCount}
│ 🤖 البوتات: ${interfaceData.user.botCount}
└─────────────────

🏆 *النشاط:*
┌─────────────────
│ ⚡ بوتات نشطة: ${interfaceData.user.botCount}
│ 📈 النسبة: ${interfaceData.user.serverCount > 0 ? 
    Math.round((interfaceData.user.botCount / (interfaceData.user.serverCount * 2)) * 100) : 0}%
│ 🕒 وقت التشغيل: ${Math.floor(interfaceData.stats.uptime / 3600)} ساعة
└─────────────────

🌟 *مستمر في النمو!*
            `, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "🔄 تحديث", callback_data: "my_stats" }],
                        [{ text: "🔙 رجوع", callback_data: "main_dashboard" }]
                    ]
                }
            });
        });

        // 🔧 الإعدادات
        bot.action('settings', async (ctx) => {
            await ctx.answerCbQuery();
            const userId = ctx.from.id;
            const settings = userData[userId]?.settings || {};
            
            const settingsKeyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: settings.autoReconnect ? "✅ إعادة اتصال" : "❌ إعادة اتصال", 
                              callback_data: "toggle_autoreconnect" },
                            { text: `🤖 ${settings.defaultBots} بوت افتراضي`, 
                              callback_data: "change_default_bots" }
                        ],
                        [
                            { text: `🎨 ${settings.theme === 'dark' ? 'داكن' : 'فاتح'}`, 
                              callback_data: "toggle_theme" },
                            { text: "🔔 الإشعارات", callback_data: "notifications" }
                        ],
                        [
                            { text: "🗑️ حذف بياناتي", callback_data: "delete_data" },
                            { text: "📤 تصدير بيانات", callback_data: "export_data" }
                        ],
                        [
                            { text: "💾 حفظ", callback_data: "save_settings" },
                            { text: "🔙 رجوع", callback_data: "main_dashboard" }
                        ]
                    ]
                }
            };
            
            await ctx.editMessageText(`
🔧 *إعدادات حسابك*

⚙️ *التفضيلات الحالية:*
┌─────────────────
│ 🔄 إعادة اتصال: ${settings.autoReconnect ? 'مفعل' : 'معطل'}
│ 🤖 البوتات الافتراضية: ${settings.defaultBots}
│ 🎨 السمة: ${settings.theme === 'dark' ? 'داكن' : 'فاتح'}
│ 🔔 الإشعارات: ${settings.notifications ? 'مفعلة' : 'معطلة'}
└─────────────────

📌 *التغييرات تحفظ تلقائياً*

👇 *اختر الإعداد الذي تريد تعديله:*
            `, {
                parse_mode: 'Markdown',
                ...settingsKeyboard
            });
        });

        // 🆘 المساعدة
        bot.action('help', async (ctx) => {
            await ctx.answerCbQuery();
            
            await ctx.editMessageText(`
🆘 *مركز المساعدة*

❓ *كيفية الاستخدام:*
1. أضف سيرفر من "إضافة سيرفر"
2. شغل البوتات من "سيرفراتي"
3. البوتات تعمل تلقائياً 24/7

📌 *أوامر سريعة:*
┌─────────────────
│ /start - لوحة التحكم
│ /add - إضافة سيرفر سريع
│ /servers - سيرفراتي
│ /stats - إحصائياتي
└─────────────────

🔧 *الدعم الفني:*
• @vsyfyk - قناة المودات
• @N_NHGER - ترويج سيرفرات
• @sjxhhdbx72 - قناة تعليمية

💡 *نصائح:*
• يمكنك إضافة أكثر من سيرفر
• البوتات تعيد الاتصال تلقائياً
• النظام يعمل 24/7 بدون توقف
            `, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📺 فيديو الشرح", callback_data: "watch_tutorial" }],
                        [{ text: "❓ الأسئلة الشائعة", callback_data: "faq" }],
                        [{ text: "🔙 رجوع", callback_data: "main_dashboard" }]
                    ]
                }
            });
        });

        // 🚀 تشغيل البوت
        await bot.launch();
        console.log('✨ البوت يعمل بواجهة حديثة!');
        console.log('🎨 الواجهة: http://localhost:' + PORT);
        console.log('📱 أرسل /start في التلجرام للبدء');
        
    } catch (error) {
        console.error('❌ خطأ في التشغيل:', error.message);
        setTimeout(initializeModernBot, 10000);
    }
}

// 🏁 بدء النظام
console.log('🚀 بدء تشغيل النظام بواجهة حديثة...');
console.log('⏳ جاري التهيئة...');
initializeModernBot();

// 🔄 الحفاظ على النظام نشط
setInterval(() => {
    if (!bot) {
        console.log('🔄 إعادة تشغيل البوت...');
        initializeModernBot();
    }
}, 30000);

// 🛑 إغلاق نظيف
process.once('SIGINT', () => {
    console.log('\n🔴 إيقاف النظام...');
    
    // إيقاف جميع البوتات
    for (const serverId in activeBots) {
        activeBots[serverId]?.forEach(b => {
            try { b.quit(); } catch {}
        });
    }
    
    if (bot) bot.stop();
    console.log('✅ النظام متوقف');
    process.exit(0);
});
