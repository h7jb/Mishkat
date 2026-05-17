const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { cleanEmojis } = require('../utils/embedBuilder');

// مسار ملف التخزين المؤقت المحلي لضمان عمل البوت 100% حتى لو انقطع الاتصال بالمصدر الخارجي
const CACHE_FILE = path.resolve(__dirname, '../../azkar_cache.json');

// المصدر الخارجي الموثوق والمتجدد للأذكار (مستودع أذكار شامل وموثوق)
const AZKAR_API_URL = 'https://raw.githubusercontent.com/nawafalqari/azkar-api/56df51279ab6eb86dc2f6202c7de26c8948331c1/azkar.json';

// قاعدة بيانات محلية فارغة تعتمد 100% على المصدر الخارجي وملف التخزين المؤقت
let localAzkarData = {
    morning: [],
    evening: [],
    ongoing: []
};

/**
 * تحديث وجلب الأذكار من المصدر الخارجي وحفظها محليا
 */
async function fetchAndCacheAzkar() {
    try {
        console.log('Fetching latest Azkar from external active source...');
        const response = await axios.get(AZKAR_API_URL, { timeout: 10000 });
        
        if (response.data) {
            const data = response.data;
            const newAzkar = {
                morning: [],
                evening: [],
                ongoing: []
            };

            // استخراج أذكار الصباح
            if (data['أذكار الصباح']) {
                newAzkar.morning = data['أذكار الصباح'].map(item => cleanEmojis(item.content)).filter(Boolean);
            }
            // استخراج أذكار المساء
            if (data['أذكار المساء']) {
                newAzkar.evening = data['أذكار المساء'].map(item => cleanEmojis(item.content)).filter(Boolean);
            }
            // استخراج الأذكار العامة والتسابيح والأدعية (أذكار جارية)
            const ongoingCategories = ['تسابيح', 'أدعية قرآنية', 'أدعية الأنبياء', 'أذكار بعد السلام من الصلاة المفروضة'];
            for (const cat of ongoingCategories) {
                if (data[cat]) {
                    const items = data[cat].map(item => cleanEmojis(item.content)).filter(Boolean);
                    newAzkar.ongoing.push(...items);
                }
            }

            // التأكد من وجود بيانات قبل استبدال البيانات المحلية
            if (newAzkar.morning.length > 0 && newAzkar.evening.length > 0 && newAzkar.ongoing.length > 0) {
                localAzkarData = newAzkar;
                fs.writeFileSync(CACHE_FILE, JSON.stringify(localAzkarData, null, 2), 'utf8');
                console.log('Azkar cache updated successfully from external source.');
                return;
            }
        }
        throw new Error('Invalid data structure received from external Azkar API');
    } catch (error) {
        console.error('Error fetching external Azkar, falling back to cache/local data:', error.message);
        // محاولة القراءة من ملف الكاش المحلي إذا كان موجودا
        if (fs.existsSync(CACHE_FILE)) {
            try {
                const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
                if (cached.morning && cached.evening && cached.ongoing) {
                    localAzkarData = cached;
                    console.log('Loaded Azkar from local cache file.');
                }
            } catch (err) {
                console.error('Error reading cache file:', err.message);
            }
        }
    }
}

/**
 * الحصول على قائمة أذكار الصباح
 * @returns {Array<string>}
 */
function getMorningAzkar() {
    return localAzkarData.morning || [];
}

/**
 * الحصول على قائمة أذكار المساء
 * @returns {Array<string>}
 */
function getEveningAzkar() {
    return localAzkarData.evening || [];
}

/**
 * الحصول على ذكر عشوائي من الأذكار الجارية
 * @returns {string}
 */
function getRandomOngoingZikr() {
    const list = localAzkarData.ongoing || [];
    if (list.length === 0) return "سبحان الله وبحمده، سبحان الله العظيم.";
    return list[Math.floor(Math.random() * list.length)];
}

/**
 * الحصول على جميع الأذكار مجمعة من كل الفئات (صباح، مساء، جارية)
 * @returns {Array<string>}
 */
function getAllAzkarCombined() {
    const morning = localAzkarData.morning || [];
    const evening = localAzkarData.evening || [];
    const ongoing = localAzkarData.ongoing || [];
    const combined = [...morning, ...evening, ...ongoing];
    if (combined.length === 0) return ["سبحان الله وبحمده، سبحان الله العظيم."];
    return combined;
}

module.exports = {
    fetchAndCacheAzkar,
    getMorningAzkar,
    getEveningAzkar,
    getRandomOngoingZikr,
    getAllAzkarCombined
};
