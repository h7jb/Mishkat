const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateGuildConfig, getGuildConfig } = require('../config/database');
const { createEmbed, COLORS } = require('../utils/embedBuilder');
const { joinQuranVoiceChannel } = require('../services/audioPlayer');
const { addDmBotTokens } = require('../services/dmBotsManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set')
        .setDescription('إعداد القناة الصوتية، الكتابية، وتوكنات البوتات الجانبية لإرسال الأذكار بالخاص (للمسؤولين فقط)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // مخصص للأدمن فقط
        .addChannelOption(option =>
            option.setName('voice_channel')
                .setDescription('القناة الصوتية المخصصة لتلاوة القرآن الكريم على مدار 24/7')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('text_channel')
                .setDescription('القناة الكتابية المخصصة لإرسال أذكار الصباح والمساء ومواعيد الصلاة')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('dm_bot_tokens')
                .setDescription('توكنات البوتات الجانبية لإرسال الأذكار للأعضاء في الخاص (افصل بينها بفاصلة)')
                .setRequired(false)),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                embeds: [createEmbed({
                    title: 'صلاحيات غير كافية',
                    description: 'هذا الأمر مخصص لإدارة السيرفر فقط ولا يمكنك استخدامه.',
                    color: COLORS.error
                })],
                ephemeral: true
            });
        }

        const voiceChannel = interaction.options.getChannel('voice_channel');
        const textChannel = interaction.options.getChannel('text_channel');
        const dmBotTokens = interaction.options.getString('dm_bot_tokens');

        const updates = {};
        if (voiceChannel !== null) updates.voice_channel_id = voiceChannel.id;
        if (textChannel !== null) updates.text_channel_id = textChannel.id;
        if (dmBotTokens !== null) updates.dm_bot_tokens = dmBotTokens;

        if (Object.keys(updates).length === 0) {
            const current = await getGuildConfig(interaction.guild.id);
            return interaction.reply({
                embeds: [createEmbed({
                    title: 'إعدادات القنوات والبوتات الحالية',
                    description: 'لم تقم بتحديد أي إعدادات جديدة. إليك الإعدادات المسجلة حاليا:',
                    color: COLORS.info,
                    fields: [
                        { name: 'قناة القرآن الكريم الصوتية', value: current.voice_channel_id ? `<#${current.voice_channel_id}>` : 'غير محددة', inline: false },
                        { name: 'قناة الأذكار الكتابية', value: current.text_channel_id ? `<#${current.text_channel_id}>` : 'غير محددة', inline: false },
                        { name: 'توكنات البوتات الجانبية (للخاص)', value: current.dm_bot_tokens ? 'مسجلة ومفعلة' : 'غير مسجلة', inline: false }
                    ]
                })],
                ephemeral: true // مخفي حسب طلب المستخدم
            });
        }

        try {
            await updateGuildConfig(interaction.guild.id, updates);
            const updatedConfig = await getGuildConfig(interaction.guild.id);

            // إذا تم تحديد قناة صوتية، نجعل البوت ينضم إليها فورا لتشغيل القرآن 24/7
            if (voiceChannel) {
                await joinQuranVoiceChannel(interaction.guild, voiceChannel.id);
            }

            // إذا تم تحديد توكنات للبوتات الجانبية، نقوم بتسجيل دخولها فورا
            if (dmBotTokens) {
                await addDmBotTokens(interaction.guild.id, dmBotTokens);
            }

            return interaction.reply({
                embeds: [createEmbed({
                    title: 'تم حفظ الإعدادات بنجاح',
                    description: 'تم تحديث إعدادات القنوات والبوتات الجانبية وتفعيلها فورا.',
                    color: COLORS.primary,
                    fields: [
                        { name: 'قناة القرآن الكريم الصوتية', value: updatedConfig.voice_channel_id ? `<#${updatedConfig.voice_channel_id}>` : 'غير محددة', inline: false },
                        { name: 'قناة الأذكار الكتابية', value: updatedConfig.text_channel_id ? `<#${updatedConfig.text_channel_id}>` : 'غير محددة', inline: false },
                        { name: 'توكنات البوتات الجانبية (للخاص)', value: updatedConfig.dm_bot_tokens ? 'مسجلة ومفعلة فورا' : 'غير مسجلة', inline: false }
                    ]
                })],
                ephemeral: true // مخفي
            });
        } catch (error) {
            console.error('Error updating channel config:', error.message);
            return interaction.reply({
                embeds: [createEmbed({
                    title: 'خطأ في الحفظ',
                    description: 'حدث خطأ أثناء محاولة حفظ الإعدادات في قاعدة البيانات.',
                    color: COLORS.error
                })],
                ephemeral: true
            });
        }
    }
};
