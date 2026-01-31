# استخدام نسخة نود كاملة تحتوي على أدوات البناء
FROM node:18-bullseye

# تثبيت أدوات البناء الضرورية للمكتبات الثقيلة
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# تحديد مجلد العمل
WORKDIR /app

# نسخ ملفات التعريف
COPY package*.json ./

# التثبيت (سيتم البناء بنجاح هنا بوجود الأدوات)
RUN npm install

# نسخ بقية الكود
COPY . .

# المنفذ
EXPOSE 8080

# تشغيل البوت
CMD ["node", "index.js"]
