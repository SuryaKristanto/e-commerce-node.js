const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Please provide a name for the role"] },
  },
  { timestamps: true }
);

const Roles = mongoose.model("roles", roleSchema);

module.exports = Roles;