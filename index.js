const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');

// توكن البوت الخاص بك
const token = '8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ';

// إنشاء البوت
const bot = new TelegramBot(token, { polling: true });

// وظيفة لفحص حالة السيرفر (تحتاج إلى تعديلها حسب طريقة مراقبة سيرفرك)
function checkServerStatus() {
  // هنا مثال بسيط: إذا كان لديك API أو طريقة للتحقق من السيرفر
  // يمكنك استخدام الأمر التالي مع استبداله بما يناسب سيرفرك
  return new Promise((resolve, reject) => {
    // على سبيل المثال، محاولة الاتصال عبر ping أو استدعاء API
    exec('ping -c 1 your.server.ip', (error, stdout, stderr) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// وظيفة لإعادة تشغيل السيرفر
function restartServer() {
  // استبدل الأمر بما يناسب طريقة تشغيل سيرفرك
  exec('systemctl restart minecraft', (error, stdout, stderr) => {
    if (error) {
      console.log(`Error restarting server: ${error.message}`);
    } else {
      console.log('Server restart command executed.');
    }
  });
}

// أمر /status للتحقق من حالة السيرفر
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  const isRunning = await checkServerStatus();
  if (isRunning) {
    bot.sendMessage(chatId, 'السيرفر شغال.');
  } else {
    bot.sendMessage(chatId, 'السيرفر متوقف، جاري محاولة إعادة التشغيل...');
    restartServer();
    // يمكنك إضافة انتظار أو تحقق بعد إعادة التشغيل
    setTimeout(async () => {
      const checkAgain = await checkServerStatus();
      if (checkAgain) {
        bot.sendMessage(chatId, 'تم إعادة تشغيل السيرفر بنجاح.');
      } else {
        bot.sendMessage(chatId, 'فشلت محاولة إعادة التشغيل، يرجى التحقق يدوياً.');
      }
    }, 15000); // انتظر 15 ثانية قبل التحقق مرة أخرى
  }
});
