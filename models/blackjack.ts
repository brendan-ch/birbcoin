import mongoose from 'mongoose';
import { Blackjack } from '../typedefs';

const BlackjackGame = new mongoose.Schema({
  userId: String,
  bet: { type: Number, min: 0 },  // amount the user is betting
  deck: Array,  // deck of "cards". can have as many decks possible
  playerHand: Array,  // when player hits, card will be taken out of deck and placed in player/dealer hand
  dealerHand: Array,
  splitHand: Array,
  showDealerCard: Boolean
});

export default mongoose.model<Blackjack.IGame>("blackjackGame", BlackjackGame);