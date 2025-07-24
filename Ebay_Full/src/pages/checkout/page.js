import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Footer from "../../components/Footer";
import SubMenu from "../../components/SubMenu";
import MainHeader from "../../components/MainHeader";
import TopMenu from "../../components/TopMenu";

// API base URL
const API_BASE_URL = "http://localhost:9999";

// Checkout item component
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
                <div className="font-bold mt-2">
                £{(product.price/100).toFixed(2)}
                </div>
                <div className="text-sm mt-1">Quantity: {product.quantity}</div>
            </div>
        </div>
    );
}

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [cartItems, setCartItems] = useState([]);
    const [addressDetails, setAddressDetails] = useState(null);
    const [addressId, setAddressId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Use consistent user data retrieval
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
                            availableStock: product.quantity || product.stock || 100
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

    // Fetch address details
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

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([fetchCartItems(), fetchAddressDetails()]);
        };
        fetchData();
    }, [currentUser?._id]);

    // Handle PayPal redirect after payment
    // useEffect(() => {
    //     const queryParams = new URLSearchParams(location.search);
    //     const token = queryParams.get("token");
    //     const PayerID = queryParams.get("PayerID");

    //     if (token && PayerID) {
    //         const completePayment = async () => {
    //             try {
    //                 const response = await fetch(
    //                     `${API_BASE_URL}/orders/success?token=${token}&PayerID=${PayerID}`
    //                 );
    //                 const result = await response.json();

    //                 if (!response.ok) {
    //                     throw new Error(result.message || "Failed to complete payment");
    //                 }

    //                 // Use the order items from the /orders/success response
    //                 const { order } = result;
    //                 const formattedCartItems = order.items.map(item => ({
    //                     idProduct: item.productId,
    //                     title: item.productName,
    //                     price: Number(item.unitPrice),
    //                     quantity: item.quantity,
    //                     url: item.images || [],
    //                 }));

    //                 localStorage.removeItem("pendingOrder");

    //                 navigate("/success", {
    //                     state: {
    //                         cartItems: formattedCartItems, // Use items from the response
    //                         addressDetails: addressDetails || {},
    //                         orderTotal: order.totalPrice || 0, // Use totalPrice from the response (in VND)
    //                     },
    //                 });
    //             } catch (error) {
    //                 console.error("Error completing payment:", error);
    //                 alert(`Payment completion error: ${error.message}`);
    //             }
    //         };

    //         completePayment();
    //     }
    // }, [location.search, navigate, addressDetails]);

    // Calculate cart total
    const getCartTotal = () => {
        return cartItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    };

    // Handle payment with PayPal
    const handlePayment = async () => {
        if (!isAuthenticated) {
            alert("Please login to checkout");
            navigate("/auth");
            return;
        }

        if (cartItems.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        if (!addressId) {
            alert("Please provide a valid shipping address");
            navigate("/address");
            return;
        }

        // Construct orderData.items from cartItems
        const orderItems = cartItems
            .filter(item => item && item.idProduct && item.quantity > 0)
            .map(item => ({
                productId: item.idProduct.toString(),
                quantity: item.quantity,
            }));

        if (orderItems.length === 0) {
            alert("No valid items found in cart!");
            return;
        }

        const orderData = {
            buyerId: currentUser._id,
            addressId: addressId,
            items: orderItems,
        };

        console.log("Order data being sent:", orderData);

        try {
            // Create PayPal order
            const response = await fetch(`${API_BASE_URL}/orders/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(orderData),
            });

            const result = await response.json();
            console.log("Order creation response:", result);

            if (!response.ok || !result.approvalUrl) {
                throw new Error(result.message || "Failed to create PayPal order");
            }

            // Save order info to localStorage for after redirect (as a fallback)
            localStorage.setItem("pendingOrder", JSON.stringify({
                cartItems,
                addressDetails,
                orderTotal: getCartTotal(),
            }));

            // Redirect to PayPal
            window.location.href = result.approvalUrl;
        } catch (error) {
            console.error("Payment error:", error);
            alert(`Error creating order: ${error.message}`);
        }
    };

    // Authentication check
    if (!isAuthenticated) {
        return (
            <div id="MainLayout" className="min-w-[1050px] max-w-[1300px] mx-auto">
                <div>
                    <TopMenu />
                    <MainHeader />
                    <SubMenu />
                </div>
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
        <>
            <div id="MainLayout" className="min-w-[1050px] max-w-[1300px] mx-auto">
                <div>
                    <TopMenu />
                    <MainHeader />
                    <SubMenu />
                </div>
                <div id="CheckoutPage" className="mt-4 max-w-[1100px] mx-auto">
                    <div className="text-2xl font-bold mt-4 mb-4">Checkout</div>

                    {isLoading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : (
                        <div className="relative flex items-baseline gap-4 justify-between mx-auto w-full">
                            <div className="w-[65%]">
                                <div className="bg-white rounded-lg p-4 border">
                                    <div className="text-xl font-semibold mb-2">
                                        Shipping Address
                                    </div>
                                    <div>
                                        <a
                                            href="/profile"
                                            className="text-blue-500 text-sm underline"
                                        >
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
                                            <div className="text-sm mt-2">
                                                No address available
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div id="Items" className="bg-white rounded-lg mt-4">
                                    {cartItems.length === 0 ? (
                                        <div className="text-center py-4">
                                            No items in cart
                                        </div>
                                    ) : (
                                        cartItems.map((product) => (
                                            <CheckoutItem
                                                key={product.idProduct}
                                                product={product}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            <div
                                id="PlaceOrder"
                                className="relative -top-[6px] w-[35%] border rounded-lg"
                            >
                                <div className="p-4">
                                    <div className="flex items-baseline justify-between text-sm mb-1">
                                        <div>
                                            Items (
                                            {cartItems.reduce((sum, item) => sum + item.quantity, 0)})
                                        </div>
                                        <div>£{(getCartTotal()/100).toFixed(2)}</div>
                                    </div>
                                    <div className="flex items-center justify-between mb-4 text-sm">
                                        <div>Shipping:</div>
                                        <div>Free</div>
                                    </div>

                                    <div className="border-t" />

                                    <div className="flex items-center justify-between my-4">
                                        <div className="font-semibold">Order total</div>
                                        <div className="text-2xl font-semibold">
                                        £{(getCartTotal()/100).toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="border border-gray-500 p-2 rounded-sm mb-4">
                                        <div className="text-gray-500 text-center">PayPal Payment</div>
                                    </div>

                                    <button
                                        className="mt-4 bg-blue-600 text-lg w-full text-white font-semibold p-3 rounded-full hover:bg-blue-700"
                                        onClick={handlePayment}
                                    >
                                        Pay with PayPal
                                    </button>
                                </div>

                                <div className="flex items-center p-4 justify-center gap-2 border-t">
                                    <img width={50} src="/images/logo.svg" alt="Logo" />
                                    <div className="font-light mb-2 mt-2">
                                        MONEY BACK GUARANTEE
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div>
                    <Footer />
                </div>
            </div>
        </>
    );
}