const { findServer } = require("../helpers/server");
const { findUser } = require('../helpers/user');
const { findCreateGame, updateHand } = require("../helpers/blackjack");
const Discord = require("discord.js");

// let messageQueue = {};

const checkCurrentNumber = (deck, dealer = false) => {
  const conversionTable = {
    "J": [10],
    "Q": [10],
    "K": [10],
    "A": [0],  // calculate aces afterwards
  };

  let currentValue = 0;
  let numAces = 0;

  deck.forEach(card => {
    const value = card.value;
    let numericValue = isNaN(value) ? conversionTable[value][0] : parseInt(value);

    if (value === "A") {
      numAces++;
    };

    currentValue += numericValue;
  });

  // calculate aces
  for (let i = 0; i < numAces; i++) {
    if (currentValue + 11 > 21 || dealer) currentValue += 1;
    else currentValue += 11;
  };

  return currentValue;
};

const concludeGame = (game) => {
  let outcome;  // "tie", "dealer", "player"
  
  const playerValue = checkCurrentNumber(game.playerHand);
  const dealerValue = checkCurrentNumber(game.dealerHand);

  const playerBusted = playerValue > 21;
  const dealerBusted = dealerValue > 21;

  if (playerBusted && dealerBusted) {
    // in a normal game player busts before dealer, so they lose first
    outcome = "dealer";
  } else if (playerBusted) {
    outcome = "dealer";
  } else if (dealerBusted) {
    outcome = "player";
  } else {
    outcome = dealerValue > playerValue ? "dealer" : (dealerValue === playerValue ? "tie" : "player");
  };

  return outcome;
};

const updateUserData = async (message, user, bet, outcome, blackjack = false) => {
  let embed;
  const game = await findCreateGame(user.userId, 0);

  // only give/take half of total bet if split hand
  const amount = game.splitHand.length !== 0 && game.splitHand[0].value !== null ? (Math.round(bet / 2)) : bet;

  switch (outcome) {
    case "tie":
      user.currency += amount;
      game.bet -= amount;

      embed = new Discord.MessageEmbed({
        title: "Tie",
        description: `${message.author.username} tied with the dealer. They now have \`${user.currency}\` birbcoins.`
      });

      message.channel.send(embed);

      break;
    case "dealer":
      embed = new Discord.MessageEmbed({
        title: "Dealer won!",
        description: `${message.author.username} lost \`${amount}\` birbcoins and now has \`${user.currency}\` birbcoins. Better luck next time.`,
        color: "#ff0000"
      });

      message.channel.send(embed);
      
      break;
    case "player":
      const winCurrency = blackjack ? amount + Math.round(bet * 1.5) : amount * 2;
      
      user.currency += winCurrency;
      game.bet -= amount;

      embed = new Discord.MessageEmbed({
        title: `${message.author.username} won!`,
        description: `${message.author.username} won \`${blackjack ? Math.round(amount * 1.5) : amount}\` birbcoins! They now have \`${user.currency}\` birbcoins.`,
        color: "#17d9ff"
      });

      message.channel.send(embed);

      break;

    default:
      user.currency += amount;
      game.bet -= amount;

      // something went wrong
      embed = new Discord.MessageEmbed({
        title: "Something went wrong",
        description: "Unable to determine outcome of game. Birbcoins has been returned to the user.",
        color: "#ff0000"
      });

      message.channel.send(embed);

      break;
  };

  // we delete the blackjack game here. 
  // UNLESS there is a split hand, then we discard player hand and move split hand to player hand
  if (game.splitHand.length === 0 || game.splitHand[0].value === null) {
    await game.deleteOne();
    await user.save();
  } else {
    game.playerHand = [game.splitHand[0]];  // clear player hand
    game.splitHand = [{
      value: null  // will recognize that a split happened
    }];

    await user.save();
    await game.save();
  }

  // we want to keep the last message so that we can see what happened
  // delete messageQueue[message.author.id];

  return;
}

const updateDealerHand = (game) => {
  // here, we indicate that the dealer's full hand can be shown
  game.showDealerCards = true;

  while (checkCurrentNumber(game.dealerHand) < 17) {
    updateHand(game, "dealer");
  };
}

