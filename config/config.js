
const mysql = require('mysql');
module.exports = {
  PORT: process.env.PORT || 5000,
  mysql: mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "barcode"
  })
};
