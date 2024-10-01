const mongoose = require ('mongoose');
const config = require('config');
const dbgr = require('debug')("development:mongoose"); //development likha hai kyu ki hum abhi development phase mai hai isliye
//config .get works on the environment variable
mongoose.connect(`${config.get("MONGODB_URI")}/Bag_project`) //ye apne local host wale mongo se connect hota hai
.then(() => {
    dbgr('MongoDB connected successfully');
  })
  .catch((err) => {
    dbgr('MongoDB connection error:', err);
  });

  // to setup environment variable 
  // export DEBUG=development:*       DEBUG = environment variable hai development:* means Development: ki sari chizz lena
  module.exports = mongoose.connection;