const { getCache, setCache, removeCache } = require("../helpers/caching.helper");
const queryDB = require("../helpers/query.helper");

const addWishlist = async (req, res, next) => {
  try {
    const { product_code } = req.body;

    // insert wishlist rcord
    const add = await queryDB(`INSERT INTO wishlists (id, user_id, product_code, created_at) VALUES (DEFAULT,?,?,DEFAULT)`, [
      req.user_id,
      product_code,
    ]);

    removeCache("wishlist");

    return res.status(200).json({
      message: "Added to wishlist",
    });
  } catch (error) {
    next(error);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    let list;

    const cacheData = await getCache("wishlist");
    if (cacheData) {
      console.log("Cache Hit");
      list = JSON.parse(cacheData);
    } else {
      const product = await queryDB(`SELECT product_code FROM wishlists WHERE user_id = ? ORDER BY created_at DESC`, req.user_id);

      let productCode = [];
      for (let i = 0; i < product.length; i++) {
        productCode[i] = product[i].product_code;
      }

      const placeholders = productCode.map(() => "?").join(", ");

      // select wishlist and product record
      list = await queryDB(
        `SELECT products.name, products.price FROM wishlists LEFT JOIN products ON wishlists.product_code = products.code WHERE code IN (${placeholders}) AND wishlists.user_id = ? AND deleted_at IS NULL ORDER BY wishlists.created_at DESC`,
        [productCode, req.user_id]
      );

      setCache("wishlist", list);
    }

    return res.status(200).json({
      message: "Wishlist",
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

const removeWishlist = async (req, res, next) => {
  try {
    const { product_code } = req.body;

    // delete wishlist record
    const remove = await queryDB(`DELETE FROM wishlists WHERE user_id = ? AND product_code = ?`, [req.user_id, product_code]);

    removeCache("wishlist");

    return res.status(200).json({
      message: "Removed from wishlist",
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
