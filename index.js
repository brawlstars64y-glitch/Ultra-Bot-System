const { Telegraf } = require('telegraf');

const TOKEN = "8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ";

// ⚠️ **مهم:** بدون علامة @ في البداية
const REQUIRED_CHANNELS = [
    "vsyfyk",      // قناة مودات دينار
    "N_NHGER",     // ترويج سيرفرات
    "sjxhhdbx72"   // قناة تعليمية
];

const bot = new Telegraf(TOKEN);

// 🔧 **دالة محسنة للتحقق من الاشتراك**
async function checkSubscription(userId) {
    const results = [];
    
    for (const channel of REQUIRED_CHANNELS) {
        try {
            console.log(`🔍 جاري التحقق من ${channel} للمستخدم ${userId}`);
            
            const member = await bot.telegram.getChatMember(channel, userId);
            
            const isMember = ['member', 'administrator', 'creator'].includes(member.status);
            
            console.log(`📊 ${channel}: حالة ${member.status} - عضو؟ ${isMember}`);
            
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
        
        // تأخير بين كل طلب لتجنب Rate Limit
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const allSubscribed = results.every(r => r.isMember);
    const missing = results.filter(r => !r.isMember).map(r => r.channel);
    
    return {
        subscribed: allSubscribed,
        details: results,
        missingChannels: missing
    };
}

// 🎯 **أمر اختبار شخصي**
bot.command('testme', async (ctx) => {
    await ctx.reply(`🔍 جاري فحص اشتراكاتك...\n\n${ctx.from.first_name} - ID: ${ctx.from.id}`);
    
    const subscription = await checkSubscription(ctx.from.id);
    
    let message = `📊 **نتيجة الفحص:**\n\n`;
    
    subscription.details.forEach((detail, index) => {
        message += `${index+1}. ${detail.channel}: ${detail.isMember ? '✅ مشترك' : '❌ غير مشترك'}\n`;
        if (detail.error) message += `   خطأ: ${detail.error}\n`;
        message += `   الحالة: ${detail.status}\n\n`;
    });
    
    message += subscription.subscribed 
        ? '🎉 **مبروك! أنت مشترك في جميع القنوات**\nأرسل /start لبدء استخدام البوت'
        : `❌ **أنت غير مشترك في:**\n${subscription.missingChannels.join('\n')}\n\nانضم للقنوات ثم أرسل /testme مرة أخرى`;
    
    await ctx.reply(message, { parse_mode: 'Markdown' });
});

// 🏁 أمر البداية المحسن
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    
    console.log(`🚀 مستخدم جديد: ${username} (${userId})`);
    
    // التحقق من الاشتراك
    const subscription = await checkSubscription(userId);
    
    if (!subscription.subscribed) {
        console.log(`❌ ${username} غير مشترك في:`, subscription.missingChannels);
        
        const buttons = REQUIRED_CHANNELS.map(channel => {
            const channelName = channel === 'vsyfyk' ? 'مودات دينار' :
                              channel === 'N_NHGER' ? 'ترويج سيرفرات' :
                              'قناة تعليمية';
            
            return [{
                text: `📍 ${channelName}`,
                url: `https://t.me/${channel}`
            }];
        });
        
        buttons.push([{ text: '🔄 تحقق مرة أخرى', callback_data: 'check_again' }]);
        
        await ctx.reply(`🔒 **مطلوب اشتراك**\n\nعزيزي ${username},\nيجب الاشتراك في القنوات التالية:\n\n${subscription.missingChannels.map((ch, i) => `${i+1}. ${ch}`).join('\n')}\n\n📌 **خطوات:**\n1. انضم للقنوات أعلاه\n2. اضغط "تحقق مرة أخرى"\n3. تأكد من عدم وجود قيود في القنوات`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: buttons }
        });
        
        return;
    }
    
    // إذا كان مشتركاً
    console.log(`✅ ${username} مشترك في جميع القنوات`);
    
    await ctx.reply(`🎉 **أهلاً ${username}!**\n\n✅ تم التحقق من اشتراكاتك بنجاح.\n\nيمكنك الآن استخدام البوت.`, {
        parse_mode: 'Markdown'
    });
});

// 🔄 زر التحقق مرة أخرى
bot.action('check_again', async (ctx) => {
    await ctx.answerCbQuery('جاري التحقق...');
    
    const subscription = await checkSubscription(ctx.from.id);
    
    if (subscription.subscribed) {
        await ctx.editMessageText(`✅ **مبروك!**\n\nتم التحقق من اشتراكاتك بنجاح.\n\nأرسل /start لبدء استخدام البوت.`, {
            parse_mode: 'Markdown'
        });
    } else {
        await ctx.editMessageText(`❌ **ما زلت غير مشترك**\n\nالقنوات المفقودة:\n${subscription.missingChannels.join('\n')}\n\n⚠️ **ملاحظات مهمة:**\n1. تأكد من ضغطك على "Join" في كل قناة\n2. قد تحتاج لإعادة فتح التلجرام\n3. بعض القنوات تحتاج قبول الدعوة`, {
            parse_mode: 'Markdown'
        });
    }
});

// 👑 أمر للمشرف لعرض معلومات القنوات
bot.command('channelinfo', async (ctx) => {
    // تأكد أنك أنت المشرف
    const ADMIN_ID = "ضع_ايديك_هنا"; // غير هذا برقم ايديك
    
    if (ctx.from.id.toString() !== ADMIN_ID) {
        return ctx.reply('❌ هذا الأمر للمشرف فقط');
    }
    
    let report = `📊 **معلومات القنوات:**\n\n`;
    
    for (const channel of REQUIRED_CHANNELS) {
        try {
            const chat = await bot.telegram.getChat(`@${channel}`);
            report += `🔹 @${channel}\n`;
            report += `   العنوان: ${chat.title || 'غير معروف'}\n`;
            report += `   النوع: ${chat.type}\n`;
            report += `   ID: ${chat.id}\n\n`;
        } catch (error) {
            report += `🔸 @${channel}\n`;
            report += `   ❌ خطأ: ${error.message}\n\n`;
        }
    }
    
    await ctx.reply(report, { parse_mode: 'Markdown' });
});

// 🚀 تشغيل البوت
console.log('🤖 بدء تشغيل البوت مع نظام اشتراك محسن...');
bot.launch()
    .then(() => {
        console.log('✅ البوت يعمل!');
        console.log('📢 القنوات المطلوبة:', REQUIRED_CHANNELS.map(c => `@${c}`).join(', '));
        console.log('\n🔍 **للتجربة:**');
        console.log('1. افتح بوتك في التلجرام');
        console.log('2. أرسل /testme لفحص اشتراكاتك');
        console.log('3. أرسل /channelinfo (للمشرف) لعرض معلومات القنوات');
    })
    .catch(err => {
        console.error('❌ خطأ:', err.message);
    });
