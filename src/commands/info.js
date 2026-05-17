const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../utils/embedBuilder');
const { voiceConnections } = require('../services/audioPlayer');
const { getGuildConfig } = require('../config/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('عرض معلومات البوت، إحصائياته، وحالة التلاوة المستمرة 24/7'),

    async execute(interaction) {
        const client = interaction.client;
        const config = await getGuildConfig(interaction.guild.id);

        const totalGuilds = client.guilds.cache.size;
        const activeVoiceStreams = voiceConnections.size;
        const ping = client.ws.ping;
        
        // حساب وقت التشغيل
        const totalSeconds = Math.floor(client.uptime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const uptimeStr = `${hours} ساعة و ${minutes} دقيقة`;

        const inviteUrl = config.invite_link || `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

        const embed = createEmbed({
            title: 'إحصائيات ومعلومات بوت Mishkat | مِشكاة',
            description: 'بوت مخصص لنشر الخير، الأذكار، التلاوة الصوتية 24/7، ومواعيد الصلاة.',
            color: COLORS.info,
            fields: [
                { name: 'عدد السيرفرات المتواجد بها', value: `**${totalGuilds}** سيرفر`, inline: true },
                { name: 'قنوات التلاوة النشطة 24/7', value: `**${activeVoiceStreams}** قناة صوتية`, inline: true },
                { name: 'سرعة استجابة البوت (Ping)', value: `**${ping}** ملي ثانية`, inline: true },
                { name: 'مدة التشغيل المستمر (Uptime)', value: uptimeStr, inline: true },
                { name: 'رابط دعوة البوت المباشر', value: `[اضغط هنا لدعوة البوت](${inviteUrl})`, inline: false }
            ]
        });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
