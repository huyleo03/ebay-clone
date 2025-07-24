import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    // Optional: Load cart from localStorage or backend
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(savedCart);
    setCartCount(savedCart.reduce((total, item) => total + item.quantity, 0));
  }, []);

  const updateCartCount = () => {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    setCartCount(count);
    // Optional: Update localStorage or backend
    localStorage.setItem("cart", JSON.stringify(cart));
  };

  const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find((item) => item.productId === product._id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          productName: product.title,
          quantity,
          price: product.price,
        },
      ]);
    }
    updateCartCount();
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
    updateCartCount();
  };

  return (
    <CartContext.Provider
      value={{ cart, cartCount, addToCart, removeFromCart, updateCartCount }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
