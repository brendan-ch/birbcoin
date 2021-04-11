import Discord from "discord.js";
import { findServer } from "../helpers/server";
import { findUser } from '../helpers/user';
import { findCreateGame, updateHand } from "../helpers/blackjack";

import { Blackjack, Command, IUser } from '../typedefs';

/**
 * Check the value of the player or dealer's deck.
 * @param deck 
 * @param dealer Used in calculating the value of aces.
 * @returns Returns the value of the player or dealer's deck.
 */
const checkCurrentNumber = (deck: Blackjack.Deck, dealer = false) => {
  const conversionValues = ["J", "Q", "K"];

  let currentValue = 0;
  let numAces = 0;

  deck.forEach(card => {
    const value = card.value;

    // check what numeric value the card represents
    if (value === "A") {
      numAces++;
    } else if (value !== null) {
      const numericValue = conversionValues.includes(value) ? 10 : parseInt(value);
      currentValue += numericValue;
    }
  });

  // calculate aces
  for (let i = 0; i < numAces; i++) {
    if (currentValue + 11 > 21 || dealer) currentValue += 1;
    else currentValue += 11;
  };

  return currentValue;
};

/**
 * Determine the winner of the game based on values of decks.
 * @param game The blackjack game instance.
 * @returns Returns "tie", "dealer", or "player", indicating who won.
 */
const concludeGame = (game: Blackjack.IGame) => {
  let outcome: "tie" | "dealer" | "player";  // "tie", "dealer", "player"
  
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

/**
 * Update the user data after the game is over.
 * @param message The user's Discord message.
 * @param user The user instance from the database.
 * @param bet The amount of the user's bet.
 * @param outcome "tie", "dealer", or "player". Determines the payout.
 * @param blackjack Whether the outcome was a blackjack (1.5x payout)
 * @returns A promise that resolves after user data is updated.
 */
const updateUserData = async (
  message: Discord.Message, 
  user: IUser, 
  bet: number, 
  outcome: "tie" | "dealer" | "player", 
  blackjack = false
) => {
  let embed;
  const game = await findCreateGame(user.userId, 0);
  if (!game) return;

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
      suit: null,
      value: null  // will recognize that a split happened
    }];

    await user.save();
    await game.save();
  };
};

/**
 * Continually update the dealer's hand until value is greater than 17.
 * Call after the user stands or busts.
 * @param game The game instance from the database.
 */
const updateDealerHand = (game: Blackjack.IGame) => {
  // here, we indicate that the dealer's full hand can be shown
  game.showDealerCards = true;

  while (checkCurrentNumber(game.dealerHand) < 17) {
    updateHand(game, "dealer");
  };
}

/**
 * Render and send a message of the current game details.
 * @param message The original Discord message from the user.
 * @param game The game instance from the database.
 * @param prefix The server prefix. Defaults to ".".
 * @returns A promise that resolves after the message is sent.
 */
const sendCurrentGame = async (message: Discord.Message, game: Blackjack.IGame, prefix = ".") => {
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

  if (!game.dealerHand[0].suit) return;
  const displayDealerHandHidden = `${game.dealerHand[0].value} of ${suits[game.dealerHand[0].suit]}\n???\n`

  game.playerHand.forEach(card => {
    // check if card suit is valid
    if (card.suit) {
      displayPlayerHand += `${card.value} of ${suits[card.suit]}\n`;
    }
  });
  game.dealerHand.forEach(card => {
    if (card.suit) {
      displayDealerHand += `${card.value} of ${suits[card.suit]}\n`;  
    }
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
  });

  await message.channel.send(embed);
};

/**
 * The blackjack command object.
 */
const blackjackCommand: Command = {
  name: "blackjack",
  aliases: ["21"],
  allowDMs: true,
  description: "Play blackjack and lose even more of your money!",
  type: "Wager your birbcoins!",
  usage: "<amount of birbcoins>",
  execute: async (message, args) => {
    const serverID = message.guild ? message.guild.id : undefined;
    const server = serverID ? await findServer(serverID) : undefined;
    const prefix = server ? server.prefix : ".";

    // we need this to check currency
    const userID = message.author.id;
    const user = await findUser(userID, message.author.tag, true, serverID);
    if (!user) return;

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
      
      else if (args[0] !== "all" && (isNaN(Number(args[0])) || args[0].includes('.') || Number(args[0]) <= 0)) {
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
      if (!newGame) return;
      user.currency -= betCurrency;  // take user currency now and give it back later
      await user.save();

      // determine if dealer's OR player's hand = 21 and conclude game here
      if (checkCurrentNumber(newGame.playerHand) === 21 && checkCurrentNumber(newGame.dealerHand) === 21) {
        const outcome = "tie";

        updateDealerHand(newGame);
        sendCurrentGame(message, newGame, prefix);
        await updateUserData(message, user, newGame.bet, outcome, true);
      } else if (checkCurrentNumber(newGame.playerHand) === 21) {  // player blackjack; pay out 1.5x
        const outcome = "player";
        
        updateDealerHand(newGame);
        sendCurrentGame(message, newGame, prefix);
        await updateUserData(message, user, newGame.bet, outcome, true);
      } else if (checkCurrentNumber(newGame.dealerHand) === 21) {
        const outcome = "dealer";

        updateDealerHand(newGame);
        sendCurrentGame(message, newGame, prefix);
        await updateUserData(message, user, newGame.bet, outcome, true);
      } else {
        sendCurrentGame(message, newGame, prefix);
      }

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

        // we check if there's cards in splitHand, if there are then we move splitHand cards to playerHand


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

export default blackjackCommand;