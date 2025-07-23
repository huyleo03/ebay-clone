const User = require("../models/user.js");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(
      users.map((u) => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        avatarURL: u.avatarURL,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Không thể lấy danh sách người dùng" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const userData = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role || "user",
      avatarURL: req.body.avatarURL || "",
    };

    const user = new User(userData);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, avatarURL, role } = req.body;

  try {
    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    // Validate username
    if (username !== undefined) {
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        return res
          .status(400)
          .json({ message: "Tên người dùng không được để trống." });
      }
      if (/\s/.test(trimmedUsername)) {
        return res
          .status(400)
          .json({ message: "Tên người dùng không được chứa khoảng cách." });
      }
      // Check for duplicate username
      const existingUsername = await User.findOne({
        username: trimmedUsername,
        _id: { $ne: id },
      });
      if (existingUsername) {
        return res
          .status(400)
          .json({ message: "Tên người dùng đã được sử dụng." });
      }
      user.username = trimmedUsername;
    }

    // Validate avatarURL
    if (avatarURL !== undefined) {
      user.avatarURL = avatarURL.trim();
    }

    // Validate role (only admins can change roles)
    if (role !== undefined) {
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Chỉ quản trị viên mới có thể thay đổi vai trò." });
      }
      if (!["user", "seller", "admin"].includes(role)) {
        return res.status(400).json({ message: "Vai trò không hợp lệ." });
      }
      user.role = role;
    }

    // Save updated user
    await user.save();

    // Return updated user data
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarURL: user.avatarURL,
      isVerified: user.isVerified,
    };

    res.status(200).json({
      user: userResponse,
      message: "Cập nhật thông tin thành công.",
    });
  } catch (err) {
    console.error("Update user error:", {
      message: err.message,
      stack: err.stack,
    });
    res
      .status(500)
      .json({ message: "Cập nhật thông tin thất bại. Vui lòng thử lại." });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { action } = req.body;
    if (!["lock", "unlock"].includes(action)) {
      return res.status(400).json({ message: "Hành động không hợp lệ." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { action },
      { new: true }
    ).select("-password");

    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    res.json({ user, message: "Cập nhật trạng thái thành công." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    res.status(204).json({ message: "Xóa người dùng thành công." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
