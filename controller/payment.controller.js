const Orders = require("../db/schemas/order.schema");
const NewError = require("../helpers/error-stack.helper");

const orderPayment = async (req, res, next) => {
  try {
    const { user_id, order_no } = req.query;
    const { payment_amount } = req.body;

    // find order document
    const order = await Orders.findOne({ user_id: user_id, order_no: order_no }, { _id: 0, total_price: 1 });
    // console.log(order);

    // if the order total price match with the body, update the status
    if (order.total_price == payment_amount) {
      const payment = await Orders.findOneAndUpdate({ user_id: user_id, order_no: order_no }, { status: "PROCESSING" });
      // console.log(payment);

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
