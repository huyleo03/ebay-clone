import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Footer from "../../components/Footer";
import SubMenu from "../../components/SubMenu";
import MainHeader from "../../components/MainHeader";
import TopMenu from "../../components/TopMenu";

const API_BASE_URL = "http://localhost:9999";

function CheckoutItem({ product }) {
    return (
        <div className="flex items-center gap-4 p-4 border-b">
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
                <div className="font-semibold">{product.title}</div>
                <div className="text-sm text-gray-500">{product.description}</div>
                <div className="font-bold mt-2">£{(product.price / 100).toFixed(2)}</div>
                <div className="text-sm mt-1">Quantity: {product.quantity}</div>
            </div>
        </div>
    );
}

export default function Checkout() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [addressDetails, setAddressDetails] = useState(null);
    const [addressId, setAddressId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    const [shippingMethod, setShippingMethod] = useState("standard");
    const shippingRates = {
        standard: 500,  // £5.00
        express: 1500   // £15.00
    };

    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const token = localStorage.getItem("token");
    const isAuthenticated = !!currentUser._id && !!token;
    const fetchCartItems = async () => {
        if (!isAuthenticated) {
            setCartItems([]);
            setIsLoading(false);
            return;
        }

        try {
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

            if (data.success && data.cart && Array.isArray(data.cart.items)) {
                const items = data.cart.items
                    .filter(item => item && item.productId)
                    .map((item) => {
                        const product = item.productId;
                        return {
                            idProduct: product._id || product,
                            title: product.title || "Product",
                            description: product.description || "",
                            price: Number(product.price || 0),
                            url: product.images || [],
                            quantity: item.quantity || 1,
                        };
                    })
                    .filter(Boolean);
                setCartItems(items);
            } else {
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
        if (!currentUser?._id) return;

        try {
            const response = await fetch(`${API_BASE_URL}/address/user/${currentUser._id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                const address = data[0];
                setAddressDetails({
                    name: address.fullname || "N/A",
                    address: address.street || "N/A",
                    zipcode: address.zipcode || "N/A",
                    city: address.city || "N/A",
                    country: address.country || "N/A",
                });
                setAddressId(address._id || null);
            } else {
                setAddressDetails(null);
                setAddressId(null);
            }
        } catch (error) {
            console.error("Address fetch error:", error);
            setAddressDetails(null);
            setAddressId(null);
        }
    };

useEffect(() => {
    const fetchAll = async () => {
        // Nếu có dữ liệu truyền qua location.state (Buy it now)
        if (location.state && location.state.items && location.state.items.length > 0) {
            setCartItems(location.state.items.map(item => ({
                idProduct: item.id || item._id || item.idProduct,
                title: item.title,
                description: item.description || "",
                // Nếu giá nhỏ hơn 100 thì nhân 100, nếu lớn hơn 100 thì giữ nguyên (đã là pence)
                price: item.price && item.price > 100 ? item.price : Math.round((item.price || item.buyNowPrice) * 100),
                url: item.image
                    ? [item.image]
                    : (Array.isArray(item.images) ? item.images : (item.images ? [item.images] : (item.url ? [item.url] : []))),
                quantity: item.quantity || 1,
                availableStock: item.availableStock || item.stock || 100
            })));
            setIsLoading(false);
            fetchAddressDetails();
        } else {
            // Nếu không phải Buy it now thì lấy từ giỏ hàng như cũ
            await Promise.all([fetchCartItems(), fetchAddressDetails()]);
        }
    };
    fetchAll();
    // eslint-disable-next-line
}, [currentUser?._id, location.state]);

    const getCartTotal = () => {
        return cartItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    };

    const getShippingFee = () => {
        return shippingRates[shippingMethod] || 0;
    };

const getOrderTotal = () => {
    const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const shippingFee = shippingRates[shippingMethod]; // phí ship hiện tại
    return subtotal + shippingFee;
};

const handlePayment = async () => {
    try {
        const orderTotal = getOrderTotal();

        const response = await fetch("http://localhost:9999/orders/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                buyerId: currentUser._id,
                addressId,
                items: cartItems.map(item => ({
                    productId: item.idProduct || item.productId || item.id || item._id,
                    quantity: item.quantity,
                    price: item.price, // đảm bảo giá được truyền đúng
                })),
                shippingMethod, // truyền đúng "standard" hoặc "express"
                orderTotal: (orderTotal / 100).toFixed(2),
            }),
        });

        const result = await response.json();

        if (result && result.approvalUrl) {
            window.location.href = result.approvalUrl;
        } else {
            throw new Error(result.message || "Không lấy được đường dẫn PayPal");
        }
    } catch (error) {
        alert("Lỗi khi tạo đơn hàng PayPal: " + error.message);
        console.error(error);
    }
};

    if (!isAuthenticated) {
        return (
            <div id="MainLayout" className="min-w-[1050px] max-w-[1300px] mx-auto">
                <TopMenu />
                <MainHeader />
                <SubMenu />
                <div className="text-center py-20">
                    Please{" "}
                    <button
                        onClick={() => navigate("/auth")}
                        className="text-blue-500 hover:underline"
                    >
                        login
                    </button>{" "}
                    to proceed to checkout
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div id="MainLayout" className="min-w-[1050px] max-w-[1300px] mx-auto">
            <TopMenu />
            <MainHeader />
            <SubMenu />

            <div id="CheckoutPage" className="mt-4 max-w-[1100px] mx-auto">
                <div className="text-2xl font-bold mt-4 mb-4">Checkout</div>

                {isLoading ? (
                    <div className="text-center py-12">Loading...</div>
                ) : (
                    <div className="flex gap-4 justify-between">
                        <div className="w-[65%]">
                            <div className="bg-white rounded-lg p-4 border mb-4">
                                <div className="text-xl font-semibold mb-2">Shipping Address</div>
                                <a href="/profile" className="text-blue-500 text-sm underline">
                                    Update Address
                                </a>
                                {addressDetails ? (
                                    <ul className="text-sm mt-2">
                                        <li>Name: {addressDetails.name}</li>
                                        <li>Address: {addressDetails.address}</li>
                                        <li>Zip: {addressDetails.zipcode}</li>
                                        <li>City: {addressDetails.city}</li>
                                        <li>Country: {addressDetails.country}</li>
                                    </ul>
                                ) : (
                                    <div className="text-sm mt-2">No address available</div>
                                )}
                            </div>

                            <div className="bg-white rounded-lg">
                                {cartItems.length === 0 ? (
                                    <div className="text-center py-4">No items in cart</div>
                                ) : (
                                    cartItems.map((product) => (
                                        <CheckoutItem key={product.idProduct} product={product} />
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="w-[35%] border rounded-lg p-4">
                            <div className="text-sm mb-4">
                                <div className="font-medium mb-1">Shipping Method</div>
                                <select
                                    value={shippingMethod}
                                    onChange={(e) => setShippingMethod(e.target.value)}
                                    className="w-full border rounded p-2"
                                >
                                    <option value="standard">
                                        Standard Delivery (£{(shippingRates.standard / 100).toFixed(2)})
                                    </option>
                                    <option value="express">
                                        Express Delivery (£{(shippingRates.express / 100).toFixed(2)})
                                    </option>
                                </select>
                            </div>

                            <div className="flex justify-between text-sm mb-1">
                                <span>Items ({cartItems.reduce((sum, i) => sum + i.quantity, 0)})</span>
                                <span>£{(getCartTotal() / 100).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between text-sm mb-4">
                                <span>Shipping:</span>
                                <span>£{(getShippingFee() / 100).toFixed(2)}</span>
                            </div>

                            <div className="border-t my-4" />

                            <div className="flex justify-between items-center mb-4">
                                <div className="font-semibold">Order total</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    £{(getOrderTotal() / 100).toFixed(2)}
                                </div>
                            </div>

                            <div className="border border-gray-500 p-2 text-center text-gray-500 rounded mb-4">
                                PayPal Payment
                            </div>

                            <button
                                className="bg-blue-600 text-white w-full py-3 rounded-full font-semibold hover:bg-blue-700"
                                onClick={handlePayment}
                            >
                                Pay with PayPal
                            </button>

                            <div className="flex items-center justify-center mt-4 gap-2 border-t pt-4">
                                <img width={50} src="/images/logo.svg" alt="Logo" />
                                <div className="font-light">MONEY BACK GUARANTEE</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
