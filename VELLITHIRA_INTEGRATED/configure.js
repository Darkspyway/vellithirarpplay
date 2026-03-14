const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

console.clear();
console.log("\x1b[35m============================================================\x1b[0m");
console.log("\x1b[36m    ✨ Nexus City RP - Automated Bot Configuration ✨    \x1b[0m");
console.log("\x1b[35m============================================================\x1b[0m\n");
console.log("Welcome! This wizard will set up your Discord Bot automatically.");
console.log("You will need your Discord Developer Portal open: https://discord.com/developers/applications\n");

const envPath = path.join(__dirname, '.env');

// Parse existing .env to use as defaults if they exist
let existingConfig = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            existingConfig[match[1].trim()] = match[2].trim().replace(/^"|"$/g, ''); // Remove quotes if any
        }
    });
}

const questions = [
    {
        type: 'input',
        name: 'token',
        message: 'Enter your Discord Bot Token:',
        default: existingConfig.DISCORD_BOT_TOKEN !== 'your_bot_token_here' ? existingConfig.DISCORD_BOT_TOKEN : undefined,
        validate: input => input.length > 30 ? true : 'Please enter a valid Discord Bot Token.'
    },
    {
        type: 'input',
        name: 'clientId',
        message: 'Enter your Application Client ID:',
        default: existingConfig.DISCORD_CLIENT_ID !== 'your_client_id_here' ? existingConfig.DISCORD_CLIENT_ID : undefined,
        validate: input => /^\d{17,20}$/.test(input) ? true : 'Client ID should be a long number (17-20 digits).'
    },
    {
        type: 'input',
        name: 'clientSecret',
        message: 'Enter your Application Client Secret (from the OAuth2 tab):',
        default: existingConfig.DISCORD_CLIENT_SECRET !== 'your_client_secret_here' ? existingConfig.DISCORD_CLIENT_SECRET : undefined,
        validate: input => input.length > 20 ? true : 'Please enter a valid Client Secret.'
    },
    {
        type: 'input',
        name: 'guildId',
        message: 'Enter your Nexus City Server ID (Guild ID):',
        default: existingConfig.DISCORD_GUILD_ID !== 'your_server_id_here' ? existingConfig.DISCORD_GUILD_ID : undefined,
        validate: input => /^\d{17,20}$/.test(input) ? true : 'Guild ID should be a long number (17-20 digits).'
    },
    {
        type: 'input',
        name: 'roleId',
        message: 'Enter the Visa Role ID (the role to give users who pass):',
        default: existingConfig.DISCORD_VISA_ROLE_ID !== 'your_role_id_here' ? existingConfig.DISCORD_VISA_ROLE_ID : undefined,
        validate: input => /^\d{17,20}$/.test(input) ? true : 'Role ID should be a long number (17-20 digits).'
    }
];

inquirer.prompt(questions).then((answers) => {
    console.log("\n\x1b[33mGenerating Configuration...\x1b[0m");

    const newEnvContent = `
# Nexus City RP - Discord Authentication Config
DISCORD_BOT_TOKEN="${answers.token}"
DISCORD_CLIENT_ID="${answers.clientId}"
DISCORD_CLIENT_SECRET="${answers.clientSecret}"
DISCORD_GUILD_ID="${answers.guildId}"
DISCORD_VISA_ROLE_ID="${answers.roleId}"

# OAuth URLs (Do not change unless moving to production)
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback
FRONTEND_REDIRECT_URL=http://127.0.0.1:5500/BOT/index.html
`.trim();

    fs.writeFileSync(envPath, newEnvContent);
    console.log("\x1b[32m✅ Successfully saved to .env file!\x1b[0m\n");

    // Generate Invite Link
    const scopes = encodeURIComponent("bot applications.commands");
    const permissions = "268435456"; // Manage Roles
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${answers.clientId}&permissions=${permissions}&scope=${scopes}`;

    console.log("\x1b[35m============================================================\x1b[0m");
    console.log("\x1b[36m                     NEXT STEPS                         \x1b[0m");
    console.log("\x1b[35m============================================================\x1b[0m\n");

    console.log("\x1b[1m1. Invite the bot to your server using this link:\x1b[0m");
    console.log(`   \x1b[36m\x1b[4m${inviteUrl}\x1b[0m\n`);

    console.log("\x1b[1m2. Add the Redirect URI to Developer Portal:\x1b[0m");
    console.log("   Go to OAuth2 -> General -> Redirects, and add:");
    console.log("   \x1b[33mhttp://localhost:3000/api/auth/discord/callback\x1b[0m\n");

    console.log("\x1b[1m3. Enable Server Members Intent:\x1b[0m");
    console.log("   Go to Bot -> Privileged Gateway Intents, turn ON 'Server Members Intent'\n");

    console.log("\x1b[1m4. Important Discord Server Setting:\x1b[0m");
    console.log("   In your Server Settings -> Roles, drag the Bot's role ABOVE the Visa role.\n");

    console.log("\x1b[32mYou are all set! Run \x1b[1mnpm start\x1b[0m\x1b[32m to boot up the application.\x1b[0m\n");

}).catch((error) => {
    console.error("An error occurred during setup:", error);
});
