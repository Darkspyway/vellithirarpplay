require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());


// ==========================================
// Serve all frontend files
// ==========================================
const PROJECT_ROOT = __dirname;

// Main Website
app.use('/main', express.static(path.join(PROJECT_ROOT, 'frontend')));
app.use('/frontend', express.static(path.join(PROJECT_ROOT, 'frontend')));

// Exam Site
app.use('/exam', express.static(path.join(PROJECT_ROOT, 'exam')));

// Legacy paths (keeping for compatibility if possible, but directing to new ones)
app.use(['/quiz', '/BOT'], express.static(path.join(PROJECT_ROOT, 'exam')));
app.use(['/rules', '/RULES'], express.static(path.join(PROJECT_ROOT, 'frontend/pages')));
app.use(['/tutorials', '/TUTORIALS'], express.static(path.join(PROJECT_ROOT, 'frontend/pages')));

app.get(['/', '/index.html'], (req, res) => {
    res.redirect('/main/index.html');
});

// ==========================================
// Discord OAuth2 Routes
// ==========================================
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

app.get('/api/auth/discord/login', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join`;
    res.redirect(url);
});

app.get('/api/auth/discord/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.send('No code provided.');

    try {
        // Exchange Code for Access Token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResponse.data.access_token;

        // Fetch User Info
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const userData = userResponse.data;

        // Redirect to exam with user data
        const FRONTEND_URL = process.env.FRONTEND_URL || '';
        // If FRONTEND_URL is the local site, use /exam/index.html
        const targetUrl = FRONTEND_URL.includes('localhost') ? `/exam/index.html` : `${FRONTEND_URL}/exam/index.html`;
        res.redirect(`${targetUrl}?id=${userData.id}&username=${userData.username}&avatar=${userData.avatar}`);


    } catch (error) {
        console.error('OAuth Callback Error:', error.response?.data || error.message);
        res.status(500).send('Authentication failed.');
    }
});

// ==========================================
// Load Environment Variables
// ==========================================
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const ROLE_ID = process.env.DISCORD_VISA_ROLE_ID;

const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

// ==========================================
// Initialize Discord Bot
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Configure the Application Channel Name
const APPLICATION_CHANNEL_NAME = process.env.DISCORD_APPLICATION_CHANNEL || '📑-visa-application';
const PASS_LOG_CHANNEL = process.env.DISCORD_PASS_LOG_CHANNEL || '✅-pass-logs';
const FAIL_LOG_CHANNEL = process.env.DISCORD_FAIL_LOG_CHANNEL || '❌-fail-logs';

// Helper function to send log to a specific channel
async function sendLog(channelName, embedData) {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const channels = await guild.channels.fetch();
        const logChannel = channels.find(ch => ch.name === channelName);

        if (logChannel && logChannel.isTextBased()) {
            const embed = new EmbedBuilder(embedData);
            await logChannel.send({ embeds: [embed] });
            console.log(`  📝 Log sent to ${channelName}`);
        } else {
            console.warn(`  ⚠️ Log channel "${channelName}" not found or not text-based.`);
        }
    } catch (err) {
        console.error(`  ❌ Failed to send log to ${channelName}:`, err.message);
    }
}


client.once('ready', async (c) => {
    console.log(`  ✅ Discord Bot logged in as ${c.user.tag}`);

    // Register Slash Commands
    const commands = [
        new SlashCommandBuilder()
            .setName('upload')
            .setDescription('Upload a tutorial link via special code')
            .addStringOption(option =>
                option.setName('code')
                    .setDescription('The special guide code (e.g., heal_guide)')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('link')
                    .setDescription('The video link or YouTube ID')
                    .setRequired(true))
            .toJSON(),
        new SlashCommandBuilder()
            .setName('website')
            .setDescription('Get the website link')
            .toJSON(),
        new SlashCommandBuilder()
            .setName('setup_application')
            .setDescription('Manually setup the application message')
            .toJSON()
    ];

    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    try {
        console.log(`  🔄 Registering commands for Guild: ${GUILD_ID}`);
        await rest.put(Routes.applicationGuildCommands(c.user.id, GUILD_ID), { body: commands });
        console.log('  ✅ Slash Commands Registered (Guild Specific)');
    } catch (err) {
        console.error('  ❌ Slash Command Error:', err);
    }

    // Auto-update application message on restart
    await refreshApplicationMessage();
});

async function refreshApplicationMessage() {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const channels = await guild.channels.fetch();
        const appChannel = channels.find(ch => ch.name === APPLICATION_CHANNEL_NAME);

        if (!appChannel || !appChannel.isTextBased()) {
            console.warn(`  ⚠️ Application channel "${APPLICATION_CHANNEL_NAME}" not found or not text-based.`);
            return;
        }

        const siteUrl = process.env.FRONTEND_URL || `http://localhost:${port}`;

        // Fetch last 50 messages to find bot's previous message
        const messages = await appChannel.messages.fetch({ limit: 50 });
        const botMessages = messages.filter(m => m.author.id === client.user.id);

        // Delete old messages from the bot in this channel
        for (const msg of botMessages.values()) {
            try {
                await msg.delete();
                console.log(`  🗑️ Deleted old automated message: ${msg.id}`);
            } catch (e) { console.error(`  ❌ Failed to delete message ${msg.id}:`, e.message); }
        }

        // Send new Portal message
        const embed = new EmbedBuilder()
            .setTitle('🏙️ VELLITHIRA ROLEPLAY PORTAL')
            .setDescription('Welcome to the **VELLITHIRA ROLEPLAY** official portal. Explore the city, learn the rules, and apply for your immigration visa below.')
            .setColor(0x00ff99)
            .addFields(
                { name: '🌐 Official Website', value: 'Visit our website for live map, player stats, and community guides.' },
                { name: '📑 Visa Application', value: 'Complete the automated whitelist exam to gain citizenship and access the city.' }
            )
            .setImage('https://i.imgur.com/your-premium-banner-here.png') // Note: User can replace this with a real banner
            .setThumbnail(guild.iconURL())
            .setFooter({ text: 'VELLITHIRA ROLEPLAY - Automated Sync System' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Visit Website')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`${siteUrl}/main/index.html`),
                new ButtonBuilder()
                    .setLabel('Start Application')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`${siteUrl}/exam/index.html`)
            );

        await appChannel.send({ embeds: [embed], components: [row] });
        console.log('  ✅ New portal message posted to channel.');

    } catch (err) {
        console.error('  ❌ Error refreshing automated message:', err.message);
    }
}


