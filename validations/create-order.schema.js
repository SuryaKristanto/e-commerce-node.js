const Joi = require("joi");

const createOrderSchema = Joi.object({
  products: Joi.array().items(
    Joi.object({
      code: Joi.number().required(),
      qty: Joi.number().required(),
    })
  ),
  payment_method: Joi.string().required(),
});

module.exports = createOrderSchema;
