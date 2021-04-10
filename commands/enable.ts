import Discord from 'discord.js';
import { findServer } from "../helpers/server";
import { Command } from '../typedefs';

const enableCommand: Command = {
  name: 'enable',
  description: "Enable a command previously turned off by the `disable` command.",
  type: "Admin",
  allowDMs: false,
  usage: '<command>',
  execute: async (message, args) => {
    // get server data
    const serverId = message.guild!.id;
    const server = await findServer(serverId);

    if (args.length === 0 || !server.disabledCommands.includes(args[0])) {
      const embed = new Discord.MessageEmbed({
        title: "Command not found",
        description: `Disabled commands: \`${server.disabledCommands.join(", ") || "none"}\``,
        color: "#ff0000"
      });

      message.channel.send(embed);
      return;
    };

    try {
      const commandIndex = server.disabledCommands.indexOf(args[0]);
      if (commandIndex !== -1) server.disabledCommands.splice(commandIndex, 1);
      await server.save();

      const embed = new Discord.MessageEmbed({
        title: "Disabled commands updated!",
        description: `\`${args[0]}\` has been removed from the list of disabled commands.\n\nDisabled commands: \`${server.disabledCommands.join(", ") || "none"}\``,
        color: "#08FF00"
      });

      message.channel.send(embed);
      return;
    } catch(err) {
      const embed = new Discord.MessageEmbed({
        title: "Error saving server document",
        description: `The changes were not applied because there was an internal server error.`,
        color: "#ff0000"
      });

      message.channel.send(embed);
      console.error(err);
      return;
    }
    
  }
}

export default enableCommand;