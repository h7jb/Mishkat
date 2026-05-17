const schedule = require('node-schedule');
const { getAllTextConfigs, getGuildConfig } = require('../config/database');
const { createEmbed, COLORS } = require('../utils/embedBuilder');
const { getPrayerTimes } = require('./prayerApi');
const { getMorningAzkar, getEveningAzkar, getRandomOngoingZikr } = require('./azkarApi');

// نصوص أذكار الصباح (بدون إيموجيات - كبديل محلي)
const MORNING_AZKAR = [
    "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.",
    "اللهم بك أصبحنا وبك أمسينا، وبك نحيا وبك نموت وإليك النشور.",
    "حسبي الله لا إله إلا هو، عليه توكلت وهو رب العرش العظيم (سبع مرات).",
    "اللهم إني أسألك العفو والعافية في الدنيا والآخرة، اللهم إني أسألك العفو والعافية في ديني ودنياي وأهلي ومالي.",
    "بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم (ثلاث مرات)."
];

// نصوص أذكار المساء (بدون إيموجيات - كبديل محلي)
const EVENING_AZKAR = [
    "أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.",
    "اللهم بك أمسينا وبك أصبحنا، وبك نحيا وبك نموت وإليك المصير.",
    "اللهم ما أمسى بي من نعمة أو بأحد من خلقك فمنك وحدك لا شريك لك، فلك الحمد ولك الشكر.",
    "أعوذ بكلمات الله التامات من شر ما خلق (ثلاث مرات).",
    "اللهم إني أمسيت أشهدك وأشهد حملة عرشك وملائكتك وجميع خلقك أنك أنت الله لا إله إلا أنت وحدك لا شريك لك وأن محمدا عبدك ورسولك."
];

// نصوص الأذكار الجارية المتنوعة (بدون إيموجيات - كبديل محلي)
const ONGOING_AZKAR = [
    "سبحان الله وبحمده، سبحان الله العظيم. كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن.",
    "لا حول ولا قوة إلا بالله العلي العظيم. كنز من كنوز الجنة.",
    "اللهم صل وسلم وبارك على نبينا محمد وعلى آله وصحبه أجمعين.",
    "أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه.",
    "لا إله إلا أنت سبحانك إني كنت من الظالمين. دعوة ذي النون إذ دعا وهو في بطن الحوت.",
    "سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر. أحب الكلام إلى الله.",
    "يا حي يا قيوم برحمتك أستغيث، أصلح لي شأني كله ولا تكلني إلى نفسي طرفة عين."
];

/**
 * دالة مساعدة لإرسال Embed إلى القنوات المحددة في كل السيرفرات
 * @param {Object} client 
 * @param {Function} embedGenerator دالة تولد الـ Embed الخاص بكل سيرفر بناء على إعداداته
 */
async function broadcastToAllTextChannels(client, embedGenerator) {
    try {
        const configs = await getAllTextConfigs();
        for (const config of configs) {
            if (!config.text_channel_id) continue;
            try {
                const channel = await client.channels.fetch(config.text_channel_id);
                if (channel && channel.isTextBased()) {
                    const embed = await embedGenerator(config);
                    await channel.send({ embeds: [embed] });
                }
            } catch (err) {
                console.error(`Failed to send scheduled message to channel ${config.text_channel_id} in guild ${config.guild_id}:`, err.message);
            }
        }
    } catch (error) {
        console.error('Error in broadcastToAllTextChannels:', error.message);
    }
}

/**
 * تهيئة جميع الجداول الزمنية (أذكار الصباح، المساء، الصلاة، والأذكار الجارية)
 * @param {Object} client 
 */
function initScheduler(client) {
    console.log('Initializing scheduler for Azkar and Prayer times...');

    // 1. أذكار الصباح: يوميا الساعة 06:00 صباحا بتوقيت السيرفر
    schedule.scheduleJob('0 6 * * *', async () => {
        console.log('Running scheduled Morning Azkar broadcast...');
        await broadcastToAllTextChannels(client, async (config) => {
            const list = getMorningAzkar();
            const description = list.slice(0, 7).map(azkar => `• ${azkar}`).join('\n\n');
            return createEmbed({
                title: 'أذكار الصباح',
                description: description,
                color: COLORS.primary
            });
        });
    });

    // 2. أذكار المساء: يوميا الساعة 17:00 (5 مساء) بتوقيت السيرفر
    schedule.scheduleJob('0 17 * * *', async () => {
        console.log('Running scheduled Evening Azkar broadcast...');
        await broadcastToAllTextChannels(client, async (config) => {
            const list = getEveningAzkar();
            const description = list.slice(0, 7).map(azkar => `• ${azkar}`).join('\n\n');
            return createEmbed({
                title: 'أذكار المساء',
                description: description,
                color: COLORS.secondary
            });
        });
    });

    // 3. مواعيد الصلاة: يوميا الساعة 05:00 صباحا
    schedule.scheduleJob('0 5 * * *', async () => {
        console.log('Running scheduled Prayer Times broadcast...');
        const prayers = await getPrayerTimes('Riyadh', 'Saudi Arabia'); // يمكن لاحقا تخصيص المدينة لكل سيرفر
        await broadcastToAllTextChannels(client, async (config) => {
            return createEmbed({
                title: 'مواعيد الصلاة اليومية',
                description: `التاريخ الهجري: ${prayers.dateHijri}\nالتاريخ الميلادي: ${prayers.dateGregorian}`,
                color: COLORS.info,
                fields: [
                    { name: 'الفجر', value: prayers.fajr, inline: true },
                    { name: 'الشروق', value: prayers.sunrise, inline: true },
                    { name: 'الظهر', value: prayers.dhuhr, inline: true },
                    { name: 'العصر', value: prayers.asr, inline: true },
                    { name: 'المغرب', value: prayers.maghrib, inline: true },
                    { name: 'العشاء', value: prayers.isha, inline: true }
                ]
            });
        });
    });

    // 4. الأذكار الجارية والروابط (إحسان والمسبحة): كل ساعتين
    schedule.scheduleJob('0 */2 * * *', async () => {
        console.log('Running scheduled Ongoing Azkar broadcast...');
        await broadcastToAllTextChannels(client, async (config) => {
            // اختيار ذكر عشوائي من المصدر المتجدد
            const randomZikr = getRandomOngoingZikr();
            const fields = [];

            if (config.ehsan_link) {
                fields.push({ name: 'منصة إحسان للعمل الخيري', value: `[تبرع الآن عبر منصة إحسان](${config.ehsan_link})`, inline: true });
            }
            if (config.masbaha_link) {
                fields.push({ name: 'المسبحة الإلكترونية', value: `[سبح واذكر الله](${config.masbaha_link})`, inline: true });
            }

            return createEmbed({
                title: 'أذكار جارية',
                description: randomZikr,
                color: COLORS.dark,
                fields: fields
            });
        });
    });

    console.log('Scheduler initialized successfully.');
}

module.exports = {
    initScheduler,
    MORNING_AZKAR,
    EVENING_AZKAR,
    ONGOING_AZKAR
};
