const { Telegraf } = require('telegraf');
const express = require('express');

// 🌐 خادم ويب متين لـ Railway
const app = express();
const PORT = process.env.PORT || 3000;

// مسارات الصحة المطلوبة لـ Railway
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Pedrock Bot System',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// 🔧 معالجة أخطاء Railway
app.use((err, req, res, next) => {
    console.error('❌ خطأ في الخادم:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`🚀 خادم Railway يعمل على ${PORT}`);
});

// 🤖 نظام البوت المحسّن
const TOKEN = process.env.TELEGRAM_TOKEN || "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";
const bot = new Telegraf(TOKEN);

// تخزين مؤقت
let userData = {};

// 🔧 معالجة أخطاء البوت
bot.catch((err, ctx) => {
    console.error('❌ خطأ في البوت:', err.message);
    if (ctx && ctx.reply) {
        ctx.reply('⚠️ حدث خطأ، جرب مرة أخرى');
    }
});

// 🏁 أمر البداية مع واجهة أزرار Inline
bot.start(async (ctx) => {
    try {
        const userId = ctx.from.id;
        userData[userId] = userData[userId] || {
            name: ctx.from.first_name,
            servers: [],
            created: new Date()
        };

        const menu = {
            reply_markup: {
                inline_keyboard: [
                    // الصف الأول: الإضافة والإدارة
                    [
                        {
                            text: "➕ إضافة سيرفر",
                            callback_data: "add_server_menu"
                        },
                        {
                            text: "📋 سيرفراتي",
                            callback_data: "my_servers_menu"
                        }
                    ],
                    // الصف الثاني: التشغيل
                    [
                        {
                            text: "🎮 تشغيل بوتات",
                            callback_data: "start_bots_menu"
                        },
                        {
                            text: "⏸️ إيقاف بوتات",
                            callback_data: "stop_bots_menu"
                        }
                    ],
                    // الصف الثالث: إحصائيات ومعلومات
                    [
                        {
                            text: "📊 إحصائيات",
                            callback_data: "stats_menu"
                        },
                        {
                            text: "⚙️ إعدادات",
                            callback_data: "settings_menu"
                        }
                    ],
                    // الصف الرابع: مساعدة ودعم
                    [
                        {
                            text: "❓ المساعدة",
                            callback_data: "help_menu"
                        },
                        {
                            text: "🌐 موقعنا",
                            url: `http://localhost:${PORT}`
                        }
                    ]
                ]
            }
        };

        await ctx.reply(`
🎮 *مرحباً ${ctx.from.first_name}!*

✨ *Pedrock Bot System*
نظام إدارة سيرفرات ماينكرافت المتكامل

📌 *استخدم الأزرار الجانبية للتحكم:*
        `.trim(), {
            parse_mode: 'Markdown',
            ...menu
        });

    } catch (error) {
        console.error('خطأ في /start:', error);
    }
});

// 🎯 قائمة إضافة السيرفر
bot.action('add_server_menu', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const serverTypes = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🌐 Aternos",
                            callback_data: "add_aternos"
                        },
                        {
                            text: "⚡ Pedrock",
                            callback_data: "add_pedrock"
                        }
                    ],
                    [
                        {
                            text: "🎮 IP مخصص",
                            callback_data: "add_custom"
                        },
                        {
                            text: "📁 استيراد",
                            callback_data: "import_server"
                        }
                    ],
                    [
                        {
                            text: "🔙 رجوع",
                            callback_data: "back_to_main"
                        }
                    ]
                ]
            }
        };

        await ctx.editMessageText(`
📝 *إضافة سيرفر جديد*

🔍 *اختر نوع السيرفر:*

• 🌐 *Aternos* - سيرفرات مجانية
• ⚡ *Pedrock* - بيدروك 1.21.x
• 🎮 *IP مخصص* - أي سيرفر
• 📁 *استيراد* - من ملف

👇 *اختر النوع:*
        `.trim(), {
            parse_mode: 'Markdown',
            ...serverTypes
        });

    } catch (error) {
        console.error('خطأ في add_server_menu:', error);
    }
});

