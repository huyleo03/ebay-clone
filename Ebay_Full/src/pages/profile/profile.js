import React, { useEffect, useState } from "react";
import TopMenu from "../../components/TopMenu";
import MainHeader from "../../components/MainHeader";
import Footer from "../../components/Footer";
import { Link } from "react-router-dom";
import { Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import {
  FiTrash2,
  FiCheckCircle,
  FiEdit,
  FiMapPin,
  FiUser,
  FiGlobe,
  FiPhone,
} from "react-icons/fi";
import axios from "axios";

function Profile() {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    role: "",
    avatarURL: "",
  });
  const [addressForm, setAddressForm] = useState({
    fullname: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
    isDefault: false,
  });
  const [addressEditId, setAddressEditId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");

  const api = axios.create({
    baseURL: "http://localhost:9999/",
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setFormData({
        username: parsedUser.username || "",
        role: parsedUser.role || "user",
        avatarURL: parsedUser.avatarURL || "",
      });
      fetchAddresses(parsedUser._id);
    }
  }, []);

  const fetchAddresses = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn cần đăng nhập để xem địa chỉ.");
      }

      const response = await api.get(`/address/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(response.data);
    } catch (error) {
      console.error("Fetch addresses error:", error);
      setAddresses([]);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const updateUserInDatabase = async (updatedUser) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn cần đăng nhập để cập nhật thông tin.");
      }

      if (!updatedUser.username.trim()) {
        throw new Error("Tên người dùng không được để trống.");
      }

      // Validate username for spaces
      if (/\s/.test(updatedUser.username.trim())) {
        throw new Error("Tên người dùng không được chứa khoảng cách.");
      }

      const payload = {
        username: updatedUser.username.trim(),
        avatarURL: updatedUser.avatarURL.trim(),
      };

      if (user.role === "admin") {
        if (!["user", "seller", "admin"].includes(updatedUser.role)) {
          throw new Error("Vai trò không hợp lệ.");
        }
        payload.role = updatedUser.role;
      }

      const response = await api.put(`/user/${updatedUser._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data.user;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
        if (error.response.status === 403) {
          throw new Error("Bạn không có quyền cập nhật thông tin này.");
        }
        if (error.response.status === 404) {
          throw new Error("Không tìm thấy người dùng.");
        }
        throw new Error(
          error.response.data.message || "Cập nhật thông tin thất bại."
        );
      }
      throw error;
    }
  };

  const addAddress = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn cần đăng nhập để thêm địa chỉ.");
      }

      const response = await api.post(
        `/address/user/${user._id}`,
        addressForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAddresses([...addresses, response.data.address]);
      setShowAddressForm(false);
      setAddressForm({
        fullname: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        country: "",
        isDefault: false,
      });
      showToast("Thêm địa chỉ thành công!", "success");
    } catch (error) {
      showToast(error.message || "Thêm địa chỉ thất bại.", "error");
    }
  };

  const updateAddress = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn cần đăng nhập để cập nhật địa chỉ.");
      }

      const response = await api.put(`/address/${addressEditId}`, addressForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAddresses(
        addresses.map((addr) =>
          addr._id === addressEditId ? response.data.address : addr
        )
      );
      setShowAddressForm(false);
      setAddressEditId(null);
      setAddressForm({
        fullname: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        country: "",
        isDefault: false,
      });
      showToast("Cập nhật địa chỉ thành công!", "success");
    } catch (error) {
      showToast(error.message || "Cập nhật địa chỉ thất bại.", "error");
    }
  };

  const deleteAddress = async (addressId) => {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn cần đăng nhập để xóa địa chỉ.");
      }

      await api.delete(`/address/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAddresses(addresses.filter((addr) => addr._id !== addressId));
      showToast("Xóa địa chỉ thành công!", "success");
    } catch (error) {
      showToast(error.message || "Xóa địa chỉ thất bại.", "error");
    }
  };

  const setDefaultAddress = async (addressId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn cần đăng nhập để đặt địa chỉ mặc định.");
      }

      const response = await api.patch(
        `/address/${addressId}/default`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAddresses(
        addresses.map((addr) =>
          addr._id === addressId
            ? response.data.address
            : { ...addr, isDefault: false }
        )
      );
      showToast("Đặt địa chỉ mặc định thành công!", "success");
    } catch (error) {
      showToast(error.message || "Đặt địa chỉ mặc định thất bại.", "error");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveChanges = async () => {
    setLoading(true);
    try {
      const updatedUser = { ...user, ...formData };
      const savedUser = await updateUserInDatabase(updatedUser);
      setUser(savedUser);
      localStorage.setItem("currentUser", JSON.stringify(savedUser));
      setEditing(false);
      showToast("Cập nhật thông tin thành công!", "success");
    } catch (error) {
      showToast(error.message || "Cập nhật thông tin thất bại.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address) => {
    setAddressForm({ ...address });
    setAddressEditId(address._id);
    setShowAddressForm(true);
  };

  const handleSubmitAddress = (e) => {
    e.preventDefault();
    if (addressEditId) {
      updateAddress();
    } else {
      addAddress();
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">Đang tải thông tin người dùng...</div>
    );
  }

  const defaultAddress = addresses.find((addr) => addr.isDefault) || null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <TopMenu />
      <MainHeader />

      <div className="max-w-5xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">My eBay</h1>

        <div className="border-b mb-6">
          <div className="flex">
            <NavTab label="Activity" active={false} />
            <NavTab label="Messages" active={false} />
            <NavTab label="Account" active={true} />
            <div className="ml-auto flex items-center text-sm">
              <span className="text-red-600 mr-2">{user.username} </span>
              <Bookmark className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64">
            <SidebarSection
              title="Personal Info"
              expanded={true}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-6">
              {activeSection === "personal" ? "Personal Info" : "Addresses"}
            </h2>

            <div className="space-y-6">
              {activeSection === "personal" && (
                <>
                  <EditableInfoSection
                    title="Tên người dùng"
                    value={user.username}
                    field="username"
                    onSave={async (newValue) => {
                      try {
                        const updatedUser = {
                          ...user,
                          username: newValue.trim(),
                        };
                        const savedUser = await updateUserInDatabase(
                          updatedUser
                        );
                        setUser(savedUser);
                        localStorage.setItem(
                          "currentUser",
                          JSON.stringify(savedUser)
                        );
                        showToast(
                          "Cập nhật tên người dùng thành công!",
                          "success"
                        );
                      } catch (error) {
                        showToast(
                          error.message || "Cập nhật tên người dùng thất bại.",
                          "error"
                        );
                      }
                    }}
                  />

                  <EditableInfoSection
                    title="URL Ảnh đại diện"
                    value={user.avatarURL}
                    field="avatarURL"
                    onSave={async (newValue) => {
                      try {
                        const updatedUser = {
                          ...user,
                          avatarURL: newValue.trim(),
                        };
                        const savedUser = await updateUserInDatabase(
                          updatedUser
                        );
                        setUser(savedUser);
                        localStorage.setItem(
                          "currentUser",
                          JSON.stringify(savedUser)
                        );
                        showToast(
                          "Cập nhật ảnh đại diện thành công!",
                          "success"
                        );
                      } catch (error) {
                        showToast(
                          error.message || "Cập nhật ảnh đại diện thất bại.",
                          "error"
                        );
                      }
                    }}
                  />

                  <InfoSection
                    title="Loại tài khoản"
                    value={
                      user.role === "admin"
                        ? "Quản trị viên"
                        : user.role === "seller"
                        ? "Người bán"
                        : "Người mua"
                    }
                    hasEdit={user.role === "admin"}
                    isRole={user.role === "admin"}
                    valueRole={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  />

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Thông tin liên hệ
                    </h3>

                    <InfoSection
                      title="Địa chỉ email"
                      value={user.email}
                      hasEdit={false}
                      hasVerify={true}
                      verified={user.isVerified}
                    />

                    {defaultAddress ? (
                      <div className="py-4 border-t md:flex">
                        <div className="w-full md:w-1/3 text-sm font-medium mb-2 md:mb-0">
                          Địa chỉ mặc định
                        </div>
                        <div className="text-sm md:w-2/3">
                          <div className="font-semibold">
                            {defaultAddress.fullname}
                          </div>
                          <div>{defaultAddress.street}</div>
                          <div>{defaultAddress.city}</div>
                          {defaultAddress.state && (
                            <div>{defaultAddress.state}</div>
                          )}
                          <div>{defaultAddress.country}</div>
                          <div>{defaultAddress.phone}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 border-t text-sm">
                        Chưa có địa chỉ mặc định. Vui lòng thêm địa chỉ trong
                        tab "Addresses".
                      </div>
                    )}
                  </div>

                  {editing && (
                    <div className="mt-4">
                      <button
                        className={`px-4 py-2 bg-blue-600 text-white rounded ${
                          loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={saveChanges}
                        disabled={loading}
                      >
                        {loading ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                    </div>
                  )}
                </>
              )}

              {activeSection === "addresses" && (
                <>
                  {defaultAddress ? (
                    <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="font-semibold text-lg text-gray-800">
                              {defaultAddress.fullname}
                            </div>
                            <span className="text-sm font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                              Mặc định
                            </span>
                          </div>
                          <div className="space-y-2 text-gray-600">
                            <div className="flex items-center gap-2">
                              <FiUser size={16} className="text-gray-500" />
                              <span>{defaultAddress.fullname}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FiMapPin size={16} className="text-gray-500" />
                              <span>{defaultAddress.street}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FiMapPin size={16} className="text-gray-500" />
                              <span>{defaultAddress.city}</span>
                            </div>
                            {defaultAddress.state && (
                              <div className="flex items-center gap-2">
                                <FiMapPin size={16} className="text-gray-500" />
                                <span>{defaultAddress.state}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <FiGlobe size={16} className="text-gray-500" />
                              <span>{defaultAddress.country}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FiPhone size={16} className="text-gray-500" />
                              <span>+84 {defaultAddress.phone}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditAddress(defaultAddress)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                          aria-label="Chỉnh sửa địa chỉ mặc định"
                        >
                          <FiEdit size={16} />
                          Sửa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg mb-6 flex items-center gap-2">
                      <FiMapPin size={16} className="text-gray-500" />
                      Chưa có địa chỉ mặc định.
                    </div>
                  )}

                  {addresses
                    .filter((addr) => !addr.isDefault)
                    .map((address) => (
                      <div
                        key={address._id}
                        className="border border-gray-200 rounded-lg p-6 mb-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-300"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-lg text-gray-800 mb-3">
                              {address.fullname}
                            </div>
                            <div className="space-y-2 text-gray-600">
                              <div className="flex items-center gap-2">
                                <FiUser size={16} className="text-gray-500" />
                                <span>{address.fullname}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FiMapPin size={16} className="text-gray-500" />
                                <span>{address.street}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FiMapPin size={16} className="text-gray-500" />
                                <span>{address.city}</span>
                              </div>
                              {address.state && (
                                <div className="flex items-center gap-2">
                                  <FiMapPin
                                    size={16}
                                    className="text-gray-500"
                                  />
                                  <span>{address.state}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <FiGlobe size={16} className="text-gray-500" />
                                <span>{address.country}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FiPhone size={16} className="text-gray-500" />
                                <span>+84 {address.phone}</span>
                              </div>
                            </div>
                            <div className="mt-4 flex gap-3">
                              <button
                                onClick={() => deleteAddress(address._id)}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
                                aria-label="Xóa địa chỉ"
                              >
                                <FiTrash2 size={16} />
                                Xóa
                              </button>
                              <button
                                onClick={() => setDefaultAddress(address._id)}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                                aria-label="Đặt làm địa chỉ mặc định"
                              >
                                <FiCheckCircle size={16} />
                                Đặt làm mặc định
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                            aria-label="Chỉnh sửa địa chỉ"
                          >
                            <FiEdit size={16} />
                            Sửa
                          </button>
                        </div>
                      </div>
                    ))}

                  {showAddressForm && (
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">
                        {addressEditId
                          ? "Chỉnh sửa địa chỉ"
                          : "Thêm địa chỉ mới"}
                      </h3>
                      <form
                        onSubmit={handleSubmitAddress}
                        className="space-y-4"
                      >
                        <div>
                          <label className="text-sm text-gray-500">
                            Họ và tên
                          </label>
                          <input
                            type="text"
                            name="fullname"
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={addressForm.fullname}
                            onChange={handleAddressInputChange}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">
                            Số điện thoại
                          </label>
                          <input
                            type="text"
                            name="phone"
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={addressForm.phone}
                            onChange={handleAddressInputChange}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Đường</label>
                          <input
                            type="text"
                            name="street"
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={addressForm.street}
                            onChange={handleAddressInputChange}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">
                            Thành phố
                          </label>
                          <input
                            type="text"
                            name="city"
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={addressForm.city}
                            onChange={handleAddressInputChange}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">
                            Tỉnh/Bang
                          </label>
                          <input
                            type="text"
                            name="state"
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={addressForm.state}
                            onChange={handleAddressInputChange}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">
                            Quốc gia
                          </label>
                          <input
                            type="text"
                            name="country"
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={addressForm.country}
                            onChange={handleAddressInputChange}
                            required
                          />
                        </div>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setAddressEditId(null);
                              setAddressForm({
                                fullname: "",
                                phone: "",
                                street: "",
                                city: "",
                                state: "",
                                country: "",
                                isDefault: false,
                              });
                            }}
                            className="border border-blue-600 text-blue-600 px-4 py-1 rounded-full"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-1 rounded-full"
                          >
                            Lưu
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {!showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="text-blue-600 text-sm mt-4"
                    >
                      + Add another address
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {toast.show && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded shadow-lg text-white ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function NavTab({ label, active }) {
  return (
    <Link
      to="#"
      className={`px-6 py-3 text-sm font-medium ${
        active
          ? "text-blue-600 border-b-2 border-blue-600"
          : "text-gray-700 hover:text-blue-600"
      }`}
    >
      {label}
    </Link>
  );
}

function SidebarSection({ title, expanded, activeSection, setActiveSection }) {
  const items = [
    { label: "Personal Information", section: "personal" },
    { label: "Addresses", section: "addresses" },
  ];

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center py-2 border-b">
        <h3 className="font-medium">{title}</h3>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </div>
      {expanded && (
        <ul className="mt-2">
          {items.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => setActiveSection(item.section)}
                className={`block w-full text-left py-2 text-sm ${
                  activeSection === item.section
                    ? "bg-gray-100 font-medium"
                    : "hover:bg-gray-50"
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditableInfoSection({ title, field, value, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [hasChanged, setHasChanged] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const newValue = e.target.value;
    if (field === "username") {
      // Remove spaces and validate
      const cleanedValue = newValue.replace(/\s/g, "");
      setInputValue(cleanedValue);
      if (/\s/.test(newValue)) {
        setError("Tên người dùng không được chứa khoảng cách.");
      } else {
        setError("");
      }
    } else {
      setInputValue(newValue);
    }
    setHasChanged(newValue.trim() !== (value || ""));
  };

  const handleSave = async () => {
    if (hasChanged && !error) {
      try {
        await onSave(inputValue);
        setIsEditing(false);
        setHasChanged(false);
        setError("");
      } catch (error) {
        setError(error.message || "Cập nhật thất bại.");
      }
    }
  };

  const handleCancel = () => {
    setInputValue(value || "");
    setHasChanged(false);
    setError("");
    setIsEditing(false);
  };

  return (
    <div className="py-4 border-t flex flex-col md:flex-row">
      <div className="w-full md:w-1/3 text-sm font-medium mb-2 md:mb-0">
        {title}
      </div>
      <div className="flex-1">
        {isEditing ? (
          <>
            <input
              type="text"
              className={`w-full border rounded px-3 py-2 text-sm ${
                error ? "border-red-500" : ""
              }`}
              value={inputValue}
              onChange={handleChange}
            />
            {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
            <div className="mt-4 flex gap-4">
              <button
                onClick={handleCancel}
                className="border border-blue-600 text-blue-600 px-4 py-1 rounded-full"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className={`px-4 py-1 rounded-full text-white ${
                  hasChanged && !error
                    ? "bg-blue-600"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                disabled={!hasChanged || !!error}
              >
                Lưu
              </button>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-start">
            <div className="text-sm">{value || "Chưa cung cấp"}</div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 text-sm"
            >
              Chỉnh sửa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoSection({
  title,
  value,
  hasEdit,
  hasVerify,
  verified,
  isRole,
  valueRole,
  onChange,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(valueRole);

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    onChange(e);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelectedRole(valueRole);
    setIsEditing(false);
  };

  return (
    <div className="py-4 border-t flex flex-col md:flex-row">
      <div className="w-full md:w-1/3 text-sm font-medium mb-2 md:mb-0">
        {title}
      </div>
      <div className="flex-1">
        {isRole && hasEdit && isEditing ? (
          <>
            <select
              name="role"
              className="w-full border rounded px-3 py-2 text-sm"
              value={selectedRole}
              onChange={handleRoleChange}
            >
              <option value="user">Người mua</option>
              <option value="seller">Người bán</option>
              <option value="admin">Quản trị viên</option>
            </select>
            <div className="mt-4 flex gap-4">
              <button
                onClick={handleCancel}
                className="border border-blue-600 text-blue-600 px-4 py-1 rounded-full"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className={`px-4 py-1 rounded-full text-white ${
                  selectedRole !== valueRole
                    ? "bg-blue-600"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                disabled={selectedRole === valueRole}
              >
                Lưu
              </button>
            </div>
          </>
        ) : (
          <div className="flex justify-between items-start">
            <div className="text-sm">
              {isRole ? (
                value
              ) : (
                <>
                  {value}
                  {hasVerify && (
                    <span
                      className={`block text-sm ${
                        verified ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {verified ? "Đã xác minh" : "Chưa xác minh"}
                    </span>
                  )}
                </>
              )}
            </div>
            {hasEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 text-sm"
              >
                Chỉnh sửa
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
