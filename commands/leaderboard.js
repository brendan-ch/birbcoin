const Discord = require('discord.js');
const leaderboardCount = process.env.LEADERBOARD_COUNT ? process.env.LEADERBOARD_COUNT : 5;

const { findTopUsersInServer } = require('../helpers/server');
const { findUser } = require('../helpers/user');

// KNOWN ISSUES:
// doesn't account for deleted users
// looks like shit right now

module.exports = {
  name: "leaderboard",
  aliases: ["rankings"],
  type: "General",
  description: "See who the richest people in your server are.",
  execute: async (message, args) => {
    const serverId = message.guild.id;

    // get top users in server
    const users = await findTopUsersInServer(serverId);

    let leaderboard = users.length > 0 ?
      ""
    :
      "There is no one on the leaderboard yet.";

    // will run for each user; won't run if there are no users
    let count = 1;
    for (const user of users) {
      if (count > leaderboardCount) break;
      
      // let userClass = undefined;

      let username = "";

      if (user.usernameDiscord) {  // get registered username
        username = user.usernameDiscord.slice(0, -5);
      } else {  // this bit will be removed eventually, after most users have registered username in document
        try {
          const userClass = await message.client.users.fetch(user.userId);
          username = userClass.username;

          findUser(userClass.id, userClass.tag, true, serverId);
        } catch(err) {
          console.error(err);
        };
      };

      leaderboard += `${count}. \`${username}\`: \`${user.currency}\` birbcoins\n`;

      count += 1;
    }

    const embed = new Discord.MessageEmbed({
      title: "Leaderboard",
      description: leaderboard,
      color: "#981ceb"
    });

    message.channel.send(embed);
  }
};