// 🌐 إضافة سيرفر Aternos
bot.action('add_aternos', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        await ctx.editMessageText(`
🌐 *إضافة سيرفر Aternos*

✏️ *أرسل اسم سيرفر Aternos:*

📌 *الشكل:* **yourname.aternos.me**

📋 *أمثلة:*
• myserver.aternos.me
• playworld.aternos.me
• bestmc.aternos.me

⚠️ *يجب أن ينتهي بـ .aternos.me*

👇 *اكتب الآن:*
        `.trim(), {
            parse_mode: 'Markdown'
        });

        // استقبال الاسم
        const userId = ctx.from.id;
        const handler = async (nextCtx) => {
            if (nextCtx.from.id === userId) {
                const serverName = nextCtx.message.text.trim();
                
                if (serverName.toLowerCase().endsWith('.aternos.me')) {
                    // حفظ السيرفر
                    if (!userData[userId].servers) {
                        userData[userId].servers = [];
                    }
                    
                    userData[userId].servers.push({
                        id: Date.now(),
                        name: `Aternos: ${serverName}`,
                        ip: serverName,
                        port: 25565,
                        type: 'aternos',
                        added: new Date().toLocaleString('ar-SA')
                    });
                    
                    const successMenu = {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "🚀 تشغيل مباشر",
                                        callback_data: `start_server_${serverName}`
                                    },
                                    {
                                        text: "⚙️ إعدادات",
                                        callback_data: `settings_${serverName}`
                                    }
                                ],
                                [
                                    {
                                        text: "➕ إضافة آخر",
                                        callback_data: "add_server_menu"
                                    },
                                    {
                                        text: "📋 السيرفرات",
                                        callback_data: "my_servers_menu"
                                    }
                                ]
                            ]
                        }
                    };
                    
                    await nextCtx.reply(`
✅ *تمت الإضافة بنجاح!*

🎮 **${serverName}**
🌐 IP: ${serverName}:25565
⚡ النوع: Aternos
📅 الوقت: ${new Date().toLocaleString('ar-SA')}

👇 *اختر الإجراء التالي:*
                    `.trim(), {
                        parse_mode: 'Markdown',
                        ...successMenu
                    });
                    
                    bot.off('text', handler);
                } else {
                    await nextCtx.reply(`
❌ *اسم غير صحيح!*

يجب أن ينتهي الاسم بـ **.aternos.me**

✏️ *جرب مرة أخرى:*
                    `.trim(), {
                        parse_mode: 'Markdown'
                    });
                }
            }
        };
        
        bot.on('text', handler);
        
    } catch (error) {
        console.error('خطأ في add_aternos:', error);
    }
});

// 📋 قائمة السيرفرات
bot.action('my_servers_menu', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const userId = ctx.from.id;
        const servers = userData[userId]?.servers || [];
        
        if (servers.length === 0) {
            await ctx.editMessageText(`
📭 *لا توجد سيرفرات*

لم تقم بإضافة أي سيرفرات بعد.

👇 *لإضافة أول سيرفر:*
            `.trim(), {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "➕ إضافة سيرفر الآن",
                                callback_data: "add_server_menu"
                            }
                        ],
                        [
                            {
                                text: "🔙 الرئيسية",
                                callback_data: "back_to_main"
                            }
                        ]
                    ]
                }
            });
            return;
        }
        
        // إنشاء أزرار لكل سيرفر
        const serverButtons = [];
        
        servers.forEach((server, index) => {
            serverButtons.push([
                {
                    text: `🎮 ${server.name}`,
                    callback_data: `server_${server.id}`
                }
            ]);
        });
        
        // أزرار التحكم
        serverButtons.push([
            {
                text: "➕ إضافة جديد",
                callback_data: "add_server_menu"
            },
            {
                text: "🚀 تشغيل الكل",
                callback_data: "start_all_servers"
            }
        ]);
        
        serverButtons.push([
            {
                text: "🔙 الرئيسية",
                callback_data: "back_to_main"
            }
        ]);
        
        await ctx.editMessageText(`
📋 *سيرفراتك (${servers.length})*

${servers.map((server, i) => 
    `${i+1}. **${server.name}**\n   🌐 ${server.ip}:${server.port}\n`
).join('\n')}

👇 *اختر سيرفر للإدارة:*
        `.trim(), {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: serverButtons
            }
        });
        
    } catch (error) {
        console.error('خطأ في my_servers_menu:', error);
    }
});

