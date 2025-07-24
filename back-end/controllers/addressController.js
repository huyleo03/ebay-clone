const Address = require("../models/address.js");

exports.getAddressesByUser = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: "Thiếu thông tin xác thực." });
    }

    if (currentUser.id !== req.params.userId && currentUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xem địa chỉ." });
    }

    const addresses = await Address.find({ userId: req.params.userId });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: "Thiếu thông tin xác thực." });
    }

    if (currentUser.id !== req.params.userId && currentUser.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thêm địa chỉ." });
    }

    const newAddress = new Address({
      userId: req.params.userId,
      fullname: req.body.fullname.trim(),
      phone: req.body.phone.trim(),
      street: req.body.street.trim(),
      city: req.body.city.trim(),
      state: req.body.state ? req.body.state.trim() : "",
      country: req.body.country.trim(),
      isDefault: req.body.isDefault || false,
    });

    if (newAddress.isDefault) {
      await Address.updateMany(
        { userId: req.params.userId },
        { isDefault: false }
      );
    } else {
      const hasDefault = await Address.findOne({
        userId: req.params.userId,
        isDefault: true,
      });
      if (!hasDefault) {
        newAddress.isDefault = true;
      }
    }

    await newAddress.save();
    res
      .status(201)
      .json({ address: newAddress, message: "Thêm địa chỉ thành công." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: "Thiếu thông tin xác thực." });
    }

    const address = await Address.findById(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: "Không tìm thấy địa chỉ." });
    }

    if (
      currentUser.id !== address.userId.toString() &&
      currentUser.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền cập nhật địa chỉ." });
    }

    address.fullname = req.body.fullname
      ? req.body.fullname.trim()
      : address.fullname;
    address.phone = req.body.phone ? req.body.phone.trim() : address.phone;
    address.street = req.body.street ? req.body.street.trim() : address.street;
    address.city = req.body.city ? req.body.city.trim() : address.city;
    address.state = req.body.state ? req.body.state.trim() : address.state;
    address.country = req.body.country
      ? req.body.country.trim()
      : address.country;

    if (req.body.isDefault) {
      await Address.updateMany(
        { userId: address.userId },
        { isDefault: false }
      );
      address.isDefault = true;
    }

    await address.save();
    res.json({ address, message: "Cập nhật địa chỉ thành công." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: "Thiếu thông tin xác thực." });
    }

    const address = await Address.findById(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: "Không tìm thấy địa chỉ." });
    }

    if (
      currentUser.id !== address.userId.toString() &&
      currentUser.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa địa chỉ." });
    }

    const addressCount = await Address.countDocuments({
      userId: address.userId,
    });
    if (addressCount === 1) {
      return res
        .status(400)
        .json({ message: "Không thể xóa địa chỉ duy nhất." });
    }

    await address.deleteOne();

    if (address.isDefault) {
      const nextAddress = await Address.findOne({ userId: address.userId });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    res.json({ message: "Xóa địa chỉ thành công." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ message: "Thiếu thông tin xác thực." });
    }

    const address = await Address.findById(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: "Không tìm thấy địa chỉ." });
    }

    if (
      currentUser.id !== address.userId.toString() &&
      currentUser.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền đặt địa chỉ mặc định." });
    }

    await Address.updateMany({ userId: address.userId }, { isDefault: false });
    address.isDefault = true;
    await address.save();

    res.json({ address, message: "Đặt địa chỉ mặc định thành công." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
