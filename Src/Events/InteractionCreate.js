const { Client, EmbedBuilder, Events, GatewayIntentBits } = require('discord.js');
const { handleDatastoreAPI } = require('../Api/datastoreApi.js');
const { checkName } = require('../Api/checkName.js');

const Config = require('../Credentials/Config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent] });

client.modals = new Map();
client.buttons = new Map();

const fs = require('node:fs');
const path = require('node:path');

const modalsDir = path.join(__dirname, '..', 'Modals');
const buttonsDir = path.join(__dirname, '..', 'Buttons');

const buttonFiles = fs.readdirSync(buttonsDir).filter(file => file.endsWith('.js'));
const modalFiles = fs.readdirSync(modalsDir).filter(file => file.endsWith('.js'));

for (const file of buttonFiles) {
    try {
        const button = require(path.join(buttonsDir, file));
        client.buttons.set(button.name, button);
    } catch (error) {
        console.log(`[WARNING] Error loading button at ${path.join(buttonsDir, file)}: ${error}`);
    }
}

for (const file of modalFiles) {
	const modal = require(path.join(modalsDir, file));
	client.modals.set(modal.name, modal);
}

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}
	
			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(`Error executing ${interaction.commandName}`);
				console.error(error);
			}
		} else if (interaction.isModalSubmit()) {
			if (interaction.customId === 'appealModal') {
				const modalName = interaction.customId;
				try {
					const modalEvent = client.modals.get(modalName);
					if (!modalEvent) {
						console.log(`Modal event ${modalEvent} not found`);
						return;
					};
					const username = interaction.fields.getTextInputValue('userInput');
					const body = interaction.fields.getTextInputValue('appealField');
					const submitChannel = await interaction.client.channels.fetch(Config.appChannelID);

					if (submitChannel) {
						const embed = new EmbedBuilder()
							.setColor('#0099ff')
							.setTitle('Appeal Application')
							.addFields({name: 'Username', value: username})
							.addFields({name: 'Appeal', value: body})

						const message = await submitChannel.send({ embeds: [embed] });
						await message.react('✅');
                		await message.react('❌');
						const filter = (reaction, user) => {
							return ['✅', '❌'].includes(reaction.emoji.name) && user.id === interaction.user.id;
						};
						message.awaitReactions({ filter, max: 1, errors: ['time'] })
							.then(async collected => {
								const reaction = collected.first();

								if (reaction.emoji.name === '✅') {
									const data = { method: 'Unban' }

									try {
										// call the unban function
										const userID = await checkName(username, 'username');
										const entryKey = `user_${userID}`;
										const response = await handleDatastoreAPI(entryKey, data);
										if (!response) {
											interaction.reply({ content: `Invalid username, got: ${username}`, ephemeral: true });
										}
										if (message.reactions.cache.size > 0) {
											message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
										}

										const updatedEmbed = {
											title: 'Discord <-> Roblox System',
											color: parseInt('00ff44', 16),
											fields: [
											  { name: 'Application', value: `Successfully Unbanned **${username}**` },
											  { name: 'Response', value: body },
											  { name: 'Administrator', value: `Accepted by: ${interaction.user}` }
											]
										};

										await message.edit({ embeds: [updatedEmbed] })
									} catch (err) {
										console.log(err);
									}
								} else {
									if (message.reactions.cache.size > 0) {
										message.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));
									}
									const updatedEmbed = {
										title: 'Discord <-> Roblox Ban System',
										color: parseInt('00ff44', 16),
										fields: [
											{ name: 'Application', value: `Successfully Declined **${username}**` },
											{ name: 'Response', value: body},
											{ name: 'Administrator', value: `Declined by: ${interaction.user}` }
										]
									};
									await message.edit({ embeds: [updatedEmbed] })
								}
							})

						await interaction.reply({ content: 'Your appeal has been submitted.', ephemeral: true });
					} else {
						interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
					}
				} catch (error) {
					console.log('Error getting modal:', error);
					console.log('client.modals:', client.modals);
					console.log('modalName:', modalName);
				}
			}
		} else if (interaction.isButton()) {
			const buttonName = interaction.customId;
			const buttonEvent = client.buttons.get(buttonName);
			if (!buttonEvent) {
				console.log(`Button event ${buttonName} not found`);
				return;
			}

			try {
				await buttonEvent.execute(interaction);
			} catch (error) {
				console.error(`Error executing Button event "${buttonEvent}":`, error);
				interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
			}
		}
	}
};