// Slash Command Interaction Handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'upload') {
        const code = interaction.options.getString('code');
        const link = interaction.options.getString('link');

        const tutorialPath = path.join(__dirname, 'tutorials.json');
        let tutorials = [];
        if (fs.existsSync(tutorialPath)) {
            try {
                tutorials = JSON.parse(fs.readFileSync(tutorialPath, 'utf8'));
            } catch (e) { tutorials = []; }
        }

        const index = tutorials.findIndex(t => t.id === code);

        // Smarter URL parsing for YouTube and direct links
        let videoEmbed = link;
        if (link.includes('youtube.com/watch?v=')) {
            const videoId = link.split('v=')[1].split('&')[0];
            videoEmbed = `https://www.youtube.com/embed/${videoId}`;
        } else if (link.includes('youtu.be/')) {
            const videoId = link.split('youtu.be/')[1].split('?')[0];
            videoEmbed = `https://www.youtube.com/embed/${videoId}`;
        }

        if (index !== -1) {
            tutorials[index].videoUrl = videoEmbed;
            fs.writeFileSync(tutorialPath, JSON.stringify(tutorials, null, 4));
            await interaction.reply({ content: `✅ Tutorial **${code}** updated successfully!`, ephemeral: true });
        } else {
            // New Tutorial
            tutorials.push({
                id: code,
                title: code.replace(/_/g, ' ').toUpperCase(),
                category: code.startsWith('bm_') ? "Crime" : "General",
                description: `Official orientation guide for the ${code.replace(/_/g, ' ')} department. Follow these steps carefully to ensure success in VELLITHIRA ROLEPLAY.`,
                videoUrl: videoEmbed,
                isBlackMarket: code.startsWith('bm_'),
                uploadedAt: new Date().toISOString()
            });
            fs.writeFileSync(tutorialPath, JSON.stringify(tutorials, null, 4));
            await interaction.reply({ content: `✅ New tutorial **${code}** registered and uploaded!`, ephemeral: true });
        }
    }

    if (interaction.commandName === 'website') {
        const siteUrl = process.env.FRONTEND_URL || `http://localhost:${port}`;
        
        const embed = new EmbedBuilder()
            .setTitle('🌐 VELLITHIRA ROLEPLAY')
            .setDescription('Welcome to the official website of **VELLITHIRA ROLEPLAY**. Here you can find our rules, tutorials, and apply for your Visa.')
            .setColor(0x0099ff)
            .addFields(
                { name: '📖 Information', value: 'Check out our tutorials and rules to prepare for your journey.' },
                { name: '🛂 Applications', value: 'Ready to join? Head over to the application section!' }
            )
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: 'VELLITHIRA ROLEPLAY | Official Link' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Visit Website')
                    .setStyle(ButtonStyle.Link)
                    .setURL(siteUrl)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
});

