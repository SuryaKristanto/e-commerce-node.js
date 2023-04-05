const Joi = require("joi");

const addWishlistSchema = Joi.object({
  product_code: Joi.string().required(),
});

module.exports = addWishlistSchema;
