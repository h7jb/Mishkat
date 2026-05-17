const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../utils/embedBuilder');
const { getGuildConfig } = require('../config/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('الحصول على رابط دعوة البوت لإضافته إلى سيرفرك الخاص'),

    async execute(interaction) {
        const config = await getGuildConfig(interaction.guild.id);
        const client = interaction.client;
        
        // استخدام الرابط المخصص من قاعدة البيانات، أو توليد رابط دعوة بصلاحيات كاملة تلقائيا
        const inviteUrl = config.invite_link || `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

        const embed = createEmbed({
            title: 'دعوة بوت Mishkat | مِشكاة',
            description: `يسعدنا ويشرفنا استخدامك للبوت ورغبتك في نشره لتعم الفائدة والأجر.\n\nلإضافة البوت إلى سيرفرك الخاص والاستفادة من تلاوة القرآن 24/7 والأذكار التلقائية:\n\n[اضغط هنا لإضافة البوت لسيرفرك](${inviteUrl})`,
            color: COLORS.primary,
            fields: [
                { name: 'ملاحظة للمسؤولين', value: 'بعد إضافة البوت لسيرفرك، يمكنك استخدام الأمر /set لتعيين القناة الصوتية للقرآن والقناة الكتابية للأذكار.', inline: false }
            ]
        });

        // جعل الرد متاحا للجميع (عام) ليتمكن أي شخص من رؤية الرابط واستخدامه
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
