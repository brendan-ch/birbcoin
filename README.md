# birbcoin
A Discord currency bot. Invite link [here.](https://discord.com/oauth2/authorize?client_id=772336032044941322&scope=bot&permissions=3072)

# Usage
- `.claim`: Claim birbcoins on a regular basis.
- `.currency`: Find out how many birbcoins you have.
- `.give @<user> <number of birbcoins>`: Give someone else some birbcoins! You'll need to mention the user you're giving birbcoins to.
- `.help`: List all commands and their uses.
- `.leaderboard`: See the richest people on your server.
- `.prefix <new prefix (optional)>`: List the server prefix, or change the server prefix if one is specified (server admins only). Available prefixes: `.,!?/<>;~`
- `.roulette <number of birbcoins>`: Play roulette and lose all your money!

# Running the bot yourself
You must have Node.js installed on your machine.
- Clone this repository (or download the source code from the Releases page)
- In the project directory, run `npm install`.
- Follow [these steps](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot) to set up a bot application on Discord. Set `ACCESS_TOKEN` to the bot token when setting up environment variables (see below).
- Follow [these steps](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#bot-invite-links) to add the bot to your server. Use `3072` for the permissions parameter.
- Create a MongoDB database by using [Atlas](https://www.mongodb.com/cloud/atlas) or the [Community Server](https://www.mongodb.com/try/download/community). Set `DATABASE_STRING` to the connection string (`mongodb+srv://<username>:<password>@...`) when setting up environment variables.
- Set the rest of the environment variables to your liking.
- Run `npm start`.

# Environment variables
All of these are required unless otherwise stated.
- `ACCESS_TOKEN` (string): The bot token used to log into Discord.
- `DATABASE_STRING` (string): The string used to log into MongoDB (`mongodb+srv://<username>:<password>@...`).
- `DEFAULT_PREFIX` (string): The prefix that is automatically set for new servers. Note that server admins can change the prefix for their server by using the `prefix` command. Available prefixes: `.,!?/<>;~`
- `DEFAULT_CURRENCY` (int): The starting amount of birbcoins for new users.
- `CLAIM_COOLDOWN` (int): The number of milliseconds to wait before a user can claim birbcoins. Do not set this to more than `3600000` (one hour).
- `CLAIM_CURRENCY` (int): The number of birbcoins given when a user claims.
- `LEADERBOARD_COUNT` (int): The maximum number of people to display on the leaderboard.
- `STATUS_MESSAGE` (string) (optional): The status message to display on startup ("Playing <status message>").
- `PORT` (int): The port that the Express server runs on.
