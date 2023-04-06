const connection = require("../db");
const NewError = require("../helpers/error-stack.helper");

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
    const { user_id, order_no } = req.query;
    const { payment_amount } = req.body;

    // select order record
    const order = await queryDB(`SELECT total_price FROM orders WHERE user_id = ? AND order_no = ?`, [user_id, order_no]);

    // if the order total price match with the body, update the status
    if (order[0].total_price === payment_amount) {
      const payment = await queryDB(`UPDATE orders SET status = 'PROCESSING' WHERE user_id = ? AND order_no = ?`, [user_id, order_no]);

      return res.status(200).json({
        message: "Payment successful",
      });
    } else {
      throw new NewError(400, "Payment failed");
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { orderPayment };