// 🚀 قائمة التشغيل
bot.action('start_bots_menu', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const startOptions = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🤖 1 بوت",
                            callback_data: "start_1_bot"
                        },
                        {
                            text: "🤖🤖 2 بوت",
                            callback_data: "start_2_bots"
                        }
                    ],
                    [
                        {
                            text: "🤖🤖🤖 3 بوت",
                            callback_data: "start_3_bots"
                        },
                        {
                            text: "⚡ سريع",
                            callback_data: "start_quick"
                        }
                    ],
                    [
                        {
                            text: "🎯 لكل سيرفر",
                            callback_data: "start_all_servers"
                        },
                        {
                            text: "⏰ مجدول",
                            callback_data: "start_scheduled"
                        }
                    ],
                    [
                        {
                            text: "🔙 رجوع",
                            callback_data: "back_to_main"
                        }
                    ]
                ]
            }
        };
        
        await ctx.editMessageText(`
🚀 *تشغيل البوتات*

🔧 *خيارات التشغيل:*

• 🤖 *1 بوت* - تشغيل بوت واحد
• 🤖🤖 *2 بوت* - تشغيل بوتين
• 🤖🤖🤖 *3 بوت* - تشغيل ثلاثة بوتات
• ⚡ *سريع* - إعدادات سريعة
• 🎯 *لكل سيرفر* - جميع السيرفرات
• ⏰ *مجدول* - تشغيل حسب الوقت

👇 *اختر عدد البوتات:*
        `.trim(), {
            parse_mode: 'Markdown',
            ...startOptions
        });
        
    } catch (error) {
        console.error('خطأ في start_bots_menu:', error);
    }
});

// 📊 قائمة الإحصائيات
bot.action('stats_menu', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const userId = ctx.from.id;
        const servers = userData[userId]?.servers || [];
        const totalUsers = Object.keys(userData).length;
        
        const statsMenu = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🔄 تحديث",
                            callback_data: "stats_menu"
                        },
                        {
                            text: "📈 تفصيلي",
                            callback_data: "detailed_stats"
                        }
                    ],
                    [
                        {
                            text: "📊 النظام",
                            callback_data: "system_stats"
                        },
                        {
                            text: "👥 المستخدمين",
                            callback_data: "users_stats"
                        }
                    ],
                    [
                        {
                            text: "🔙 الرئيسية",
                            callback_data: "back_to_main"
                        }
                    ]
                ]
            }
        };
        
        await ctx.editMessageText(`
📊 *إحصائيات النظام*

🏆 *إحصائياتك:*
┌─────────────────
│ 👤 الاسم: ${ctx.from.first_name}
│ 📅 منذ: ${userData[userId]?.created ? new Date(userData[userId].created).toLocaleDateString('ar-SA') : 'اليوم'}
│ 🌐 السيرفرات: ${servers.length}
│ 🤖 البوتات: 0
└─────────────────

📈 *إحصائيات عامة:*
┌─────────────────
│ 👥 المستخدمين: ${totalUsers}
│ ⏰ وقت التشغيل: ${Math.floor(process.uptime() / 3600)} ساعة
│ 💾 الذاكرة: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
│ 🚀 الحالة: نشط
└─────────────────

🕒 *آخر تحديث:* ${new Date().toLocaleTimeString('ar-SA')}
        `.trim(), {
            parse_mode: 'Markdown',
            ...statsMenu
        });
        
    } catch (error) {
        console.error('خطأ في stats_menu:', error);
    }
});

// ⚙️ قائمة الإعدادات
bot.action('settings_menu', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const settingsMenu = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🔔 الإشعارات",
                            callback_data: "notifications_settings"
                        },
                        {
                            text: "🎨 المظهر",
                            callback_data: "theme_settings"
                        }
                    ],
                    [
                        {
                            text: "🔒 الخصوصية",
                            callback_data: "privacy_settings"
                        },
                        {
                            text: "📦 البيانات",
                            callback_data: "data_settings"
                        }
                    ],
                    [
                        {
                            text: "🌐 اللغة",
                            callback_data: "language_settings"
                        },
                        {
                            text: "⚡ الأداء",
                            callback_data: "performance_settings"
                        }
                    ],
                    [
                        {
                            text: "💾 حفظ",
                            callback_data: "save_settings"
                        },
                        {
                            text: "↩️ إعادة تعيين",
                            callback_data: "reset_settings"
                        }
                    ],
                    [
                        {
                            text: "🔙 الرئيسية",
                            callback_data: "back_to_main"
                        }
                    ]
                ]
            }
        };
        
        await ctx.editMessageText(`
⚙️ *إعدادات النظام*

🔧 *خيارات التخصيص:*

• 🔔 *الإشعارات* - تحكم بالإشعارات
• 🎨 *المظهر* - تغيير الألوان والواجهة
• 🔒 *الخصوصية* - إعدادات الخصوصية
• 📦 *البيانات* - إدارة بياناتك
• 🌐 *اللغة* - تغيير لغة الواجهة
• ⚡ *الأداء* - تحسين أداء النظام

👇 *اختر الإعداد الذي تريد تعديله:*
        `.trim(), {
            parse_mode: 'Markdown',
            ...settingsMenu
        });
        
    } catch (error) {
        console.error('خطأ في settings_menu:', error);
    }
});

