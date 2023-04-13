const connection = require("../db/mysql");

async function queryDB(query, param) {
  return new Promise((resolve, reject) => {
    connection.query(query, param, function (err, result, fields) {
      if (err) {
        reject("err :" + err.message);
      } else {
        resolve(result);
      }
    });
  });
}

module.exports = queryDB;
