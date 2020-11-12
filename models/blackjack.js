const mongoose = require('mongoose');

const Blackjack = new mongoose.Schema({
  userId: String,
  bet: { type: Number, min: 0 },  // amount the user is betting
  deck: Array,  // deck of "cards". can have as many decks possible
  playerHand: Array,  // when player hits, card will be taken out of deck and placed in player/dealer hand
  dealerHand: Array,
  splitHand: Array,
  showDealerCard: Boolean
});

module.exports = mongoose.model("blackjackGame", Blackjack);