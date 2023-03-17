const { Collection, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logChannelID } = require('../Credentials/Config.json');
const { handleDatastoreAPI } = require('../Api/datastoreAPI');
const { getAvatarUrl } = require('../Api/profilePic.js');
const { checkName } = require('../Api/checkName.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a specified user from in game')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Kick user by Username or User ID')
                .setRequired(true)
                .addChoices(
                    { name: 'Username', value: 'username' },
                    { name: 'User ID', value: 'userid'},
                ))

        .addStringOption(option =>
            option.setName('input')
                .setDescription('Username/ID to ban')
                .setRequired(true))

        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kicking')
                .setRequired(true))
        
        .addIntegerOption(option =>
            option.setName('time')
                .setDescription('Time to ban the user for')
                .setRequired(false))

        .addStringOption(option =>
            option.setName('length')
                .setDescription('Length of time to ban the user for')
                .setRequired(false)
                .addChoices(
                    { name: 'Hour', value: 'hr' },
                    { name: 'Day', value: 'day' },
                    { name: 'Week', value: 'wk' },
                    { name: 'Month', value: 'mo' },
                    { name: 'Year', value: 'yr' },
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const logChan = await interaction.client.channels.fetch(logChannelID);
        const userOrID = interaction.options.getString('category');
        const userToBan = interaction.options.getString('input');
        const reason = interaction.options.getString('reason');
        const timeToBan = interaction.options.getInteger('time');
        const lengthToBan = interaction.options.getString('length');
        let combinedTime = timeToBan && lengthToBan ? timeToBan + lengthToBan : 'Permanent';

        try {
            const robloxData = await checkName(userToBan, userOrID);

            if (robloxData.id) {
                const userId = robloxData.id;
                const avatarUrl = await getAvatarUrl(userId);

                const confirmEmbed = new EmbedBuilder()
                    .setColor('#eb4034')
                    .setTitle('Confirm Ban')
                    .setThumbnail(avatarUrl)
                    .setDescription(`Are you sure you want to ban **${userToBan}**?\n\nTime:\n**${combinedTime}**\n\nReason:\n**${reason}**`)
                    .setTimestamp();

                const message = await interaction.reply({ embeds: [confirmEmbed], fetchReply: true });

                await message.react('👍');
                await message.react('👎');

                const filter = (reaction, user) => {
                    return ['👍', '👎'].includes(reaction.emoji.name) && user.id === interaction.user.id;
                };

                message.awaitReactions({ filter, max: 1, time: 60000, errors: ['time'] })
                    .then(async collected => {
                        const reaction = collected.first();

                        if (reaction.emoji.name === '👍') {
                            if (message.reactions.cache.size > 0) {
                                message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                            }
                            
                            const method = "Ban";
                            const entryKey = `user_${robloxData.id}`;
                            const data = { method: method, time: combinedTime, reason: reason }

                            try {
                                const response = await handleDatastoreAPI(entryKey, data);
                                const color = response.success ? '#00ff44' : '#eb4034';
                        
                                const embed = new EmbedBuilder()
                                    .setColor(color)
                                    .setTitle(`${method} ${response ? 'Successful' : 'Failed'}`)
                                    .setThumbnail(avatarUrl)
                                    .addFields({ name: 'Username', value: `${robloxData.name}` })
                                    .addFields({ name: 'User ID', value: `${robloxData.id}` })
                                    .setTimestamp();

                                const logEmbed = new EmbedBuilder()
                                    .setColor('#eb4034')
                                    .setTitle('Command Executed')
                                    .addFields({ name: 'Administrator', value: `${interaction.user}` })
                                    .addFields({ name: 'Action', value: `${method} ${userToBan} **${reason}** **${combinedTime}**` })
                                    .setThumbnail(interaction.user.displayAvatarURL())
                                    .setTimestamp();

                                if (message) {
                                    message.edit({ embeds: [embed] });
                                    if (logChan) {
                                        logChan.send({ embeds: [logEmbed] });
                                    } else {
                                        console.log("Make sure to set a log channel!");
                                    }
                                } else {
                                    return console.error("No message detected");
                                }
                            } catch (error) {
                                return console.error(`Datastore API | ${error}`);
                            }
                        } else {
                            if (message.reactions.cache.size > 0) {
                                message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                            }
                            const updatedEmbed = {
                                title: 'Discord <-> Roblox System',
                                color: parseInt('00ff44', 16),
                                fields: [{ name: 'Ban Cancelled', value: 'Cancelled the ban process' }]
                            };
                            await message.edit({ embeds: [updatedEmbed] });
                        }
                    })
                    .catch(error => {
                        if (error instanceof Collection) {
                            if (message.reactions.cache.size > 0) {
                                message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
                            }
                            const timeoutEmbed = {
                                title: 'Discord <-> Roblox System',
                                color: parseInt('00ff44', 16),
                                fields: [
                                    { name: 'Timeout', value: 'Timed out'}
                                ]
                            };
                            message.edit({ embeds: [timeoutEmbed] });
                        } else {
                            console.error(`Error awaiting reactions: ${error}`);
                            interaction.followUp('An error occurred while awaiting reactions.');
                        }
                    });
            } else {
                await interaction.reply('Unable to find that user on Roblox.');
            }
        } catch (error) {
            console.log("ERR | ", error);
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply({ content: `An error occurred while trying to ban that user.\n\n**Error:**\n${error.data}` });
            }
        }
    }
}