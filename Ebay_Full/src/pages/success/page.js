import { CheckCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// API base URL
const API_BASE_URL = "http://localhost:9999";

export default function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItems, setCartItems] = useState([]);
  const [addressDetails, setAddressDetails] = useState(null);
  const [addressId, setAddressId] = useState(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get token for authentication
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const token = localStorage.getItem("token");
  const isAuthenticated = !!currentUser._id && !!token;

  // Get cart items - updated to match cart API structure
  const fetchCartItems = async () => {
    if (!isAuthenticated) {
      console.log("No authenticated user, setting empty cart");
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log("Fetching cart for authenticated user...");
      const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("currentUser");
          localStorage.removeItem("token");
          navigate("/auth");
          throw new Error("Session expired");
        }
        throw new Error(`Cannot load cart: ${response.status}`);
      }

      const data = await response.json();
      console.log("Cart API response:", data);

      // Process cart items consistently with Cart component
      if (data.success && data.cart && Array.isArray(data.cart.items) && data.cart.items.length > 0) {
        const items = data.cart.items
          .filter(item => item && item.productId)
          .map((item) => {
            const product = item.productId;
            if (!product) {
              console.warn("Item missing product data:", item);
              return null;
            }

            return {
              idProduct: product._id || product,
              title: product.title || product.name || "Product",
              description: product.description || "",
              price: Number(product.price || 0),
              url: product.images || product.url || product.image || [],
              quantity: item.quantity || 1,
              availableStock: product.quantity || product.stock || 100,
            };
          })
          .filter(Boolean);

        console.log("Processed cart items:", items);
        setCartItems(items);
      } else {
        console.log("Empty cart or unrecognized format");
        setCartItems([]);
      }
    } catch (error) {
      console.error("Cart fetch error:", error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAddressDetails = async () => {
    if (!currentUser?._id) {
      console.warn("No user ID found, skipping address fetch");
      setAddressDetails({
        name: "N/A",
        address: "N/A",
        zipcode: "N/A",
        city: "N/A",
        country: "N/A",
      });
      setAddressId(null);
      return;
    }

    try {
      console.log("Fetching address for user ID:", currentUser._id);
      const addressResponse = await fetch(
        `${API_BASE_URL}/address/user/${currentUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!addressResponse.ok) {
        throw new Error(`Failed to fetch address: ${addressResponse.status}`);
      }

      const addressData = await addressResponse.json();
      console.log("Address API response:", addressData);

      if (Array.isArray(addressData) && addressData.length > 0) {
        const address = addressData[0];
        setAddressId(address._id || null);
        setAddressDetails({
          name: address.fullname || "N/A",
          address: address.street || "N/A",
          zipcode: address.zipcode || "N/A",
          city: address.city || "N/A",
          country: address.country || "N/A",
        });
      } else {
        console.warn("No addresses found for user");
        setAddressDetails({
          name: "N/A",
          address: "N/A",
          zipcode: "N/A",
          city: "N/A",
          country: "N/A",
        });
        setAddressId(null);
      }
    } catch (error) {
      console.error("Error fetching address:", error.message);
      try {
        console.warn("Trying fallback user endpoint...");
        const userResponse = await fetch(
          `${API_BASE_URL}/user?id=${currentUser._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!userResponse.ok) {
          throw new Error(`Failed to fetch user: ${userResponse.status}`);
        }

        const userData = await userResponse.json();
        console.log("User API response:", userData);

        const user = Array.isArray(userData)
          ? userData.find((u) => u._id === currentUser._id)
          : userData;

        if (user && user.address) {
          setAddressDetails({
            name: user.fullname || "N/A",
            address: user.address.street || "N/A",
            zipcode: user.address.zipcode || "N/A",
            city: user.address.city || "N/A",
            country: user.address.country || "N/A",
          });
          setAddressId(user.address.id || null);
        } else {
          throw new Error("No valid address found in user data");
        }
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError.message);
        setAddressDetails({
          name: "N/A",
          address: "N/A",
          zipcode: "N/A",
          city: "N/A",
          country: "N/A",
        });
        setAddressId(null);
      }
    }
  };

  // Hàm xóa giỏ hàng
  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        // Xóa giỏ hàng trên server cho người dùng đăng nhập
        const response = await fetch(`${API_BASE_URL}/cart/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error clearing cart on server:", errorData);
          throw new Error(errorData.message || "Không thể xóa giỏ hàng trên server");
        }

        console.log("Cart cleared on server successfully");
      } else {
        // Xóa giỏ hàng trong localStorage cho khách
        localStorage.removeItem("cart");
        console.log("Local cart cleared successfully");
      }

      // Cập nhật state giỏ hàng về rỗng
      setCartItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error.message);
      alert(error.message || "Không thể xóa giỏ hàng");
    }
  };

  // Xử lý khi nhấn "Back to Shop"
  const handleBackToShop = async () => {
    await clearCart(); // Xóa giỏ hàng trước khi điều hướng
    navigate("/"); // Điều hướng về trang chủ
  };
  const handleBackOrderViewHistory = async () => {
    await clearCart(); // Xóa giỏ hàng trước khi điều hướng
    navigate("/order-history") // Điều hướng về trang chủ
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchCartItems(), fetchAddressDetails()]);
    };
    fetchData();
  }, [currentUser?._id]);

  // Fetch order details using orderId from query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const orderId = queryParams.get("orderId");

    if (!orderId) {
      setError("No order ID provided. Redirecting to home...");
      setTimeout(() => navigate("/"), 3000);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/orders/detail/${orderId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch order details");
        }

        const data = await response.json();
        console.log("Order Details Response:", data);

        setCartItems(data.cartItems || []);
        setAddressDetails(data.addressDetails || {});
        setOrderTotal(data.orderTotal || 0);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Error loading order details. Redirecting to home...");
        setTimeout(() => navigate("/"), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location.search, navigate]);

  if (isLoading) {
    return (
      <div id="SuccessPage" className="mt-12 max-w-[1200px] mx-auto px-2 min-h-[50vh]">
        <div className="bg-white w-full p-6 min-h-[150px] flex flex-col items-center">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="SuccessPage" className="mt-12 max-w-[1200px] mx-auto px-2 min-h-[50vh]">
        <div className="bg-white w-full p-6 min-h-[150px] flex flex-col items-center">
          <div className="text-red-500 text-center py-12">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div id="SuccessPage" className="mt-12 max-w-[1200px] mx-auto px-2 min-h-[50vh]">
      <div className="bg-white w-full p-6 min-h-[150px] flex flex-col items-center">
        {/* Thông báo thành công */}
        <div className="flex items-center text-xl mb-6">
          <CheckCircle className="text-green-500 h-8 w-8" />
          <span className="pl-4 font-semibold">Payment Successful</span>
        </div>

        <div className="w-full max-w-[800px]">
          {/* Thông tin hóa đơn */}
          <div className="border-b pb-4 mb-6">
            <h2 className="text-lg font-semibold">Order Confirmation</h2>
            <p className="text-sm text-gray-600">
              Thank you! We've received your payment. Here are your order details:
            </p>
          </div>

          {/* Danh sách sản phẩm (Order Summary) */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2">Order Summary</h3>
            {cartItems.length > 0 ? (
              <div className="border rounded-lg p-4">
                {cartItems.map((item) => (
                  <div
                    key={item.idProduct}
                    className="flex items-center justify-between border-b py-2 last:border-b-0"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          Array.isArray(item.url) && item.url[0]
                            ? `${item.url[0]}/100`
                            : "https://picsum.photos/100"
                        }
                        alt={item.title}
                        className="w-[60px] h-[60px] object-cover rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://picsum.photos/100";
                        }}
                      />
                      <div>
                        <p className="font-semibold text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-sm">
                      ${((item.price * item.quantity)/100).toFixed(2)}
                    </p>
                  </div>
                ))}
                <div className="flex justify-between mt-4 pt-2 border-t">
                  <span className="font-semibold">Total:</span>
                  <span className="font-semibold text-lg">
                    ${(getCartTotal()/100).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No items in your order.</p>
            )}
          </div>

          {/* Địa chỉ giao hàng (Shipping Address) */}
          {addressDetails && Object.keys(addressDetails).length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold mb-2">Shipping Address</h3>
              <div className="border rounded-lg p-4 text-sm">
                <p>{addressDetails.name}</p>
                <p>{addressDetails.address}</p>
                <p>
                  {addressDetails.city}, {addressDetails.zipcode}
                </p>
                <p>{addressDetails.country}</p>
              </div>
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleBackToShop}
              className="bg-blue-600 text-sm font-semibold text-white p-3 rounded-full hover:bg-blue-700 px-6"
            >
              Back to Shop
            </button>
            <button
              onClick={handleBackOrderViewHistory}
              className="bg-green-600 text-sm font-semibold text-white p-3 rounded-full hover:bg-green-700 px-6"
            >
              View Order History
            </button>
            <button
              onClick={() => window.print()}
              className="bg-gray-200 text-sm font-semibold text-gray-800 p-3 rounded-full hover:bg-gray-300 px-6"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}