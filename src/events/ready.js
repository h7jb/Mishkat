const { REST, Routes } = require('discord.js');
const { initScheduler } = require('../services/scheduler');
const { initAudioSystem, joinQuranVoiceChannel } = require('../services/audioPlayer');
const { getAllVoiceConfigs, getBotSetting } = require('../config/database');
const { fetchAndCacheAzkar } = require('../services/azkarApi');
const { initDmBots } = require('../services/dmBotsManager');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);

        // 0. استعادة حالة ونشاط البوت المحفوظة في قاعدة البيانات
        try {
            const savedPresence = await getBotSetting('bot_presence');
            if (savedPresence) {
                const presenceData = JSON.parse(savedPresence);
                client.user.setPresence(presenceData);
                console.log('Restored bot presence from database.');
            }
        } catch (err) {
            console.error('Error restoring bot presence:', err.message);
        }

        // 0.5 جلب الأذكار المتجددة من المصدر الخارجي الموثوق وتخزينها محليا
        await fetchAndCacheAzkar();
        // تحديث الأذكار من المصدر الخارجي كل 12 ساعة لضمان استمرار التجدد
        setInterval(fetchAndCacheAzkar, 12 * 60 * 60 * 1000);

        // 1. تسجيل أوامر السلاش (Slash Commands)
        const commands = [];
        const commandsPath = path.join(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            if (command.data && command.execute) {
                commands.push(command.data.toJSON());
                client.commands.set(command.data.name, command);
            }
        }

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        try {
            console.log('Started refreshing application (/) commands.');
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );
            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('Error registering slash commands:', error.message);
        }

        // 2. تشغيل نظام الجدولة التلقائية (الأذكار ومواعيد الصلاة)
        initScheduler(client);

        // 3. تشغيل النظام الصوتي للقرآن الكريم 24/7
        initAudioSystem();

        // 3.5 تشغيل البوتات الجانبية لإرسال الأذكار في الخاص للأعضاء
        initDmBots();

        // 4. استرجاع القنوات الصوتية المسجلة في قاعدة البيانات والانضمام إليها تلقائيا
        try {
            const voiceConfigs = await getAllVoiceConfigs();
            console.log(`Found ${voiceConfigs.length} voice configurations in database.`);
            for (const config of voiceConfigs) {
                if (!config.voice_channel_id) continue;
                try {
                    const guild = await client.guilds.fetch(config.guild_id);
                    if (guild) {
                        await joinQuranVoiceChannel(guild, config.voice_channel_id);
                    }
                } catch (err) {
                    console.error(`Could not join voice channel for guild ${config.guild_id}:`, err.message);
                }
            }
        } catch (error) {
            console.error('Error auto-joining voice channels on ready:', error.message);
        }

        console.log('Mishkat | مِشكاة Bot is fully operational.');
    }
};
