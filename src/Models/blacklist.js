const mongoose = require('mongoose');

const BlacklistSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now,
    expires: 60*60*24
  }
});

module.exports = mongoose.model('Blacklist', BlacklistSchema);