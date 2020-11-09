require('dotenv').config();

const mongoose = require('mongoose');  // for managing database
const Discord = require('discord.js');  // for interfacing with Discord API
const fs = require('fs');  // interact with filesystem
const express = require('express');
const app = express();
const port = process.env.PORT;
app.set('port', port);

// helper functions
const { findServer } = require('./helpers/server');

// database setup

const string = process.env.DATABASE_STRING;
mongoose.connect(string);
const db = mongoose.connection;

// event listeners
db.on('error', () => {
  console.error("Connection error dumbass");
});

db.once("open", () => {
  console.log("Connection established to database.");
});

// Discord setup

const client = new Discord.Client();

client.commands = new Discord.Collection();  // to contain commands

// get filenames
const commandFiles = fs.readdirSync('./commands').filter(fileName => fileName.endsWith('.js'));

// add commands to collection
for (const fileName of commandFiles) {
  const command = require(`./commands/${fileName}`);  // import command from each file
  client.commands.set(command.name, command);
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  // grab status message from env file
  const statusMessage = process.env.STATUS_MESSAGE;

  if (statusMessage) {
    client.user.setActivity(statusMessage, { type: 'PLAYING' })
      .catch((err) => console.error(err));
  }
});

client.on('message', async (message) => {
  if (!message.guild) return;

  // get server ID and prefix
  const serverId = message.guild.id;
  const server = await findServer(serverId);
  const prefix = server.prefix;

  // check message against prefix and author
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // trim extra whitespace and remove prefix
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();  // gets the first thing in args
  const command = client.commands.get(commandName)
    || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  // if command doesn't exist, return early
  // likewise, if command is disabled by admin, return early
  // finally, if command is an admin command, return early if user doesn't have sufficient permission
  if (!command || server.disabledCommands.includes(commandName) || (command.type === "Admin" && !message.member.hasPermission('ADMINISTRATOR'))) return;

  // retrieve the command and run execute method on it
  command.execute(message, args);
});

// connect to API
const token = process.env.ACCESS_TOKEN;
client.login(token);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})