// API to serve tutorials to the frontend
app.get('/api/tutorials', (req, res) => {
    const tutorialPath = path.join(__dirname, 'tutorials.json');
    if (fs.existsSync(tutorialPath)) {
        res.json(JSON.parse(fs.readFileSync(tutorialPath, 'utf8')));
    } else {
        res.json([]);
    }
});

// Listener for website link requests and Name Changes
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();

    // Website Link Command
    if (content === '!website' || content === '!site' || content === '!link' || content === '!visa') {
        const siteUrl = process.env.FRONTEND_URL || `http://localhost:${port}`;
        return message.reply(`🌐 **Welcome to VELLITHIRA ROLEPLAY!**\n\nVisit our official website to learn the rules, watch tutorials, and apply for your Visa:\n${siteUrl}\n\n*See you in the city!*`);
    }


    // Name Change logic for specific channel
    if (message.channel.name === '🔹ᴅɪꜱᴄᴏʀᴅ-ɴᴀᴍᴇ-ᴄʜᴀɴɢᴇ') {
        const newName = message.content.trim();

        // Validation criteria
        const isUpperCase = newName === newName.toUpperCase();
        // Regex: Allows multiple spaces, CAPITAL LETTERS, and flexible spacing around the " | " separator
        const isValidFormat = /^[A-Z0-9\s]+(\s*\|\s*[A-Z0-9\s]+)?$/.test(newName);

        if (!isUpperCase || !isValidFormat) {
            try { await message.delete(); } catch (e) { }

            const rejectionMsg = await message.channel.send({
                content: `<@${message.author.id}>`,
                embeds: [{
                    color: 0xff4757,
                    title: 'Nickname Request Rejected',
                    description: `Your request for **${newName || 'Empty Name'}** was rejected. Please follow the rules below.`,
                    fields: [
                        {
                            name: '📌 Naming Rules',
                            value: '• Name must be in **CAPITAL LETTERS**\n• Must match your in-game name exactly\n• Only " **|** " separator allowed — no other special characters\n• Gang members must include **Gang Tag | Character Name**'
                        },
                        {
                            name: '✅ Examples',
                            value: '`JOHN DOE`\n`BLOODS | JOHN DOE`'
                        },
                        {
                            name: '❌ Examples',
                            value: '`john doe` (No lowercase)\n`JOHN_DOE` (No underscores)\n`[GANG] JOHN DOE` (No brackets)'
                        }
                    ],
                    footer: { text: 'This message will self-destruct in 15 seconds.' }
                }]
            });

            setTimeout(() => rejectionMsg.delete().catch(() => { }), 15000);
            return;
        }

        // Apply Nickname
        try {
            await message.member.setNickname(newName);
            await message.react('✅');
        } catch (err) {
            console.error('Nickname change failed:', err.message);
            const errorMsg = await message.reply('❌ **Error:** I cannot change your nickname. I either lack permissions or you carry a role higher than mine.');
            setTimeout(() => errorMsg.delete().catch(() => { }), 5000);
        }
    }
});

// ==========================================
// API: Verify User is in Server and eligible
// ==========================================
app.post('/api/verify', async (req, res) => {
    const { discordUsername } = req.body;
    if (!discordUsername) return res.status(400).json({ success: false, message: 'Username required.' });

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        await guild.members.fetch();
        const member = guild.members.cache.find(m =>
            m.user.username.toLowerCase() === discordUsername.toLowerCase() ||
            m.user.tag.toLowerCase() === discordUsername.toLowerCase()
        );

        if (!member) {
            return res.json({ success: false, message: 'You are not a member of the VELLITHIRA ROLEPLAY server. Please join first!' });
        }

        // Check if they ALREADY have the Visa role
        if (member.roles.cache.has(ROLE_ID)) {
            return res.json({ success: false, message: 'You already have the Visa role!' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Verify error:', error.message);
        return res.status(500).json({ success: false, message: 'Error verifying member.' });
    }
});

// ==========================================
// API: Assign Visa Role by Discord Username
// ==========================================
app.post('/api/pass', async (req, res) => {
    const { discordUsername } = req.body;

    if (!discordUsername) {
        return res.status(400).json({ success: false, message: 'Discord username is required.' });
    }

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        await guild.members.fetch();
        const member = guild.members.cache.find(m =>
            m.user.username.toLowerCase() === discordUsername.toLowerCase() ||
            m.user.tag.toLowerCase() === discordUsername.toLowerCase()
        );

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found in server.' });
        }

        const role = await guild.roles.fetch(ROLE_ID);
        if (!role) {
            return res.status(500).json({ success: false, message: 'Visa role not found.' });
        }

        await member.roles.add(role);
        console.log(`  [Pass] ✅ Visa role assigned to ${member.user.tag}`);

        // Log to Pass Channel
        const { score } = req.body;
        await sendLog(PASS_LOG_CHANNEL, {
            title: '✅ EXAM PASSED',
            color: 0x00ff99,
            fields: [
                { name: 'Applicant', value: `${member.user.tag}`, inline: true },
                { name: 'Score', value: `${score}%`, inline: true },
                { name: 'Role', value: 'Visa Assigned', inline: true }
            ],
            timestamp: new Date()
        });

        return res.json({ success: true, message: `Congratulations ${member.user.username}! Your Visa role has been assigned.` });

    } catch (error) {
        console.error('  [Pass] Error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to assign role.' });
    }
});

