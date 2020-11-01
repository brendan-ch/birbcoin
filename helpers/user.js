const User = require('../models/user');
// amount of currency user starts with
const defaultCurrency = process.env.DEFAULT_CURRENCY;

const findUser = async (userId, createNewIfNull = true) => {
  // returns null if no user
  const user = await User.findOne({
    userId: userId
  }).exec();

  if (user) {  // user found
    return user;
  } else if (createNewIfNull) {  // no user found, create new user in database
    const newUser = new User({
      userId: userId,
      currency: defaultCurrency,
      lastClaimedDaily: new Date(),
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