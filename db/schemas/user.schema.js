const mongoose = require("mongoose");
const Roles = require("./role.schema");

const userSchema = new mongoose.Schema(
  {
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: Roles, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    reset_token: { type: String, default: null },
    token_expired_at: { type: Date, default: null },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

const Users = mongoose.model("users", userSchema);

module.exports = Users;
