const User = require('../models/user');
// amount of currency user starts with
const defaultCurrency = process.env.DEFAULT_CURRENCY;

const findUser = async (userId, createNewIfNull = true) => {
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