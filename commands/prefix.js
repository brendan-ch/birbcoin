const Discord = require('discord.js');
const { findServer } = require('../helpers/server');

const validPrefixes = ['.', ',', '!', '?', '/', '<', '>', ';', '~'];

module.exports = {
  name: 'prefix',
  description: 'Change the prefix for this server.',
  execute(message, args) {
    const serverId = message.guild.id;

    // return current prefix
    if (args.length === 0) {
      findServer(serverId).then((server) => {
        const embed = new Discord.MessageEmbed({
          title: "Server prefix",
          description: "The current server prefix is `" + server.prefix + "`.",
        });

        message.channel.send(embed);
      })

      return;
    }

    // check whether prefix is valid
    else if (!validPrefixes.includes(args[0])) {
      const embed = new Discord.MessageEmbed({
        title: "Error setting new prefix",
        description: "Invalid prefix provided. Available prefixes include: `" + validPrefixes + "`.",
        color: "#ff0000"
      });

      message.channel.send(embed);

      return;
    };

    // guarenteed to return document
    findServer(serverId).then((server) => {
      server.prefix = args[0]  // set new prefix
      server.save();

      const embed = new Discord.MessageEmbed({
        title: "Prefix set!",
        description: "The prefix for this server is now `" + server.prefix + "`.",
        color: "#08FF00"
      });

      message.channel.send(embed);
    }).catch(err => {
      console.error(err);
    })
  }
}