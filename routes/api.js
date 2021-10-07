const keys = require('../config/keys');
const config = require('../config/config');
var sha1 = require('sha1');
const cookieParser = require("cookie-parser");

module.exports = app => {
  app.get('/api/logout', (req, res) => {
    req.logout(); // logout() gets attached by passport to the request
    res.redirect('/');
  });

  app.get('/api/current_user', (req, res) => {
    res.send(req.user);
  });
  app.post('/api/hasUser', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    var query = 'select * from users where username ="' + username + '" and  password = "' + sha1(password) + '"';
    config.mysql.query(query, function (err, result) {
      if (err) throw err;
      if (result.length) {
        res.send({ result: 'default_login' })
      } else {
        if (!result.length && username == "admin" && password == 'password') {
          var query = "INSERT INTO users (username, PASSWORD) VALUES ('" + username + "', '" + sha1(password) + "')";
          config.mysql.query(query, async (err, result) => {
            if (err) throw err;
            if (result) {
              res.send({ result: 'default_login' });
            } else {
              res.send({ result: 'error' })
            }
          })
          // var cookies = req.cookies; // Gets read-only cookies from the request
          // res.cookie('login_status', 'true'); // Adds a new cookie to the response
          // res.cookie('username', 'admin'); // Adds a new cookie to the response

        } else {
          res.send({ result: 'error' })
        }
      }
    })
  })
  app.post('/api/addrow', function (req, res) {
    var data = [req.body];
    console.log(2222, data)
    config.mysql.query('select * from barcode_list where barcode_key=?', [req.body.key], async function (err, result) {
      if (err) throw err;
      let values = data.reduce((o, a) => {
        let ini = [];
        ini.push(a.key);
        ini.push(a.barcode);
        ini.push(a.barcode_name);
        ini.push(a.date_added);
        ini.push(a.barcode_status);
        o.push(ini);
        return o
      }, []);
      console.log(values)
      if (!result.length) {
        var sql = "INSERT INTO barcode_list (barcode_key, barcode, barcode_name, date_added, barcode_status) VALUES ?";
        config.mysql.query(sql, [values], async function (err, result) { //pass values array (from above)  directly here
          console.log(result)
          if (err) throw err;
          res.send({ result: 'inserted' })
        });
      } else {
        var sql = "UPDATE barcode_list SET barcode =?,barcode_name =?,barcode_status=? where barcode_key=?";
        config.mysql.query(sql, [req.body.barcode, req.body.barcode_name, req.body.barcode_status, req.body.key], async function (err, result) {
          if (err) throw err;
          res.send({ result: 'updated' });
        })
      }
    })
  })
  app.post('/api/get_tabledata', (req, res) => {
    config.mysql.query('select * from barcode_list', (err, result) => {
      if (err) throw err;
      res.send(result);
    })
  })
  app.post('/api/record_active', (req, res) => {
    var ids = req.body;
    let values = ids.reduce((o, a) => {
      let ini = [];
      ini.push(a);
      o.push(ini);
      return o
    }, []);
    ids.map(async(values, index) => {
      await config.mysql.query('UPDATE barcode_list SET barcode_status = "Active" where barcode_key=?', [values], async function (err, result) {4
        if(err) throw err;
      })
    })

    config.mysql.query('select * from barcode_list', async (err, result) => {
      if (err) throw err;
      if (result) {
        res.send(result);
      }
    })
  })
  app.post('/api/record_archived', (req, res) => {
    var ids = req.body;
    let values = ids.reduce((o, a) => {
      let ini = [];
      ini.push(a);
      o.push(ini);
      return o
    }, []);
    ids.map(async(values, index) => {
      await config.mysql.query('UPDATE barcode_list SET barcode_status = "Archived" where barcode_key=?', [values], async function (err, result) {
        if (err) throw err;
      })
      config.mysql.query('select * from barcode_list', async (err, result) => {
        if (err) throw err;
        if (result) {

          res.send(result);
        }
      })

    })
  })
  app.post('/api/change_userinfo', (req, res) => {
    var userData = req.body;
    config.mysql.query('select * from users where password =?', [sha1(userData.oldpass)], async (err, result) => {
      if (err) throw err;
      if (result.length) {
        console.log('123123123');
        var query = 'UPDATE users SET username=?,password=? where password=?';
        config.mysql.query(query, [userData.username, sha1(userData.password), sha1(userData.oldpass)], async (err, result) => {
          if (err) throw err;
          if (result) {
            res.send(true);
          }
        })
      } else {
        res.send(false)
      }
    })
  })
  // app.post('/api/filter_barcode', (req, res) => {
  //   console.log(req.body)
  // })
  app.post('/api/amount_transaction', (req, res) => {
    let data = [req.body];
    var query = "INSERT INTO amount_transaction (barcode,barcode_name,date_added,amount,food_type) VALUES ?";
    console.log(data)
    let values = data.reduce((o, a) => {
      let ini = [];
      ini.push(a.barcode);
      ini.push(a.barcode_name);
      ini.push(a.date_added);
      ini.push(a.amount);
      ini.push(a.food_type);
      o.push(ini);
      return o
    }, []);
    config.mysql.query(query, [values], async (err, result) => {
      if (err) throw err;
      if (result) {
        res.send("success");
      }
    })
  })
  app.post('/api/get_scaneddata', (req, res) => {
    let sql = "SELECT * FROM amount_transaction";
    config.mysql.query(sql, async (err, result) => {
      if (err) throw err;
      if (result) {
        res.send(result);
      }
    })
  })
  app.post('/api/scaned_remove', (req, res) => {
    let data = req.body;
    let sql = "DELETE FROM amount_transaction WHERE id = ?";
    let flag = false;
    data.map(async(data, index) => {
      await config.mysql.query(sql, [data], async (err, result) => {
        if (err) throw err;
      })
    })
    config.mysql.query("select * from amount_transaction", async (err, result) => {
      if (err) throw err;
      if (result) {
        res.send(result);
      }
    })
  })
  app.post('/api/barcode_remove', (req, res) => {
    let data = req.body;
    let sql = "DELETE FROM barcode_list WHERE barcode_key = ?";
    let flag = false;
    data.map(async(data, index) => {
      await config.mysql.query(sql, [data], async (err, result) => {
        if (err) throw err;
      })
    })
    config.mysql.query("select * from barcode_list", async (err, result) => {
      if (err) throw err;
      if (result) {
        res.send(result);
      }
    })
  })
};
