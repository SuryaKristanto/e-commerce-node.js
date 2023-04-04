const Roles = require("../db/schemas/role.schema");
const NewError = require("../helpers/error-stack.helper");

const createRole = async (req, res, next) => {
  try {
    const { name } = req.body;

    const existRole = await Roles.findOne({ name: name });

    if (existRole) {
      throw new NewError(409, "role already exist");
    }

    const role = await Roles.create(name);

    return res.status(200).json({
      message: "success create role",
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRole };
