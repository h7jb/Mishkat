const axios = require('axios');

/**
 * جلب مواعيد الصلاة اليومية لمدينة محددة (الافتراضي: الرياض، المملكة العربية السعودية - تقويم أم القرى)
 * @param {string} city 
 * @param {string} country 
 * @returns {Promise<Object>}
 */
async function getPrayerTimes(city = 'Riyadh', country = 'Saudi Arabia') {
    try {
        // طريقة الحساب 4 تعني تقويم أم القرى (Umm Al-Qura)
        const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity`, {
            params: {
                city,
                country,
                method: 4
            }
        });

        if (response.data && response.data.data && response.data.data.timings) {
            const timings = response.data.data.timings;
            const hijri = response.data.data.date.hijri;
            const gregorian = response.data.data.date.gregorian;

            return {
                fajr: timings.Fajr,
                sunrise: timings.Sunrise,
                dhuhr: timings.Dhuhr,
                asr: timings.Asr,
                maghrib: timings.Maghrib,
                isha: timings.Isha,
                dateHijri: `${hijri.day} ${hijri.month.ar} ${hijri.year}`,
                dateGregorian: gregorian.date
            };
        }

        throw new Error('Invalid response structure from Aladhan API');
    } catch (error) {
        console.error('Error fetching prayer times:', error.message);
        // إرجاع أوقات افتراضية تقريبية في حال فشل الاتصال بالـ API
        return {
            fajr: '04:00',
            sunrise: '05:20',
            dhuhr: '11:55',
            asr: '15:20',
            maghrib: '18:30',
            isha: '20:00',
            dateHijri: 'غير متوفر حاليا',
            dateGregorian: new Date().toLocaleDateString('en-GB')
        };
    }
}

module.exports = {
    getPrayerTimes
};
