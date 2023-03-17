const { botToken } = require('./Src/Credentials/Config.json');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent] });

const fs = require('node:fs');
const path = require('node:path');

const commandsPath = path.join(__dirname, 'Src', 'MessageCommands');
const eventsPath = path.join(__dirname, 'Src', 'Events');

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

client.commands = new Collection();

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing either the 'data' or 'execute' property.`);
    }
}

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

async function startApp() {
    try {
        await client.login(botToken);
    } catch (error) {
        console.log(`Failed to login | ${error}`);
        process.exit(1);
    }
}

startApp();

module.exports = { client }