const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String },
    role: { type: String, default: "user", enum: ["user", "seller", "admin"] },
    avatarURL: { type: String, trim: true, default: "" },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    action: { type: String, default: "lock", enum: ["lock", "unlock"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