// ==========================================
// API: Log Failed Exam Result
// ==========================================
app.post('/api/fail', async (req, res) => {
    const { discordUsername, score, reason } = req.body;

    if (!discordUsername) return res.status(400).json({ success: false, message: 'Username required.' });

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        await guild.members.fetch();
        const member = guild.members.cache.find(m =>
            m.user.username.toLowerCase() === discordUsername.toLowerCase() ||
            m.user.tag.toLowerCase() === discordUsername.toLowerCase()
        );

        const applicantLabel = member ? member.user.tag : discordUsername;

        await sendLog(FAIL_LOG_CHANNEL, {
            title: '❌ EXAM FAILED',
            color: 0xff4757,
            fields: [
                { name: 'Applicant', value: applicantLabel, inline: true },
                { name: 'Score', value: `${score}%`, inline: true },
                { name: 'Reason', value: reason || 'Low Score' }
            ],
            timestamp: new Date()
        });

        return res.json({ success: true });
    } catch (error) {
        console.error('  [Fail Log] Error:', error.message);
        return res.status(500).json({ success: false });
    }
});

// ==========================================
// Start Server
// ==========================================
app.listen(port, () => {
    const url = `http://localhost:${port}`;

    console.log('\x1b[33m');
    console.log('  ██╗   ██╗███████╗██╗     ██╗     ██╗████████╗██╗  ██╗██╗██████╗  █████╗     ██████╗ ██████╗ ');
    console.log('  ██║   ██║██╔════╝██║     ██║     ██║╚══██╔══╝██║  ██║██║██╔══██╗██╔══██╗    ██╔══██╗██╔══██╗');
    console.log('  ██║   ██║█████╗  ██║     ██║     ██║   ██║   ███████║██║██████╔╝███████║    ██████╔╝██████╔╝');
    console.log('  ╚██╗ ██╔╝██╔══╝  ██║     ██║     ██║   ██║   ██╔══██║██║██╔══██╗██╔══██║    ██╔══██╗██╔═══╝ ');
    console.log('   ╚████╔╝ ███████╗███████╗███████╗██║   ██║   ██║  ██║██║██║  ██║██║  ██║    ██║  ██║██║     ');
    console.log('    ╚═══╝  ╚══════╝╚══════╝╚══════╝╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝     ');
    console.log('\x1b[0m');
    console.log('\x1b[33m  VELLITHIRA ROLEPLAY - Visa Application System\x1b[0m');
    console.log('\x1b[33m  ================================================\x1b[0m\n');
    console.log(`\x1b[32m  ✅ Website Online:   \x1b[4m${url}\x1b[0m`);
    console.log(`\x1b[32m  📄 Main Page:        ${url}/main/index.html\x1b[0m`);
    console.log(`\x1b[32m  📝 Quiz Page:        ${url}/quiz/index.html\x1b[0m`);
    console.log(`\x1b[32m  📚 Tutorials:        ${url}/tutorials/index.html\x1b[0m`);
    console.log('\x1b[35m  ================================================\x1b[0m\n');
    console.log('\x1b[33m  🌐 Opening browser automatically...\x1b[0m\n');

    // Only open browser on locally on Windows
    if (process.platform === 'win32') {
        exec(`start ${url}`);
    }

    if (BOT_TOKEN) {
        client.login(BOT_TOKEN).catch(err => {
            console.error('\x1b[31m  ❌ Bot login failed:', err.message, '\x1b[0m');
        });
    } else {
        console.error('\x1b[31m  ❌ No DISCORD_BOT_TOKEN found in .env\x1b[0m');
    }
});
