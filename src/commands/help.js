const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('عرض قائمة بجميع أوامر البوت وشرح وظائفها ومميزاتها'),

    async execute(interaction) {
        const embed = createEmbed({
            title: 'دليل أوامر بوت Mishkat | مِشكاة',
            description: 'مرحبا بك في دليل استخدام البوت. إليك قائمة بجميع الأوامر المتاحة ووظيفة كل منها:',
            color: COLORS.primary,
            fields: [
                { name: '/azkar', value: 'عرض أذكار الصباح، أذكار المساء، أو الأذكار الجارية يدويا في أي وقت.', inline: false },
                { name: '/prayer', value: 'عرض مواعيد الصلاة الدقيقة لليوم الحالي حسب تقويم أم القرى.', inline: false },
                { name: '/ayah', value: 'عرض آية قرآنية ملهمة ومؤثرة للتأمل اليومي مع اسم السورة ورقم الآية.', inline: false },
                { name: '/asmaa', value: 'عرض مجموعة متجددة من أسماء الله الحسنى مع معانيها الجليلة وشرحها الوافي.', inline: false },
                { name: '/khatma', value: 'حاسبة ومُنظّم لجدول ختم القرآن الكريم خلال مدة محددة (من 3 إلى 60 يوما) مع تقسيم الورد بعد الصلوات.', inline: false },
                { name: '/info', value: 'عرض إحصائيات البوت الحية (عدد السيرفرات، قنوات التلاوة النشطة 24/7، وسرعة الاستجابة).', inline: false },
                { name: '/invite', value: 'الحصول على رابط دعوة البوت المباشر لإضافته إلى سيرفرك الخاص ومشاركة الأجر.', inline: false },
                { name: '/set', value: '(للمسؤولين فقط) تعيين القناة الصوتية للقرآن 24/7، القناة الكتابية للأذكار، وتوكنات البوتات الجانبية للخاص.', inline: false }
            ]
        });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
