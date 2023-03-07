const Joi = require("joi");

const addWishlistSchema = Joi.object({
  product_code: Joi.number().required(),
});

module.exports = addWishlistSchema;
