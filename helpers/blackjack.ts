import BlackjackGame from '../models/blackjack';
const decks = Number(process.env.BLACKJACK_DECKS) || 1;

import { Blackjack } from '../typedefs';

/**
 * Constructs an unshuffled deck.
 * @param numDecks Number of decks to construct.
 * @returns Returns the constructed, unshuffled deck.
 */
const constructDeck = (numDecks = 1) => {
  const suits: Array<Blackjack.Suit> = ["H", "S", "C", "D"];
  const values: Array<Blackjack.Value> = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

  let deck: Blackjack.Deck = [];
  for (let i = 1; i <= numDecks; i += 1) {
    suits.forEach(suit => {
      values.forEach(value => {
        deck.push({
          suit: suit,
          value: value
        })  // push every combination to deck
      })
    });
  };

  return deck;
};

/**
 * Shuffles a constructed deck.
 * @param deck The deck to shuffle.
 * @returns Returns the shuffled deck.
 */
const shuffleDeck = (deck: Blackjack.Deck) => {
  // make copy of deck
  let newDeck = deck.slice(0);

  for (let i = newDeck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  };

  return newDeck;
};

/**
 * Update the hand of the player or dealer.
 * @param game The game instance from the database.
 * @param hand "player" or "dealer". Defaults to "player".
 */
const updateHand = (game: Blackjack.IGame, hand: "player" | "dealer" = "player") => {
  // update player's or dealer's hand
  if (hand === "player") {
    game.playerHand.push(game.deck[0]);
  } else if (hand === "dealer") {
    game.dealerHand.push(game.deck[0]);
  };

  game.deck.shift();
}

/**
 * Get an existing game, or create one if it doesn't exist.
 * @param userID The Discord user ID to link the game to.
 * @param bet The bet amount. Should be greater than 0.
 * @returns The game if found or created, or null if `bet` === 0.
 */
const findCreateGame = async (userID: string, bet = 0) => {
  const game = await BlackjackGame.findOne({
    userId: userID
  }).exec();

  if (game) {
    return game;
  } else if (bet > 0) {
    // create new game document
    let newGame = new BlackjackGame({
      userId: userID,
      bet: bet,
      deck: shuffleDeck(constructDeck(decks)),
      playerHand: [],
      dealerHand: [],
      splitHand: [],
      showDealerCards: false
    });

    // we'll update player and dealer hands first before saving/returning
    // ...what was past birb thinking????????
    updateHand(newGame, "player");
    updateHand(newGame, "dealer");
    updateHand(newGame, "player");
    updateHand(newGame, "dealer");

    await newGame.save();

    return newGame;
  } else {
    return null;
  }
};

export { findCreateGame, updateHand }