const mongoose = require("mongoose");
const Users = require("./user.schema");
const Products = require("./product.schema");

const wishlistSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: Users, required: true },
    product_code: { type: mongoose.Schema.Types.ObjectId, ref: Products, required: true },
  },
  {
    timestamps: true,
  }
);

const Wishlist = mongoose.model("wishlists", wishlistSchema);

module.exports = Wishlist;
