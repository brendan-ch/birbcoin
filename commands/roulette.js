const Discord = require('discord.js');
const { findServer } = require('../helpers/server');
const { findUser } = require('../helpers/user');

module.exports = {
  name: 'roulette',  // used to activate command
  description: 'Play roulette and lose all your birbcoins!',
  usage: "<number of birbcoins>",
  execute: async (message, args) => {
    // invalid # birbcoins provided
    if (args.length === 0 || (args[0] !== "all" && isNaN(args[0]))) {
      // get server id to get prefix
      const serverId = message.guild.id;
      const server = await findServer(serverId);
      const prefix = server.prefix;
      
      const embed = new Discord.MessageEmbed({
        title: "Invalid arguments provided",
        description: "To play roulette, use `" + prefix + "roulette <number of birbcoins>`.",
        color: "#ff0000"
      });

      message.channel.send(embed);
      return;
    };

    // from here on we can assume that all arguments are valid

    // get user details
    const userId = message.author.id;
    const user = await findUser(userId);

    // get # birbcoins to bet from args
    // if args[0] === all, get user.currency and set that as bet currency
    const betCurrency = args[0] === "all" ? user.currency : parseInt(args[0]);
    
    // check if betCurrency exceeds user currency
    if (betCurrency > user.currency) {
      const embed = new Discord.MessageEmbed({
        title: "Not enough birbcoins",
        description: message.author.username + " is missing `" + (betCurrency - user.currency) + "` birbcoins.",
        color: "#ff0000"
      });

      message.channel.send(embed);
      return;
    };

    // generate determining number
    const determiningNumber = Math.random();

    // add or subtract birbcoins based on determining number
    if (determiningNumber >= 0.5) {
      // user wins birbcoins; betCurrency is added to user's currency
      user.currency += betCurrency;
      user.save();

      const embed = new Discord.MessageEmbed({
        title: message.author.username + " won birbcoins!",
        description: message.author.username + " bet `" + betCurrency + "` birbcoins and won! They now have `" + user.currency + "` birbcoins.",
        color: "#17d9ff"
      });

      message.channel.send(embed);
      return;
    } else {
      // user loses birbcoins; subtract betCurrency from user.currency
      user.currency -= betCurrency;
      user.save();

      const embed = new Discord.MessageEmbed({
        title: message.author.username + " lost birbcoins!",
        description: message.author.username + " bet `" + betCurrency + "` birbcoins and lost. They now have `" + user.currency + "` birbcoins.",
        color: "#ff0000"
      });

      message.channel.send(embed);
      return;
    }
  }
}