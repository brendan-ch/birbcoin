const Discord = require('discord.js');
const { findServer } = require('../helpers/server');

// const validPrefixes = ['.', ',', '!', '?', '/', '<', '>', ';', '~'];
const validPrefixes = '.,!?/<>;~';

module.exports = {
  name: 'prefix',
  description: 'List the prefix for this server, or change the prefix for this server if one is specified.',
  type: "Admin",
  usage: '<new prefix (optional)>',
  execute(message, args) {
    const serverId = message.guild.id;

    // return current prefix
    if (args.length === 0) {
      findServer(serverId).then((server) => {
        const hasAdmin = message.member.hasPermission('ADMINISTRATOR');

        const embed = new Discord.MessageEmbed({
          title: "Server prefix",
          description: "The current server prefix is `" + server.prefix + "`." + 
            (hasAdmin ? 
              " Available prefixes include: `" + validPrefixes + "`."
            :
              ""
            ),
        });

        message.channel.send(embed);
      })

      return;
    }

    // check for sufficient permissions
    else if (!message.member.hasPermission('ADMINISTRATOR')) {
      const embed = new Discord.MessageEmbed({
        title: "Insufficient permissions",
        description: 'You must have a role with the "Administrator" permission enabled to change the server prefix.',
        color: "#ff0000"
      });

      message.channel.send(embed);

      return;
    }

    // check whether prefix is valid
    else if (!validPrefixes.includes(args[0]) || args[0].length > 1) {
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