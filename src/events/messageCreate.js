const { createEmbed, COLORS } = require('../utils/embedBuilder');
const { getGuildConfig } = require('../config/database');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // تجاهل رسائل البوتات لتجنب التكرار اللانهائي
        if (message.author.bot) return;

        // التحقق مما إذا كان البوت قد تم عمل منشن له في الرسالة
        if (message.mentions.has(client.user)) {
            try {
                const config = await getGuildConfig(message.guild.id);
                // استخدام الرابط المخصص من قاعدة البيانات، أو رابط دعوة افتراضي للبوت كبديل
                const inviteUrl = config.invite_link || `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

                const embed = createEmbed({
                    title: 'معلومات وإعدادات البوت',
                    description: `اهلا <@${message.author.id}>\nامر الاعداد /set\nلاضافه البوت [اضغط هنا](${inviteUrl})`,
                    color: COLORS.primary
                });

                await message.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error responding to bot mention:', error.message);
            }
        }
    }
};
