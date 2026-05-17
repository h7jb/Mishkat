const { createEmbed, COLORS } = require('../utils/embedBuilder');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error.message);
            const errorEmbed = createEmbed({
                title: 'خطأ غير متوقع',
                description: 'حدث خطأ أثناء محاولة تنفيذ هذا الأمر. يرجى المحاولة لاحقا.',
                color: COLORS.error
            });

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
