const { EmbedBuilder } = require('discord.js');

// الألوان المتناسقة والهادئة (بدون ألوان صارخة أو تقليدية)
const COLORS = {
    primary: 0x1B4D3E, // أخضر داكن ووقور
    secondary: 0xC5A880, // ذهبي هادئ
    dark: 0x2A2D34, // رمادي داكن
    info: 0x3A6073, // أزرق بترولي
    error: 0x8B0000 // أحمر داكن
};

/**
 * دالة مساعدة لتنظيف النصوص من أي إيموجيات محتملة لضمان الالتزام التام بشرط المستخدم
 * @param {string} text 
 * @returns {string}
 */
function cleanEmojis(text) {
    if (!text) return '';
    // إزالة الإيموجيات والرموز التعبيرية
    return text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
}

/**
 * إنشاء Embed احترافي ووقور خالي من الإيموجيات
 * @param {Object} options 
 * @param {string} options.title 
 * @param {string} options.description 
 * @param {number} [options.color] 
 * @param {Array} [options.fields] 
 * @param {string} [options.footer] 
 * @returns {EmbedBuilder}
 */
function createEmbed({ title, description, color = COLORS.primary, fields = [], footer = 'Mishkat | مِشكاة' }) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTimestamp();

    if (title) embed.setTitle(cleanEmojis(title));
    if (description) embed.setDescription(cleanEmojis(description));
    if (footer) embed.setFooter({ text: cleanEmojis(footer) });

    if (fields && fields.length > 0) {
        const cleanedFields = fields.map(f => ({
            name: cleanEmojis(f.name),
            value: cleanEmojis(f.value),
            inline: !!f.inline
        }));
        embed.addFields(cleanedFields);
    }

    return embed;
}

module.exports = {
    COLORS,
    cleanEmojis,
    createEmbed
};
