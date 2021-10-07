const express = require('express');
const passport = require('passport');
const cors = require('cors');
const config = require('./config/config');
const keys = require('./config/keys');
const mysql = require('mysql');
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser')


// Mongoose
var con = config.mysql;

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});
con.query('CREATE DATABASE IF NOT EXISTS barcode', function (err, data) {
  if (!err) {
    console.log('success create database');
  }
})
require('./models/User');
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
}
app.use(cors({ origin: '*' }));
app.use(express.static(__dirname + "/client"))
app.use(cookieParser());
app.use(bodyParser.json({ limit: "15360mb", type: 'application/json' }))
app.use(bodyParser.urlencoded({ extended: true }))
// Implement Middleware
require('./middleware/express')(app, passport);

// Passport Setup
require('./services/passport/passport')(passport);
require('./services/passport/strategies/local-signup')(passport);
require('./services/passport/strategies/local-login')(passport);

// Routes

require('./routes/auth')(app, passport);
require('./routes/api')(app, passport);
app.listen(config.PORT, () => {
  console.log(`Server listening on port ${config.PORT}`);
});
