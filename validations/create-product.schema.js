const Joi = require("joi");

const createProductSchema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().required(),
  weight: Joi.number().required(),
  qty: Joi.number().required(),
});

module.exports = createProductSchema;
