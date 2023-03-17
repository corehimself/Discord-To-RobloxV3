const { ActionRowBuilder, ModalBuilder, PermissionsBitField, TextInputBuilder, TextInputStyle } = require('discord.js');


module.exports = {
    name: 'submitAppeal',
    async execute(interaction) {
        if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const modal = new ModalBuilder()
            .setCustomId('appealModal')
            .setTitle('Unban Appeal Application')

        const userInputField = new TextInputBuilder()
            .setCustomId('userInput')
            .setLabel("What's your Username/ID?")
            .setPlaceholder('corehimself')
            .setStyle(TextInputStyle.Short);

        const appealInputField = new TextInputBuilder()
            .setCustomId('appealField')
            .setLabel("What would you like to appeal?")
            .setPlaceholder('I would like to appeal my ban because...')
            .setStyle(TextInputStyle.Paragraph);

        const firstAct = new ActionRowBuilder().addComponents(userInputField);
        const secAct = new ActionRowBuilder().addComponents(appealInputField);

        modal.addComponents(firstAct, secAct);
    
        // Show the modal to the user
        await interaction.showModal(modal);
    
        } else {
            return await interaction.reply({content: "You have no Permission to do that!", ephemeral: true});
        }
    },
};