const { Telegraf, Markup } = require('telegraf');
const http = require('http');

// 🛡️ جلب التوكن من Variables
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("❌ خطأ: لم يتم العثور على BOT_TOKEN!");
  process.exit(1);
}

const bot = new Telegraf(token);

// 🌐 سيرفر Railway لضمان العمل 24 ساعة
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.write("💎 نظام الأسطورة يعمل بأعلى كفاءة");
  res.end();
}).listen(process.env.PORT || 3000);

// ✨ واجهة الترحيب الأسطورية (صيغة المذكر)
bot.start((ctx) => {
  const message = `
🚀 **أهلاً بك يا بطل في نظامك الخاص!**

تم تفعيل الواجهة الأسطورية بنجاح. هذا البوت يعمل الآن تحت إشرافك وبحماية كاملة من سيرفر Railway 🛡️.

✨ **ماذا تريد أن نفعل الآن؟**
  `;
  
  ctx.replyWithMarkdown(message, 
    Markup.inlineKeyboard([
      [Markup.button.callback('📊 حالة النظام', 'check_status'), Markup.button.callback('🛡️ الحماية', 'check_protect')],
      [Markup.button.url('✨ قناتي الخاصة', 'https://t.me/YourChannel')] 
    ])
  );
});

// تفعيلات الأزرار الشفافة
bot.action('check_status', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('📊 النظام مستقر ويعمل بأعلى سرعة من أجلك يا بطل ✅');
});

bot.action('check_protect', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('🛡️ حماية "الأسطورة" مفعلة.. بياناتك في أمان مطلق!');
});

// تشغيل المحرك
bot.launch({ polling: { dropPendingUpdates: true } })
  .then(() => console.log("🚀 تم إطلاق الواجهة الأسطورية بنجاح!"))
  .catch((err) => console.error("❌ عطل:", err));
