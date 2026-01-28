const { Telegraf } = require('telegraf');
const express = require('express');
const mineflayer = require('mineflayer');

// ⚠️ التوكن - غير هذا بعد التجربة
const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";

// 🔗 قنوات الاشتراك الإجباري (بدون @ في البداية)
const REQUIRED_CHANNELS = [
    "vsyfyk",      // قناة "مودات دينار"
    "N_NHGER",     // قناة "ترويج سيرفرات ماين كرافت"
    "sjxhhdbx72"   // قناة "مـْـْْـْمعٌـِـِِـِلُـِـِِـٍِمـْـْْـْآتٌـٌـي"
];

// ID المشرف (ضع ايديك هنا)
const ADMIN_ID = "ايديك_هنا";

// خادم ويب للحفاظ على التطبيق نشط
const app = express();
const PORT = process.env.PORT || 3000;

// صفحة ويب
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>بوت بيدروك | اشتراك إجباري</title>
            <style>
                body { font-family: Arial; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
                .container { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; max-width: 700px; margin: 0 auto; }
                h1 { margin-bottom: 30px; }
                .channel { background: rgba(255,255,255,0.15); margin: 10px 0; padding: 15px; border-radius: 8px; }
                .btn { background: #4CAF50; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 بوت بيدروك 24/7 مع اشتراك إجباري</h1>
                <div class="channel">
                    <h3>📢 القنوات المطلوبة:</h3>
                    <a href="https://t.me/vsyfyk" class="btn" target="_blank">1. قناة مودات دينار</a>
                    <a href="https://t.me/N_NHGER" class="btn" target="_blank">2. ترويج سيرفرات</a>
                    <a href="https://t.me/sjxhhdbx72" class="btn" target="_blank">3. قناة تعليمية</a>
                </div>
                <p>🕒 ${new Date().toLocaleString('ar-SA')}</p>
            </div>
        </body>
        </html>
    `);
});

// نقطة التحقق
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', channels: REQUIRED_CHANNELS, uptime: process.uptime() });
});

// بدء خادم الويب
app.listen(PORT, () => {
    console.log(`🌐 خادم ويب يعمل على ${PORT}`);
    console.log(`📢 القنوات المطلوبة: ${REQUIRED_CHANNELS.map(c => `@${c}`).join(', ')}`);
});

// تخزين البيانات
let userData = {};
let activeBots = {};
let bot = null;

// 🔍 دالة التحقق من الاشتراك (محسنة)
async function checkSubscription(userId) {
    const results = [];
    
    for (const channel of REQUIRED_CHANNELS) {
        try {
            const member = await bot.telegram.getChatMember(`@${channel}`, userId);
            const isMember = ['member', 'administrator', 'creator'].includes(member.status);
            
            results.push({
                channel: `@${channel}`,
                status: member.status,
                isMember: isMember,
                error: null
            });
            
        } catch (error) {
            console.error(`❌ خطأ في ${channel}:`, error.message);
            results.push({
                channel: `@${channel}`,
                status: 'error',
                isMember: false,
                error: error.message
            });
        }
        
        // تأخير بين الطلبات
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const allSubscribed = results.every(r => r.isMember);
    const missing = results.filter(r => !r.isMember).map(r => r.channel);
    
    return {
        subscribed: allSubscribed,
        details: results,
        missingChannels: missing
    };
}

// 🎯 دالة عرض طلب الاشتراك
function showSubscriptionRequired(ctx, missingChannels = []) {
    const buttons = REQUIRED_CHANNELS.map(channel => {
        const name = channel === 'vsyfyk' ? 'مودات دينار' :
                    channel === 'N_NHGER' ? 'ترويج سيرفرات' :
                    'قناة تعليمية';
        
        return [{
            text: `📍 ${name}`,
            url: `https://t.me/${channel}`
        }];
    });

    buttons.push([{ text: '✅ تحقق من الاشتراك', callback_data: 'check_subscription' }]);

    ctx.reply(`🔒 *اشتراك إجباري مطلوب*\n\nعزيزي ${ctx.from.first_name}، يجب الاشتراك في:\n\n${REQUIRED_CHANNELS.map((ch, i) => `${i+1}. @${ch}`).join('\n')}\n\n${missingChannels.length > 0 ? `❌ غير مشترك في: ${missingChannels.join(', ')}` : ''}`, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
    });
}

