import Discord from 'discord.js';
import { findServer } from '../helpers/server';
import { findUser } from '../helpers/user';
import { Command } from '../typedefs';

const giveCommand: Command = {
  name: "give",
  aliases: ['send'],
  type: "General",
  allowDMs: false,
  description: "Give someone else some birbcoins.",
  usage: "@<user> <number of birbcoins>",
  execute: async (message, args) => {
    if (!message.guild) return;

    const serverId = message.guild.id;

    // no user or invalid # birbcoins provided
    if (
      args.length === 0 || 
      !message.mentions.members || 
      !message.mentions.members.first() || 
      (args[1] !== "all" && isNaN(Number(args[1])))) {
      // get server id to get prefix
      findServer(serverId).then(server => {
        const prefix = server.prefix;
        const embed = new Discord.MessageEmbed({
          title: "Invalid arguments provided",
          description: "To give someone else birbcoins, use `" + prefix + "give @<username> <number of birbcoins>`. You'll have to mention the user you're giving birbcoins to.",
          color: "#ff0000"
        });
  
        message.channel.send(embed);
      });

      return;
    };

    // get server member id; same as user id
    const recipientMember = message.mentions.members.first();
    if (!recipientMember) return;

    const recipientId = recipientMember.id;
    const recipientUsername = recipientMember.user.tag;  // get username from user object
    
    // get recipient with id; don't create new one if no user found
    const recipient = await findUser(recipientId, recipientUsername, false, serverId);
    const recipientUsernameShort = recipientUsername.slice(0, -5);

    if (recipient === null) {
      // the user must have interacted with the bot once
      const embed = new Discord.MessageEmbed({
        title: "No user found",
        description: recipientUsernameShort + " hasn't interacted with me yet. To prevent incidents where birbcoin is lost (e.g. to a bot) among other issues, the recipient must have interacted with me at least once.",
        color: "#ff0000"
      });

      message.channel.send(embed);
      return;
    };

    // we already have the recipient from earlier, we just need to get the user giving the coins
    const userId = message.author.id;
    const username = message.author.tag;
    const user = await findUser(userId, username);
    if (!user) return;

    // from here on we can assume that all arguments are correct
    // this is the amount of currency to give
    const numCurrency = args[1] === "all" ? user.currency : parseInt(args[1]);

    // number is negative or a decimal
    if (numCurrency <= 0 || args[1].includes('.')) {
      const embed = new Discord.MessageEmbed({
        title: "Invalid value",
        description: "Please enter a positive integer.",
        color: "#ff0000"
      });
      message.channel.send(embed);

      return;
    }

    // user doesn't have enough currency
    else if (numCurrency > user.currency) {
      const embed = new Discord.MessageEmbed({
        title: "Not enough birbcoins",
        description: message.author.username + " is missing `" + (numCurrency - user.currency) + "` birbcoins.",
        color: "#ff0000"
      });

      message.channel.send(embed);

      return;
    } else if (userId === recipientId) {  // user and recipient are the same
      const embed = new Discord.MessageEmbed({
        title: "Invalid user",
        description: "You can't give birbcoins to yourself.",
        color: "#ff0000"
      });

      message.channel.send(embed);

      return;
    };

    // subtract coins from first user
    user.currency -= numCurrency;
    user.save();

    // add coins for second user
    recipient.currency += numCurrency;
    recipient.save();
    
    const embed = new Discord.MessageEmbed({
      title: "Successful transaction",
      description: message.author.username + " gave `" + numCurrency + "` birbcoins to " + recipientUsernameShort + "! They now have `" + recipient.currency + "` birbcoins.",
      color: "#08FF00"
    });

    message.channel.send(embed);
  }
}

export default giveCommand;