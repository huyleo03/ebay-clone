const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
} = require("../controller/userController");
const verifyToken = require("../middlewares/verifyToken");
const { body, validationResult } = require("express-validator");

const router = express.Router();

const updateUserValidation = [
  body("username")
    .notEmpty()
    .withMessage("Tên người dùng không được để trống.")
    .trim(),
  body("avatarURL").optional().isString().trim(),
  body("role")
    .optional()
    .isIn(["user", "seller", "admin"])
    .withMessage("Vai trò phải là 'user', 'seller', hoặc 'admin'."),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get("/", verifyToken, getAllUsers);
router.get("/:id", verifyToken, getUserById);
router.post("/", verifyToken, createUser);
router.put("/:id", verifyToken, updateUserValidation, validate, updateUser);
router.patch("/:id", verifyToken, updateUserStatus);
router.delete("/:id", verifyToken, deleteUser);

module.exports = router;
