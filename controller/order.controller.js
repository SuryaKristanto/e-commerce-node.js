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

const createOrder = async (req, res, next) => {
  try {
    // cek itemnya ada semua ngga?
    const { products } = req.body;
    console.log(products);
    const { payment_method } = req.body;
    console.log(payment_method);

    const productCode = products.map((product) => {
      return product.code;
    });
    console.log(productCode);

    const placeholders = productCode.map(() => "?").join(", ");
    // console.log(placeholders);

    const existProducts = await queryDB(
      `SELECT * FROM products WHERE code IN (${placeholders}) AND deleted_at IS NULL`,
      productCode
    );
    console.log(existProducts);

    if (existProducts.length !== products.length) {
      throw {
        code: 404,
        message: "product not found",
      };
    }

    try {
      await connection.beginTransaction();

      const order_no = Math.floor(Math.random() * 100 + 1);

      const order = await queryDB(
        `INSERT INTO orders (id, user_id, order_no, status, payment_method, updated_at, created_at) VALUES (DEFAULT,?,?,DEFAULT,?,DEFAULT,DEFAULT)`,
        [req.user_id, order_no, payment_method]
      );
      console.log(order);

      const totalPrice = [];
      await Promise.all(
        existProducts.map(async (product) => {
          const selectedPayload = products.find(
            (val) => val.code === product.code
          );
          console.log(selectedPayload);

          deductQty = product.qty - selectedPayload.qty;
          console.log(deductQty);
          // deduct product qty
          const update = await queryDB(
            `UPDATE products SET qty = ? WHERE qty = ?`,
            [deductQty, product.qty]
          );
          console.log(update);

          // create order_products
          const orderProducts = await queryDB(
            `INSERT INTO order_products (id, product_code, order_id, qty_order, updated_at, created_at) VALUES (DEFAULT,?,?,?,DEFAULT,DEFAULT)`,
            [product.code, order.insertId, selectedPayload.qty]
          );
          console.log(orderProducts);

          const totalPerProduct = selectedPayload.qty * product.price;
          console.log(totalPerProduct);
          totalPrice.push(totalPerProduct);
          console.log(totalPrice);
        })
      );

      var sum = 0;
      for (let i = 0; i < totalPrice.length; i++) {
        sum += totalPrice[i];
      }
      console.log(sum);

      const updateTotalPrice = await queryDB(
        `UPDATE orders SET total_price = ? WHERE order_no = ?`,
        [sum, order_no]
      );
      console.log(updateTotalPrice);

      await connection.commit();
      console.log("Transaction committed successfully");
    } catch (error) {
      await connection.rollback();
      console.log("Transaction rolled back due to error: " + error);
    } finally {
      await connection.end();
    }

    return res.status(201).json({
      message: "success create order",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder };
