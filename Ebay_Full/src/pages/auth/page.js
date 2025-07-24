import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Mail, Lock, User, Key } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import emailjs from "@emailjs/browser";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isVerification, setIsVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    verificationCode: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Axios instance
  const api = axios.create({
    baseURL: "http://localhost:9999",
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  // Send verification email using EmailJS
  const sendVerificationEmail = useCallback(async (email, verificationCode) => {
    try {
      const response = await emailjs.send(
        "service_57aiq9p",
        "template_vgb4pph",
        {
          to_email: email.toLowerCase().trim(),
          subject: "Xác Nhận Đăng Ký Tài Khoản",
          verification_code: verificationCode,
        },
        "s1NkKWtFWDZzlqjGM"
      );
      console.log(`Verification email sent to ${email}:`, response);
      return true;
    } catch (err) {
      console.error("Failed to send verification email:", {
        message: err.message,
        text: err.text,
        status: err.status,
      });
      return false;
    }
  }, []);

  // Check for verification success from URL
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get("verified") === "true") {
      setSuccess("Email xác minh thành công! Vui lòng đăng nhập.");
      setIsLogin(true);
      setIsVerification(false);
    }
  }, [location]);

  // Handle username input change (prevent spaces)
  const handleUsernameChange = (e) => {
    const value = e.target.value.replace(/\s/g, ""); // Remove spaces
    setFormData({ ...formData, username: value });
    if (/\s/.test(e.target.value)) {
      setError("Tên người dùng không được chứa khoảng cách.");
    } else if (error === "Tên người dùng không được chứa khoảng cách.") {
      setError("");
    }
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setSuccess("");
      setLoading(true);

      if (isVerification) {
        // Handle verification code submission
        if (!/^\d{6}$/.test(formData.verificationCode)) {
          setError("Mã xác minh phải là 6 chữ số.");
          setLoading(false);
          return;
        }

        try {
          console.log(
            `Submitting verification: email=${formData.email}, code=${formData.verificationCode}`
          );
          const response = await api.post("/auth/verify-code", {
            email: formData.email.toLowerCase().trim(),
            verificationToken: formData.verificationCode,
          });
          const { token, user } = response.data;

          console.log(`Verification successful for ${formData.email}`);

          // Store token and user data
          localStorage.setItem("token", token);
          localStorage.setItem("currentUser", JSON.stringify(user));

          // Navigate based on role
          if (user.role === "admin") {
            navigate("/adminDashboard");
          } else {
            navigate("/profile");
          }
        } catch (err) {
          setError(err.response?.data?.message || "Xác minh mã thất bại.");
          console.error("Lỗi xác minh mã:", {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
          });
        } finally {
          setLoading(false);
        }
      } else {
        // Validate username for spaces
        if (/\s/.test(formData.username)) {
          setError("Tên người dùng không được chứa khoảng cách.");
          setLoading(false);
          return;
        }

        // Handle login or registration
        const endpoint = isLogin ? "/auth/login" : "/auth/register";
        const payload = isLogin
          ? {
              login: formData.username.toLowerCase().trim(),
              password: formData.password,
            }
          : {
              username: formData.username.trim(),
              email: formData.email.toLowerCase().trim(),
              password: formData.password,
            };

        try {
          console.log("Sending payload:", payload);
          const response = await api.post(endpoint, payload);

          if (isLogin) {
            const { token, user } = response.data;
            if (!token || !user) {
              throw new Error("Dữ liệu phản hồi không hợp lệ.");
            }
            // Store token and user data
            localStorage.setItem("token", token);
            localStorage.setItem("currentUser", JSON.stringify(user));
            // Navigate based on role
            if (user.role === "admin") {
              navigate("/adminDashboard");
            } else {
              navigate("/profile");
            }
          } else {
            const { verificationToken } = response.data;
            if (!verificationToken) {
              throw new Error("Không nhận được mã xác minh từ server.");
            }

            // Send verification email
            const emailSent = await sendVerificationEmail(
              formData.email,
              verificationToken
            );
            if (!emailSent) {
              throw new Error("Không thể gửi email xác minh.");
            }

            setSuccess(
              "Đăng ký thành công! Vui lòng nhập mã 6 chữ số được gửi đến email của bạn."
            );
            setIsVerification(true);
          }
        } catch (err) {
          const errorMessage =
            err.response?.data?.errors?.map((e) => e.msg).join(", ") ||
            err.response?.data?.message ||
            (isLogin
              ? "Đăng nhập thất bại."
              : err.message || "Đăng ký thất bại.");
          setError(errorMessage);
          console.error(isLogin ? "Lỗi đăng nhập:" : "Lỗi đăng ký:", {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
          });
        } finally {
          setLoading(false);
        }
      }
    },
    [isLogin, isVerification, formData, navigate, sendVerificationEmail, error]
  );

  const handleResendVerification = useCallback(async () => {
    if (!formData.email) {
      setError("Vui lòng nhập email để gửi lại mã xác minh.");
      return;
    }

    setError("");
    setSuccess("");
    setResendLoading(true);

    try {
      console.log(`Resending verification for email=${formData.email}`);
      const response = await api.post("/auth/resend-verification", {
        email: formData.email.toLowerCase().trim(),
      });
      const { verificationToken } = response.data;
      if (!verificationToken) {
        throw new Error("Không nhận được mã xác minh từ server.");
      }

      // Send verification email
      const emailSent = await sendVerificationEmail(
        formData.email,
        verificationToken
      );
      if (!emailSent) {
        throw new Error("Không thể gửi email xác minh.");
      }

      setSuccess(
        "Mã xác minh đã được gửi lại thành công! Vui lòng kiểm tra email."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Gửi lại mã xác minh thất bại."
      );
      console.error("Lỗi gửi lại mã xác minh:", err);
    } finally {
      setResendLoading(false);
    }
  }, [formData.email, sendVerificationEmail]);

  // Cleanup
  useEffect(() => {
    return () => {
      setLoading(false);
      setResendLoading(false);
      setError("");
      setSuccess("");
    };
  }, []);

  // Auto-fill seller credentials
  const fillSellerCredentials = () => {
    setFormData({
      ...formData,
      username: "thuctrandanh93@gmail.com",
      password: "123123",
    });
    setIsLogin(true);
  };

  // Auto-fill admin credentials
  const fillAdminCredentials = () => {
    setFormData({
      ...formData,
      username: "admin",
      password: "123123",
    });
    setIsLogin(true);
  };

  <GoogleLogin
    onSuccess={async (credentialResponse) => {
      const decoded = jwtDecode(credentialResponse.credential);
      const { email, name, picture } = decoded;

      const response = await api.post("/auth/google-login", {
        email,
        name,
        avatarURL: picture,
      });

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("currentUser", JSON.stringify(user));

      if (user.role === "admin") {
        navigate("/adminDashboard");
      } else {
        navigate("/profile");
      }
    }}
    onError={() => {
      setError("Không thể đăng nhập bằng Google.");
    }}
  />;

  return (
    <div id="AuthPage" className="w-full min-h-screen bg-white">
      <div className="w-full flex items-center justify-center p-5 border-b-gray-300">
        <a href="/" className="min-w-[170px]">
          <img width="170" src="/images/logo.svg" alt="Logo" />
        </a>
      </div>

      <div className="w-full flex items-center justify-center p-5 border-b-gray-300">
        <div className="flex gap-4">
          <button
            className={`font-semibold ${
              isLogin && !isVerification ? "text-blue-600" : "text-gray-600"
            }`}
            onClick={() => {
              setIsLogin(true);
              setIsVerification(false);
            }}
            disabled={loading || resendLoading}
          >
            Đăng nhập
          </button>
          <span className="text-gray-300">|</span>
          <button
            className={`font-semibold ${
              !isLogin && !isVerification ? "text-blue-600" : "text-gray-600"
            }`}
            onClick={() => {
              setIsLogin(false);
              setIsVerification(false);
            }}
            disabled={loading || resendLoading}
          >
            Đăng ký
          </button>
        </div>
      </div>

      <div className="max-w-[400px] mx-auto px-2">
        {error && <div className="text-red-500 text-center my-2">{error}</div>}
        {success && (
          <div className="text-green-500 text-center my-2">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          {isVerification ? (
            <>
              <div className="relative">
                <Key
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Mã xác minh (6 chữ số)"
                  className="w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.verificationCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      verificationCode: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6),
                    })
                  }
                  disabled={loading || resendLoading}
                  maxLength={6}
                  pattern="\d{6}"
                />
              </div>
              <button
                type="submit"
                className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold flex items-center justify-center disabled:bg-blue-400"
                disabled={loading || resendLoading}
              >
                {loading && (
                  <div className="w-5 h-5 border-2 border-t-white border-gray-300 rounded-full animate-spin mr-2"></div>
                )}
                Xác minh
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                className="w-full p-3 bg-gray-600 text-white rounded-md hover:bg-blue-700 font-semibold flex items-center justify-center disabled:bg-gray-400"
                disabled={resendLoading || loading}
              >
                {resendLoading && (
                  <div className="w-5 h-5 border-2 border-t-white border-gray-300 rounded-full animate-spin mr-2"></div>
                )}
                Gửi lại mã xác minh
              </button>
            </>
          ) : isLogin ? (
            <>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Tên người dùng hoặc Email"
                  className="w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.username}
                  onChange={handleUsernameChange}
                  disabled={loading || resendLoading}
                />
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  className="w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={loading || resendLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading || resendLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button
                type="submit"
                className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold flex items-center justify-center disabled:bg-blue-400"
                disabled={loading || resendLoading}
              >
                {loading && (
                  <div className="w-5 h-5 border-2 border-t-white border-gray-300 rounded-full animate-spin mr-2"></div>
                )}
                Đăng nhập
              </button>
              <a
                href="/forgot-password"
                className="text-center text-blue-600 hover:underline text-sm"
              >
                Quên mật khẩu?
              </a>
              <div className="flex gap-4 justify-center mt-4">
                <button
                  type="button"
                  onClick={fillSellerCredentials}
                  className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Tự Điền Seller
                </button>
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
                >
                  Tự Điền Admin
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Tên người dùng"
                  className="w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.username}
                  onChange={handleUsernameChange}
                  disabled={loading || resendLoading}
                />
              </div>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  placeholder="Địa chỉ Email"
                  className="w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={loading || resendLoading}
                />
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  className="w-full p-3 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  disabled={loading || resendLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading || resendLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button
                type="submit"
                className="w-full p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold flex items-center justify-center disabled:bg-blue-400"
                disabled={loading || resendLoading}
              >
                {loading && (
                  <div className="w-5 h-5 border-2 border-t-white border-gray-300 rounded-full animate-spin mr-2"></div>
                )}
                Đăng ký
              </button>
            </>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                hoặc tiếp tục với
              </span>
            </div>
          </div>

          <GoogleOAuthProvider clientId="332875983693-h8d4d5h7aip186nfa1f7sccvln79h053.apps.googleusercontent.com">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                console.log("Google Login Success:", credentialResponse);
                const decoded = jwtDecode(credentialResponse.credential);
                console.log("Decoded JWT:", decoded);
                const { email, name, picture } = decoded;

                try {
                  const response = await api.post("/auth/google-login", {
                    email,
                    name,
                    avatarURL: picture,
                  });
                  const { token, user } = response.data;
                  localStorage.setItem("token", token);
                  localStorage.setItem("currentUser", JSON.stringify(user));

                  if (user.role === "admin") {
                    navigate("/adminDashboard");
                  } else {
                    navigate("/profile");
                  }
                } catch (err) {
                  console.error("Google Login API Error:", err);
                  setError(
                    err.response?.data?.message ||
                      "Không thể đăng nhập bằng Google."
                  );
                }
              }}
              onError={(error) => {
                console.error("Google Login Error:", error);
                setError("Không thể đăng nhập bằng Google.");
              }}
              disabled={loading || resendLoading}
            />
          </GoogleOAuthProvider>
        </form>
      </div>
    </div>
  );
}
