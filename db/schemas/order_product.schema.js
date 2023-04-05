const mongoose = require("mongoose");
const Products = require("./product.schema");
const Orders = require("./order.schema");

const orderProductSchema = new mongoose.Schema(
  {
    product_code: { type: mongoose.Schema.Types.ObjectId, ref: Products, required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: Orders, required: true },
    qty_order: { type: Number, required: true },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

const OrderProducts = mongoose.model("order_products", orderProductSchema);

module.exports = OrderProducts;
