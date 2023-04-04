const Joi = require("joi");

const resetPasswordSchema = Joi.object({
  new_password: Joi.string().min(8).required(),
  confirm_new_password: Joi.string().min(8).required(),
});

module.exports = resetPasswordSchema;