// ❓ قائمة المساعدة
bot.action('help_menu', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        
        const helpMenu = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "📖 التعليمات",
                            callback_data: "faq_menu"
                        },
                        {
                            text: "🎥 فيديو",
                            callback_data: "video_tutorial"
                        }
                    ],
                    [
                        {
                            text: "🔧 استكشاف الأخطاء",
                            callback_data: "troubleshooting"
                        },
                        {
                            text: "📞 دعم فني",
                            callback_data: "support_contact"
                        }
                    ],
                    [
                        {
                            text: "📚 الوثائق",
                            callback_data: "documentation"
                        },
                        {
                            text: "🆘 طوارئ",
                            callback_data: "emergency_help"
                        }
                    ],
                    [
                        {
                            text: "🔙 الرئيسية",
                            callback_data: "back_to_main"
                        }
                    ]
                ]
            }
        };
        
        await ctx.editMessageText(`
❓ *مركز المساعدة*

🆘 *الدعم الفني:*

• 📖 *التعليمات* - الأسئلة الشائعة
• 🎥 *فيديو* - شروحات بالفيديو
• 🔧 *استكشاف الأخطاء* - حل المشاكل
• 📞 *دعم فني* - التواصل مع الدعم
• 📚 *الوثائق* - دليل الاستخدام
• 🆘 *طوارئ* - مشاكل حرجة

👇 *اختر القسم المناسب:*
        `.trim(), {
            parse_mode: 'Markdown',
            ...helpMenu
        });
        
    } catch (error) {
        console.error('خطأ في help_menu:', error);
    }
});

// 🔙 العودة للرئيسية
bot.action('back_to_main', async (ctx) => {
    try {
        await ctx.answerCbQuery();
        ctx.callbackQuery.data = null;
        bot.start(ctx);
    } catch (error) {
        console.error('خطأ في back_to_main:', error);
    }
});

// 📨 معالجة الرسائل النصية
bot.on('text', async (ctx) => {
    try {
        const text = ctx.message.text;
        
        // تجاهل الأوامر
        if (text.startsWith('/')) return;
        
        const quickReplies = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "➕ إضافة سيرفر",
                            callback_data: "add_server_menu"
                        },
                        {
                            text: "📋 سيرفراتي",
                            callback_data: "my_servers_menu"
                        }
                    ],
                    [
                        {
                            text: "🚀 تشغيل",
                            callback_data: "start_bots_menu"
                        },
                        {
                            text: "❓ المساعدة",
                            callback_data: "help_menu"
                        }
                    ]
                ]
            }
        };
        
        await ctx.reply(`
💬 *تم استلام رسالتك*

📝 "${text}"

🎮 *للتحكم السريع:*
        `.trim(), {
            parse_mode: 'Markdown',
            ...quickReplies
        });
        
    } catch (error) {
        console.error('خطأ في معالجة النص:', error);
    }
});

// 🚀 تشغيل البوت مع معالجة أخطاء Railway
async function startBot() {
    try {
        console.log('🤖 جاري بدء البوت...');
        
        await bot.launch({
            dropPendingUpdates: true,
            allowedUpdates: ['message', 'callback_query'],
            polling: {
                timeout: 30,
                limit: 100
            }
        });
        
        console.log('✅ البوت يعمل بنجاح على Railway!');
        console.log('📱 أرسل /start للبدء');
        
        // إعادة التشغيل التلقائي عند الفشل
        bot.catch((err) => {
            console.error('⚠️ خطأ في البوت، إعادة التشغيل...', err.message);
            setTimeout(startBot, 5000);
        });
        
    } catch (error) {
        console.error('❌ فشل تشغيل البوت:', error.message);
        console.log('🔄 إعادة المحاولة بعد 10 ثواني...');
        setTimeout(startBot, 10000);
    }
}

// بدء النظام
startBot();

// 🔧 معالجة إيقاف Railway
process.on('SIGTERM', () => {
    console.log('🔴 إشارة SIGTERM من Railway');
    bot.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔴 إشارة SIGINT');
    bot.stop();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('🚨 خطأ غير متوقع:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 وعد مرفوض غير معالج:', reason);
});
