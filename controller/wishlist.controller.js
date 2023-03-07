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

const addWishlist = async (req, res, next) => {
  try {
    const bodies = req.body;

    const add = await queryDB(
      `INSERT INTO wishlist (id, user_id, product_code, created_at) VALUES (DEFAULT,?,?,DEFAULT)`,
      [req.user_id, bodies.product_code]
    );
    console.log(add);

    res.status(200).json({
      message: "added to wishlist",
    });
  } catch (error) {
    next(error);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const product = await queryDB(
      `SELECT product_code FROM wishlist WHERE user_id = ? ORDER BY created_at DESC`,
      req.user_id
    );
    // console.log(product);

    let productCode = [];
    for (let i = 0; i < product.length; i++) {
      productCode[i] = product[i].product_code;
    }
    // console.log(productCode);

    const placeholders = productCode.map(() => "?").join(", ");
    // console.log(placeholders);

    const list = await queryDB(
      `SELECT products.name, products.price FROM wishlist LEFT JOIN products ON wishlist.product_code = products.code WHERE code IN (${placeholders}) AND deleted_at IS NULL ORDER BY wishlist.created_at DESC`,
      productCode
    );
    console.log(list);

    res.status(200).json({
      message: "Wishlist",
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

const removeWishlist = async (req, res, next) => {
  try {
    const bodies = req.body;

    const remove = await queryDB(
      `DELETE FROM wishlist WHERE user_id = ? AND product_code = ?`,
      [req.user_id, bodies.product_code]
    );
    console.log(remove);

    res.status(200).json({
      message: "removed from wishlist",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addWishlist,
  getWishlist,
  removeWishlist,
};
