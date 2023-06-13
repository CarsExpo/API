const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expireAt: {type: Date, expires: 300, default: Date.now}
});

module.exports = mongoose.model('OTP', OtpSchema);
