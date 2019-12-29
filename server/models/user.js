const mongoose = require('mongoose');
const UserSchema = mongoose.Schema({
  email: {
    type: String, 
  },
  password: {
    type: String,   
  },
  displayName: {
    type: String,    
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  token: {
    type: String,
  }
});
const User = mongoose.model('User', UserSchema);
module.exports = {User};