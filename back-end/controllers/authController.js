const User = require("../models/user.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng." });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res
        .status(400)
        .json({ message: "Tên người dùng đã được sử dụng." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit verification code
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Create new user
    const user = new User({
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      avatarURL: "",
      isVerified: false,
      verificationToken,
      action: "lock",
    });

    await user.save();

    res.status(201).json({
      message:
        "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.",
      verificationToken, // Return token for frontend to send email
    });
  } catch (err) {
    console.error("Registration error:", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ message: "Đăng ký thất bại. Vui lòng thử lại." });
  }
};

exports.verifyCode = async (req, res) => {
  const { email, verificationToken } = req.body;

  try {
    // Normalize email and token
    const normalizedEmail = email.toLowerCase().trim();
    const tokenString = verificationToken.toString().trim();

    console.log(
      `Verifying: email=${normalizedEmail}, verificationToken=${tokenString}`
    );

    const user = await User.findOne({
      email: normalizedEmail,
      verificationToken: tokenString,
    });

    if (!user) {
      console.log(
        `Verification failed: No user found for email=${normalizedEmail}, verificationToken=${tokenString}`
      );
      return res
        .status(400)
        .json({ message: "Mã xác minh hoặc email không hợp lệ." });
    }

    if (user.isVerified) {
      console.log(`User already verified: email=${normalizedEmail}`);
      return res.status(400).json({ message: "Email đã được xác minh." });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = null;
    user.action = "unlock";
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarURL: user.avatarURL,
      isVerified: user.isVerified,
    };

    console.log(`User verified: email=${normalizedEmail}`);

    res.status(200).json({
      token,
      user: userResponse,
      message: "Xác minh email thành công.",
    });
  } catch (err) {
    console.error("Verify code error:", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ message: "Xác minh thất bại. Vui lòng thử lại." });
  }
};

exports.login = async (req, res) => {
  const { login, password } = req.body;

  try {
    // Normalize input
    const normalizedInput = login.toLowerCase().trim();

    // Check if input is username or email
    const user = await User.findOne({
      $or: [{ username: normalizedInput }, { email: normalizedInput }],
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Tên người dùng hoặc email không đúng." });
    }

    if (user.action === "lock") {
      return res
        .status(403)
        .json({ message: "Tài khoản đang bị khóa. Vui lòng liên hệ hỗ trợ." });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Vui lòng xác minh email trước khi đăng nhập." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Mật khẩu không đúng." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarURL: user.avatarURL,
      isVerified: user.isVerified,
    };

    res.json({ token, user: userResponse, message: "Đăng nhập thành công!" });
  } catch (err) {
    console.error("Login error:", { message: err.message, stack: err.stack });
    res.status(500).json({ message: "Đăng nhập thất bại. Vui lòng thử lại." });
  }
};

exports.resendVerification = async (req, res) => {
  const { email } = req.body;

  try {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Không tìm thấy người dùng." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email đã được xác minh." });
    }

    // Generate new 6-digit verification code
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    user.verificationToken = verificationToken;
    await user.save();

    res.status(200).json({
      message: "Mã xác minh đã được tạo lại. Vui lòng kiểm tra email.",
      verificationToken, // Return token for frontend to send email
    });
  } catch (err) {
    console.error("Resend verification error:", {
      message: err.message,
      stack: err.stack,
    });
    res
      .status(500)
      .json({ message: "Gửi lại mã xác minh thất bại. Vui lòng thử lại." });
  }
};
exports.googleLogin = async (req, res) => {
  const { email, name, avatarURL } = req.body;
  console.log("Google Login Request:", { email, name, avatarURL });

  if (!email || !name) {
    return res.status(400).json({ message: "Thiếu email hoặc tên." });
  }

  try {
    let user = await User.findOne({ email });
    console.log("User Found:", user);

    if (user) {
      if (!user.isVerified) {
        return res.status(403).json({
          message:
            "Tài khoản chưa xác minh email. Vui lòng đăng nhập thông thường để xác minh.",
        });
      }
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      return res.json({ token, user });
    }

    user = await User.create({
      username: name,
      email,
      password: "",
      isVerified: true,
      role: "user",
      avatarURL: avatarURL || "",
      action: "unlock",
    });
    console.log("User Created:", user);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error("Google Login Error:", err);
    res.status(500).json({ message: "Lỗi server khi đăng nhập bằng Google." });
  }
};
