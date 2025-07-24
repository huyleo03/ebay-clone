const express = require("express");
const {
  getAddressesByUser,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");
const verifyToken = require("../middlewares/verifyToken");
const { body, validationResult } = require("express-validator");

const router = express.Router();

const addressValidation = [
  body("fullname")
    .notEmpty()
    .withMessage("Họ và tên không được để trống.")
    .trim(),
  body("phone")
    .notEmpty()
    .withMessage("Số điện thoại không được để trống.")
    .trim(),
  body("street").notEmpty().withMessage("Đường không được để trống.").trim(),
  body("city").notEmpty().withMessage("Thành phố không được để trống.").trim(),
  body("state").optional().isString().trim(),
  body("country")
    .notEmpty()
    .withMessage("Quốc gia không được để trống.")
    .trim(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get("/user/:userId", verifyToken, getAddressesByUser);
router.post(
  "/user/:userId",
  verifyToken,
  addressValidation,
  validate,
  addAddress
);
router.put(
  "/:addressId",
  verifyToken,
  addressValidation,
  validate,
  updateAddress
);
router.delete("/:addressId", verifyToken, deleteAddress);
router.patch("/:addressId/default", verifyToken, setDefaultAddress);

module.exports = router;
