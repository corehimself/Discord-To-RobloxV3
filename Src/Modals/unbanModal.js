const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');

module.exports = {
  name: 'unbanModal',
  async execute(interaction) {
    const logChan = interaction.options.getChannel('logchan');
    const appChan = interaction.options.getChannel('appchan');
    const modChan = interaction.options.getChannel('modalchan');

    let channelsSet = [];
    let newConf = {};

    if (logChan) {
      newConf.logChannelID = logChan.id;
      channelsSet.push(`Commands will be sent to: ${logChan}`);
    }

    if (appChan) {
      newConf.appChannelID = appChan.id;
      channelsSet.push(`Application Responses will be sent to: ${appChan}`);
    }

    if (modChan) {
      channelsSet.push(`Appeal modal will appear on: ${modChan}`);

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('submitAppeal')
            .setLabel('✅ Unban Appeal')
            .setStyle(ButtonStyle.Secondary),
        );

      const embed = new EmbedBuilder()
        .setTitle('Unban Appeal')
        .setDescription('Please fill out the form below to appeal your ban')
        .setColor('#0099ff')
        .setTimestamp();

      const modChannel = interaction.guild.channels.cache.get(modChan.id);
      if (!modChannel) {
        interaction.followUp({ content: 'Channel not found', ephemeral: true });
      } else {
        try {
          const sentMessage = await modChannel.send({ embeds: [embed], components: [row] });
          interaction.followUp({ content: `Modal sent to ${modChan}`, ephemeral: true });
        } catch (err) {
          console.error(err);
          interaction.followUp({ content: 'Failed to send modal', ephemeral: true });
          return;
        }
      }
    }

    fs.readFile('Src/Credentials/Config.json', (err, data) => {
      if (err) {
        console.error(err);
        interaction.followUp({ content: 'Failed to read configuration data', ephemeral: true });
        return;
      }

      let config = JSON.parse(data);
      config = { ...config, ...newConf };
      fs.writeFile('Src/Credentials/Config.json', JSON.stringify(config), (err) => {
        if (err) {
          console.error(err);
          interaction.followUp({ content: 'Failed to update configuration data', ephemeral: true });
          return;
        }
        console.log('Data written to file!');

        if (logChan || appChan) {
          const message = `Configuration updated. ${channelsSet.join(', ')}`;
          interaction.followUp({ content: message, ephemeral: true });
        }
      });
    });
  },
};