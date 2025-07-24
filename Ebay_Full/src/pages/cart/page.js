import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import TopMenu from "../../components/TopMenu";
import MainHeader from "../../components/MainHeader";
import SubMenu from "../../components/SubMenu";
import SimilarProducts from "../../components/SimilarProducts";
import Footer from "../../components/Footer";
import DiscountCode from "../../components/DiscountCode";
import { useCart } from "../../context/cartContext";

// API base URL
const API_BASE_URL = "http://localhost:9999"; // Update to your actual API URL

function EmptyCart() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-2xl font-semibold mb-2">Your cart is empty</h3>
      <p className="text-gray-500 mb-6">
        Looks like you haven't added anything to your cart yet
      </p>
      <button
        onClick={() => navigate("/")}
        className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
      >
        Start Shopping
      </button>
    </div>
  );
}

function CartItem({ product, onRemove, onUpdateQuantity, availableStock }) {
  const [isUpdating, setIsUpdating] = useState(false);
  console.log("product.images:", product.images);
  console.log("First image:", product.images?.[0]);

  return (
    <div className="flex items-center justify-between gap-4 border-b p-4">
      <div className="flex items-center gap-4">
        <img
          src={Array.isArray(product.url)
            ? (product.url[0] ? `${product.url[0]}/100` : "https://picsum.photos/100")
            : (typeof product.url === 'string' ? `${product.url}/100` : "https://picsum.photos/100")}
          alt={product.title}
          className="w-[100px] h-[100px] object-cover rounded-lg"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://picsum.photos/100";
          }}
        />
        <div>
          <div className="font-semibold"><a href={`/product/${product.idProduct}`}>{product.title}</a></div>
          <div className="text-sm text-gray-500">{product.description}</div>
          <div className="font-bold mt-2">£{(product.price/100).toFixed(2)}</div>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => {
                setIsUpdating(true);
                onUpdateQuantity(
                  product.idProduct,
                  product.quantity - 1
                ).finally(() => setIsUpdating(false));
              }}
              className="p-1 rounded-full hover:bg-gray-100"
              disabled={product.quantity <= 1 || isUpdating}
            >
              <Minus size={16} />
            </button>
            <span>{product.quantity}</span>
            <button
              onClick={() => {
                setIsUpdating(true);
                onUpdateQuantity(
                  product.idProduct,
                  product.quantity + 1
                ).finally(() => setIsUpdating(false));
              }}
              className="p-1 rounded-full hover:bg-gray-100"
              disabled={product.quantity >= availableStock || isUpdating}
            >
              <Plus size={16} />
            </button>
          </div>
          {availableStock === 0 && (
            <div className="text-red-500 text-sm mt-1">Hết hàng</div>
          )}
        </div>
      </div>
      <button
        onClick={() => {
          setIsUpdating(true);
          onRemove(product.idProduct).finally(() => setIsUpdating(false));
        }}
        className="text-blue-500 hover:text-blue-700"
        disabled={isUpdating}
      >
        Xóa
      </button>
    </div>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const { updateCartCount } = useCart();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const token = localStorage.getItem("token");
  const isAuthenticated = !!currentUser._id && !!token;

  // Get cart from localStorage for guest users
  const getLocalCart = () => {
    const cartData = localStorage.getItem('cart');
    return cartData ? JSON.parse(cartData) : { products: [] };
  };

  // Save cart to localStorage for guest users
  const saveLocalCart = (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
  };
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  const fetchCartItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isAuthenticated) {
        // Fetch cart from the server for logged in users
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
            throw new Error("Phiên đăng nhập hết hạn");
          }
          throw new Error(`Không thể tải giỏ hàng: ${response.status}`);
        }

        const data = await response.json();
        console.log("Cart API response:", data);

        // Check if we have items in cart (correct structure)
        if (data.success && data.cart && Array.isArray(data.cart.items) && data.cart.items.length > 0) {
          console.log("Found items array in cart");
          const items = data.cart.items
            .filter(item => item && item.productId) // Filter out any invalid items
            .map((item) => {
              // Make sure we have product data
              const product = item.productId;
              if (!product) {
                console.warn("Item missing product data:", item);
                return null;
              }

              return {
                idProduct: product._id || product,  // Handle both object and ID string
                title: product.title || product.name || "Product",
                description: product.description || "",
                price: Number(product.price || 0),
                url: product.images || "",
                quantity: item.quantity || 1,
                availableStock: product.quantity || product.stock || 100
              };
            })
            .filter(Boolean); // Remove any null items

          console.log("Processed cart items:", items);
          setCartItems(items);
        }
        // Fallback for old structure or empty cart
        else {
          console.log("Empty cart or unrecognized format");
          setCartItems([]);
        }
      } else {
        // For guest users, get cart from localStorage
        console.log("Fetching cart for guest user from localStorage");
        const localCart = getLocalCart();

        // If there are products in local cart, fetch their details
        if (localCart.products && localCart.products.length > 0) {
          const items = await Promise.all(
            localCart.products.map(async (item) => {
              try {
                // Fetch product details for each cart item
                const productRes = await fetch(`${API_BASE_URL}/products/${item.idProduct}`);
                if (!productRes.ok) throw new Error(`Couldn't fetch product ${item.idProduct}`);
                const productData = await productRes.json();

                return {
                  idProduct: item.idProduct,
                  title: productData.title,
                  description: productData.description,
                  price: productData.price,
                  url: productData.url,
                  quantity: item.quantity,
                  availableStock: productData.quantity || 100, // Default if not available
                };
              } catch (err) {
                console.error(`Error fetching product ${item.idProduct}:`, err);
                // Return basic item with placeholder data
                return {
                  idProduct: item.idProduct,
                  title: "Product Not Found",
                  description: "Unable to load product details",
                  price: 0,
                  quantity: item.quantity,
                  availableStock: 0
                };
              }
            })
          );
          setCartItems(items.filter(item => item.price > 0)); // Filter out invalid products
        } else {
          setCartItems([]);
        }
      }

      updateCartCount();
    } catch (error) {
      console.error("Cart fetch error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId) => {
    try {
      // First, fetch product details to check stock
      const productResponse = await fetch(`${API_BASE_URL}/products/${productId}`);
      if (!productResponse.ok) throw new Error("Không thể lấy thông tin sản phẩm");
      const product = await productResponse.json();

      if (product.quantity <= 0) {
        alert("Sản phẩm này đã hết hàng!");
        return;
      }

      if (isAuthenticated) {
        console.log("Adding item to authenticated user cart:", productId);

        // For authenticated users, use server API with the correct field name
        const response = await fetch(`${API_BASE_URL}/cart/items`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: productId, // Use productId to match backend schema
            quantity: 1
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error adding to cart:", errorData);
          throw new Error(errorData.message || "Không thể thêm sản phẩm vào giỏ hàng");
        }

        await fetchCartItems();
      } else {
        // For guest users, update localStorage
        const localCart = getLocalCart();
        const existingItemIndex = localCart.products.findIndex(
          item => item.idProduct === productId
        );

        if (existingItemIndex !== -1) {
          const newQuantity = localCart.products[existingItemIndex].quantity + 1;
          if (newQuantity > product.quantity) {
            alert("Không thể thêm sản phẩm; đã đạt giới hạn tồn kho!");
            return;
          }
          localCart.products[existingItemIndex].quantity = newQuantity;
        } else {
          localCart.products.push({
            idProduct: productId,
            quantity: 1
          });
        }

        saveLocalCart(localCart);
        await fetchCartItems();
      }
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      alert(error.message || "Không thể thêm sản phẩm vào giỏ hàng");
    }
  };

  const removeFromCart = async (productId) => {
    try {
      if (isAuthenticated) {
        // For authenticated users, use server API
        const response = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Không thể xóa sản phẩm khỏi giỏ hàng");
        }
      } else {
        // For guest users, update localStorage
        const localCart = getLocalCart();
        localCart.products = localCart.products.filter(
          item => item.idProduct !== productId
        );
        saveLocalCart(localCart);
      }

      await fetchCartItems();
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
      alert(error.message || "Không thể xóa sản phẩm khỏi giỏ hàng");
    }
  };

  // Replace your current updateQuantity function with this improved version

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      // Prevent multiple clicks
      setIsLoading(true);

      console.log(`Updating quantity for product ${productId} to ${newQuantity}`);

      if (isAuthenticated) {
        // For authenticated users, use server API
        const response = await fetch(`${API_BASE_URL}/cart/items/${productId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: newQuantity }),
        });

        const data = await response.json();
        console.log("Update response:", data);

        if (!response.ok) {
          throw new Error(data.message || "Không thể cập nhật giỏ hàng");
        }

        // Directly update cart items from response instead of fetching again
        if (data.success && data.cart && Array.isArray(data.cart.items)) {
          const updatedItems = data.cart.items
            .filter(item => item && item.productId)
            .map(item => {
              const product = item.productId;
              return {
                idProduct: product._id || product,
                title: product.title || product.name || "Product",
                description: product.description || "",
                price: Number(product.price || 0),
                url: product.images || product.url || product.image || [],  // FIXED: Check images first
                quantity: item.quantity || 1,
                availableStock: product.quantity || product.stock || 100
              };
            });

          setCartItems(updatedItems);
        } else {
          // Fallback to fetching cart if response format is unexpected
          await fetchCartItems();
        }
      } else {
        // For guest users, update localStorage
        const localCart = getLocalCart();
        const existingItemIndex = localCart.products.findIndex(
          item => item.idProduct === productId
        );

        if (existingItemIndex !== -1) {
          localCart.products[existingItemIndex].quantity = newQuantity;
          saveLocalCart(localCart);
          await fetchCartItems();
        }
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert(error.message || "Couldn't update quantity");
    } finally {
      setIsLoading(false);
    }
  };

  // Merge local cart with server cart when logging in
  const mergeCartsAfterLogin = async () => {
    if (!isAuthenticated) return;

    try {
      const localCart = getLocalCart();

      // Skip if local cart is empty
      if (!localCart.products || localCart.products.length === 0) return;

      console.log("Merging local cart with server cart");

      // Convert the format from what frontend uses (products/idProduct)
      // to what backend expects (items/productId)
      const formattedLocalCart = {
        items: localCart.products.map(item => ({
          productId: item.idProduct,
          quantity: item.quantity
        }))
      };

      console.log("Sending to server:", formattedLocalCart);

      const response = await fetch(`${API_BASE_URL}/cart/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ localCart: formattedLocalCart }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error merging carts:", errorData);
        throw new Error(errorData.message || "Failed to merge carts");
      }

      // Clear local cart after successful merge
      localStorage.removeItem("cart");

      await fetchCartItems();
    } catch (error) {
      console.error("Error merging carts:", error);
    }
  };

  const handleApplyDiscount = (discount) => {
    setAppliedDiscount(discount);
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để thanh toán");
      navigate("/auth");
      return;
    }

    if (cartItems.length === 0) {
      alert("Giỏ hàng của bạn trống!");
      return;
    }

    navigate("/checkout", { state: { cartItems, total: getCartTotal() } });
  };

  useEffect(() => {
    fetchCartItems();

    // If user just logged in and has items in local storage, merge carts
    if (isAuthenticated) {
      mergeCartsAfterLogin();
    }
  }, [isAuthenticated]);

  return (
    <div id="MainLayout" className="min-w-[1050px] max-w-[1300px] mx-auto">
      <div>
        <TopMenu />
        <MainHeader />
        <SubMenu />
      </div>

      <div className="max-w-[1200px] mx-auto mb-8 min-h-[300px]">
        <div className="text-2xl font-bold my-4">Giỏ hàng</div>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {isLoading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              {cartItems.length === 0 ? (
                <EmptyCart />
              ) : (
                <div className="space-y-4">
                  {cartItems.map((product) => (
                    <CartItem
                      key={product.idProduct}
                      product={product}
                      onRemove={removeFromCart}
                      onUpdateQuantity={updateQuantity}
                      availableStock={product.availableStock}
                    />
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="md:col-span-1">
                <div className="bg-white p-4 border sticky top-4">
                  <DiscountCode
                    onApplyDiscount={handleApplyDiscount}
                    productId={cartItems[0]?.idProduct} // Using first item's productId for now
                  />

                  <button
                    onClick={handleCheckout}
                    className="flex items-center justify-center bg-blue-600 w-full text-white font-semibold p-3 rounded-full hover:bg-blue-700 mt-4"
                  >
                    Thanh toán
                  </button>

                  <div className="flex items-center justify-between mt-4 text-sm mb-1">
                    <div>Sản phẩm ({cartItems.length})</div>
                    <div>£{(getCartTotal()/100).toFixed(2)}</div>
                  </div>
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <div>Vận chuyển:</div>
                    <div>Miễn phí</div>
                  </div>

                  <div className="border-b border-gray-300" />

                  <div className="flex items-center justify-between mt-4 mb-1 text-lg font-semibold">
                    <div>Tổng cộng</div>
                    <div>£{(getCartTotal()/100).toFixed(2)}</div>
                  </div>
                  {appliedDiscount && (
                    <div className="text-sm text-green-600 mt-2">
                      Applied discount: {appliedDiscount.code} (-{appliedDiscount.discountPercent}%)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-12">
          <SimilarProducts />
        </div>
      </div>
      <Footer />
    </div>
  );
}