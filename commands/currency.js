const Discord = require('discord.js');
const User = require('../models/user');
const { findUser } = require('../helpers/user');

module.exports = {
  name: "currency",
  type: "General",
  aliases: ['birbcoins'],
  description: "Find out how many birbcoins you have.",
  execute(message, args) {
    // id of user who sent the message
    const userId = message.author.id;
    const serverId = message.guild.id;

    // username; does not include tag
    const username = message.author.username;
    findUser(userId, username, true, serverId, message.client).then(user => {
      // amount of currency
      const currency = user.currency;

      const embed = new Discord.MessageEmbed({
        title: `${username}'s birbcoins`,
        description: username + " has `" + currency + "` birbcoins.",
      });

      message.channel.send(embed);
    })
  }
}