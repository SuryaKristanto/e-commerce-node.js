const Roles = require("../db/schemas/role.schema");

const createRole = async (req, res, next) => {
  try {
    const role = await Roles.create(req.body);

    return res.status(200).json({
      message: "success create role",
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRole };
