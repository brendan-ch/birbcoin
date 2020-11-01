const mongoose = require('mongoose');

const Server = new mongoose.Schema({
  prefix: String,
  serverId: String
});

module.exports = mongoose.model('server', Server);