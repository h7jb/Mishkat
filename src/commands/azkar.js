const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../utils/embedBuilder');
const { getMorningAzkar, getEveningAzkar, getRandomOngoingZikr } = require('../services/azkarApi');
const { getGuildConfig } = require('../config/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('azkar')
        .setDescription('عرض أذكار الصباح، المساء، أو الأذكار الجارية يدويا')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('نوع الأذكار المطلوب عرضها')
                .setRequired(true)
                .addChoices(
                    { name: 'أذكار الصباح', value: 'morning' },
                    { name: 'أذكار المساء', value: 'evening' },
                    { name: 'أذكار جارية', value: 'ongoing' }
                )),

    async execute(interaction) {
        const type = interaction.options.getString('type');
        const config = await getGuildConfig(interaction.guild.id);

        let title = '';
        let description = '';
        let color = COLORS.primary;
        const fields = [];

        if (type === 'morning') {
            title = 'أذكار الصباح';
            const list = getMorningAzkar();
            description = list.slice(0, 7).map(z => `• ${z}`).join('\n\n');
            color = COLORS.primary;
        } else if (type === 'evening') {
            title = 'أذكار المساء';
            const list = getEveningAzkar();
            description = list.slice(0, 7).map(z => `• ${z}`).join('\n\n');
            color = COLORS.secondary;
        } else {
            title = 'أذكار جارية';
            // اختيار ذكر عشوائي من المصدر المتجدد
            description = getRandomOngoingZikr();
            color = COLORS.dark;

            if (config.ehsan_link) {
                fields.push({ name: 'منصة إحسان للعمل الخيري', value: `[تبرع الآن عبر منصة إحسان](${config.ehsan_link})`, inline: true });
            }
            if (config.masbaha_link) {
                fields.push({ name: 'المسبحة الإلكترونية', value: `[سبح واذكر الله](${config.masbaha_link})`, inline: true });
            }
        }

        return interaction.reply({
            embeds: [createEmbed({
                title,
                description,
                color,
                fields
            })],
            ephemeral: true // الأوامر مخفية حسب طلب المستخدم
        });
    }
};
