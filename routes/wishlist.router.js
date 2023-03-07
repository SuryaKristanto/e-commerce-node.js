const {
  addWishlist,
  getWishlist,
  removeWishlist,
} = require("../controller/wishlist.controller");

const roleAuthorization = require("../middlewares/authorization.middleware");

const validation = require("../middlewares/validation.middleware");

const addWishlistSchema = require("../validations/add-wishlist.schema");
const removeWishlistSchema = require("../validations/remove-wishlist.schema");

const router = require("express").Router();

router.post(
  "",
  validation(addWishlistSchema),
  roleAuthorization("admin", "member"),
  addWishlist
);
router.get("", roleAuthorization("admin", "member"), getWishlist);
router.delete(
  "",
  validation(removeWishlistSchema),
  roleAuthorization("admin", "member"),
  removeWishlist
);

module.exports = router;
