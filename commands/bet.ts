import Discord from 'discord.js';
import { findServer } from '../helpers/server';
import { findUser } from '../helpers/user';

import { Command } from '../typedefs';

const betCommand: Command = {
  name: 'bet',  // used to activate command
  aliases: ['roulette'],
  description: 'Lose all your birbcoins!',
  allowDMs: true,
  type: "Wager your birbcoins!",
  usage: "<number of birbcoins>",
  execute: async (message: Discord.Message, args: Array<string>) => {
    const serverId = message.guild ? message.guild.id : undefined;
    // invalid # birbcoins provided
    if (args.length === 0 || (args[0] !== "all" && isNaN(Number(args[0])))) {
      // get server id to get prefix
      const server = serverId ? await findServer(serverId) : undefined;
      const prefix = server ? server.prefix : ".";
      
      const embed = new Discord.MessageEmbed({
        title: "Invalid argument provided",
        description: "To bet coins, use `" + prefix + "bet <number of birbcoins>`.",
        color: "#ff0000"
      });

      message.channel.send(embed);
      return;
    };

    // from here on we can assume that all arguments are valid

    // get user details
    const userId = message.author.id;
    const username = message.author.tag;
    const user = await findUser(userId, username, true, serverId);

    // add better error handling later -@unnameduser95
    if (!user) return;

    // get # birbcoins to bet from args
    // if args[0] === all, get user.currency and set that as bet currency
    const betCurrency = args[0] === "all" ? user.currency : parseInt(args[0]);

    // number is negative or a decimal
    if (betCurrency <= 0 || args[0].includes('.')) {
      const embed = new Discord.MessageEmbed({
        title: "Invalid value",
        description: "Please enter a positive integer.",
        color: "#ff0000"
      });
      message.channel.send(embed);

      return;
    }
    
    // check if betCurrency exceeds user currency
    else if (betCurrency > user.currency) {
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

export default betCommand;