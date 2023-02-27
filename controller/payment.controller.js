const connection = require("../db");

async function queryDB(query, param) {
  return new Promise((resolve) => {
    connection.query(query, param, function (err, result, fields) {
      if (err) {
        //resolve('err : ' + err.stack);
        resolve("err :" + err.message);
      } else {
        resolve(result);
      }
    });
  });
}

const orderPayment = async (req, res, next) => {
  try {
    const queryString = req.query;
    const bodies = req.body;

    const order = await queryDB(
      `SELECT total_price FROM orders WHERE user_id = ? AND order_no = ?`,
      [queryString.user_id, queryString.order_no]
    );
    console.log(order);

    if (order[0].total_price == bodies.payment_amount) {
      const payment = await queryDB(
        `UPDATE orders SET status = 'PENDING' WHERE user_id = ? AND order_no = ?`,
        [queryString.user_id, queryString.order_no]
      );
      console.log(payment);

      return res.status(200).json({
        message: "payment successful",
      });
    } else {
      throw {
        code: 400,
        message: "payment failed",
      };
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { orderPayment };
