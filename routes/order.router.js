const {
  createOrder,
  orderList,
  orderStatus,
  orderHistory,
} = require("../controller/order.controller");

const roleAuthorization = require("../middlewares/authorization.middleware");

const router = require("express").Router();

router.post("", roleAuthorization("admin", "member"), createOrder);
router.get("/list", roleAuthorization("admin", "member"), orderList);
router.get("/status", orderStatus);
router.get("/history", roleAuthorization("admin", "member"), orderHistory);

module.exports = router;
