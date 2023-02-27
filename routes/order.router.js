const {
  createOrder,
  orderList,
  orderStatus,
} = require("../controller/order.controller");

const roleAuthorization = require("../middlewares/authorization.middleware");

const router = require("express").Router();

router.post("", roleAuthorization("admin", "member"), createOrder);
router.get("/list", roleAuthorization("admin", "member"), orderList);
router.get("/status", orderStatus);

module.exports = router;
