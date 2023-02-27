const {
  createOrder,
  orderList,
  orderStatus,
  orderHistory,
} = require("../controller/order.controller");

const roleAuthorization = require("../middlewares/authorization.middleware");

const validation = require("../middlewares/validation.middleware");

const createOrderSchema = require("../validations/create-order.schema");

const router = require("express").Router();

router.post(
  "",
  roleAuthorization("admin", "member"),
  validation(createOrderSchema),
  createOrder
);
router.get("/list", roleAuthorization("admin", "member"), orderList);
router.get("/status", roleAuthorization("admin", "member"), orderStatus);
router.get("/history", roleAuthorization("admin", "member"), orderHistory);

module.exports = router;
