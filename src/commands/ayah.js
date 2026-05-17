const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../utils/embedBuilder');

// قائمة بآيات قرآنية ملهمة ومؤثرة (بدون إيموجيات)
const QURAN_AYAT = [
    { text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", surah: "سورة الشرح", number: "6" },
    { text: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَى", surah: "سورة الضحى", number: "5" },
    { text: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ", surah: "سورة البقرة", number: "186" },
    { text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", surah: "سورة الطلاق", number: "2-3" },
    { text: "لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا", surah: "سورة التوبة", number: "40" },
    { text: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ", surah: "سورة غافر", number: "60" },
    { text: "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ", surah: "سورة النحل", number: "127" },
    { text: "رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا", surah: "سورة البقرة", number: "286" },
    { text: "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", surah: "سورة الرعد", number: "28" },
    { text: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ وَاللَّهُ بِمَا تَعْمَلُونَ بَصِيرٌ", surah: "سورة الحديد", number: "4" },
    { text: "سَيَجْعَلُ اللَّهُ بَعْدَ عُسْرٍ يُسْرًا", surah: "سورة الطلاق", number: "7" },
    { text: "فَاصْبِرْ صَبْرًا جَمِيلًا", surah: "سورة المعارج", number: "5" },
    { text: "مَا أَنزَلْنَا عَلَيْكَ الْقُرْآنَ لِتَشْقَى", surah: "سورة طه", number: "2" },
    { text: "وَاللَّهُ يَعْلَمُ وَأَنتُمْ لَا تَعْلَمُونَ", surah: "سورة البقرة", number: "216" }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ayah')
        .setDescription('عرض آية قرآنية ملهمة ومؤثرة للتأمل اليومي'),

    async execute(interaction) {
        // اختيار آية عشوائية
        const randomAyah = QURAN_AYAT[Math.floor(Math.random() * QURAN_AYAT.length)];

        const embed = createEmbed({
            title: 'آية اليوم للتأمل',
            description: `قال الله تعالى:\n\n**﴿ ${randomAyah.text} ﴾**\n\n[${randomAyah.surah} - آية ${randomAyah.number}]`,
            color: COLORS.primary
        });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
