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

const createOrder = async (req, res, next) => {
  try {
    const { products, payment_method } = req.body;

    const productCode = products.map((product) => {
      return product.code;
    });

    const placeholders = productCode.map(() => "?").join(", ");

    // check if the product exist
    const existProducts = await queryDB(`SELECT * FROM products WHERE code IN (${placeholders}) AND deleted_at IS NULL`, productCode);

    if (existProducts.length !== products.length) {
      throw new NewError(404, "Product not found");
    }

    connection.beginTransaction();

    try {
      const order_no = Math.floor(Math.random() * 1000);

      // insert order record
      const order = await queryDB(
        `INSERT INTO orders (id, user_id, order_no, status, payment_method, updated_at, created_at) VALUES (DEFAULT,?,?,DEFAULT,?,DEFAULT,DEFAULT)`,
        [req.user_id, order_no, payment_method]
      );

      const totalPrice = [];
      await Promise.all(
        existProducts.map(async (product) => {
          const selectedPayload = products.find((val) => val.code === product.code);

          const deductQty = product.qty - selectedPayload.qty;

          // deduct product qty
          const update = await queryDB(`UPDATE products SET qty = ? WHERE qty = ?`, [deductQty, product.qty]);

          // create order_product record
          const orderProducts = await queryDB(
            `INSERT INTO order_products (id, product_code, order_id, qty_order, updated_at, created_at) VALUES (DEFAULT,?,?,?,DEFAULT,DEFAULT)`,
            [product.code, order.insertId, selectedPayload.qty]
          );

          const totalPerProduct = selectedPayload.qty * product.price;
          totalPrice.push(totalPerProduct);
        })
      );

      const sum = 0;
      for (let i = 0; i < totalPrice.length; i++) {
        sum += totalPrice[i];
      }

      // update total price in order document
      const updateTotalPrice = await queryDB(`UPDATE orders SET total_price = ? WHERE order_no = ?`, [sum, order_no]);

      connection.commit();
      console.log("Transaction committed successfully");
    } catch (error) {
      connection.rollback();
      console.log("Transaction rolled back due to error: " + error);
    } finally {
      connection.end();
    }

    return res.status(201).json({
      message: "Success create order",
    });
  } catch (error) {
    next(error);
  }
};

const orderList = async (req, res, next) => {
  try {
    // select user
    const userId = await queryDB(`SELECT id FROM users WHERE id = ? AND deleted_at IS NULL`, [req.user_id]);

    // select order
    const orders = await queryDB(
      `SELECT orders.order_no, orders.status, orders.total_price, order_products.product_code AS "product_code", order_products.qty_order AS "qty_order", products.name AS "name", products.price AS "price" FROM orders LEFT JOIN order_products ON orders.id = order_products.order_id LEFT JOIN products ON order_products.product_code = products.code AND (products.deleted_at IS NULL) WHERE orders.deleted_at IS NULL AND orders.user_id = ? AND status <> 'FINISHED' ORDER BY orders.created_at DESC`,
      userId[0].id
    );

    // loop the data into array
    const order_products = [];
    for (let i = 0; i < orders.length; i++) {
      const existingOrderIndex = order_products.findIndex((order) => order.order_no === orders[i].order_no);

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
    const { id } = req.query;

    // find the order status
    const existOrder = await queryDB(`SELECT status FROM orders WHERE id = ? AND deleted_at IS NULL`, id);

    if (existOrder.length < 1) {
      throw new NewError(404, "Order not found");
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
    // select user
    const userId = await queryDB(`SELECT id FROM users WHERE id = ? AND deleted_at IS NULL`, [req.user_id]);

    // select order
    const orders = await queryDB(
      `SELECT orders.order_no, orders.status, orders.total_price, order_products.product_code AS "product_code", order_products.qty_order AS "qty_order", products.name AS "name", products.price AS "price" FROM orders LEFT JOIN order_products ON orders.id = order_products.order_id LEFT JOIN products ON order_products.product_code = products.code AND (products.deleted_at IS NULL) WHERE orders.deleted_at IS NULL AND orders.user_id = ? AND status = 'FINISHED' ORDER BY orders.created_at DESC`,
      userId[0].id
    );

    // loop the data into array
    const order_products = [];
    for (let i = 0; i < orders.length; i++) {
      const existingOrderIndex = order_products.findIndex((order) => order.order_no === orders[i].order_no);

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

    res.status(200).json({
      message: "Order List",
      data: order_products,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, orderList, orderStatus, orderHistory };