// 🎮 إنشاء بوت ماينكرافت
function createMinecraftBot(serverInfo, botNumber) {
    try {
        const mcBot = mineflayer.createBot({
            host: serverInfo.ip,
            port: serverInfo.port || 19132,
            username: `Bot${botNumber}_${Date.now()}`,
            version: serverInfo.version || '1.21.132',
            auth: 'offline'
        });

        mcBot.on('login', () => {
            console.log(`✅ ${mcBot.username} دخل ${serverInfo.name}`);
        });

        mcBot.on('spawn', () => {
            setInterval(() => {
                if (mcBot.entity) {
                    mcBot.setControlState('jump', true);
                    setTimeout(() => mcBot.setControlState('jump', false), 200);
                    mcBot.look(Math.random() * 360, 0);
                }
            }, 60000);
        });

        mcBot.on('end', () => {
            console.log(`🔌 ${mcBot.username} انقطع`);
            setTimeout(() => {
                // إعادة الاتصال إذا كان النظام نشط
                const serverId = serverInfo.id;
                if (activeBots[serverId]) {
                    const newBot = createMinecraftBot(serverInfo, botNumber);
                    if (newBot) {
                        const index = activeBots[serverId].findIndex(b => b === mcBot);
                        if (index > -1) activeBots[serverId][index] = newBot;
                    }
                }
            }, 15000);
        });

        mcBot.on('error', (err) => {
            console.log(`⚠️ خطأ: ${err.message}`);
        });

        return mcBot;
        
    } catch (err) {
        console.log('❌ فشل إنشاء بوت:', err.message);
        return null;
    }
}

