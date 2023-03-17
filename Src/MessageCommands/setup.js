const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const unbanModal = require('../Modals/unbanModal.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup the bot for your server')
        .addChannelOption(option => 
            option.setName('logchan')
            .setDescription('Channel to log moderation actions')
            .setRequired(false)
        )
        .addChannelOption(option => 
            option.setName('appchan')
            .setDescription('Channel to log applications')
            .setRequired(false)
        )
        .addChannelOption(option => 
            option.setName('modalchan')
            .setDescription('Channel to send the appeal application')
            .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        try {
            const logChan = interaction.options.getChannel('logchan');
            const appChan = interaction.options.getChannel('appchan');
            const modChan = interaction.options.getChannel('modalchan');
        
            if (logChan || appChan || modChan) {
                await interaction.reply({content: 'Please wait while I set up the bot for your server...', ephemeral: true});
                await unbanModal.execute(interaction);
            } else {
                console.log('No channel was provided');
                interaction.reply({content: 'You must specify at least one channel.', ephemeral: true});
            }
        } catch(err) {
            console.log(err);
            interaction.reply({content: 'An error occurred while trying to get the channels from your request.', ephemeral: true});
        }
    }
}