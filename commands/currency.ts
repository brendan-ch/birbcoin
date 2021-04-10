import Discord from 'discord.js';
import { findUser } from '../helpers/user';

import { Command } from '../typedefs';

const currencyCommand: Command = {
  name: "currency",
  type: "General",
  allowDMs: true,
  aliases: ['birbcoins'],
  description: "Find out how many birbcoins you have.",
  execute: async (message, args) => {
    // id of user who sent the message
    const userId = message.author.id;
    const serverId = message.guild ? message.guild.id : undefined;

    // username; includes tag
    const username = message.author.tag;
    findUser(userId, username, true, serverId).then(user => {
      if (!user) return;

      // amount of currency
      const currency = user.currency;
      
      const shortUsername = username.slice(0, -5);

      const embed = new Discord.MessageEmbed({
        title: `${shortUsername}'s birbcoins`,
        description: shortUsername + " has `" + currency + "` birbcoins.",
      });

      message.channel.send(embed);
    })
  }
}

export default currencyCommand;