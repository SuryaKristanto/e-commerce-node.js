const Joi = require("joi");

const paymentSchema = Joi.object({
  payment_amount: Joi.number().required(),
});

module.exports = paymentSchema;
