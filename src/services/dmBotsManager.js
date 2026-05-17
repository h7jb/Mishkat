const { Client, GatewayIntentBits } = require('discord.js');
const { getAllDmBotConfigs } = require('../config/database');
const { getAllAzkarCombined } = require('./azkarApi');
const { createEmbed, COLORS } = require('../utils/embedBuilder');

// خريطة لتتبع البوتات الجانبية النشطة وتجنب تكرار تسجيل الدخول لنفس التوكن
const activeDmBots = new Map();

/**
 * تشغيل بوت جانبي واحد باستخدام التوكن الخاص به
 * @param {string} guildId 
 * @param {string} token 
 */
async function startSingleDmBot(guildId, token) {
    if (!token || activeDm(token)) return;

    try {
        const helper = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers, // مطلوب لجلب قائمة الأعضاء
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildPresences // مطلوب لمعرفة الأعضاء المتفاعلين (Online/Idle/DND)
            ]
        });

        helper.once('ready', () => {
            console.log(`Helper DM Bot logged in successfully as ${helper.user.tag}`);
            activeDmBots.set(token, helper);

            // إعداد مؤقت لإرسال الأذكار كل نصف ساعة (30 دقيقة) لعضو عشوائي متفاعل
            setInterval(() => {
                sendDmZikrToRandomActiveMember(helper);
            }, 30 * 60 * 1000);
        });

        helper.on('error', err => {
            console.error(`Helper DM Bot Error (${token.substring(0, 5)}...):`, err.message);
        });

        await helper.login(token);
    } catch (error) {
        console.error(`Failed to login helper DM bot (${token.substring(0, 5)}...):`, error.message);
    }
}

/**
 * التحقق مما إذا كان البوت مسجلا مسبقا
 */
function activeDm(token) {
    return activeDmBots.has(token);
}

/**
 * إرسال ذكر لعضو عشوائي متفاعل في السيرفرات التي يتواجد بها البوت الجانبي
 * @param {Client} helperClient 
 */
async function sendDmZikrToRandomActiveMember(helperClient) {
    try {
        helperClient.guilds.cache.forEach(async guild => {
            try {
                // جلب جميع الأعضاء في السيرفر
                const members = await guild.members.fetch();
                
                // تصفية الأعضاء: استبعاد البوتات واختيار الأعضاء المتفاعلين (حالتهم ليست Offline)
                let activeMembers = members.filter(m => !m.user.bot && m.presence && m.presence.status !== 'offline');

                // إذا لم يوجد أعضاء متفاعلون بالظاهر، نختار أي عضو بشري عادي
                if (activeMembers.size === 0) {
                    activeMembers = members.filter(m => !m.user.bot);
                }

                if (activeMembers.size === 0) return;

                // اختيار عضو عشوائي
                const randomMember = activeMembers.random();
                if (!randomMember) return;

                // جلب كل الأذكار المجمعة واختيار ذكر عشوائي منها
                const allAzkar = getAllAzkarCombined();
                const randomZikr = allAzkar[Math.floor(Math.random() * allAzkar.length)];

                const embed = createEmbed({
                    title: 'تذكير بذكر الله',
                    description: `السلام عليكم ورحمة الله وبركاته،\n\n**﴿ ${randomZikr} ﴾**\n\nنسأل الله أن يكتب لك الأجر والمثوبة ويديم عليك فضله.`,
                    color: COLORS.primary
                });

                await randomMember.send({ embeds: [embed] });
                console.log(`Successfully sent DM Zikr to ${randomMember.user.tag} from helper bot ${helperClient.user.tag}`);
            } catch (guildErr) {
                // تجاهل الأخطاء الناتجة عن إغلاق العضو لخاصية الرسائل الخاصة (DMs)
                console.error(`Could not send DM in guild ${guild.id} from helper ${helperClient.user.tag}:`, guildErr.message);
            }
        });
    } catch (err) {
        console.error('Error in sendDmZikrToRandomActiveMember:', err.message);
    }
}

/**
 * تهيئة وتشغيل جميع البوتات الجانبية المسجلة في قاعدة البيانات عند إقلاع البوت الأساسي
 */
async function initDmBots() {
    try {
        console.log('Initializing Helper DM Bots from database...');
        const configs = await getAllDmBotConfigs();
        console.log(`Found ${configs.length} guilds with DM bot configurations.`);

        for (const config of configs) {
            if (!config.dm_bot_tokens) continue;
            // تقسيم التوكنات في حال وجود أكثر من توكن مفصولة بفاصلة
            const tokens = config.dm_bot_tokens.split(',').map(t => t.trim()).filter(Boolean);
            for (const token of tokens) {
                await startSingleDmBot(config.guild_id, token);
            }
        }
    } catch (error) {
        console.error('Error initializing DM bots:', error.message);
    }
}

/**
 * إضافة وتشغيل توكنات جديدة ديناميكيا عند قيام المسؤول بتحديثها عبر أمر /set
 * @param {string} guildId 
 * @param {string} tokensString 
 */
async function addDmBotTokens(guildId, tokensString) {
    if (!tokensString) return;
    const tokens = tokensString.split(',').map(t => t.trim()).filter(Boolean);
    for (const token of tokens) {
        await startSingleDmBot(guildId, token);
    }
}

module.exports = {
    initDmBots,
    addDmBotTokens
};
