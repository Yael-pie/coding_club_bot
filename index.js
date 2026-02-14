const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Répond par Pong ! (Test de connexion)'),
    new SlashCommandBuilder().setName('de').setDescription('Lance un dé à 6 faces'),
    new SlashCommandBuilder().setName('dayrole').setDescription('Indique si tu participes au coding club du jour !').addRoleOption(option => 
        option.setName('role')
            .setDescription('Le rôle du coding club du jour à donner aux participants')
            .setRequired(true)
    ),
    new SlashCommandBuilder().setName('today_create').setDescription('Crée le rôle, la catégorie coding club du jour et les salons associés à celle-ci !'),
    new SlashCommandBuilder().setName('present').setDescription('Indique si tu participes au coding club du jour !'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

let day_role = null;

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands("1472165112071590063", "1434849259747938385"),
            { body: commands },
        );
        console.log('✅ Commandes enregistrées');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.guild != 1434849259747938385) {
        await interaction.reply({ content: "❌ Ce bot est réservé au coding club petit malin !", ephemeral: true });
        return;
    }

    if (interaction.commandName === 'ping') {
        await interaction.reply('🏓 Pong !');
    }

    if (interaction.commandName === 'de') {
        const resultat = Math.floor(Math.random() * 6) + 1;
        await interaction.reply(`🎲 Résultat : **${resultat}**`);
    }

    if (interaction.commandName === 'present') {
        const membre = interaction.member;

        if (day_role === null) {
            await interaction.reply({ content: "❌ Le rôle du coding club du jour n'est pas encore défini. Appelle quelqu'un du staff !", ephemeral: false });
            return;
        }
        try {
            await membre.roles.add(day_role);
            await interaction.reply({ content: `✅ Tu participes au coding club du jour ! (**${day_role.name}**) !`, ephemeral: false});
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "❌ Erreur : Appelle quelqu'un du staff", ephemeral: false });
        }
    }

    if (interaction.commandName === 'dayrole') {
        const role = interaction.options.getRole('role');
        if (!interaction.member.permissions.has('ManageRoles')) {
            await interaction.reply({ content: "❌ Tu n'as pas la permission de gérer les rôles !", ephemeral: true });
            return;
        }
        day_role = role;
        await interaction.reply({ content: `✅ Le rôle du coding club du jour est maintenant **${role.name}** !`, ephemeral: false});
    }

    if (interaction.commandName === 'today_create') {
        const guild = interaction.guild;
        if (!interaction.member.permissions.has('ManageRoles')) {
            await interaction.reply({ content: "❌ Tu n'as pas la permission de gérer les rôles !", ephemeral: true });
            return;
        }
        day_role = role;
        await interaction.reply({ content: `✅ Le rôle du coding club du jour est maintenant **${role.name}** !`, ephemeral: false});
    }
});

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} est en ligne`);
});

client.login(process.env.TOKEN);