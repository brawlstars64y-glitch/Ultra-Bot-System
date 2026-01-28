const { Telegraf } = require('telegraf');
const mineflayer = require('mineflayer');

// ⚠️ التوكن - غير هذا بعد التجربة
const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// تخزين البيانات
let userData = {};
let activeBots = {};

// 🎮 إنشاء بوت بسيط
function createSimpleBot(serverInfo, botNumber) {
    try {
        const botName = `Player${botNumber}`;
        
        const mcBot = mineflayer.createBot({
            host: serverInfo.ip,
            port: serverInfo.port || 19132,
            username: botName,
            version: serverInfo.version || '1.21.132',
            auth: 'offline'
        });

        mcBot.on('login', () => {
            console.log(`✅ ${botName} دخل السيرفر`);
        });

        mcBot.on('spawn', () => {
            console.log(`📍 ${botName} ظهر`);
            
            // حركة بسيطة كل دقيقة
            setInterval(() => {
                if (mcBot.entity) {
                    // قفزة بسيطة
                    mcBot.setControlState('jump', true);
                    setTimeout(() => mcBot.setControlState('jump', false), 200);
                    
                    // تحريك الرأس
                    mcBot.look(Math.random() * 360, 0);
                }
            }, 60000);
        });

        mcBot.on('end', () => {
            console.log(`🔌 ${botName} انقطع - إعادة...`);
            setTimeout(() => createSimpleBot(serverInfo, botNumber), 10000);
        });

        return { name: botName, instance: mcBot };
        
    } catch (err) {
        console.log('❌ فشل إنشاء بوت:', err.message);
        return null;
    }
}

// 🏠 القائمة الرئيسية البسيطة
function showMainMenu(ctx) {
    const keyboard = {
        reply_markup: {
            keyboard: [
                ['➕ أضف سيرفر', '📋 سيرفراتي'],
                ['▶️ تشغيل البوتات', '⏹️ إيقاف البوتات'],
                ['📊 الحالة', '🆘 المساعدة']
            ],
            resize_keyboard: true
        }
    };
    
    ctx.reply(`🎮 *مرحباً في نظام بيدروك البسيط*

📌 *كل ما تحتاجه:*
1. أضف سيرفر (اسم + IP)
2. اضغط تشغيل البوتات
3. البوتات ستبقى نشطة 24/7

👇 اختر من الأزرار:`, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// ➕ إضافة سيرفر بخطوة واحدة
bot.hears('➕ أضف سيرفر', async (ctx) => {
    await ctx.reply(`📝 *أضف سيرفر بكل سهولة*

أرسل لي معلومات السيرفر في رسالة واحدة:

📌 *مثال:*
سيرفر الإبداع play.pedrock.net

أو يمكنك إضافة البورت:
سيرفر البناء mc.example.com 19133

📢 *ببساطة:*
اكتب اسم السيرفر ثم IP

👇 أرسل الآن:`, {
        parse_mode: 'Markdown'
    });
    
    // استقبال السيرفر
    bot.on('text', async (nextCtx) => {
        const text = nextCtx.message.text.trim();
        const userId = nextCtx.from.id;
        
        if (text.includes('أضف سيرفر') || text.includes('سيرفراتي') || 
            text.includes('تشغيل') || text.includes('إيقاف') ||
            text.includes('الحالة') || text.includes('المساعدة')) {
            return; // تجاهل أوامر القائمة
        }
        
        // معالجة النص
        const parts = text.split(' ');
        
        if (parts.length >= 2) {
            const serverName = parts[0];
            const serverIP = parts[1];
            const serverPort = parts[2] ? parseInt(parts[2]) : 19132;
            
            // حفظ السيرفر
            if (!userData[userId]) {
                userData[userId] = {
                    name: nextCtx.from.first_name,
                    servers: []
                };
            }
            
            const serverInfo = {
                id: Date.now(),
                name: serverName,
                ip: serverIP,
                port: serverPort,
                version: '1.21.132',
                added: new Date().toLocaleString()
            };
            
            userData[userId].servers.push(serverInfo);
            
            // رد سريع
            await nextCtx.reply(`✅ *تمت الإضافة!*

📛 السيرفر: ${serverName}
🌐 IP: ${serverIP}:${serverPort}
🎮 الإصدار: بيدروك 1.21.132

الآن اضغط "▶️ تشغيل البوتات" لبدء التشغيل`, {
                parse_mode: 'Markdown'
            });
            
            // إظهار القائمة
            showMainMenu(nextCtx);
            
        } else {
            await nextCtx.reply('❌ *خطأ في التنسيق*

📌 أرسل بهذا الشكل:
اسم السيرفر IP

مثال:
سيرفرنا play.example.com', {
                parse_mode: 'Markdown'
            });
        }
    }, { once: true }); // مرة واحدة فقط
});

// 📋 عرض السيرفرات
bot.hears('📋 سيرفراتي', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!userData[userId] || userData[userId].servers.length === 0) {
        await ctx.reply('📭 *لا توجد سيرفرات*
        
اضغط "➕ أضف سيرفر" لإضافة أول سيرفر لك', {
            parse_mode: 'Markdown'
        });
        return;
    }
    
    let message = `📋 *سيرفراتك (${userData[userId].servers.length})*\n\n`;
    
    userData[userId].servers.forEach((server, index) => {
        const botStatus = activeBots[server.id] ? 
            `🤖 ${activeBots[server.id].length} بوت نشط` : 
            '🛑 بدون بوتات';
        
        message += `*${index + 1}. ${server.name}*
🌐 ${server.ip}:${server.port}
${botStatus}
⏰ ${server.added}\n\n`;
    });
    
    message += '\n📌 *للتحكم:* اضغط "▶️ تشغيل البوتات" أو "⏹️ إيقاف البوتات"';
    
    await ctx.reply(message, {
        parse_mode: 'Markdown'
    });
});

