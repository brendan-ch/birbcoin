const { findServer } = require("../helpers/server");
const { findUser } = require('../helpers/user');
const { findCreateGame, updateHand } = require("../helpers/blackjack");
const Discord = require("discord.js");

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

  switch (outcome) {
    case "tie":
      user.currency += bet;

      embed = new Discord.MessageEmbed({
        title: "Tie",
        description: `${message.author.username} tied with the dealer. They now have \`${user.currency}\` birbcoins.`
      });

      message.channel.send(embed);

      break;
    case "dealer":
      embed = new Discord.MessageEmbed({
        title: "Dealer won!",
        description: `${message.author.username} lost \`${bet}\` birbcoins and now has \`${user.currency}\` birbcoins. Better luck next time.`,
        color: "#ff0000"
      });

      message.channel.send(embed);
      
      break;
    case "player":
      const winCurrency = blackjack ? bet + Math.round(bet * 1.5) : bet * 2;
      
      user.currency += winCurrency;

      embed = new Discord.MessageEmbed({
        title: `${message.author.username} won!`,
        description: `${message.author.username} won \`${blackjack ? Math.round(bet * 1.5) : bet}\` birbcoins! They now have \`${user.currency}\` birbcoins.`,
        color: "#17d9ff"
      });

      message.channel.send(embed);

      break;

    default:
      user.currency += bet;  

      // something went wrong
      embed = new Discord.MessageEmbed({
        title: "Something went wrong",
        description: "Unable to determine outcome of game. Birbcoins has been returned to the user.",
        color: "#ff0000"
      });

      message.channel.send(embed);

      break;
  };

  // we delete the blackjack game here
  const game = await findCreateGame(user.userId, 0);
  await game.deleteOne();
  await user.save();
}

const updateDealerHand = (game) => {
  // here, we indicate that the dealer's full hand can be shown
  game.showDealerCards = true;

  while (checkCurrentNumber(game.dealerHand) < 17) {
    updateHand(game, "dealer");
  };
}

// this will be used several times to update user on current game
const sendCurrentGame = (message, game) => {
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
    title: "Current game",
    description: `**__Player's hand__**\n\`${displayPlayerHand}\`\n**__Dealer's hand__**\n\`${game.showDealerCards ? displayDealerHand : displayDealerHandHidden}\``
    + `\n${message.author.username} is currently sitting at \`${playerValue}\`. `
    + (playerValue > 21 ? "They busted first!" : "")
    + (playerValue === 21 && game.playerHand.length === 2 ? "They hit blackjack!" : "")
    + `\nThe dealer is currently sitting at \`${dealerValue}\`. `
    + (dealerValue > 21 ? "They busted!" : "")
    + (dealerValue === 21 && game.dealerHand.length === 2 ? "They hit blackjack!" : "")
    // display options
    + `\n\nAvailable options: \`hit, stand`
    // + (game.playerHand.length === 2 ? `, double` : "")
    // + (game.playerHand.length === 2 && game.playerHand[0].value === game.playerHand[1].value ? ', split' : "")
    + `\``
    // The JSON.stringify is temporary and will be removed after I properly format everything
  });

  message.channel.send(embed);
};

module.exports = {
  name: "blackjack",
  aliases: ["21"],
  description: "Play blackjack and lose even more of your money!",
  type: "Wager your birbcoins!",
  execute: async (message, args) => {
    const serverID = message.guild.id;
    const server = await findServer(serverID);
    const prefix = server.prefix;

    // we need this to check currency
    const userID = message.author.id;
    const user = await findUser(userID, message.author.tag, true, serverID);

    const game = await findCreateGame(userID, 0);  // get current game if it exists
    
    if (!game) {
      // check if arguments are valid for creating a game
      if (args.length === 0) {
        const embed = new Discord.MessageEmbed({
          title: "No current game found",
          description: `Please use \`${prefix}blackjack <amount of birbcoins> to start a new game.`,
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

      // determine if dealer's OR player's hand = 21 and conclude game here
      if (checkCurrentNumber(newGame.playerHand) === 21 && checkCurrentNumber(newGame.dealerHand) === 21) {
        const outcome = "tie";

        updateDealerHand(newGame);
        sendCurrentGame(message, newGame);
        updateUserData(message, user, newGame.bet, outcome, true);
      } else if (checkCurrentNumber(newGame.playerHand) === 21) {  // player blackjack; pay out 1.5x
        const outcome = "player";
        
        updateDealerHand(newGame);
        sendCurrentGame(message, newGame);
        updateUserData(message, user, newGame.bet, outcome, true);
      } else if (checkCurrentNumber(newGame.dealerHand) === 21) {
        const outcome = "dealer";

        updateDealerHand(newGame);
        sendCurrentGame(message, newGame);
        updateUserData(message, user, newGame.bet, outcome, true);
      } else {
        sendCurrentGame(message, newGame);
      }

      return;
    }

    // assume that a game exists and user wants to get details of game

    if (args.length === 0) {
      sendCurrentGame(message, game);
      return;
    };

    // at this point, we can assume that a game is in progress and the user wants to continue the game

    switch (args[0]) {
      case "hit":
        updateHand(game, "player");

        if (checkCurrentNumber(game.playerHand) > 21) {
          updateDealerHand(game);
          sendCurrentGame(message, game);

          const outcome = concludeGame(game);
          updateUserData(message, user, game.bet, outcome);

          return;
        };

        sendCurrentGame(message, game);

        // we check if there's cards in splitHand, if there are then we move splitHand cards to playerHand


        await game.save();
        break;

      case "stand":
        updateDealerHand(game);

        // we check if there's cards in splitHand, if there are then we move splitHand cards to playerHand

        sendCurrentGame(message, game);

        const outcome = concludeGame(game);

        updateUserData(message, user, game.bet, outcome);

        break;

      // case "double":
        // check if there's only two cards
        // take more money here

        // updateHand(game, "player");
        // concludeGame(game)

        // break;

      // case "split":
        // check if two cards are matching
        // move card to splitHand
        // continue playing playerHand as usual

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