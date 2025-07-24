const express = require("express");
const {
  register,
  login,
  resendVerification,
  verifyCode,
  googleLogin,
} = require("../controllers/authController");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Validation middleware for register
const registerValidation = [
  body("username")
    .notEmpty()
    .withMessage("Tên người dùng không được để trống.")
    .trim(),
  body("email").isEmail().withMessage("Email không hợp lệ.").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự."),
];

// Validation middleware for login
const loginValidation = [
  body("login")
    .notEmpty()
    .withMessage("Tên người dùng hoặc email không được để trống.")
    .trim(),
  body("password").notEmpty().withMessage("Mật khẩu không được để trống."),
];

// Validation middleware for resend verification
const resendVerificationValidation = [
  body("email").isEmail().withMessage("Email không hợp lệ.").normalizeEmail(),
];

// Validation middleware for verify code
const verifyCodeValidation = [
  body("email").isEmail().withMessage("Email không hợp lệ.").normalizeEmail(),
  body("verificationToken")
    .matches(/^\d{6}$/)
    .withMessage("Mã xác minh phải là 6 chữ số."),
];

// Validation result middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
const googleLoginValidation = [
  body("email").isEmail().withMessage("Email không hợp lệ."),
  body("name").notEmpty().withMessage("Tên không được để trống."),
];

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post(
  "/resend-verification",
  resendVerificationValidation,
  validate,
  resendVerification
);
router.post("/verify-code", verifyCodeValidation, validate, verifyCode);
router.post("/google-login", googleLoginValidation, validate, googleLogin);
module.exports = router;
