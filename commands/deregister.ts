import Discord from 'discord.js';
import { findUser, findUserByTag } from '../helpers/user';
import { Command } from '../typedefs';

const deregisterCommand: Command = {
  name: "deregister",
  type: "Admin",
  usage: "<mention | user's tag (e.g. user#0001) | user ID>",
  allowDMs: false,
  description: "Deregister a user from this server's leaderboard.",
  execute: async (message, args) => {
    if (!message.guild) return;

    const serverId = message.guild.id;

    if (args.length === 0 || !message.mentions.members) {  // no user provided
      const embed = new Discord.MessageEmbed({
        title: "No user provided",
        description: "Please provide a mention, a user's tag (e.g. `user#0001`), or a user ID.",
        color: "#ff0000"
      });

      message.channel.send(embed);
      return;
    };

    let user;
    const mention = message.mentions.members.first();
    if (mention) {
      // find user by id
      user = await findUser(mention.id, mention.user.tag, false);
    } else if (isNaN(Number(args[0]))) {  // user's tag (search for user using tag)
      user = await findUserByTag(args.join(' '));
    } else {  // find by provided user id;
      user = await findUser(args[0], undefined, false);
    };

    // no user found (either from cache or database)
    if (!user) {
      const embed = new Discord.MessageEmbed({
        title: "No user found",
        description: "The user provided couldn't be found. Please try again.",
        color: "#ff0000"
      });

      message.channel.send(embed);
      return;
    } else if (!user.servers.includes(serverId)) {
      const embed = new Discord.MessageEmbed({
        title: "User not in server",
        description: "The user provided hasn't interacted with me in this server yet, or they may have already been deregistered.",
        color: "#ff0000"
      });

      message.channel.send(embed);
      return;
    };

    const serverIndex = user.servers.indexOf(serverId);
    if (serverIndex !== -1) user.servers.splice(serverIndex, 1);

    await user.save();

    const embed = new Discord.MessageEmbed({
      title: "Successfully deregistered",
      description: `\`${user.usernameDiscord}\` has been deregistered from the server. They will no longer appear on this server's leaderboard until they interact with me again.`,
      color: "#08FF00"
    });

    message.channel.send(embed);
  }
}

export default deregisterCommand;