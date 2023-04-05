const { register, login, forgotPassword, resetPassword } = require("../controller/authentication.controller");

const validation = require("../middlewares/validation.middleware");

const registerSchema = require("../validations/register.schema");
const loginSchema = require("../validations/login.schema");
const forgotPasswordSchema = require("../validations/forgot-password.schema");
const resetPasswordSchema = require("../validations/reset-password.schema");

const router = require("express").Router();

router.post("/register", validation(registerSchema), register);
router.post("/login", validation(loginSchema), login);
router.post("/forgot-password", validation(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validation(resetPasswordSchema), resetPassword);

module.exports = router;
