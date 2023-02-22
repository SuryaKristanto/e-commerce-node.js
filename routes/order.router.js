const { createOrder } = require("../controller/order.controller");

const roleAuthorization = require("../middlewares/authorization.middleware");

const router = require("express").Router();

router.post("", roleAuthorization("admin", "member"), createOrder);

module.exports = router;
