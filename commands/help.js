const Discord = require('discord.js');
const { findServer } = require('../helpers/server');

module.exports = {
  name: "help",
  description: "Display info on all available commands.",
  execute: async (message, args) => {
    const serverId = message.guild.id;
    const server = await findServer(serverId);
    const prefix = server.prefix;
    
    // get existing commands
    const { commands } = message.client;

    const listCommands = commands.map(command => 
      "`" + prefix + command.name + (command.usage ? " " + command.usage : "") + "`: " + command.description
    ).join('\n');

    const embed = new Discord.MessageEmbed({
      title: "List of commands",
      description: listCommands
    });

    message.channel.send(embed);
  }
}