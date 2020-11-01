require('dotenv').config();

const mongoose = require('mongoose');  // for managing database
const Discord = require('discord.js');  // for interfacing with Discord API
const fs = require('fs');  // interact with filesystem

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
  console.log("Connection established.");
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
  const command = args.shift().toLowerCase();  // gets the first thing in args

  // if command doesn't exist, return early
  if (!client.commands.has(command)) return;

  // retrieve the command and run execute method on it
  client.commands.get(command).execute(message, args);
});

// connect to API
const token = process.env.ACCESS_TOKEN;
client.login(token);