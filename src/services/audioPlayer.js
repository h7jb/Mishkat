const { 
    createAudioPlayer, 
    createAudioResource, 
    joinVoiceChannel, 
    AudioPlayerStatus, 
    VoiceConnectionStatus, 
    NoSubscriberBehavior 
} = require('@discordjs/voice');

// قائمة نخبة من القراء من خوادم mp3quran.net الموثوقة
const RECITERS = [
    { name: 'مشاري راشد العفاسي', url: 'https://server8.mp3quran.net/afs/' },
    { name: 'عبد الباسط عبد الصمد', url: 'https://server7.mp3quran.net/basit/' },
    { name: 'سعد الغامدي', url: 'https://server7.mp3quran.net/s_gmd/' },
    { name: 'ماهر المعيقلي', url: 'https://server12.mp3quran.net/maher/' },
    { name: 'ياسر الدوسري', url: 'https://server11.mp3quran.net/yasser/' },
    { name: 'أبو بكر الشاطري', url: 'https://server11.mp3quran.net/shatri/' },
    { name: 'ناصر القطامي', url: 'https://server6.mp3quran.net/qtm/' },
    { name: 'أحمد العجمي', url: 'https://server10.mp3quran.net/ajm/' },
    { name: 'خالد الجليل', url: 'https://server10.mp3quran.net/jleel/' },
    { name: 'إدريس أبكر', url: 'https://server6.mp3quran.net/abkr/' }
];

// إنشاء مشغل صوتي عالمي واحد (Global Audio Player) تشترك فيه جميع السيرفرات لتوفير الذاكرة والمعالجة
const globalPlayer = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Play // استمرار التشغيل حتى لو لم يكن هناك مستمعين حاليا
    }
});

let currentSurah = 1;
let currentReciterIndex = 0;
// خريطة لتتبع اتصالات الصوت لكل سيرفر
const voiceConnections = new Map();

/**
 * تحويل رقم السورة إلى صيغة 3 خانات (مثال: 001, 025, 114)
 * @param {number} num 
 * @returns {string}
 */
function getSurahNumberString(num) {
    return num.toString().padStart(3, '0');
}

/**
 * تشغيل السورة الحالية في المشغل العالمي
 */
function playCurrentSurah() {
    try {
        const reciter = RECITERS[currentReciterIndex];
        const surahStr = getSurahNumberString(currentSurah);
        const audioUrl = `${reciter.url}${surahStr}.mp3`;

        console.log(`Playing Surah ${currentSurah} (${surahStr}) with Reciter: ${reciter.name}`);

        const resource = createAudioResource(audioUrl, {
            inlineVolume: true
        });
        resource.volume.setVolume(0.8); // مستوى صوت متزن ومريح

        globalPlayer.play(resource);
    } catch (error) {
        console.error(`Error playing Surah ${currentSurah}:`, error.message);
        // في حال حدوث خطأ، الانتقال للسورة التالية بعد 5 ثواني
        setTimeout(playNextSurah, 5000);
    }
}

/**
 * الانتقال للسورة التالية وتنويع القارئ
 */
function playNextSurah() {
    currentSurah++;
    if (currentSurah > 114) {
        currentSurah = 1; // العودة للفاتحة عند ختم القرآن
    }
    // اختيار قارئ مختلف عشوائيا لتنويع التلاوات حسب طلب المستخدم
    currentReciterIndex = Math.floor(Math.random() * RECITERS.length);
    playCurrentSurah();
}

// إعداد أحداث المشغل الصوتي العالمي
globalPlayer.on(AudioPlayerStatus.Idle, () => {
    console.log('AudioPlayer is idle. Moving to next Surah...');
    playNextSurah();
});

globalPlayer.on('error', (error) => {
    console.error('AudioPlayer encountered an error:', error.message);
    setTimeout(playNextSurah, 5000);
});

/**
 * انضمام البوت لقناة صوتية والاشتراك في المشغل العالمي 24/7
 * @param {Object} guild 
 * @param {string} channelId 
 */
async function joinQuranVoiceChannel(guild, channelId) {
    try {
        const connection = joinVoiceChannel({
            channelId: channelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true // كتم صوت البوت للاستماع لتخفيف استهلاك الباندويث
        });

        connection.subscribe(globalPlayer);
        voiceConnections.set(guild.id, connection);

        console.log(`Joined voice channel ${channelId} in guild ${guild.id}. Subscribed to global Quran player.`);

        // معالجة انقطاع الاتصال ومحاولة إعادة الاتصال التلقائي
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            console.log(`Voice connection disconnected in guild ${guild.id}. Attempting to reconnect...`);
            try {
                await Promise.race([
                    new Promise((resolve) => connection.once(VoiceConnectionStatus.Signalling, resolve)),
                    new Promise((resolve) => connection.once(VoiceConnectionStatus.Connecting, resolve)),
                ]);
            } catch (error) {
                console.log(`Destroying connection for guild ${guild.id} after disconnect timeout.`);
                connection.destroy();
                voiceConnections.delete(guild.id);
            }
        });

        return true;
    } catch (error) {
        console.error(`Failed to join voice channel in guild ${guild.id}:`, error.message);
        return false;
    }
}

/**
 * بدء تشغيل النظام الصوتي عند إقلاع البوت
 */
function initAudioSystem() {
    playCurrentSurah();
}

module.exports = {
    initAudioSystem,
    joinQuranVoiceChannel,
    globalPlayer,
    voiceConnections
};
