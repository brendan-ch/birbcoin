require('dotenv').config();

import mongoose = require('mongoose');  // for managing database
import Discord = require('discord.js');  // for interfacing with Discord API
import fs = require('fs');  // interact with filesystem
import express = require('express');
const app = express();
const port = process.env.PORT;
app.set('port', port);

import { ClientWithCommands, Command } from './typedefs';

// helper functions
const { findServer } = require('./helpers/server');

// database setup

const string = process.env.DATABASE_STRING || "";
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
const client: ClientWithCommands = new Discord.Client();

client.commands = new Discord.Collection();  // to contain commands

async function getCommands() {
  const commands: Array<Command> = [];

  // get filenames
  const commandFiles = fs.readdirSync('./dist/commands').filter(fileName => fileName.endsWith('.js'));

  // add commands to collection
  for (const fileName of commandFiles) {
    const command = await import(`./commands/${fileName}`);  // import command from each file
    commands.push(command.default);
  };

  return commands;
}

client.on('ready', () => {
  // run check for client user
  if (!client.user) {
    console.error("No bot user found, double-check your access token.")
    process.exit();
  }

  console.log(`Logged in as ${client.user.tag}`);

  // grab status message from env file
  const statusMessage = process.env.STATUS_MESSAGE;

  if (statusMessage) {
    client.user.setActivity(statusMessage, { type: 'PLAYING' })
      .then(() => console.log(`Set status message to "Playing ${statusMessage}".`))
      .catch((err) => console.error(err));
  }
});

client.on('message', async (message) => {
  // run check for client user
  if (!client.user) {
    console.error("No bot user found, double-check your access token.");
    process.exit();
  }

  const serverId = message.guild ? message.guild.id : undefined;
  const server = serverId ? await findServer(serverId) : undefined;
  const prefix = server ? server.prefix : ".";

  // if message was sent by birbcoin bot, log that message
  if (message.author.id === client.user.id) {
    console.log(`(message) (bot in ${serverId || "DMs"}) ${message.embeds.length > 0 ? `embed\ntitle: "${message.embeds[0].title}"\ndescription: "${message.embeds[0].description}"` 
    : message.content}`);
  }

  // check message against prefix and author
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // trim extra whitespace and remove prefix
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()  // gets the first thing in args
  if (!client.commands || !commandName) return;

  const command = client.commands.get(commandName.toLowerCase())
    || client.commands.find(cmd => cmd.aliases !== undefined && cmd.aliases.includes(commandName.toLowerCase()));

  console.log(`(message) (user ${message.author.id} in ${serverId || "DMs"}) ${message.content}`);

  // if command doesn't exist, return early
  // likewise, if command is disabled by admin, return early
  // finally, if command is an admin command, return early if user doesn't have sufficient permission
  if ((server && 
    (!command || server.disabledCommands.includes(commandName) || 
    (command.type === "Admin" && message.member && !message.member.hasPermission('ADMINISTRATOR'))))
  || (!server &&
    (!command || !command.allowDMs))
  ) {
    console.log("Error: check failed. Command was not executed.");
    return;
  } 

  // retrieve the command and run execute method on it
  if (command) {
    command.execute(message, args);
  }
});

// call function to load commands
getCommands().then(commands => commands.forEach(command => client.commands?.set(command.name, command)));

// connect to API
const token = process.env.ACCESS_TOKEN;
client.login(token);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})