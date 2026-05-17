require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 1. تشغيل خادم الويب (Express) المخصص لاستضافة Render المجانية
const app = express();
const PORT = process.env.PORT || 3000;
const axios = require('axios');

app.get('/', (req, res) => {
    res.send('Mishkat | مِشكاة Bot is active and running 24/7.');
});

app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

app.listen(PORT, () => {
    console.log(`Express web server is listening on port ${PORT}`);
    
    // نظام التنبيه الذاتي (Self-Pinging Keep-Alive) لمنع Render من إدخال الخدمة في وضع السكون
    if (process.env.RENDER_EXTERNAL_URL) {
        console.log(`Setting up self-pinging for Render URL: ${process.env.RENDER_EXTERNAL_URL}`);
        setInterval(async () => {
            try {
                const url = `${process.env.RENDER_EXTERNAL_URL}/ping`;
                await axios.get(url);
                console.log('Self-ping successful to keep Render service alive 24/7.');
            } catch (err) {
                console.error('Self-ping failed:', err.message);
            }
        }, 10 * 60 * 1000); // كل 10 دقائق (Render يسكن بعد 15 دقيقة)
    }
});

// 2. إعداد عميل ديسكورد (Discord Client) مع الصلاحيات المطلوبة
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates, // مطلوب للاتصال بالقنوات الصوتية 24/7
        GatewayIntentBits.GuildMessages, // مطلوب لقراءة الرسائل والرد على المنشن
        GatewayIntentBits.MessageContent // مطلوب لمعرفة محتوى المنشن
    ]
});

client.commands = new Collection();

// 3. تحميل معالجات الأحداث (Events)
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// 4. تسجيل الدخول للبوت باستخدام التوكن
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === 'your_bot_token_here') {
    console.warn('⚠️ تنبيه: لم يتم تعيين DISCORD_TOKEN في ملف .env. يرجى تعيين التوكن لتشغيل البوت بنجاح.');
} else {
    client.login(process.env.DISCORD_TOKEN).catch(err => {
        console.error('Failed to login to Discord:', err.message);
    });
}

// معالجة الأخطاء العامة غير المتوقعة لضمان استمرار عمل البوت 24/7 بدون توقف
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});
