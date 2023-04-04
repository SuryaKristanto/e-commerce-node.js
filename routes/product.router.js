const { productList, createProduct, deleteProduct, updateProduct, productDetail, searchProduct } = require("../controller/product.controller");

const roleAuthorization = require("../middlewares/authorization.middleware");

const validation = require("../middlewares/validation.middleware");

const createProductSchema = require("../validations/create-product.schema");
const updateProductSchema = require("../validations/update-product.schema");

const router = require("express").Router();

router.get("", productList);
router.post("/create", validation(createProductSchema), roleAuthorization("admin"), createProduct);
router.delete("/delete/:_id", roleAuthorization("admin"), deleteProduct);
router.patch("/update/:_id", validation(updateProductSchema), roleAuthorization("admin"), updateProduct);
router.get("/:name", productDetail);
router.post("/search", searchProduct);

module.exports = router;