// this will be used several times to update user on current game
const sendCurrentGame = async (message, game, prefix = ".") => {
  const playerValue = checkCurrentNumber(game.playerHand);
  
  // if we're not showing the dealer's cards, pick the first card and show that instead
  const dealerValue = checkCurrentNumber(game.showDealerCards ? game.dealerHand : [game.dealerHand[0]]);

  const suits = {
    "C": "clubs",
    "D": "diamonds",
    "H": "hearts",
    "S": "spades"
  };

  let displayPlayerHand = "";
  let displayDealerHand = "";

  const displayDealerHandHidden = `${game.dealerHand[0].value} of ${suits[game.dealerHand[0].suit]}\n???\n`

  game.playerHand.forEach(card => {
    displayPlayerHand += `${card.value} of ${suits[card.suit]}\n`;
  });
  game.dealerHand.forEach(card => {
    displayDealerHand += `${card.value} of ${suits[card.suit]}\n`;
  })

  const embed = new Discord.MessageEmbed({
    title: `${message.author.username}'s current game`,
    description: `\`${game.bet}\` birbcoins total ${game.splitHand.length !== 0 && game.splitHand[0].value ? `(\`${Math.round(game.bet / 2)}\` in split deck)` : ``}\n\n`
    + `**__Player's hand__**\n\`${displayPlayerHand}\`\n**__Dealer's hand__**\n\`${game.showDealerCards ? displayDealerHand : displayDealerHandHidden}\``
    + `\n${message.author.username} is currently sitting at \`${playerValue}\`. `
    + (playerValue > 21 ? "They busted first!" : "")
    + (playerValue === 21 && game.playerHand.length === 2 && game.splitHand.length === 0 ? "They hit blackjack!" : "")
    + `\nThe dealer is currently sitting at \`${dealerValue}\`. `
    + (dealerValue > 21 ? "They busted!" : "")
    + (dealerValue === 21 && game.dealerHand.length === 2 ? "They hit blackjack!" : "")
    // display options
    + `\n\nAvailable options: \`${prefix}blackjack <hit, stand`
    + (game.playerHand.length === 2 && game.splitHand.length === 0 ? `, double` : "") 
    + (game.playerHand.length === 2 && game.playerHand[0].value === game.playerHand[1].value && game.splitHand.length === 0 ? ', split' : "")
    + `>\``
    // The JSON.stringify is temporary and will be removed after I properly format everything
  });

  // delete old message to prevent chaos
  await message.channel.send(embed);
  // const newMessage = await message.channel.send(embed);

  // const oldMessage = messageQueue[message.author.id];  // message sent in RESPONSE to user, not user's message
  // if (oldMessage && oldMessage.deletable) oldMessage.delete();
  // if (newMessage) messageQueue[message.author.id] = newMessage;
};

