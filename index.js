const { Telegraf } = require('telegraf');
const express = require('express');
const mineflayer = require('mineflayer');

// ⚠️ التوكن
const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";

// 🔗 قنوات الاشتراك
const REQUIRED_CHANNELS = ["vsyfyk", "N_NHGER", "sjxhhdbx72"];

// خادم ويب
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('🤖 بوت بيدروك 24/7 يعمل بنجاح');
});
app.listen(PORT, () => console.log(`🌐 خادم ويب: ${PORT}`));

// تخزين
let userData = {};
let activeBots = {};
let bot = null;

// 🔍 تحقق من الاشتراك
async function checkSubscription(userId) {
    for (const channel of REQUIRED_CHANNELS) {
        try {
            const member = await bot.telegram.getChatMember(`@${channel}`, userId);
            if (!['member', 'administrator', 'creator'].includes(member.status)) {
                return false;
            }
        } catch {
            return false;
        }
    }
    return true;
}

// 🚀 إضافة سيرفر SUPER EASY
async function addServerEasy(ctx) {
    const userId = ctx.from.id;
    const username = ctx.from.first_name;
    
    // إنشاء لوحة أزرار للاختيار السريع
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🌐 pedrock.net", callback_data: "server_pedrock.net_19132" },
                    { text: "🎮 mc.pedrock.com", callback_data: "server_mc.pedrock.com_19132" }
                ],
                [
                    { text: "🚀 play.example.com", callback_data: "server_play.example.com_19132" },
                    { text: "⚡ server.mc", callback_data: "server_server.mc_19132" }
                ],
                [
                    { text: "➕ إضافة IP مخصص", callback_data: "custom_server" }
                ]
            ]
        }
    };
    
    await ctx.reply(`🎮 *أضف سيرفر بكل سهولة ${username}!*

👇 *اختر من القائمة الجاهزة:*

أو اضغط "إضافة IP مخصص" لكتابة IP خاص بك

📌 *مثال بسيط لو أردت الكتابة:* 
play.myserver.com`, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

// 🎮 إنشاء بوت ماينكرافت بسيط
function createSimpleBot(ip, port = 19132, botNumber = 1) {
    try {
        const mcBot = mineflayer.createBot({
            host: ip,
            port: port,
            username: `Player${botNumber}_${Date.now().toString().slice(-4)}`,
            version: '1.21.132',
            auth: 'offline'
        });

        mcBot.on('login', () => {
            console.log(`✅ ${mcBot.username} دخل ${ip}`);
        });

        mcBot.on('spawn', () => {
            // حركة بسيطة كل دقيقة
            setInterval(() => {
                if (mcBot.entity) {
                    mcBot.setControlState('jump', true);
                    setTimeout(() => mcBot.setControlState('jump', false), 300);
                }
            }, 60000);
        });

        return mcBot;
    } catch {
        return null;
    }
}

// 🏁 بدء البوت
async function initializeBot() {
    try {
        bot = new Telegraf(TOKEN);
        
        // 🔧 Middleware للاشتراك
        bot.use(async (ctx, next) => {
            const allowed = ['start', 'easy', 'add'];
            const command = ctx.message?.text?.split(' ')[0]?.replace('/', '') || '';
            
            if (allowed.includes(command) || ctx.callbackQuery) {
                return next();
            }
            
            const isSubscribed = await checkSubscription(ctx.from.id);
            if (!isSubscribed) {
                const buttons = REQUIRED_CHANNELS.map(ch => [{
                    text: `📍 انضم @${ch}`,
                    url: `https://t.me/${ch}`
                }]);
                
                await ctx.reply(`🔒 *يجب الاشتراك في القنوات أولاً*\n\nانضم ثم أرسل /start`, {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: buttons }
                });
                return;
            }
            
            return next();
        });

        // 🎯 الأمر السهل الجديد
        bot.command(['start', 'easy', 'add'], async (ctx) => {
            const isSubscribed = await checkSubscription(ctx.from.id);
            
            if (!isSubscribed) {
                const buttons = REQUIRED_CHANNELS.map(ch => [{
                    text: `📍 @${ch}`,
                    url: `https://t.me/${ch}`
                }]);
                buttons.push([{ text: '✅ تحقق', callback_data: 'check_sub' }]);
                
                await ctx.reply(`🔒 *أولاً: انضم للقنوات*\n\n1. @vsyfyk\n2. @N_NHGER\n3. @sjxhhdbx72\n\nانضم ثم اضغط تحقق`, {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: buttons }
                });
                return;
            }
            
            // إذا كان مشتركاً، عرض نظام الإضافة السهل
            await addServerEasy(ctx);
        });

        // 📱 معالجة الأزرار
        // زر التحقق
        bot.action('check_sub', async (ctx) => {
            await ctx.answerCbQuery();
            const isSubscribed = await checkSubscription(ctx.from.id);
            
            if (isSubscribed) {
                await ctx.editMessageText(`✅ *مبروك! يمكنك الآن إضافة سيرفر*\n\nاضغط /easy للبدء`);
                await addServerEasy(ctx);
            } else {
                await ctx.answerCbQuery('❌ ما زلت غير مشترك', { show_alert: true });
            }
        });

        // اختيار سيرفر جاهز
        bot.action(/^server_/, async (ctx) => {
            await ctx.answerCbQuery();
            const data = ctx.callbackQuery.data;
            const parts = data.split('_');
            const ip = parts[1];
            const port = parts[2] || 19132;
            
            const userId = ctx.from.id;
            if (!userData[userId]) {
                userData[userId] = {
                    name: ctx.from.first_name,
                    servers: []
                };
            }
            
            // إضافة السيرفر
            const server = {
                id: Date.now(),
                name: `سيرفر ${ip.split('.')[0]}`,
                ip: ip,
                port: parseInt(port),
                added: new Date().toLocaleTimeString()
            };
            
            userData[userId].servers.push(server);
            
            // عرض خيارات مباشرة
            const actionKeyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "▶️ تشغيل بوت", callback_data: `startbot_${server.id}_1` },
                            { text: "▶️ تشغيل 2 بوت", callback_data: `startbot_${server.id}_2` }
                        ],
                        [
                            { text: "➕ إضافة سيرفر آخر", callback_data: "add_another" },
                            { text: "📋 سيرفراتي", callback_data: "my_servers" }
                        ]
                    ]
                }
            };
            
            await ctx.reply(`✅ *تمت الإضافة بنجاح!*\n\n📛 ${server.name}\n🌐 ${ip}:${port}\n\n👇 *ماذا تريد الآن؟*`, {
                parse_mode: 'Markdown',
                ...actionKeyboard
            });
        });

        // إضافة IP مخصص
        bot.action('custom_server', async (ctx) => {
            await ctx.answerCbQuery();
            await ctx.reply(`📝 *أرسل لي IP السيرفر فقط:*\n\nمثال:\nplay.myserver.com\n\nأو مع بورت:\nplay.myserver.com 19133\n\nاكتب الآن:`);
            
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
                        // إضافة السيرفر
                        if (!userData[userId]) {
                            userData[userId] = { servers: [] };
                        }
                        
                        const server = {
                            id: Date.now(),
                            name: `سيرفر ${ip.split('.')[0]}`,
                            ip: ip,
                            port: port,
                            added: new Date().toLocaleTimeString()
                        };
                        
                        userData[userId].servers.push(server);
                        
                        // خيارات سريعة
                        const quickActions = {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: "⚡ تشغيل بوت سريع", callback_data: `quickstart_${server.id}` },
                                        { text: "➕ إضافة آخر", callback_data: "add_another" }
                                    ]
                                ]
                            }
                        };
                        
                        await nextCtx.reply(`🎉 *تم!*\n\n✅ ${ip}:${port}\n\nالبوت جاهز للتشغيل!`, {
                            parse_mode: 'Markdown',
                            ...quickActions
                        });
                        
                        bot.off('text', handler);
                    } else {
                        await nextCtx.reply('❌ IP غير صالح\nمثال: play.example.com');
                    }
                }
            };
            
            bot.on('text', handler);
        });

        // تشغيل بوت سريع
        bot.action(/^quickstart_/, async (ctx) => {
            await ctx.answerCbQuery('جاري التشغيل...');
            const serverId = ctx.callbackQuery.data.split('_')[1];
            const userId = ctx.from.id;
            
            const userServers = userData[userId]?.servers || [];
            const server = userServers.find(s => s.id == serverId);
            
            if (server) {
                // تشغيل بوت واحد
                const mcBot = createSimpleBot(server.ip, server.port, 1);
                if (mcBot) {
                    if (!activeBots[serverId]) activeBots[serverId] = [];
                    activeBots[serverId].push(mcBot);
                    
                    await ctx.reply(`🚀 *بدأ البوت باللعب!*\n\n✅ ${server.ip}\n🤖 بوت واحد نشط\n\n📌 سيبقى نشطاً 24/7 تلقائياً`);
                }
            }
        });

        // تشغيل بوتات
        bot.action(/^startbot_/, async (ctx) => {
            await ctx.answerCbQuery();
            const parts = ctx.callbackQuery.data.split('_');
            const serverId = parts[1];
            const count = parseInt(parts[2]) || 1;
            const userId = ctx.from.id;
            
            const userServers = userData[userId]?.servers || [];
            const server = userServers.find(s => s.id == serverId);
            
            if (server) {
                // إيقاف القديم
                if (activeBots[serverId]) {
                    activeBots[serverId].forEach(b => b.quit());
                }
                
                // تشغيل جديد
                activeBots[serverId] = [];
                for (let i = 0; i < count; i++) {
                    const mcBot = createSimpleBot(server.ip, server.port, i+1);
                    if (mcBot) activeBots[serverId].push(mcBot);
                }
                
                await ctx.reply(`✅ *${count} بوت يعملون الآن!*\n\n🎮 ${server.name}\n🌐 ${server.ip}:${server.port}\n🤖 ${count} لاعب نشط\n\n⏰ يعملون 24/7`);
            }
        });

        // إضافة سيرفر آخر
        bot.action('add_another', async (ctx) => {
            await ctx.answerCbQuery();
            await addServerEasy(ctx);
        });

        // سيرفراتي
        bot.action('my_servers', async (ctx) => {
            await ctx.answerCbQuery();
            const userId = ctx.from.id;
            const servers = userData[userId]?.servers || [];
            
            if (servers.length === 0) {
                await ctx.reply('📭 *لا توجد سيرفرات*\n\nاضغط /easy لإضافة أول سيرفر');
                return;
            }
            
            let message = `📋 *سيرفراتك (${servers.length})*\n\n`;
            
            servers.forEach((server, index) => {
                const botsCount = activeBots[server.id]?.length || 0;
                message += `*${index+1}. ${server.name}*\n`;
                message += `🌐 ${server.ip}:${server.port}\n`;
                message += `🤖 ${botsCount} بوت نشط\n`;
                message += `⏰ ${server.added}\n\n`;
            });
            
            const serverButtons = servers.map((server, index) => {
                return [{
                    text: `▶️ ${server.name}`,
                    callback_data: `startbot_${server.id}_1`
                }];
            });
            
            serverButtons.push([{ text: "➕ إضافة جديد", callback_data: "add_another" }]);
            
            await ctx.reply(message, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: serverButtons }
            });
        });

        // 🎮 أوامر نصية سهلة
        bot.hears(['سيرفراتي', 'سيرفرات'], async (ctx) => {
            const userId = ctx.from.id;
            const servers = userData[userId]?.servers || [];
            
            if (servers.length === 0) {
                await ctx.reply('📭 لا توجد سيرفرات\nاكتب /easy لإضافة سيرفر');
                return;
            }
            
            let message = `📋 لديك ${servers.length} سيرفر:\n\n`;
            servers.forEach((s, i) => {
                message += `${i+1}. ${s.name} (${s.ip})\n`;
            });
            
            await ctx.reply(message);
        });

        bot.hears(['شغل', 'تشغيل', 'ابدأ'], async (ctx) => {
            const userId = ctx.from.id;
            const servers = userData[userId]?.servers || [];
            
            if (servers.length === 0) {
                await ctx.reply('❌ أضف سيرفر أولاً بـ /easy');
                return;
            }
            
            if (servers.length === 1) {
                // إذا كان سيرفر واحد فقط، شغله مباشرة
                const server = servers[0];
                const mcBot = createSimpleBot(server.ip, server.port, 1);
                if (mcBot) {
                    if (!activeBots[server.id]) activeBots[server.id] = [];
                    activeBots[server.id].push(mcBot);
                    await ctx.reply(`🚀 بدأ البوت باللعب في ${server.ip}!`);
                }
            } else {
                // إذا كان أكثر من سيرفر، عرض قائمة للاختيار
                const buttons = servers.map(server => {
                    return [{
                        text: `▶️ ${server.name}`,
                        callback_data: `startbot_${server.id}_1`
                    }];
                });
                
                await ctx.reply(`📱 *اختر سيرفر للتشغيل:*\n\nلديك ${servers.length} سيرفر`, {
                    parse_mode: 'Markdown',
                    reply_markup: { inline_keyboard: buttons }
                });
            }
        });

        bot.hears(['توقف', 'اوقف', 'stop'], async (ctx) => {
            const userId = ctx.from.id;
            const servers = userData[userId]?.servers || [];
            
            let stopped = 0;
            servers.forEach(server => {
                if (activeBots[server.id]) {
                    activeBots[server.id].forEach(b => {
                        try { b.quit(); stopped++; } catch {}
                    });
                    delete activeBots[server.id];
                }
            });
            
            await ctx.reply(stopped > 0 ? `🛑 أوقفت ${stopped} بوت` : '⚠️ لا توجد بوتات نشطة');
        });

        // 🆘 المساعدة البسيطة
        bot.hears(['مساعدة', 'مساعده', 'help'], async (ctx) => {
            await ctx.reply(`🆘 *كيفية الاستخدام السريع:*
            
1. أرسل */easy*
2. اختر سيرفر جاهز أو اكتب IP
3. اضغط "تشغيل بوت"
4. تم! البوت يلعب تلقائياً

📌 *أوامر سريعة:*
- "سيرفراتي" ← لعرض سيرفراتك
- "شغل" ← لتشغيل البوتات
- "توقف" ← لإيقاف البوتات

✅ *سهل جداً!*`, {
                parse_mode: 'Markdown'
            });
        });

        // 🚀 تشغيل البوت
        await bot.launch();
        console.log('✅ البوت يعمل! أرسل /easy للبدء');
        
    } catch (error) {
        console.error('❌ خطأ:', error.message);
        setTimeout(initializeBot, 10000);
    }
}

// بدء
console.log('🚀 نظام إضافة سيرفر السهل...');
initializeBot();

// 🔁 إعادة تشغيل
setInterval(() => {
    if (!bot) initializeBot();
}, 30000);
