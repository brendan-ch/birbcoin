const Discord = require('discord.js');
const { findServer } = require('../helpers/server');
const adminCategory = "Admin";

module.exports = {
  name: "help",
  type: "General",
  description: "Display info on all available commands.",
  execute: async (message, args) => {
    const serverId = message.guild.id;
    const server = await findServer(serverId);
    const prefix = server.prefix;
    
    // get existing commands
    const { commands } = message.client;
    const commandsArray = commands.array();

    // these will be displayed in the embed
    let categories = [];
    for (const command of commandsArray) {
      if ((!categories || !categories.includes(command.type)) 
        && ((message.member.hasPermission('ADMINISTRATOR') && command.type === adminCategory)
        || (command.type !== adminCategory))) {
        categories.push(command.type);
      };
    };

    // for each category, get the list of commands
    let listAllCommands = "";
    for (const category of categories) {
      // have category as "header"
      let listCommands = `**__${category}__\n**`;

      // match command type with category, and append if matching
      for (const command of commandsArray) {
        if (command.type === category) {
          listCommands += "`" + prefix + command.name + (command.usage ? " " + command.usage : "") + "`: " + command.description + "\n"
        }
      };

      listCommands += "\n";  // add newline after section
      listAllCommands += listCommands;  // add to entire thing

      // const listCommands = commands.map(command => 
      //   "`" + prefix + command.name + (command.usage ? " " + command.usage : "") + "`: " + command.description
      // ).join('\n');
    }

    const embed = new Discord.MessageEmbed({
      title: "List of commands",
      description: listAllCommands
    });

    message.channel.send(embed);
  }
}