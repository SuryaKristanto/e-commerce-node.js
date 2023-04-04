const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    weight: { type: Number, required: true },
    qty: { type: Number, required: true },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

const Products = mongoose.model("products", productSchema);

module.exports = Products;
