const mongoose = require('mongoose');
console.log(process.env.MONGODB_URI);
// Plug in global ES6 promise constructor
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://blog:blog123@dbh63.mlab.com:27637/demo_social_media_login', { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Now connected to database.')
});


module.exports = { mongoose };