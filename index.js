const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ');

let servers = []; // قائمة السيرفرات

// بدء البوت
bot.start((ctx) => {
  ctx.reply('مرحبًا بك في إدارة سيرفرات Bedrock! استخدم /menu لعرض الخيارات.');
});

// عرض القائمة
bot.command('menu', (ctx) => {
  ctx.reply('اختر خيار:', Markup.inlineKeyboard([
    [Markup.button.callback('إضافة سيرفر', 'add_server')],
    [Markup.button.callback('عرض السيرفرات', 'list_servers')]
  ]));
});

// إضافة سيرفر
bot.action('add_server', (ctx) => {
  ctx.reply('يرجى إرسال عنوان الـ IP الخاص بالسيرفر:');
  bot.once('text', (msg) => {
    const ip = msg.message.text.trim();
    servers.push({ ip });
    ctx.reply(`تمت إضافة السيرفر بعنوان: ${ip}`);
  });
});

// عرض السيرفرات
bot.action('list_servers', (ctx) => {
  if (servers.length === 0) {
    ctx.reply('لا توجد سيرفرات مضافة حالياً.');
    return;
  }
  servers.forEach((server, index) => {
    ctx.reply(`السيرفر ${index + 1}: ${server.ip}`, Markup.inlineKeyboard([
      [Markup.button.callback('التحقق من الحالة', `check_${index}`)],
      [Markup.button.callback('إعادة التشغيل', `restart_${index}`)]
    ]));
  });
});

// التحقق من حالة السيرفر باستخدام bedrock-protocol
bot.action(/check_(\d+)/, async (ctx) => {
  const index = parseInt(ctx.match[1]);
  const server = servers[index];
  ctx.reply(`جارٍ التحقق من حالة السيرفر ${server.ip}...`);
  const isOnline = await checkBedrockServer(server.ip);
  ctx.reply(`السيرفر ${server.ip} حالته: ${isOnline ? 'شغال' : 'متوقف'}`);
});

// إعادة تشغيل السيرفر (مثال)
bot.action(/restart_(\d+)/, (ctx) => {
  const index = parseInt(ctx.match[1]);
  const server = servers[index];
  ctx.reply(`جارٍ إعادة تشغيل السيرفر ${server.ip}...`);
  restartServer(server.ip).then(() => {
    ctx.reply('تمت إعادة تشغيل السيرفر بنجاح.');
  }).catch(() => {
    ctx.reply('حدث خطأ أثناء إعادة التشغيل.');
  });
});

// وظيفة التحقق من حالة سيرفر Bedrock
async function checkBedrockServer(ip) {
  return new Promise((resolve) => {
    const client = bedrock.createClient({
      host: ip,
      port: 19132,
      // اضف باقي الإعدادات إذا لزم الأمر
    });

    // محاولة الاتصال
    client.on('connect', () => {
      resolve(true);
      client.end(); // اغلاق الاتصال بعد التحقق
    });

    client.on('error', (err) => {
      resolve(false);
    });
  });
}

// وظيفة إعادة التشغيل (نموذج، يعتمد على طريقة السيرفر)
function restartServer(ip) {
  return new Promise((resolve, reject) => {
    // هنا تضع أمر إعادة التشغيل الخاص بك، مثلاً عبر SSH أو أمر نظام
    // مثال:
    // exec(`ssh user@${ip} 'sudo systemctl restart bedrock'`, (err) => {
    //   if (err) reject(err);
    //   else resolve();
    // });
    resolve(); // مؤقتًا، استبدله بأمر حقيقي
  });
}

// تشغيل البوت
bot.launch();

console.log('Bot is running...');
