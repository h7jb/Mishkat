const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuildConfig, getGuildConfig, setBotSetting, getAllDmBotConfigs } = require('../config/database');
const { createEmbed, COLORS } = require('../utils/embedBuilder');
const { voiceConnections } = require('../services/audioPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('أوامر الإدارة الشاملة لمالك البوت (مخصصة للسيرفر الأساسي فقط)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // مخصص للأدمن فقط
        .addSubcommand(subcommand =>
            subcommand
                .setName('links')
                .setDescription('إعداد الروابط الخاصة بالبوت (إحسان، المسبحة، رابط الإضافة)')
                .addStringOption(option =>
                    option.setName('invite_link')
                        .setDescription('رابط دعوة البوت المخصص لإضافته للسيرفرات')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('ehsan_link')
                        .setDescription('رابط التبرع الخاص بمنصة إحسان')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('masbaha_link')
                        .setDescription('رابط المسبحة الإلكترونية')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('servers')
                .setDescription('عرض قائمة السيرفرات التي يتواجد بها البوت حاليا'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('فحص حالة النظام، استهلاك الموارد، وأداء البوت'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('presence')
                .setDescription('تغيير حالة التواجد ونشاط البوت (ستريم، DND، يلعب، إلخ) وحفظها دائما')
                .addIntegerOption(option =>
                    option.setName('activity_type')
                        .setDescription('نوع النشاط')
                        .setRequired(true)
                        .addChoices(
                            { name: 'يلعب (Playing)', value: 0 },
                            { name: 'يبث (Streaming)', value: 1 },
                            { name: 'يستمع (Listening)', value: 2 },
                            { name: 'يشاهد (Watching)', value: 3 },
                            { name: 'ينافس (Competing)', value: 5 }
                        ))
                .addStringOption(option =>
                    option.setName('activity_text')
                        .setDescription('نص النشاط (مثال: تلاوة القرآن | /help)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('status')
                        .setDescription('حالة التواجد (Online, Idle, DND, Invisible)')
                        .setRequired(true)
                        .addChoices(
                            { name: 'متصل (Online)', value: 'online' },
                            { name: 'خامل (Idle)', value: 'idle' },
                            { name: 'مشغول (DND)', value: 'dnd' },
                            { name: 'مخفي (Invisible)', value: 'invisible' }
                        ))
                .addStringOption(option =>
                    option.setName('stream_url')
                        .setDescription('رابط البث المباشر (Twitch/YouTube - مطلوب فقط في حال اختيار نشاط يبث)')
                        .setRequired(false))),

    async execute(interaction) {
        // التحقق من أن الأمر يشتغل حصرا في السيرفر الأساسي لمالك البوت
        if (process.env.MAIN_GUILD_ID && interaction.guild.id !== process.env.MAIN_GUILD_ID) {
            return interaction.reply({
                embeds: [createEmbed({
                    title: 'أمر غير مصرح',
                    description: 'هذا الأمر مخصص لإدارة السيرفر الأساسي لمالك البوت فقط ولا يمكن استخدامه في هذا السيرفر.',
                    color: COLORS.error
                })],
                ephemeral: true
            });
        }

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

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'links') {
            const inviteLink = interaction.options.getString('invite_link');
            const ehsanLink = interaction.options.getString('ehsan_link');
            const masbahaLink = interaction.options.getString('masbaha_link');

            const updates = {};
            if (inviteLink !== null) updates.invite_link = inviteLink;
            if (ehsanLink !== null) updates.ehsan_link = ehsanLink;
            if (masbahaLink !== null) updates.masbaha_link = masbahaLink;

            if (Object.keys(updates).length === 0) {
                const current = await getGuildConfig(interaction.guild.id);
                return interaction.reply({
                    embeds: [createEmbed({
                        title: 'الروابط الحالية للبوت',
                        description: 'لم تقم بتمرير أي روابط جديدة للتحديث. إليك الروابط الحالية المسجلة:',
                        color: COLORS.info,
                        fields: [
                            { name: 'رابط إضافة البوت', value: current.invite_link || 'غير محدد', inline: false },
                            { name: 'رابط منصة إحسان', value: current.ehsan_link || 'غير محدد', inline: false },
                            { name: 'رابط المسبحة', value: current.masbaha_link || 'غير محدد', inline: false }
                        ]
                    })],
                    ephemeral: true
                });
            }

            try {
                await updateGuildConfig(interaction.guild.id, updates);
                const updatedConfig = await getGuildConfig(interaction.guild.id);

                return interaction.reply({
                    embeds: [createEmbed({
                        title: 'تم تحديث الروابط بنجاح',
                        description: 'تم حفظ الروابط الجديدة في قاعدة البيانات وتفعيلها فورا.',
                        color: COLORS.primary,
                        fields: [
                            { name: 'رابط إضافة البوت', value: updatedConfig.invite_link || 'غير محدد', inline: false },
                            { name: 'رابط منصة إحسان', value: updatedConfig.ehsan_link || 'غير محدد', inline: false },
                            { name: 'رابط المسبحة', value: updatedConfig.masbaha_link || 'غير محدد', inline: false }
                        ]
                    })],
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error updating admin links:', error.message);
                return interaction.reply({
                    embeds: [createEmbed({
                        title: 'خطأ في التحديث',
                        description: 'حدث خطأ أثناء محاولة حفظ الروابط في قاعدة البيانات.',
                        color: COLORS.error
                    })],
                    ephemeral: true
                });
            }
        } else if (subcommand === 'servers') {
            const client = interaction.client;
            const guilds = client.guilds.cache;
            const totalGuilds = guilds.size;
            
            // استعراض أول 20 سيرفر لتجنب تجاوز حد الحروف في ديسكورد
            const serversList = guilds.first(20).map(g => `• **${g.name}** (الأعضاء: ${g.memberCount})`).join('\n');
            const overflow = totalGuilds > 20 ? `\n...و ${totalGuilds - 20} سيرفر آخر.` : '';

            return interaction.reply({
                embeds: [createEmbed({
                    title: `قائمة السيرفرات (الإجمالي: ${totalGuilds} سيرفر)`,
                    description: `يتواجد البوت حاليا في السيرفرات التالية:\n\n${serversList}${overflow}`,
                    color: COLORS.info
                })],
                ephemeral: true
            });
        } else if (subcommand === 'status') {
            const client = interaction.client;
            const memUsage = process.memoryUsage();
            const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
            const activeStreams = voiceConnections.size;
            
            let dmBotsCount = 0;
            try {
                const dmConfigs = await getAllDmBotConfigs();
                dmBotsCount = dmConfigs.reduce((acc, curr) => acc + (curr.dm_bot_tokens ? curr.dm_bot_tokens.split(',').length : 0), 0);
            } catch (err) {
                console.error('Error counting DM bots:', err.message);
            }

            const totalSeconds = Math.floor(client.uptime / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);

            return interaction.reply({
                embeds: [createEmbed({
                    title: 'حالة النظام والأداء الحية',
                    description: 'تقرير فحص أداء البوت واستهلاك الخادم:',
                    color: COLORS.secondary,
                    fields: [
                        { name: 'استهلاك الذاكرة (RAM)', value: `${heapUsedMB} ميجابايت`, inline: true },
                        { name: 'مدة التشغيل المستمر', value: `${hours} ساعة و ${minutes} دقيقة`, inline: true },
                        { name: 'سرعة الاتصال (Ping)', value: `${client.ws.ping} ملي ثانية`, inline: true },
                        { name: 'قنوات التلاوة 24/7 النشطة', value: `${activeStreams} قناة صوتية`, inline: true },
                        { name: 'البوتات الجانبية للخاص', value: `${dmBotsCount} بوت مساعد`, inline: true }
                    ]
                })],
                ephemeral: true
            });
        } else if (subcommand === 'presence') {
            const activityType = interaction.options.getInteger('activity_type');
            const activityText = interaction.options.getString('activity_text');
            const status = interaction.options.getString('status');
            const streamUrl = interaction.options.getString('stream_url');

            const presenceData = {
                activities: [{
                    name: activityText,
                    type: activityType,
                    url: streamUrl || undefined
                }],
                status: status
            };

            try {
                await interaction.client.user.setPresence(presenceData);
                await setBotSetting('bot_presence', JSON.stringify(presenceData));

                const typeNames = { 0: 'يلعب', 1: 'يبث', 2: 'يستمع', 3: 'يشاهد', 5: 'ينافس' };
                const statusNames = { online: 'متصل', idle: 'خامل', dnd: 'مشغول (DND)', invisible: 'مخفي' };

                return interaction.reply({
                    embeds: [createEmbed({
                        title: 'تم تغيير حالة ونشاط البوت بنجاح',
                        description: 'تم تطبيق الحالة الجديدة على البوت وحفظها في قاعدة البيانات لتستمر حتى بعد إعادة التشغيل.',
                        color: COLORS.primary,
                        fields: [
                            { name: 'النشاط', value: `${typeNames[activityType]}: ${activityText}`, inline: true },
                            { name: 'الوضع', value: statusNames[status], inline: true }
                        ]
                    })],
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error setting presence:', error.message);
                return interaction.reply({
                    embeds: [createEmbed({
                        title: 'خطأ في تغيير الحالة',
                        description: 'حدث خطأ أثناء محاولة تحديث حالة ونشاط البوت.',
                        color: COLORS.error
                    })],
                    ephemeral: true
                });
            }
        }
    }
};
