// Global type definitions used across all parts of the bot.
import Discord from 'discord.js';
import mongoose from 'mongoose';

/**
 * Collection of types related to blackjack.
 */
namespace Blackjack {
  /**
   * The suit of a card from a standard card deck.
   */
  type Suit = "H" | "S" | "C" | "D" | null;
  /**
   * The value of a card from a standard card deck.
   */
  type Value = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A" | null;

  /**
   * Represents a card from a standard card deck. Used in `Deck` type.
   */
  interface Card {
    suit: Suit,
    value: Value
  }

  /**
   * Represents a blackjack deck. Used in `Game` interface.
   */
  type Deck = Card[]

  /**
   * Represents a blackjack game instance in the database.
   */
  interface IGame extends mongoose.Document {
    userId: string,
    bet: number,
    deck: Deck,
    playerHand: Deck,
    dealerHand: Deck,
    splitHand: Deck,
    showDealerCards: boolean
  }
}

/**
 * Hack to allow storing commands in Discord client.
 */
 interface ClientWithCommands extends Discord.Client {
  commands?: Discord.Collection<string, Command>
};

/**
 * Hack that uses new `ClientWithCommands` property in Discord message.
 */
interface MessageWithCommands extends Discord.Message {
  client: ClientWithCommands
};

/**
 * Represents a command object. 
 * Contains command information (name, aliases) as well as a method that runs
 * when the command is called.
 */
interface Command {
  /**
   * The name of the command. `execute` property is run when command name is called.
   */
  name: string,
  /**
   * Alternative ways the user can call the command.
   */
  aliases?: Array<string>,
  /**
   * Description of the command. Shown in help command.
   */
  description: string,
  /**
   * Whether or not the command can be used in DMs.
   */
  allowDMs: boolean,
  /**
   * Section that the command belongs to. Shows up in help command.
   * If type is "Admin", command can only be run when user has admin role on server.
   */
  type: "General" | "Wager your birbcoins!" | "Admin",
  /**
   * Describes how to use the command. Shown in help command.
   */
  usage?: string,
  /**
   * Method that is run when command is called.
   * @param message 
   * @param args 
   */
  execute(message: MessageWithCommands, args: Array<string>): Promise<void>,
};

/**
 * Represents a user instance in the database.
 */
interface IUser extends mongoose.Document {
  userId: string,
  currency: number,
  lastClaimedDaily: Date,
  servers: Array<string>,
  usernameDiscord: string
};

/**
 * Represents a Discord server instance in the database.
 */
interface IServer extends mongoose.Document {
  prefix: string,
  serverId: string,
  disabledCommands: Array
};

export {
  Command,
  IUser,
  IServer,
  Blackjack,
  ClientWithCommands,
  MessageWithCommands
}