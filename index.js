const { Telegraf } = require('telegraf');
const express = require('express');
const mineflayer = require('mineflayer');

// ⚠️ استبدل التوكن هذا بعد التجربة
const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";

// 🔗 قنوات الاشتراك الإجباري (التي طلبتها)
const REQUIRED_CHANNELS = [
    "@vsyfyk",      // قناة "مودات دينار"
    "@N_NHGER",     // قناة "ترويج سيرفرات ماين كرافت"
    "@sjxhhdbx72"   // قناة "مـْـْْـْمعٌـِـِِـِلُـِـِِـٍِمـْـْْـْآتٌـٌـي"
];

// خادم ويب للحفاظ على التطبيق نشط على Railway
const app = express();
const PORT = process.env.PORT || 3000;

// صفحة رئيسية بسيطة
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>بوت بيدروك | اشتراك إجباري</title>
            <style>
                body { 
                    font-family: 'Arial', sans-serif; 
                    text-align: center; 
                    padding: 50px; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .container { 
                    background: rgba(255,255,255,0.1); 
                    padding: 30px; 
                    border-radius: 15px; 
                    max-width: 700px; 
                    margin: 0 auto; 
                    backdrop-filter: blur(10px);
                }
                h1 { margin-bottom: 30px; color: #fff; }
                .channel-list { 
                    background: rgba(0,0,0,0.3); 
                    padding: 20px; 
                    border-radius: 10px; 
                    margin: 20px 0; 
                    text-align: right;
                }
                .channel-item { 
                    background: rgba(255,255,255,0.15); 
                    margin: 10px 0; 
                    padding: 12px; 
                    border-radius: 8px; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                }
                .status { 
                    background: rgba(0,255,0,0.2); 
                    padding: 15px; 
                    border-radius: 10px; 
                    margin: 20px 0; 
                }
                .btn { 
                    background: #4CAF50; 
                    color: white; 
                    padding: 12px 25px; 
                    border: none; 
                    border-radius: 8px; 
                    text-decoration: none; 
                    display: inline-block; 
                    margin: 10px; 
                    font-size: 16px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 بوت بيدروك 24/7</h1>
                <div class="status">
                    <h2>✅ النظام يعمل بنجاح</h2>
                    <p>📅 ${new Date().toLocaleString('ar-SA')}</p>
                </div>
                
                <div class="channel-list">
                    <h3>📢 قنوات الاشتراك الإجباري:</h3>
                    <div class="channel-item">
                        <span>1. قناة مودات دينار</span>
                        <a href="https://t.me/vsyfyk" class="btn" target="_blank">انضم الآن</a>
                    </div>
                    <div class="channel-item">
                        <span>2. ترويج سيرفرات ماين كرافت</span>
                        <a href="https://t.me/N_NHGER" class="btn" target="_blank">انضم الآن</a>
                    </div>
                    <div class="channel-item">
                        <span>3. قناة تعليمية</span>
                        <a href="https://t.me/sjxhhdbx72" class="btn" target="_blank">انضم الآن</a>
                    </div>
                </div>
                
                <p style="margin-top: 30px; font-size: 18px;">
                    🔒 يجب الاشتراك في جميع القنوات أعلاه لاستخدام البوت
                </p>
            </div>
        </body>
        </html>
    `);
});

// نقطة للتحقق من الصحة
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        required_channels: REQUIRED_CHANNELS,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// بدء خادم الويب
app.listen(PORT, () => {
    console.log(`🌐 خادم الويب يعمل على المنفذ ${PORT}`);
    console.log(`📢 قنوات مطلوبة: ${REQUIRED_CHANNELS.join(', ')}`);
});

// تخزين البيانات
let userData = {};
let activeBots = {};
let bot = null;

// 🔍 دالة التحقق من اشتراك المستخدم في القنوات
async function checkChannelSubscription(userId) {
    try {
        const chatMemberPromises = REQUIRED_CHANNELS.map(channel => {
            return bot.telegram.getChatMember(channel.replace('@', ''), userId)
                .then(member => {
                    return {
                        channel: channel,
                        status: member.status,
                        isMember: ['member', 'administrator', 'creator'].includes(member.status)
                    };
                })
                .catch(error => {
                    console.log(`❌ خطأ في التحقق من ${channel}:`, error.message);
                    return {
                        channel: channel,
                        status: 'error',
                        isMember: false,
                        error: error.message
                    };
                });
        });

        const results = await Promise.all(chatMemberPromises);
        const allSubscribed = results.every(result => result.isMember);
        
        return {
            subscribed: allSubscribed,
            details: results,
            missingChannels: results.filter(r => !r.isMember).map(r => r.channel)
        };
        
    } catch (error) {
        console.error('❌ خطأ في التحقق من الاشتراكات:', error);
        return {
            subscribed: false,
            details: [],
            missingChannels: REQUIRED_CHANNELS,
            error: error.message
        };
    }
}

// 🎯 دالة عرض قنوات الاشتراك الإجباري
function showSubscriptionRequired(ctx, missingChannels = []) {
    const channelButtons = REQUIRED_CHANNELS.map(channel => {
        const channelName = channel === '@vsyfyk' ? 'مودات دينار' :
                          channel === '@N_NHGER' ? 'ترويج سيرفرات' :
                          'قناة تعليمية';
        
        return [{
            text: `📍 ${channelName}`,
            url: `https://t.me/${channel.replace('@', '')}`
        }];
    });

    channelButtons.push([{
        text: '✅ تحقق من الاشتراك',
        callback_data: 'check_subscription'
    }]);

    const message = `🔒 *اشتراك إجباري مطلوب*
    
عزيزي ${ctx.from.first_name}، يجب الاشتراك في القنوات التالية لاستخدام البوت:

${REQUIRED_CHANNELS.map((ch, i) => `${i+1}. ${ch}`).join('\n')}

${missingChannels.length > 0 ? `\n❌ *مازلت غير مشترك في:*\n${missingChannels.join('\n')}` : ''}

📌 *خطوات الاستخدام:*
1. انضم لجميع القنوات أعلاه
2. اضغط "تحقق من الاشتراك"
3. ابدأ باستخدام البوت

⚠️ *ملاحظة:* البوت سيتحقق تلقائياً عند كل استخدام`;

    ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: channelButtons
        }
    });
}

