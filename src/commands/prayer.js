const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../utils/embedBuilder');
const { getPrayerTimes } = require('../services/prayerApi');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prayer')
        .setDescription('عرض مواعيد الصلاة اليومية حسب التوقيت'),

    async execute(interaction) {
        // إظهار حالة التحميل للمستخدم لأن الاتصال بالـ API قد يستغرق أجزاء من الثانية
        await interaction.deferReply({ ephemeral: true });

        try {
            const prayers = await getPrayerTimes('Riyadh', 'Saudi Arabia');

            const embed = createEmbed({
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

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in prayer command:', error.message);
            return interaction.editReply({
                embeds: [createEmbed({
                    title: 'خطأ في جلب المواعيد',
                    description: 'تعذر الاتصال بخادم مواعيد الصلاة حاليا. يرجى المحاولة لاحقا.',
                    color: COLORS.error
                })]
            });
        }
    }
};
