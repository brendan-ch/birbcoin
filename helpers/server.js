const Server = require('../models/server');
const User = require('../models/user');
const defaultPrefix = process.env.DEFAULT_PREFIX;

const findTopUsersInServer = async (serverId, numUsers = 0) => {
  const users = await User.find({
    servers: serverId  // find all documents where serverId is in array servers
  }).sort({ 'currency': 'desc' });

  if (numUsers > 0 && users.length >= numUsers) {
    return users.slice(0, numUsers);
  } else {
    return users;
  }
};

// find server by server ID (retrieved from message sent by user)
const findServer = async (serverId) => {
  // returns null if no server
  const server = await Server.findOne({
    serverId: serverId
  }).exec();

  if (server) {  // a server was found
    return server;
  } else {  // no server was found, create new document in database
    const newServer = new Server({
      serverId: serverId,
      prefix: defaultPrefix,
    });

    // save new server
    // await: required because saving same document too quickly multiple times will throw error
    await newServer.save();  // saves document for future

    return newServer;  // returns newly created server document
  };
};

module.exports.findServer = findServer;
module.exports.findTopUsersInServer = findTopUsersInServer;