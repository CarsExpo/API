const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  verified: { type: Boolean, required: false, default: false },
  resetPasswordToken: { type: String, required: false, default: null},
  resetPasswordExpires: { type: Date, required: false },
});

module.exports = mongoose.model('User', UserSchema);
