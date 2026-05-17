const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('khatma')
        .setDescription('حساب وتنظيم جدول يومي لختم القرآن الكريم خلال مدة محددة')
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('عدد الأيام المطلوب ختم القرآن خلالها')
                .setRequired(true)
                .addChoices(
                    { name: 'ختم في 3 أيام', value: 3 },
                    { name: 'ختم في 7 أيام (أسبوع)', value: 7 },
                    { name: 'ختم في 10 أيام', value: 10 },
                    { name: 'ختم في 15 يوم', value: 15 },
                    { name: 'ختم في 30 يوم (شهر)', value: 30 },
                    { name: 'ختم في 60 يوم (شهرين)', value: 60 }
                )),

    async execute(interaction) {
        const days = interaction.options.getInteger('days');
        const TOTAL_PAGES = 604; // عدد صفحات مصحف مجمع الملك فهد الافتراضي
        const TOTAL_JUZ = 30;

        const dailyPages = Math.ceil(TOTAL_PAGES / days);
        const pagesPerPrayer = Math.ceil(dailyPages / 5);
        const dailyJuz = (TOTAL_JUZ / days).toFixed(1);

        const embed = createEmbed({
            title: `جدول ختم القرآن الكريم في ${days} أيام`,
            description: `لقد اخترت خطة مباركة لختم كتاب الله تعالى خلال **${days}** أيام.\nإليك تفاصيل الورد اليومي المطلوب إنجازه لتحقيق هدفك:`,
            color: COLORS.secondary,
            fields: [
                { name: 'الورد اليومي بالصفحات', value: `حوالي **${dailyPages}** صفحة يوميا.`, inline: true },
                { name: 'الورد اليومي بالأجزاء', value: `حوالي **${dailyJuz}** جزء يوميا.`, inline: true },
                { name: 'التقسيم المقترح بعد كل صلاة مفروضة', value: `قراءة **${pagesPerPrayer}** صفحات بعد كل صلاة من الصلوات الخمس المفروضة (الفجر، الظهر، العصر، المغرب، العشاء).`, inline: false },
                { name: 'نصيحة للاستمرار', value: 'احرص على تثبيت وقت مخصص للقراءة يوميا، واستعن بالله ولا تعجز.', inline: false }
            ]
        });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
