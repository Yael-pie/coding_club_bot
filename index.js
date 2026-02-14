const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionOverwrites } = require('discord.js');
const fs = require('fs');
const flags = JSON.parse(fs.readFileSync('./flags.json', 'utf-8'));
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
    new SlashCommandBuilder().setName('today_create').setDescription('Crée le rôle, la catégorie coding club du jour et les salons associés à celle-ci !'),
    new SlashCommandBuilder().setName('present').setDescription('Indique si tu participes au coding club du jour !'),
    new SlashCommandBuilder().setName('flag').setDescription('Avertissement').addUserOption(option =>
        option.setName('user')
            .setDescription('L\'utilisateur à avertir')
            .setRequired(true)
    ).addStringOption(option =>
        option.setName('reason')
            .setDescription('La raison de l\'avertissement')
            .setRequired(true)
    ),
    new SlashCommandBuilder().setName('flag_list').setDescription('Liste des avertissements utilisateur').addUserOption(option =>
        option.setName('user')
            .setDescription('L\'utilisateur à check')
            .setRequired(false)
    ),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

let day_role = null;
let day_subject_cat = null;
let day_subject_room = null;

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

    if (interaction.commandName === 'today_create') {
        if (!interaction.member.permissions.has('ManageRoles') || !interaction.member.permissions.has('ManageChannels')) {
            await interaction.reply({ content: "❌ Tu n'as pas la permission de gérer les rôles ou de géérer les salons !", ephemeral: true });
            return;
        }

        day_role = await interaction.guild.roles.create({
            name: "⌨️ Participants " + new Date().toLocaleDateString('fr-FR'),
            color: "#c9c9c9",
        });
        day_subject_cat = await interaction.guild.channels.create({
            name: "Coding Club - " + new Date().toLocaleDateString('fr-FR'),
            type: 4,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: ['ViewChannel', 'SendMessages'],
                },
                {
                    id: day_role.id,
                    allow: ['ViewChannel'],
                },
            ],
        });
        day_subject_room = await interaction.guild.channels.create({
            name: "🎲-sujet",
            type: 0,
            parent: day_subject_cat.id,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: ['ViewChannel', 'SendMessages'],
                },
                {
                    id: day_role.id,
                    allow: ['ViewChannel'],
                },
            ],
        });
        await interaction.reply({ content: `✅ Le rôle du coding club du jour est maintenant **${day_role.name}** !\n✅ La catégorie d'aujourd'hui a été créée !`, ephemeral: false});
    }

    if (interaction.commandName === 'flag') {
        if (!interaction.member.permissions.has('ManageMembers')) {
            await interaction.reply({ content: "❌ Tu n'as pas la permission de gérer les membres !", ephemeral: true });
            return;
        }
        let user = interaction.options.getUser('user');
        let reason = interaction.options.getString('reason');
        let display_name = interaction.guild.members.cache.get(user.id).displayName;
        let tag = user.tag;

        if (!flags[user.id]) {
            flags[user.id] = [];
        }
        flags[user.id].push({ raison: reason, date: new Date().toISOString(), par: interaction.user.tag, nom: display_name, tag: tag });
        fs.writeFileSync('./flags.json', JSON.stringify(flags, null, 2));

        await interaction.reply({ content: `✅ ${display_name} (${tag}) a été averti pour la raison suivante : **${reason}**`, ephemeral: false });
    }

    if (interaction.commandName === 'flag_list') {
        if (!interaction.member.permissions.has('ManageMembers')) {
            await interaction.reply({ content: "❌ Tu n'as pas la permission de gérer les membres !", ephemeral: true });
            return;
        }
        let user = interaction.options.getUser('user');

        if (user) {
            if (!flags[user.id]) {
                await interaction.reply({ content: "✅ L'utilisateur n'a aucun avertissement !", ephemeral: true });
                return;
            }
            let response = "📋 **Liste des avertissements de :" + user.displayName + " aka (" + user.tag + ")\n**";
            for (let i = 0; i < flags[user.id].length; i++) {
                response += `**${i + 1}.** ${flags[user.id][i].raison} - ${flags[user.id][i].date} par ${flags[user.id][i].par}\n`;
            }
            await interaction.reply({ content: response, ephemeral: false });
        }
        await interaction.reply({ content: "ça arrive bientôt no problemo...", ephemeral: false });
    }
});

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} est en ligne`);
});

client.login(process.env.TOKEN);