// 🚀 تهيئة البوت مع نظام الاشتراك
async function initializeBot() {
    try {
        bot = new Telegraf(TOKEN);
        
        // 🔧 middleware للتحقق من الاشتراك قبل كل أمر
        bot.use(async (ctx, next) => {
            // تجاهل أوامر معينة (لتفادي الحلقة اللانهائية)
            const allowedWithoutSub = ['start', 'check_subscription'];
            const command = ctx.message?.text?.split(' ')[0]?.replace('/', '') || '';
            
            if (allowedWithoutSub.includes(command)) {
                return next();
            }
            
            // التحقق من الاشتراك
            const subscription = await checkChannelSubscription(ctx.from.id);
            
            if (!subscription.subscribed) {
                console.log(`❌ ${ctx.from.username} غير مشترك في بعض القنوات`);
                return showSubscriptionRequired(ctx, subscription.missingChannels);
            }
            
            // إذا كان مشتركاً، استمر
            return next();
        });

        // 🏁 أمر البدء مع التحقق
        bot.start(async (ctx) => {
            const subscription = await checkChannelSubscription(ctx.from.id);
            
            if (!subscription.subscribed) {
                return showSubscriptionRequired(ctx, subscription.missingChannels);
            }
            
            // إذا كان مشتركاً، عرض القائمة الرئيسية
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
            
            await ctx.reply(`🎮 *مرحباً ${ctx.from.first_name}!*
            
✅ *تم التحقق من اشتراكاتك بنجاح*

✨ *نظام بيدروك 24/7 - يعمل على Railway*

👇 الآن يمكنك استخدام جميع مميزات البوت:`, {
                parse_mode: 'Markdown',
                ...keyboard
            });
        });

        // 🔄 تحقق من الاشتراك (زر callback)
        bot.action('check_subscription', async (ctx) => {
            await ctx.answerCbQuery('جاري التحقق...');
            
            const subscription = await checkChannelSubscription(ctx.from.id);
            
            if (subscription.subscribed) {
                await ctx.editMessageText(`✅ *مبروك!*
                
تم التحقق من اشتراكاتك بنجاح، يمكنك الآن استخدام البوت.

أرسل /start للبدء.`, {
                    parse_mode: 'Markdown'
                });
            } else {
                await showSubscriptionRequired(ctx, subscription.missingChannels);
            }
        });

        // ➕ إضافة سيرفر (يحتاج اشتراك)
        bot.hears('➕ أضف سيرفر', async (ctx) => {
            await ctx.reply(`📝 *أضف سيرفر بيدروك*
            
أرسل لي معلومات السيرفر:
📌 *الشكل:* اسم السيرفر IP

*مثال:* 
سيرفر الإبداع play.pedrock.net

👇 أرسل الآن:`, {
                parse_mode: 'Markdown'
            });
            
            // ... (كود إضافة السيرفر السابق - يبقى كما هو)
        });

        // ▶️ تشغيل البوتات (يحتاج اشتراك)
        bot.hears('▶️ تشغيل البوتات', async (ctx) => {
            // ... (كود تشغيل البوتات السابق - يبقى كما هو)
        });

        // 📋 سيرفراتي (يحتاج اشتراك)
        bot.hears('📋 سيرفراتي', async (ctx) => {
            // ... (كود عرض السيرفرات السابق - يبقى كما هو)
        });

        // ⏹️ إيقاف البوتات (يحتاج اشتراك)
        bot.hears('⏹️ إيقاف البوتات', async (ctx) => {
            // ... (كود إيقاف البوتات السابق - يبقى كما هو)
        });

        // 📊 الحالة (يحتاج اشتراك)
        bot.hears('📊 الحالة', async (ctx) => {
            const totalBots = Object.values(activeBots).reduce((sum, bots) => sum + bots.length, 0);
            const subscribedUsers = Object.keys(userData).length;
            
            await ctx.reply(`📊 *حالة النظام*
            
👥 المستخدمون: ${subscribedUsers}
🤖 البوتات النشطة: ${totalBots}
📢 القنوات المطلوبة: ${REQUIRED_CHANNELS.length}
🕒 وقت التشغيل: ${Math.floor(process.uptime() / 60)} دقيقة

✅ *نظام الاشتراك الإجباري يعمل*`, {
                parse_mode: 'Markdown'
            });
        });

        // 🆘 المساعدة (يحتاج اشتراك)
        bot.hears('🆘 المساعدة', async (ctx) => {
            await ctx.reply(`🆘 *المساعدة*
            
🔒 *نظام الاشتراك الإجباري:*
1. يجب الاشتراك في جميع القنوات المطلوبة
2. البوت يتحقق تلقائياً عند كل استخدام
3. إذا لم تكن مشتركاً، ستظهر لك رسالة طلب الاشتراك

🎮 *استخدام البوت:*
1. أضف سيرفر ← اكتب اسم و IP
2. تشغيل البوتات ← يشغل بوتين لكل سيرفر
3. إيقاف البوتات ← يوقف كل البوتات

📌 *ملاحظة:* البوت يعمل 24/7 على Railway`, {
                parse_mode: 'Markdown'
            });
        });

        // 🚀 بدء البوت
        await bot.launch();
        console.log('✅ بوت التلجرام يعمل بنجاح مع نظام الاشتراك الإجباري!');
        
        // إرسال رسالة بدء التشغيل للمشرف
        const adminId = process.env.ADMIN_ID;
        if (adminId) {
            try {
                await bot.telegram.sendMessage(adminId, 
                    `🚀 النظام يعمل مع الاشتراك الإجباري للقنوات:
${REQUIRED_CHANNELS.map(ch => `• ${ch}`).join('\n')}`);
            } catch {}
        }
        
    } catch (error) {
        console.error('❌ فشل تشغيل البوت:', error.message);
        setTimeout(initializeBot, 30000);
    }
}

