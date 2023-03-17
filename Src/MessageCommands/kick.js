const { Collection, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { logChannelID } = require('../Credentials/Config.json');
const { handleDatastoreAPI } = require('../Api/datastoreApi.js');
const { getAvatarUrl } = require('../Api/profilePic.js');
const { checkName } = require('../Api/checkName.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a specified user from in game')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Kick user by Username or User ID')
                .setRequired(true)
                .addChoices(
                    { name: 'Username', value: 'username' },
                    { name: 'User ID', value: 'userid'},
                ))

        .addStringOption(option =>
            option.setName('userorid')
                .setDescription('Username/ID to kick')
                .setRequired(true))

        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kicking')
                .setRequired(true))

        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const logChan = await interaction.client.channels.fetch(logChannelID);
        const userOrID = interaction.options.getString('category');
        const userToKick = interaction.options.getString('userorid');
        const reason = interaction.options.getString('reason');

        try {
            const robloxData = await checkName(userToKick, userOrID);

            if (robloxData.id) {
                const userId = robloxData.id;
                const avatarUrl = await getAvatarUrl(userId);

                const confirmEmbed = new EmbedBuilder()
                    .setColor('#eb4034')
                    .setTitle('Confirm Kick')
                    .setThumbnail(avatarUrl)
                    .setDescription(`Are you sure you want to kick **${userToKick}**?\n\n**Reason:**\n${reason}`)
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
                            
                            const method = "Kick";
                            const entryKey = `user_${robloxData.id}`;
                            const data = {
                                method: method,
                                reason: reason
                            }

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
                                    .addFields({ name: 'Action', value: `${method} ${userToKick} ${reason}` })
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
                                fields: [
                                    { name: 'Kick Cancelled', value: 'Cancelled the kick process'}
                                ]
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
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply('An error occurred while trying to fetch data from the Roblox API.');
            }
        }
    }
};