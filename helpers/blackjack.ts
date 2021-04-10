import BlackjackGame from '../models/blackjack';
const decks = Number(process.env.BLACKJACK_DECKS) || 1;

import { Blackjack } from '../typedefs';

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

const shuffleDeck = (deck: Blackjack.Deck) => {
  // make copy of deck
  let newDeck = deck.slice(0);

  for (let i = newDeck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  };

  return newDeck;
};

const updateHand = (game: Blackjack.IGame, hand = "player") => {
  // update player's or dealer's hand
  if (hand === "player") {
    game.playerHand.push(game.deck[0]);
  } else if (hand === "dealer") {
    game.dealerHand.push(game.deck[0]);
  };

  game.deck.shift();
}

// gets an existing game, or create a new one if it doesn't exist
// run on .blackjack or .blackjack currency
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

// class Blackjack {
//   constructor(message, bet, decks = 1) {
//     this.userID = message.userID;  // will be used to identify game
//     this.bet = bet;  // amount of currency the user is betting
    
//     this.deck = shuffleDeck(constructDeck(decks));  // shuffle deck now to make things easier later
//     this.playerHand = [];
//     this.dealerHand = [];

//     this.message = message;
//   };

//   startGame() {
//     this.updateHand("dealer");
//     this.updateHand("player");
//     this.updateHand("dealer");
//     this.updateHand("player");
//   }

//   updateHand(hand = "player") {
//     // take the first card in the deck, move it to player's/dealer's hand
//     if (hand === "player") this.playerHand.push(this.deck[0]);
//     else if (hand === "dealer") this.dealerHand.push(this.deck[0]);
    
//     this.deck.shift();
//   };
// };

// // const newGame = new Blackjack("aaaaa", 50, 1);
// newGame.startGame();
// console.log(newGame.playerHand);
// console.log(newGame.dealerHand);

export { findCreateGame, updateHand }