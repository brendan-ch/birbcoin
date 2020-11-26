const Discord = require('discord.js');
const User = require('../models/user');
const { findUser } = require('../helpers/user');

module.exports = {
  name: "currency",
  type: "General",
  allowDMs: true,
  aliases: ['birbcoins'],
  description: "Find out how many birbcoins you have.",
  execute(message, args) {
    // id of user who sent the message
    const userId = message.author.id;
    const serverId = message.guild ? message.guild.id : undefined;

    // username; includes tag
    const username = message.author.tag;
    findUser(userId, username, true, serverId, message.client).then(user => {
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