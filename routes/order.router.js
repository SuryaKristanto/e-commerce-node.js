const { createOrder, orderList } = require("../controller/order.controller");

const roleAuthorization = require("../middlewares/authorization.middleware");

const router = require("express").Router();

router.post("", roleAuthorization("admin", "member"), createOrder);
router.get("/list", roleAuthorization("admin", "member"), orderList);

module.exports = router;