// 🛠️ دالة لفحص مشتركي القنوات (للمشرف)
async function checkAllSubscriptions(ctx) {
    if (ctx.from.id.toString() !== process.env.ADMIN_ID) {
        return ctx.reply('❌ هذا الأمر للمشرف فقط');
    }
    
    const users = Object.keys(userData);
    let report = `📊 *تقرير المشتركين*\n\n`;
    report += `👥 إجمالي المستخدمين: ${users.length}\n\n`;
    
    let subscribedCount = 0;
    
    for (const userId of users) {
        try {
            const subscription = await checkChannelSubscription(userId);
            const username = userData[userId]?.name || userId;
            
            if (subscription.subscribed) {
                subscribedCount++;
                report += `✅ ${username} - مشترك في جميع القنوات\n`;
            } else {
                report += `❌ ${username} - غير مشترك في: ${subscription.missingChannels.join(', ')}\n`;
            }
        } catch (error) {
            report += `⚠️ ${userId} - خطأ في الفحص\n`;
        }
    }
    
    report += `\n📈 النسبة: ${subscribedCount}/${users.length} مشتركين`;
    
    await ctx.reply(report, { parse_mode: 'Markdown' });
}

// 🔄 إعادة تشغيل البوت إذا توقف
function keepBotAlive() {
    if (!bot) {
        console.log('🔄 محاولة تشغيل البوت...');
        initializeBot();
    }
}

// بدء التشغيل
console.log('🚀 بدء نظام بيدروك مع الاشتراك الإجباري...');
initializeBot();

// 🔁 فحص حالة البوت كل دقيقة
setInterval(() => {
    if (!bot) {
        console.log('⚠️ البوت غير نشط - إعادة التشغيل...');
        initializeBot();
    }
}, 60000);

// 🛑 معالجة إغلاق التطبيق
process.on('SIGINT', () => {
    console.log('\n🛑 إيقاف النظام...');
    
    // إيقاف جميع بوتات ماينكرافت
    for (const serverId in activeBots) {
        activeBots[serverId].forEach(b => {
            try { b.quit(); } catch {}
        });
    }
    
    // إيقاف بوت التلجرام
    if (bot) {
        bot.stop();
    }
    
    process.exit(0);
});
