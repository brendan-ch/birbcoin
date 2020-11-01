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
      lastClaimedDaily: Date.now()
    });

    // save new user
    newUser.save();

    // return new user document
    return newUser;
  } else {
    return null;
  }
};

module.exports.findUser = findUser;