import Discord from 'discord.js';
import { findServer } from '../helpers/server';
import { Command } from '../typedefs';
const adminCategory = "Admin";

const helpCommand: Command = {
  name: "help",
  type: "General",
  allowDMs: true,
  description: "Display info on all available commands.",
  execute: async (message, args) => {
    const serverId = message.guild ? message.guild.id : undefined;
    const server = serverId ? await findServer(serverId) : undefined;
    const prefix = server ? server.prefix : ".";
    
    // get existing commands
    const { commands } = message.client;
    if (!commands) return;
    const commandsArray = commands.array();

    // these will be displayed in the embed
    let categories: Array<string> = [];
    for (const command of commandsArray) {
      if ((!categories || !categories.includes(command.type)) 
        && (
          (message.guild && message.member && ((message.member.hasPermission('ADMINISTRATOR') && command.type === adminCategory) || (command.type !== adminCategory)))
        ||
          (!message.guild && command.allowDMs)
        )
      ) {
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
        if (command.type === category && (
          (!message.guild && command.allowDMs)
        ||
          (message.guild)
        )) {
          listCommands += "`" + prefix + command.name + (command.usage ? " " + command.usage : "") + "`: " + command.description + "\n"
        }
      };

      listCommands += "\n";  // add newline after section
      listAllCommands += listCommands;  // add to entire thing
    }

    const embed = new Discord.MessageEmbed({
      title: "List of commands",
      description: listAllCommands
    });

    // if DM, we assume that DMs must be enabled
    // if sent in server channel, we have to account for if DMs aren't enabled
    try {
      await message.author.send(embed);
    } catch(e) {
      const errorEmbed = new Discord.MessageEmbed({
        title: "Unable to send DM",
        description: `${message.author.username}, please check if DMs are enabled.`,
        color: "#ff0000"
      });

      message.channel.send(errorEmbed);
    }
  }
}

export default helpCommand;