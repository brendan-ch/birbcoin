import Discord from 'discord.js';
import { findServer } from '../helpers/server';
import { Command } from '../typedefs';
const adminCategory = "Admin";

const disableCommand: Command = {
  name: "disable",
  description: "List all disabled commands, or disable a certain command for this server.",
  type: "Admin",
  allowDMs: false,
  usage: "<command (optional)>",
  execute: async (message, args) => {
    // get server data
    const serverId = message.guild!.id;
    const server = await findServer(serverId);
    const prefix = server.prefix;
    const disabledCommands = server.disabledCommands;

    // return disabled commands
    if (args.length === 0) {
      const embed = new Discord.MessageEmbed({
        title: "Disabled commands",
        description: `Disabled commands: \`${disabledCommands.join(", ") || "none"}\`\n\nTo disable a command, use \`${prefix}disable <command>\`.`,
      });
      
      message.channel.send(embed);

      return;
    };

    // get array of all available commands
    const commands = message.client.commands;
    if (!commands) return;

    // to get aliases and other methods
    const command = commands.get(args[0]);

    if (!command) {  // command doesn't exist
      const embed = new Discord.MessageEmbed({
        title: "Command doesn't exist",
        description: "The command you're looking for doesn't exist.",
        color: "#ff0000"
      });

      message.channel.send(embed);
      return;
    } else if (command.type === adminCategory) {
      // command is an admin command, for safety you can't add admin commands to list
      const embed = new Discord.MessageEmbed({
        title: "Command is an admin command",
        description: `\`${args[0]}\` is an administrator command and cannot be added to the list.`,
        color: "#ff0000"
      });

      message.channel.send(embed);
      return;
    } else if (server.disabledCommands.includes(command.name)) {
      // command already exists in list of commands
      const embed = new Discord.MessageEmbed({
        title: "Command already exists in list",
        description: `\`${args[0]}\` already exists in the list of disabled commands.`,
        color: "#ff0000"
      });

      message.channel.send(embed);
      return;
    }

    try {
      // add the command to list of disabled commands
      server.disabledCommands.push(args[0]);
      if (command.aliases) command.aliases.forEach(alias => server.disabledCommands.push(alias));  // push aliases along with default command
      await server.save();

      const embed = new Discord.MessageEmbed({
        title: "Disabled commands updated!",
        description: `\`${args[0]}\` has been added to the list of disabled commands.\n\nDisabled commands: \`${disabledCommands.join(", ") || "none"}\``,
        color: "#08FF00"
      });

      message.channel.send(embed);
    } catch(err) {
      const embed = new Discord.MessageEmbed({
        title: "Error saving server document",
        description: `The changes were not applied because there was an internal server error.`,
        color: "#ff0000"
      });

      message.channel.send(embed);
      console.error(err);
    }

    
  } 
}

export default disableCommand;