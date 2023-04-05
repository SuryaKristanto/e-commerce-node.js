const Joi = require("joi");

const removeWishlistSchema = Joi.object({
  product_code: Joi.string().required(),
});

module.exports = removeWishlistSchema;
