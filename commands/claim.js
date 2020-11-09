const Discord = require('discord.js');

const { findUser } = require('../helpers/user');
const claimCooldown = Number(process.env.CLAIM_COOLDOWN);  // number of milliseconds before user can claim again
const claimCurrency = Number(process.env.CLAIM_CURRENCY);  // amount of currency for each claim

module.exports = {
  name: 'claim',
  type: "General",
  description: 'Claim your hourly 50 birbcoins.',
  execute: async (message, args) => {
    const userId = message.author.id;
    const username = message.author.tag;
    const user = await findUser(userId, username, true, message.guild.id, message.client);
    const lastClaimed = user.lastClaimedDaily;

    const now = new Date();
    // how long it has been since claim
    const difference = new Date(now - lastClaimed);

    // claim cooldown, subtracted by difference
    const differenceHour = new Date(claimCooldown - difference);

    if (difference <= claimCooldown) {  // not enough time; user needs to wait
      const embed = new Discord.MessageEmbed({
        title: "Please wait before claiming again",
        description: message.author.username + ", you need to wait `" +
          differenceHour.getMinutes() + "` minutes and `" +
          differenceHour.getSeconds() + "` seconds before claiming again.",
        color: "#ff0000"
      });

      message.channel.send(embed);
    } else {
      user.currency += claimCurrency;
      user.lastClaimedDaily = new Date();
      user.save();

      const embed = new Discord.MessageEmbed({
        title: "Birbcoins claimed!",
        description: message.author.username + " claimed `" + claimCurrency + "` birbcoins! They now have `" + user.currency + "` birbcoins.",
        color: "#17d9ff"
      });

      message.channel.send(embed);
    }
  }
}