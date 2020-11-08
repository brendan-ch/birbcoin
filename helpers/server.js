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
    // what we'll use to check if server document is updated
    // not all keys from the schema are in here, because we can't set default values for some fields
    const serverValidator = {
      "prefix": defaultPrefix,
      "disabledCommands": [],
    };

    const serverKeys = Object.keys(server.toObject());  // get all keys of server document
    const serverValidatorKeys = Object.keys(serverValidator);  // get keys of serverValidator (to validate serverKeys)

    // loop through validator keys
    serverValidatorKeys.forEach(value => {
      if (!serverKeys.includes(value)) {
        server[value] = serverValidator[value];  // update server document with "default" value
      }
    });

    await server.save();
    return server;
  } else {  // no server was found, create new document in database
    const newServer = new Server({
      serverId: serverId,
      prefix: defaultPrefix,
      disabledCommands: [],
    });

    // save new server
    // await: required because saving same document too quickly multiple times will throw error
    await newServer.save();  // saves document for future

    return newServer;  // returns newly created server document
  };
};

module.exports.findServer = findServer;
module.exports.findTopUsersInServer = findTopUsersInServer;