const { Telegraf } = require('telegraf');
const fs = require('fs');

const TOKEN = process.env.TELEGRAM_TOKEN || "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// تخزين في الذاكرة فقط
let data = {};

// 🏁 البدء
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    
    if (!data[userId]) {
        data[userId] = {
            servers: [],
            botName: "Player"
        };
    }
    
    const menu = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "➕ Add Server", callback_data: "add" },
                    { text: `📂 Servers (${data[userId].servers.length})`, callback_data: "list" }
                ],
                [
                    { text: "✏️ Change Bot Name", callback_data: "name" }
                ]
            ]
        }
    };
    
    await ctx.reply(`🎮 Welcome ${ctx.from.first_name}!\n\nServers: ${data[userId].servers.length}\nBot Name: ${data[userId].botName}`, menu);
});

// ➕ إضافة
bot.action('add', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText("📝 Send server IP:port\nExample: play.example.com:19132");
    
    const userId = ctx.from.id.toString();
    
    // استقبال IP مرة واحدة
    bot.once('text', async (nextCtx) => {
        if (nextCtx.from.id.toString() === userId) {
            const text = nextCtx.message.text.trim();
            
            if (text.includes(':') && text.split(':').length === 2) {
                const [ip, port] = text.split(':');
                
                if (!data[userId].servers) {
                    data[userId].servers = [];
                }
                
                data[userId].servers.push({
                    id: Date.now(),
                    ip: ip,
                    port: port,
                    name: `Server ${data[userId].servers.length + 1}`
                });
                
                await nextCtx.reply(`✅ Added!\n${ip}:${port}\n\nTotal: ${data[userId].servers.length} servers`, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "📂 View All", callback_data: "list" },
                                { text: "➕ Add More", callback_data: "add" }
                            ]
                        ]
                    }
                });
            } else {
                await nextCtx.reply("❌ Wrong format!\nUse: ip:port");
            }
        }
    });
});

// 📂 القائمة
bot.action('list', async (ctx) => {
    await ctx.answerCbQuery();
    
    const userId = ctx.from.id.toString();
    const servers = data[userId]?.servers || [];
    
    if (servers.length === 0) {
        await ctx.editMessageText("📭 No servers found.\nPress ➕ to add first server.", {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "➕ Add Server", callback_data: "add" }
                    ]
                ]
            }
        });
        return;
    }
    
    let message = `📂 Your Servers (${servers.length}):\n\n`;
    
    servers.forEach((server, index) => {
        message += `${index + 1}. ${server.ip}:${server.port}\n`;
    });
    
    const buttons = servers.map(server => [
        { text: `🎮 ${server.name}`, callback_data: `server_${server.id}` }
    ]);
    
    buttons.push([
        { text: "➕ Add New", callback_data: "add" },
        { text: "🏠 Home", callback_data: "home" }
    ]);
    
    await ctx.editMessageText(message, {
        reply_markup: { inline_keyboard: buttons }
    });
});

// ✏️ تغيير الاسم
bot.action('name', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText("✏️ Send new bot name:");
    
    const userId = ctx.from.id.toString();
    
    bot.once('text', async (nextCtx) => {
        if (nextCtx.from.id.toString() === userId) {
            const newName = nextCtx.message.text.trim();
            
            if (newName.length > 0 && newName.length < 20) {
                data[userId].botName = newName;
                
                await nextCtx.reply(`✅ Bot name changed to: ${newName}`, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "🏠 Home", callback_data: "home" }
                            ]
                        ]
                    }
                });
            } else {
                await nextCtx.reply("❌ Name must be 1-20 characters");
            }
        }
    });
});

// 🏠 الرئيسية
bot.action('home', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.callbackQuery.data = null;
    bot.start(ctx);
});

// 🚀 تشغيل
bot.launch()
    .then(() => console.log('✅ Bot is working!'))
    .catch(err => console.log('❌ Error:', err.message));

// إيقاف
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
