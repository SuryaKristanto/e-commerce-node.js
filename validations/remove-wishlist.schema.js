const Joi = require("joi");

const removeWishlistSchema = Joi.object({
  product_code: Joi.number().required(),
});

module.exports = removeWishlistSchema;
