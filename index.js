const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');

const token = '8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ'; // التوكن الخاص بك
const bot = new TelegramBot(token, { polling: true });

// قاعدة بيانات بسيطة لتخزين السيرفرات
let servers = [];

// وظيفة التحقق من الحالة
function checkServerStatus(ip) {
  return new Promise((resolve) => {
    exec(`ping -c 1 ${ip}`, (error, stdout, stderr) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// وظيفة إعادة تشغيل السيرفر
function restartServer() {
  return new Promise((resolve, reject) => {
    exec('systemctl restart minecraft', (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

// بداية التفاعل مع المستخدم
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'مرحبًا بك في إدارة السيرفرات!', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'إضافة سيرفر', callback_data: 'add_server' },
          { text: 'سيرفراتي', callback_data: 'my_servers' }
        ]
      ]
    }
  });
});

// التعامل مع ضغط الأزرار
bot.on('callback_query', async (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  if (data === 'add_server') {
    bot.sendMessage(chatId, 'يرجى إرسال عنوان الـ IP الخاص بالسيرفر لإضافته.');
    // انتظار رسالة المستخدم
    bot.once('message', (msg) => {
      const ip = msg.text.trim();
      servers.push({ ip: ip });
      bot.sendMessage(chatId, `تمت إضافة السيرفر بعنوان: ${ip}`);
    });
  } else if (data === 'my_servers') {
    if (servers.length === 0) {
      bot.sendMessage(chatId, 'لا توجد سيرفرات حالياً.');
    } else {
      let msgText = 'قائمة السيرفرات:\n';
      servers.forEach((server, index) => {
        msgText += `${index + 1}. ${server.ip}\n`;
      });
      bot.sendMessage(chatId, msgText);
    }
  } else if (data.startsWith('check_server_')) {
    const index = parseInt(data.split('_')[2]);
    if (servers[index]) {
      const status = await checkServerStatus(servers[index].ip);
      bot.sendMessage(chatId, `السيرفر ${servers[index].ip} حالته: ${status ? 'شغال' : 'متوقف'}`);
    }
  } else if (data.startsWith('restart_server_')) {
    const index = parseInt(data.split('_')[2]);
    if (servers[index]) {
      try {
        await restartServer();
        bot.sendMessage(chatId, 'تم إعادة تشغيل السيرفر بنجاح.');
      } catch (err) {
        bot.sendMessage(chatId, 'حدث خطأ أثناء إعادة التشغيل.');
      }
    }
  }

  bot.answerCallbackQuery(callbackQuery.id);
});

// لعرض قائمة السيرفرات مع أزرار لكل سيرفر
bot.on('message', (msg) => {
  if (msg.text && msg.text === '/servers') {
    if (servers.length === 0) {
      bot.sendMessage(msg.chat.id, 'لا توجد سيرفرات لإظهارها.');
    } else {
      servers.forEach((server, index) => {
        bot.sendMessage(msg.chat.id, `السيرفر ${server.ip}`, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'التحقق من الحالة', callback_data: `check_server_${index}` },
                { text: 'إعادة التشغيل', callback_data: `restart_server_${index}` }
              ]
            ]
          }
        });
      });
    }
  }
});
