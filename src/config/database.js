const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initDb();
    }
});

function initDb() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS guild_configs (
            guild_id TEXT PRIMARY KEY,
            text_channel_id TEXT,
            voice_channel_id TEXT,
            invite_link TEXT,
            ehsan_link TEXT,
            masbaha_link TEXT,
            dm_bot_tokens TEXT
        )
    `;
    db.run(createTableQuery, (err) => {
        if (err) {
            console.error('Failed to create guild_configs table:', err.message);
        } else {
            console.log('guild_configs table initialized.');
            // محاولة إضافة العمود في حال كانت القاعدة القديمة موجودة مسبقا
            db.run('ALTER TABLE guild_configs ADD COLUMN dm_bot_tokens TEXT', (alterErr) => {
                // تجاهل الخطأ إذا كان العمود موجودا بالفعل
            });
        }
    });

    const createSettingsQuery = `
        CREATE TABLE IF NOT EXISTS bot_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `;
    db.run(createSettingsQuery, (err) => {
        if (err) {
            console.error('Failed to create bot_settings table:', err.message);
        } else {
            console.log('bot_settings table initialized.');
        }
    });
}

function getBotSetting(key) {
    return new Promise((resolve, reject) => {
        db.get('SELECT value FROM bot_settings WHERE key = ?', [key], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.value : null);
        });
    });
}

function setBotSetting(key, value) {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO bot_settings (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `;
        db.run(query, [key, value], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
}

function getGuildConfig(guildId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM guild_configs WHERE guild_id = ?', [guildId], (err, row) => {
            if (err) reject(err);
            else resolve(row || { guild_id: guildId });
        });
    });
}

function getAllVoiceConfigs() {
    return new Promise((resolve, reject) => {
        db.all('SELECT guild_id, voice_channel_id FROM guild_configs WHERE voice_channel_id IS NOT NULL', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

function getAllTextConfigs() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM guild_configs WHERE text_channel_id IS NOT NULL', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

function getAllDmBotConfigs() {
    return new Promise((resolve, reject) => {
        db.all('SELECT guild_id, dm_bot_tokens FROM guild_configs WHERE dm_bot_tokens IS NOT NULL AND dm_bot_tokens != ""', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

function updateGuildConfig(guildId, updates) {
    return new Promise((resolve, reject) => {
        getGuildConfig(guildId).then(existing => {
            const isNew = !existing.guild_id || Object.keys(existing).length === 1;
            const textChannelId = updates.text_channel_id !== undefined ? updates.text_channel_id : existing.text_channel_id;
            const voiceChannelId = updates.voice_channel_id !== undefined ? updates.voice_channel_id : existing.voice_channel_id;
            const inviteLink = updates.invite_link !== undefined ? updates.invite_link : existing.invite_link;
            const ehsanLink = updates.ehsan_link !== undefined ? updates.ehsan_link : existing.ehsan_link;
            const masbahaLink = updates.masbaha_link !== undefined ? updates.masbaha_link : existing.masbaha_link;
            const dmBotTokens = updates.dm_bot_tokens !== undefined ? updates.dm_bot_tokens : existing.dm_bot_tokens;

            const query = `
                INSERT INTO guild_configs (guild_id, text_channel_id, voice_channel_id, invite_link, ehsan_link, masbaha_link, dm_bot_tokens)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(guild_id) DO UPDATE SET
                    text_channel_id = excluded.text_channel_id,
                    voice_channel_id = excluded.voice_channel_id,
                    invite_link = excluded.invite_link,
                    ehsan_link = excluded.ehsan_link,
                    masbaha_link = excluded.masbaha_link,
                    dm_bot_tokens = excluded.dm_bot_tokens
            `;

            db.run(query, [guildId, textChannelId, voiceChannelId, inviteLink, ehsanLink, masbahaLink, dmBotTokens], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        }).catch(reject);
    });
}

module.exports = {
    db,
    getBotSetting,
    setBotSetting,
    getGuildConfig,
    getAllVoiceConfigs,
    getAllTextConfigs,
    getAllDmBotConfigs,
    updateGuildConfig
};
