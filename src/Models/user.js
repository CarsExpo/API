const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  lastname: { type: String, required: true },
  firstname: { type: String, required: true },
  password: { type: String, required: true },
  verified: { type: Boolean, required: false, default: false },
  resetPasswordToken: { type: String, required: false, default: null},
  resetPasswordExpires: { type: Date, required: false },
  confirmationToken: { type: String, required: false },
  pendingChanges: { type: Object, required: false },
});

module.exports = mongoose.model('User', UserSchema);
