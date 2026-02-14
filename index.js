const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); 

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

client.once('ready', () => {
    console.log(`✅ - Connecté en tant que ${client.user.tag}`);
});

console.log("Tentative de connexion...");
console.log("Token détecté :", process.env.TOKEN ? "OUI (caché)" : "NON (undefined)");

client.login(process.env.TOKEN).catch(err => {
    console.error("❌ Erreur de connexion :", err.message);

const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Répond avec Pong !'),
].map(command => command.toJSON());
});