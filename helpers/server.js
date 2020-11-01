const Server = require('../models/server');
const defaultPrefix = process.env.DEFAULT_PREFIX;

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

    newServer.save();  // saves document for future

    return newServer;  // returns newly created server document
  };
};

module.exports.findServer = findServer;