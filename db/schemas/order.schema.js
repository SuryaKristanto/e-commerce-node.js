const mongoose = require("mongoose");
const Users = require("./user.schema");

const orderSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: Users, required: true },
    order_no: { type: Number, required: true, unique: true },
    status: { type: String, required: true, default: "PENDING" },
    payment_method: { type: String, required: true },
    total_price: { type: String, default: null },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

const Orders = mongoose.model("orders", orderSchema);

module.exports = Orders;
