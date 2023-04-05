const { default: mongoose } = require("mongoose");
const Wishlist = require("../db/schemas/wishlist.schema");

const addWishlist = async (req, res, next) => {
  try {
    const { product_code } = req.body;

    // insert wishlist document
    const add = await Wishlist.create({ user_id: req.user_id, product_code: product_code });
    // console.log(add);

    return res.status(200).json({
      message: "Added to wishlist",
    });
  } catch (error) {
    next(error);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const product = await Wishlist.find({ user_id: req.user_id }, { _id: 0, product_code: 1 }).sort({ created_at: -1 });
    // console.log(product);

    let productCode = [];
    for (let i = 0; i < product.length; i++) {
      productCode[i] = product[i].product_code;
    }
    // console.log(productCode);

    // find wishlist and product document
    const list = await Wishlist.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(req.user_id), product_code: { $in: productCode } } },
      { $lookup: { from: "products", localField: "product_code", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $project: { _id: 0, "product.name": 1, "product.price": 1 } },
      { $sort: { created_at: -1 } },
    ]);
    // console.log(list);

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

    // delete wishlist document
    const remove = await Wishlist.deleteOne({ user_id: req.user_id, product_code: product_code });
    // console.log(remove);

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
