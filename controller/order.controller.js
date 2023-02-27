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
    // cek productsnya ada semua ngga?
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

const orderList = async (req, res, next) => {
  try {
    const userId = await queryDB(
      `SELECT id FROM users WHERE id = ? AND deleted_at IS NULL`,
      [req.user_id]
    );
    // console.log(userId);

    const orders = await queryDB(
      `SELECT orders.order_no, orders.status, orders.total_price, order_products.product_code AS "product_code", order_products.qty_order AS "qty_order", products.name AS "name", products.price AS "price" FROM orders LEFT JOIN order_products ON orders.id = order_products.order_id LEFT JOIN products ON order_products.product_code = products.code AND (products.deleted_at IS NULL) WHERE orders.deleted_at IS NULL AND orders.user_id = ? AND status <> 'FINISHED' ORDER BY orders.created_at DESC`,
      userId[0].id
    );
    console.log(orders);

    const order_products = [];
    for (let i = 0; i < orders.length; i++) {
      const existingOrderIndex = order_products.findIndex(
        (order) => order.order_no === orders[i].order_no
      );

      if (existingOrderIndex > -1) {
        order_products[existingOrderIndex].products.push({
          product_code: orders[i].product_code,
          qty_order: orders[i].qty_order,
          name: orders[i].name,
          price: orders[i].price,
        });
      } else {
        order_products.push({
          order_no: orders[i].order_no,
          status: orders[i].status,
          total_price: orders[i].total_price,
          products: [
            {
              product_code: orders[i].product_code,
              qty_order: orders[i].qty_order,
              name: orders[i].name,
              price: orders[i].price,
            },
          ],
        });
      }
    }
    // console.log(order_products);
    res.status(200).json({
      message: "Order List",
      data: order_products,
    });
  } catch (error) {
    next(error);
  }
};

const orderStatus = async (req, res, next) => {
  try {
    const queryString = req.query;
    console.log(queryString);

    const existOrder = await queryDB(
      `SELECT status FROM orders WHERE id = ? AND deleted_at IS NULL`,
      queryString.id
    );
    console.log(existOrder);

    if (existOrder.length < 1) {
      throw {
        code: 404,
        message: "order not found",
      };
    }

    return res.status(200).json({
      code: 200,
      message: existOrder[0],
    });
  } catch (error) {
    next(error);
  }
};

const orderHistory = async (req, res, next) => {
  try {
    const userId = await queryDB(
      `SELECT id FROM users WHERE id = ? AND deleted_at IS NULL`,
      [req.user_id]
    );
    // console.log(userId);

    const orders = await queryDB(
      `SELECT orders.order_no, orders.status, orders.total_price, order_products.product_code AS "product_code", order_products.qty_order AS "qty_order", products.name AS "name", products.price AS "price" FROM orders LEFT JOIN order_products ON orders.id = order_products.order_id LEFT JOIN products ON order_products.product_code = products.code AND (products.deleted_at IS NULL) WHERE orders.deleted_at IS NULL AND orders.user_id = ? AND status = 'FINISHED' ORDER BY orders.created_at DESC`,
      userId[0].id
    );
    console.log(orders);

    const order_products = [];
    for (let i = 0; i < orders.length; i++) {
      const existingOrderIndex = order_products.findIndex(
        (order) => order.order_no === orders[i].order_no
      );

      if (existingOrderIndex > -1) {
        order_products[existingOrderIndex].products.push({
          product_code: orders[i].product_code,
          qty_order: orders[i].qty_order,
          name: orders[i].name,
          price: orders[i].price,
        });
      } else {
        order_products.push({
          order_no: orders[i].order_no,
          status: orders[i].status,
          total_price: orders[i].total_price,
          products: [
            {
              product_code: orders[i].product_code,
              qty_order: orders[i].qty_order,
              name: orders[i].name,
              price: orders[i].price,
            },
          ],
        });
      }
    }
    // console.log(order_products);
    res.status(200).json({
      message: "Order List",
      data: order_products,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, orderList, orderStatus, orderHistory };