// ▶️ تشغيل البوتات لجميع السيرفرات
bot.hears('▶️ تشغيل البوتات', async (ctx) => {
    const userId = ctx.from.id;
    
    if (!userData[userId] || userData[userId].servers.length === 0) {
        await ctx.reply('❌ *لا توجد سيرفرات*
        
أضف سيرفر أولاً باستخدام "➕ أضف سيرفر"', {
            parse_mode: 'Markdown'
        });
        return;
    }
    
    await ctx.reply('🚀 *جاري تشغيل البوتات...*
    
⏳ سيتم تشغيل بوتين لكل سيرفر
🔄 قد يستغرق بضع ثوانٍ', {
        parse_mode: 'Markdown'
    });
    
    let totalBots = 0;
    let startedServers = 0;
    
    // تشغيل البوتات لكل سيرفر
    for (const server of userData[userId].servers) {
        // إيقاف أي بوتات قديمة
        if (activeBots[server.id]) {
            activeBots[server.id].forEach(bot => {
                try { bot.instance.quit(); } catch {}
            });
        }
        
        // إنشاء بوتين جديدين
        activeBots[server.id] = [];
        for (let i = 1; i <= 2; i++) {
            const newBot = createSimpleBot(server, i);
            if (newBot) {
                activeBots[server.id].push(newBot);
                totalBots++;
            }
        }
        
        if (activeBots[server.id].length > 0) {
            startedServers++;
        }
    }
    
    // النتيجة
    await ctx.reply(`✅ *تم التشغيل بنجاح!*

🎮 السيرفرات: ${startedServers}/${userData[userId].servers.length}
🤖 البوتات: ${totalBots} بوت نشط
⏰ الوقت: ${new Date().toLocaleTimeString()}

✅ البوتات تعمل الآن وستبقى نشطة 24/7 تلقائياً`, {
        parse_mode: 'Markdown'
    });
});

// ⏹️ إيقاف جميع البوتات
bot.hears('⏹️ إيقاف البوتات', async (ctx) => {
    const userId = ctx.from.id;
    
    let stoppedBots = 0;
    let stoppedServers = 0;
    
    // إيقاف جميع البوتات
    for (const serverId in activeBots) {
        if (activeBots[serverId].length > 0) {
            activeBots[serverId].forEach(bot => {
                try { 
                    bot.instance.quit();
                    stoppedBots++;
                } catch {}
            });
            activeBots[serverId] = [];
            stoppedServers++;
        }
    }
    
    if (stoppedBots > 0) {
        await ctx.reply(`🛑 *تم الإيقاف*

🤖 البوتات المتوقفة: ${stoppedBots}
🎮 السيرفرات: ${stoppedServers}
✅ تم إيقاف جميع البوتات`, {
            parse_mode: 'Markdown'
        });
    } else {
        await ctx.reply('ℹ️ *لا توجد بوتات نشطة*
        
اضغط "▶️ تشغيل البوتات" لبدء التشغيل', {
            parse_mode: 'Markdown'
        });
    }
});

// 📊 حالة النظام
bot.hears('📊 الحالة', async (ctx) => {
    const userId = ctx.from.id;
    
    let totalBots = 0;
    let activeServers = 0;
    
    for (const serverId in activeBots) {
        if (activeBots[serverId].length > 0) {
            totalBots += activeBots[serverId].length;
            activeServers++;
        }
    }
    
    const serverCount = userData[userId] ? userData[userId].servers.length : 0;
    
    await ctx.reply(`📊 *حالة النظام الحالية*

👤 المستخدم: ${ctx.from.first_name}
🎮 السيرفرات: ${serverCount}
🤖 البوتات النشطة: ${totalBots}
🌐 السيرفرات النشطة: ${activeServers}
🕒 الوقت: ${new Date().toLocaleTimeString()}

${totalBots > 0 ? '✅ النظام يعمل بشكل طبيعي' : '⚠️ لا توجد بوتات نشطة'}`, {
        parse_mode: 'Markdown'
    });
});

// 🆘 المساعدة
bot.hears('🆘 المساعدة', (ctx) => {
    ctx.reply(`🆘 *دليل استخدام سريع*

1. *➕ أضف سيرفر*
   - اكتب اسم السيرفر ثم IP
   - مثال: "سيرفري play.pedrock.net"

2. *▶️ تشغيل البوتات*
   - يشغل بوتين لكل سيرفر
   - يعمل تلقائياً 24/7

3. *⏹️ إيقاف البوتات*
   - يوقف جميع البوتات

4. *📋 سيرفراتي*
   - يعرض جميع سيرفراتك

📌 *ملاحظة:* البوتات تعمل على إصدار بيدروك 1.21.x`, {
        parse_mode: 'Markdown'
    });
});

// 🚀 أمر البدء
bot.start((ctx) => {
    const welcome = `🎮 *أهلاً بك ${ctx.from.first_name}!*

هذا النظام البسيط يحافظ على سيرفرات بيدروك نشطة 24/7 باستخدام بوتات وهمية.

📌 *ثلاث خطوات فقط:*
1. اضغط "➕ أضف سيرفر"
2. أرسل اسم السيرفر و IP
3. اضغط "▶️ تشغيل البوتات"

✅ *ومبروك!* سيرفرك سيبقى مفتوحاً دائماً.

👇 اختر من الأزرار بالأسفل:`;
    
    showMainMenu(ctx);
    
    setTimeout(() => {
        ctx.reply(welcome, { parse_mode: 'Markdown' });
    }, 500);
});

// 🏃‍♂️ تشغيل البوت
console.log('🚀 بدء نظام بيدروك البسيط...');
bot.launch()
    .then(() => {
        console.log('✅ النظام يعمل!');
        console.log('📌 أرسل /start في التلجرام للبدء');
    })
    .catch(err => {
        console.error('❌ خطأ:', err.message);
    });

// 🔧 إغلاق نظيف
process.once('SIGINT', () => {
    console.log('\n🛑 إيقاف النظام...');
    
    // إيقاف جميع البوتات
    for (const serverId in activeBots) {
        activeBots[serverId]?.forEach(bot => {
            try { bot.instance.quit(); } catch {}
        });
    }
    
    bot.stop('SIGINT');
    process.exit(0);
});
