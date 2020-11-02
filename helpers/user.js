const User = require('../models/user');
// amount of currency user starts with
const defaultCurrency = process.env.DEFAULT_CURRENCY;

const findUser = async (userId, createNewIfNull = true, serverId = undefined, client = undefined) => {
  // returns null if no user
  const user = await User.findOne({
    userId: userId
  }).exec();

  if (user) {  // user found
    // what we'll use to check if user document is updated
    // not all keys are here, because we can't set default values for all of them
    const userValidator = {
      "servers": []
    };

    const userKeys = Object.keys(user.toObject());
    const userValidatorKeys = Object.keys(userValidator);

    // loop through validator keys
    userValidatorKeys.forEach(value => {
      if (!userKeys.includes(value)) {
        user[value] = userValidator[value];  // update user document with default key
      }
    });

    // from here on we can assume that the server list exists
    // loop through server list and check if user is still in each server
    await new Promise(async (resolve, reject) => {
      if (client) {
        for (const id of user.servers) {
          const index = user.servers.indexOf(id);

          let server = undefined;
          let member = undefined;
  
          // server may or may not exist/bot may be missing access
          try {
            server = await client.guilds.fetch(id);
            member = server ? await server.members.fetch(userId) : undefined;
          } catch(err) {
            console.error(err);
          };
  
          if (!member || !server) {
            user.servers.splice(index);  // remove server from list
          }
        };

        resolve();
      } else {
        resolve();
      };
    })

    // if server ID is provided, we check if it exists in server list and add it if it doesn't exist
    if (serverId && !user.servers.includes(serverId)) {
      user.servers.push(serverId);  // add the server ID to the list
    };

    await user.save();

    return user;
  } else if (createNewIfNull) {  // no user found, create new user in database
    const newUser = new User({
      userId: userId,
      currency: defaultCurrency,
      lastClaimedDaily: new Date(Date.now() - 86400000),  // sets it to one day before so user can claim on creation
      servers: []
    });

    // save new user
    // await: required because saving same document too quickly multiple times will throw error
    await newUser.save();

    // return new user document
    return newUser;
  } else {
    return null;
  }
};

module.exports.findUser = findUser;