// 🚀 تهيئة البوت مع كل المميزات
async function initializeBot() {
    try {
        bot = new Telegraf(TOKEN);
        
        // 🔧 Middleware للتحقق من الاشتراك قبل كل أمر (باستثناء أوامر محددة)
        bot.use(async (ctx, next) => {
            const allowedCommands = ['start', 'testme', 'check_subscription'];
            const command = ctx.message?.text?.split(' ')[0]?.replace('/', '') || '';
            
            if (allowedCommands.includes(command) || ctx.callbackQuery) {
                return next();
            }
            
            // التحقق من الاشتراك
            const subscription = await checkSubscription(ctx.from.id);
            
            if (!subscription.subscribed) {
                console.log(`❌ ${ctx.from.username || ctx.from.id} غير مشترك`);
                return showSubscriptionRequired(ctx, subscription.missingChannels);
            }
            
            return next();
        });

        // 🏁 أمر البداية
        bot.start(async (ctx) => {
            const subscription = await checkSubscription(ctx.from.id);
            
            if (!subscription.subscribed) {
                return showSubscriptionRequired(ctx, subscription.missingChannels);
            }
            
            // حفظ المستخدم
            const userId = ctx.from.id;
            if (!userData[userId]) {
                userData[userId] = {
                    name: ctx.from.first_name,
                    servers: [],
                    joined: new Date().toISOString()
                };
            }
            
            const keyboard = {
                reply_markup: {
                    keyboard: [
                        ['➕ أضف سيرفر', '▶️ تشغيل البوتات'],
                        ['📋 سيرفراتي', '⏹️ إيقاف البوتات'],
                        ['📊 الحالة', '🆘 المساعدة']
                    ],
                    resize_keyboard: true
                }
            };
            
            ctx.reply(`🎮 *مرحباً ${ctx.from.first_name}!*\n\n✅ تم التحقق من اشتراكاتك\n\n✨ *بوت بيدروك 24/7*\n\n👇 اختر من الأزرار:`, {
                parse_mode: 'Markdown',
                ...keyboard
            });
        });

        // 🔄 زر التحقق
        bot.action('check_subscription', async (ctx) => {
            await ctx.answerCbQuery('جاري التحقق...');
            
            const subscription = await checkSubscription(ctx.from.id);
            
            if (subscription.subscribed) {
                await ctx.editMessageText(`✅ *مبروك!*\n\nيمكنك الآن استخدام البوت.\n\nأرسل /start للبدء.`, {
                    parse_mode: 'Markdown'
                });
            } else {
                await ctx.editMessageText(`❌ *ما زلت غير مشترك*\n\nالقنوات المفقودة:\n${subscription.missingChannels.join('\n')}\n\n⚠️ تأكد من الانضمام ثم اضغط تحقق مرة أخرى`, {
                    parse_mode: 'Markdown'
                });
            }
        });

        // 🧪 أمر اختبار
        bot.command('testme', async (ctx) => {
            const subscription = await checkSubscription(ctx.from.id);
            
            let message = `🔍 *نتيجة فحص اشتراكاتك:*\n\n`;
            
            subscription.details.forEach((detail, i) => {
                message += `${i+1}. ${detail.channel}: ${detail.isMember ? '✅ مشترك' : '❌ غير مشترك'}\n`;
                message += `   الحالة: ${detail.status}\n\n`;
            });
            
            message += subscription.subscribed 
                ? '🎉 *أنت مشترك في جميع القنوات*'
                : `❌ *أنت غير مشترك في:*\n${subscription.missingChannels.join('\n')}`;
            
            ctx.reply(message, { parse_mode: 'Markdown' });
        });

        // ➕ إضافة سيرفر
        bot.hears('➕ أضف سيرفر', async (ctx) => {
            await ctx.reply(`📝 *أضف سيرفر بيدروك*\n\nأرسل: اسم السيرفر IP\n\nمثال:\nسيرفرنا play.example.com\n\nأو مع بورت:\nسيرفرنا play.example.com 19133`, {
                parse_mode: 'Markdown'
            });
            
            const userId = ctx.from.id;
            const handler = async (nextCtx) => {
                if (nextCtx.from.id === userId) {
                    const text = nextCtx.message.text;
                    
                    if (text.includes('أضف سيرفر') || text.includes('سيرفراتي') || 
                        text.includes('تشغيل') || text.includes('إيقاف')) {
                        bot.off('text', handler);
                        return;
                    }
                    
                    const parts = text.split(' ');
                    if (parts.length >= 2) {
                        const name = parts[0];
                        const ip = parts[1];
                        const port = parts[2] ? parseInt(parts[2]) : 19132;
                        
                        const server = {
                            id: Date.now(),
                            name: name,
                            ip: ip,
                            port: port,
                            version: '1.21.132',
                            added: new Date().toLocaleString()
                        };
                        
                        userData[userId].servers.push(server);
                        
                        await nextCtx.reply(`✅ *تمت الإضافة!*\n\n📛 ${name}\n🌐 ${ip}:${port}\n🎮 بيدروك 1.21.132\n\nاضغط "▶️ تشغيل البوتات"`, {
                            parse_mode: 'Markdown'
                        });
                        
                        bot.off('text', handler);
                    } else {
                        await nextCtx.reply('❌ الشكل غير صحيح\nمثال: سيرفرنا play.example.com');
                    }
                }
            };
            
            bot.on('text', handler);
        });

        // ▶️ تشغيل البوتات
        bot.hears('▶️ تشغيل البوتات', async (ctx) => {
            const userId = ctx.from.id;
            
            if (!userData[userId] || userData[userId].servers.length === 0) {
                await ctx.reply('❌ لا توجد سيرفرات، أضف سيرفر أولاً');
                return;
            }
            
            await ctx.reply('🚀 جاري تشغيل البوتات...');
            
            let totalBots = 0;
            for (const server of userData[userId].servers) {
                // إيقاف القديم
                if (activeBots[server.id]) {
                    activeBots[server.id].forEach(b => {
                        try { b.quit(); } catch {}
                    });
                }
                
                // إنشاء بوتين جديدين
                activeBots[server.id] = [];
                for (let i = 1; i <= 2; i++) {
                    const newBot = createMinecraftBot(server, i);
                    if (newBot) {
                        activeBots[server.id].push(newBot);
                        totalBots++;
                    }
                }
            }
            
            await ctx.reply(`✅ تم تشغيل ${totalBots} بوت\n\n🤖 البوتات تعمل الآن وتعيد الاتصال تلقائياً`, {
                parse_mode: 'Markdown'
            });
        });

        // 📋 سيرفراتي
        bot.hears('📋 سيرفراتي', async (ctx) => {
            const userId = ctx.from.id;
            
            if (!userData[userId] || userData[userId].servers.length === 0) {
                await ctx.reply('📭 لا توجد سيرفرات');
                return;
            }
            
            let message = `📋 *سيرفراتك (${userData[userId].servers.length})*\n\n`;
            
            userData[userId].servers.forEach((server, index) => {
                const botsCount = activeBots[server.id] ? activeBots[server.id].length : 0;
                message += `*${index + 1}. ${server.name}*\n🌐 ${server.ip}:${server.port}\n🤖 ${botsCount} بوت\n\n`;
            });
            
            await ctx.reply(message, { parse_mode: 'Markdown' });
        });

        // ⏹️ إيقاف البوتات
        bot.hears('⏹️ إيقاف البوتات', async (ctx) => {
            const userId = ctx.from.id;
            let stopped = 0;
            
            if (userData[userId]) {
                for (const server of userData[userId].servers) {
                    if (activeBots[server.id]) {
                        activeBots[server.id].forEach(bot => {
                            try { 
                                bot.quit();
                                stopped++;
                            } catch {}
                        });
                        delete activeBots[server.id];
                    }
                }
            }
            
            await ctx.reply(stopped > 0 ? `🛑 تم إيقاف ${stopped} بوت` : '⚠️ لا توجد بوتات نشطة');
        });

        // 📊 الحالة
        bot.hears('📊 الحالة', async (ctx) => {
            const totalBots = Object.values(activeBots).reduce((sum, bots) => sum + bots.length, 0);
            const totalUsers = Object.keys(userData).length;
            const activeServers = Object.keys(activeBots).length;
            
            await ctx.reply(`📊 *حالة النظام*\n\n👥 المستخدمون: ${totalUsers}\n🤖 البوتات: ${totalBots}\n🎮 السيرفرات النشطة: ${activeServers}\n📢 القنوات المطلوبة: ${REQUIRED_CHANNELS.length}\n🕒 وقت التشغيل: ${Math.floor(process.uptime() / 60)} دقيقة`, {
                parse_mode: 'Markdown'
            });
        });

        // 🆘 المساعدة
        bot.hears('🆘 المساعدة', async (ctx) => {
            await ctx.reply(`🆘 *المساعدة*\n\n🔒 *الاشتراك الإجباري:*\n1. انضم للقنوات المطلوبة\n2. اضغط تحقق من الاشتراك\n\n🎮 *استخدام البوت:*\n1. أضف سيرفر\n2. شغل البوتات\n3. البوتات تعمل 24/7\n\n📌 *ملاحظة:* البوتات تعيد الاتصال تلقائياً`, {
                parse_mode: 'Markdown'
            });
        });

        // 👑 أوامر المشرف
        bot.command('admin', async (ctx) => {
            if (ctx.from.id.toString() !== ADMIN_ID) {
                return ctx.reply('❌ للمشرف فقط');
            }
            
            let report = `👑 *تقرير المشرف*\n\n`;
            report += `👥 المستخدمون: ${Object.keys(userData).length}\n`;
            report += `🤖 البوتات النشطة: ${Object.values(activeBots).reduce((sum, bots) => sum + bots.length, 0)}\n`;
            report += `🎮 السيرفرات: ${Object.keys(userData).reduce((sum, id) => sum + userData[id].servers.length, 0)}\n\n`;
            
            report += `📢 *القنوات المطلوبة:*\n`;
            for (const channel of REQUIRED_CHANNELS) {
                report += `• @${channel}\n`;
            }
            
            await ctx.reply(report, { parse_mode: 'Markdown' });
        });

        // 🚀 تشغيل البوت
        await bot.launch();
        console.log('✅ بوت التلجرام يعمل بنجاح!');
        
        // إرسال إشعار للمشرف
        if (ADMIN_ID) {
            try {
                await bot.telegram.sendMessage(ADMIN_ID, 
                    `🚀 النظام يعمل!\n📢 القنوات: ${REQUIRED_CHANNELS.map(c => `@${c}`).join(', ')}`);
            } catch {}
        }
        
    } catch (error) {
        console.error('❌ فشل تشغيل البوت:', error.message);
        setTimeout(initializeBot, 30000);
    }
}

// بدء التشغيل
console.log('🚀 بدء نظام بيدروك مع كل المميزات...');
initializeBot();

// 🔁 فحص البوت
setInterval(() => {
    if (!bot) {
        console.log('🔄 إعادة تشغيل البوت...');
        initializeBot();
    }
}, 60000);

// 🛑 إغلاق نظيف
process.once('SIGINT', () => {
    console.log('\n🛑 إيقاف النظام...');
    
    // إيقاف جميع بوتات ماينكرافت
    for (const serverId in activeBots) {
        activeBots[serverId]?.forEach(b => {
            try { b.quit(); } catch {}
        });
    }
    
    if (bot) bot.stop();
    process.exit(0);
});

process.once('SIGTERM', () => {
    if (bot) bot.stop();
    process.exit(0);
});
