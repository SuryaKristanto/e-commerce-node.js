const { orderPayment } = require("../controller/payment.controller");

const roleAuthorization = require("../middlewares/authorization.middleware");

const validation = require("../middlewares/validation.middleware");

const paymentSchema = require("../validations/payment.schema");

const router = require("express").Router();

router.post(
  "",
  roleAuthorization("admin", "member"),
  validation(paymentSchema),
  orderPayment
);

module.exports = router;