module.exports = {
  name: "blackjack",
  aliases: ["21"],
  allowDMs: true,
  description: "Play blackjack and lose even more of your money!",
  type: "Wager your birbcoins!",
  execute: async (message, args) => {
    const serverID = message.guild ? message.guild.id : undefined;
    const server = serverID ? await findServer(serverID) : undefined;
    const prefix = server ? server.prefix : ".";

    // we need this to check currency
    const userID = message.author.id;
    const user = await findUser(userID, message.author.tag, true, serverID);

    const game = await findCreateGame(userID, 0);  // get current game if it exists
    
    if (!game) {
      // check if arguments are valid for creating a game
      if (args.length === 0) {
        const embed = new Discord.MessageEmbed({
          title: "No current game found",
          description: `Please use \`${prefix}blackjack <amount of birbcoins>\` to start a new game.`,
          color: "#ff0000"
        });

        message.channel.send(embed);
        return;
      }
      
      else if (args[0] !== "all" && (isNaN(args[0]) || args[0].includes('.') || args[0] <= 0)) {
        const embed = new Discord.MessageEmbed({
          title: "Invalid value",
          description: "Please enter a positive integer.",
          color: "#ff0000"
        });

        message.channel.send(embed);

        return;
      };

      // at this point we can assume the user put in a valid number
      // set betCurrency to user's currency if "all", or parse argument as integer
      const betCurrency = args[0] === "all" ? user.currency : parseInt(args[0]);

      if (betCurrency > user.currency || !betCurrency) {
        const embed = new Discord.MessageEmbed({
          title: "Not enough birbcoins",
          description: message.author.username + " is missing `" + (betCurrency - user.currency) + "` birbcoins.",
          color: "#ff0000"
        });

        message.channel.send(embed);
        return;
      };

      const newGame = await findCreateGame(userID, betCurrency);
      user.currency -= betCurrency;  // take user currency now and give it back later
      await user.save();

      const currentNumberPlayer = checkCurrentNumber(newGame.playerHand);
      const currentNumberDealer = checkCurrentNumber(newGame.dealerHand);
      let outcome = "tie";

      // determine if dealer's OR player's hand = 21 and conclude game here
      if (currentNumberDealer === 21 && currentNumberPlayer === 21) {
        outcome = "tie";
      } else if (currentNumberPlayer === 21) {  // player blackjack; pay out 1.5x
        outcome = "player";
      } else if (currentNumberDealer === 21) {
        outcome = "dealer";
      } else {
        sendCurrentGame(message, newGame, prefix);

        return;
      };

      updateDealerHand(newGame);
      sendCurrentGame(message, newGame, prefix);
      await updateUserData(message, user, newGame.bet, outcome, true);

      return;
    }

    // assume that a game exists and user wants to get details of game

    if (args.length === 0) {
      sendCurrentGame(message, game, prefix);
      return;
    };

    // at this point, we can assume that a game is in progress and the user wants to continue the game

    switch (args[0]) {
      case "hit":
        updateHand(game, "player");

        if (checkCurrentNumber(game.playerHand) > 21) {
          updateDealerHand(game);
          sendCurrentGame(message, game, prefix);

          const outcome = concludeGame(game);
          updateUserData(message, user, game.bet, outcome);

          return;
        };

        sendCurrentGame(message, game, prefix);

        await game.save();
        break;

      case "stand":
        updateDealerHand(game);

        // we check if there's cards in splitHand, if there are then we move splitHand cards to playerHand
        sendCurrentGame(message, game, prefix);

        const outcome = concludeGame(game);

        updateUserData(message, user, game.bet, outcome);

        break;

      case "double":
        // send error if there's more/less than two cards and if there is/was a split hand
        if (game.playerHand.length !== 2 || game.splitHand.length !== 0) {
          const embed = new Discord.MessageEmbed({
            title: "Unable to double at this time",
            description: "This option is only available at the beginning of a game.",
            color: "#ff0000"
          });

          message.channel.send(embed);

          break;
        }

        // check if enough currency
        if (user.currency < game.bet) {
          const embed = new Discord.MessageEmbed({
            title: "Not enough birbcoins",
            description: message.author.username + " is missing `" + (game.bet - user.currency) + "` birbcoins.",
            color: "#ff0000"
          });

          message.channel.send(embed);

          break;
        };

        // yoink more money here
        user.currency -= game.bet;
        game.bet += game.bet;
        await user.save();

        updateHand(game, "player");
        updateDealerHand(game);
        sendCurrentGame(message, game, prefix);

        await game.save();
        updateUserData(message, user, game.bet, concludeGame(game));

        break;

      case "split":
        // check if two cards are matching and no existing split hand exists
        if ((game.playerHand.length !== 2 || game.playerHand[0].value !== game.playerHand[1].value || game.splitHand.length !== 0)) {
          const embed = new Discord.MessageEmbed({
            title: "Unable to split at this time",
            description: "This option is only available at the beginning of a game if two player cards in a hand have the same value.",
            color: "#ff0000"
          });

          message.channel.send(embed);

          break;
        };

        // check if enough currency
        if (user.currency < game.bet) {
          const embed = new Discord.MessageEmbed({
            title: "Not enough birbcoins",
            description: message.author.username + " is missing `" + (game.bet - user.currency) + "` birbcoins.",
            color: "#ff0000"
          });

          message.channel.send(embed);

          break;
        };

        // yoink more money here
        user.currency -= game.bet;
        game.bet += game.bet;
        await user.save();
        
        // move card to splitHand
        // continue playing playerHand as usual
        game.splitHand.push(game.playerHand[1]);
        game.playerHand.splice(1, 1);

        sendCurrentGame(message, game, prefix);
        await game.save();

        break;

      default:
        const embed = new Discord.MessageEmbed({
          title: "Invalid argument provided",
          description: `Please use \`${prefix}blackjack <hit | stand>\` when in an active game.`,
          color: "#ff0000"
        });

        message.channel.send(embed);
        break;
    };
  }
}