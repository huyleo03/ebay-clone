import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiHeart,
  FiShoppingCart,
  FiTruck,
  FiShield,
  FiArrowLeft,
  FiChevronRight,
  FiInfo,
  FiStar,
  FiShare2,
  FiPrinter,
  FiFlag,
  FiChevronDown,
} from "react-icons/fi";
import TopMenu from "../../../components/TopMenu";
import MainHeader from "../../../components/MainHeader";
import SubMenu from "../../../components/SubMenu";
import Footer from "../../../components/Footer";
import SimilarProducts from "../../../components/SimilarProducts";
import CommentSection from "../../../components/CommentSection";
import DiscountCode from "../../../components/DiscountCode";

// Import components

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isItemAdded, setIsItemAdded] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlist, setIsWishlist] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
  const [showBidHistory, setShowBidHistory] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showDescription, setShowDescription] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReturns, setShowReturns] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const API_BASE_URL = "http://localhost:9999";
  const token = localStorage.getItem("token");
  // Mock additional images for the product
  const productImages =
    product?.images?.length > 0
      ? product.images.map((url, index) => ({ id: index, url }))
      : [{ id: 0, url: "/placeholder.jpg" }];

  // Fetch product data, cart status
  useEffect(() => {
    // Check if product is in cart
    const checkItemInCart = async () => {
      if (!currentUser) return false;
      try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return false;

        const cartData = await response.json();

        // Check if product exists in cart items
        return (
          cartData.items?.some(
            (item) => item.productId === id || item.productId?._id === id
          ) || false
        );
      } catch (error) {
        console.error("Error checking cart:", error);
        return false;
      }
    };

    // Check if product is in wishlist
    const checkItemInWishlist = () => {
      const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
      return wishlist.some((item) => item.id === id);
    };

    const fetchProduct = async () => {
      try {
        // Fixed: Use the correct API endpoint to fetch a single product by ID
        const response = await fetch(`http://localhost:9999/product/${id}`);
        if (!response.ok) {
          // If the response is not ok, try the alternative endpoint that might be used in your app
          const alternativeResponse = await fetch(
            `http://localhost:9999/products/${id}`
          );
          if (!alternativeResponse.ok) {
            // If both fail, try querying with query parameter
            const queryResponse = await fetch(
              `http://localhost:9999/products?id=${id}`
            );
            const data = await queryResponse.json();
            if (data && data.length > 0) {
              setProduct(data[0]);
            } else {
              console.error("Product not found");
            }
          } else {
            const data = await alternativeResponse.json();
            setProduct(data);
          }
        } else {
          const data = await response.json();
          setProduct(data);
        }

        // Check cart status
        const inCart = await checkItemInCart();
        setIsItemAdded(inCart);

        // Check wishlist status
        setIsWishlist(checkItemInWishlist());
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, currentUser, token]); // Dependencies cần thiết

  // Tách riêng phần fetch bid history
  useEffect(() => {
    if (!product?.isAuction) return;

    const fetchBidHistory = async () => {
      try {
        const bidsResponse = await fetch(
          `http://localhost:9999/auctionBids?productId=${id}`
        );

        if (bidsResponse.ok) {
          const bidsData = await bidsResponse.json();

          // Debug logs để xem dữ liệu trả về
          console.log("Raw bidsData:", bidsData);
          console.log("Type of bidsData:", typeof bidsData);
          console.log("Is array?", Array.isArray(bidsData));

          // Kiểm tra bidsData là array trước khi sort
          if (Array.isArray(bidsData)) {
            setBidHistory(
              bidsData.sort((a, b) => new Date(b.bidDate) - new Date(a.bidDate))
            );
          } else {
            console.warn("Bid data is not an array:", bidsData);
            setBidHistory([]); // Set empty array nếu không phải array
          }
        } else {
          console.error("Failed to fetch bid history:", bidsResponse.status);
          setBidHistory([]);
        }
      } catch (error) {
        console.error("Error fetching bid history:", error);
        setBidHistory([]);
      }
    };

    fetchBidHistory();
  }, [id, product?.isAuction]); // Phụ thuộc vào product.isAuction

  // Handle cart actions (add/remove)
  const handleCartAction = async () => {
    if (!currentUser) {
      alert("Please login to manage cart");
      navigate("/auth");
      return;
    }

    try {
      setIsLoading(true);

      if (isItemAdded) {
        // REMOVE FROM CART
        const response = await fetch(`${API_BASE_URL}/cart/items/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to remove item from cart"
          );
        }

        setIsItemAdded(false);
      } else {
        // ADD TO CART
        const response = await fetch(`${API_BASE_URL}/cart/items`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: id,
            quantity: quantity,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to add item to cart");
        }

        setIsItemAdded(true);
      }
    } catch (error) {
      console.error("Error managing cart:", error);
      alert(error.message || "Failed to update cart");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle placing a bid
  // Update the handlePlaceBid function
  const handlePlaceBid = async () => {
    if (!currentUser) {
      alert("Please login to place a bid");
      navigate("/auth");
      return;
    }

    if (!bidAmount || isNaN(bidAmount) || bidAmount <= 0) {
      alert("Please enter a valid bid amount");
      return;
    }

    const bidValue = parseFloat(bidAmount);
    const currentBid = product.currentBid || product.price / 100;

    if (bidValue <= currentBid) {
      alert(
        `Your bid must be higher than the current bid of £${currentBid.toFixed(
          2
        )}`
      );
      return;
    }

    try {
      // Convert to API expected format (pennies/cents)
      const bidAmountInPennies = Math.round(bidValue * 100);

      // Create bid request with proper structure
      const bidRequest = {
        productId: id,
        bidAmount: bidAmountInPennies,
      };

      console.log("Sending bid request:", bidRequest);
      console.log("With token:", token.substring(0, 10) + "...");

      // Submit new bid with authorization header
      const response = await fetch(`${API_BASE_URL}/auctionBids`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Add the auth token
        },
        body: JSON.stringify(bidRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to place bid");
      }

      // Refresh bid history after successful bid
      const bidsResponse = await fetch(
        `${API_BASE_URL}/auctionBids?productId=${id}`
      );
      if (bidsResponse.ok) {
        const bidsData = await bidsResponse.json();
        if (Array.isArray(bidsData)) {
          setBidHistory(
            bidsData.sort((a, b) => new Date(b.bidDate) - new Date(a.bidDate))
          );
        }
      }

      alert("Bid placed successfully!");
      setBidAmount("");
      console.log("Response status:", response.status);
      console.log("Response body:", await response.clone().json());
    } catch (error) {
      console.error("Error placing bid:", error);
      alert("Failed to place bid: " + error.message);
    }
  };
const handleBuyItNow = () => {
  if (!currentUser) {
    alert("Please login to buy now");
    navigate("/auth");
    return;
  }

  // Lấy giá bid cao nhất (giá lớn nhất trong bidHistory), nếu chưa có ai bid thì lấy giá khởi điểm
  let highestBid = product.price;
  if (Array.isArray(bidHistory) && bidHistory.length > 0) {
    highestBid = Math.max(...bidHistory.map(bid => bid.bidAmount));
  }

  // Nếu có buyNowPrice và nó lớn hơn highestBid thì ưu tiên buyNowPrice, còn không thì lấy highestBid
  const buyNowPrice = product.buyNowPrice && product.buyNowPrice > highestBid
    ? product.buyNowPrice
    : highestBid;

  const buyNowProduct = {
    id: product._id || product.id,
    title: product.title,
    description: product.description || "",
    price: buyNowPrice, // Giá đúng là giá bid cao nhất hoặc buyNowPrice nếu lớn hơn
    image: Array.isArray(product.images) ? product.images[0] : (product.images || product.image || "/placeholder.jpg"),
    quantity: 1,
    availableStock: product.quantity || 100
  };
  navigate("/checkout", { state: { items: [buyNowProduct], buyNow: true } });
};

  // Toggle wishlist status
  const toggleWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

    if (isWishlist) {
      const updatedWishlist = wishlist.filter((item) => item.id !== id);
      localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
      setIsWishlist(false);
    } else {
      if (product) {
        localStorage.setItem(
          "wishlist",
          JSON.stringify([...wishlist, product])
        );
        setIsWishlist(true);
      }
    }
  };

  const handleApplyDiscount = (discount) => {
    setAppliedDiscount(discount);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <TopMenu />
        <MainHeader />
        <SubMenu />
        <div className="max-w-[1300px] mx-auto px-4 py-16">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-100">
        <TopMenu />
        <MainHeader />
        <SubMenu />
        <div className="max-w-[1300px] mx-auto px-4 py-16">
          <div className="bg-white p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Product Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-sm text-white bg-[#0053A0] hover:bg-[#00438A]"
            >
              Return to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  let highestBid = product.price;
if (Array.isArray(bidHistory) && bidHistory.length > 0) {
  highestBid = Math.max(...bidHistory.map(bid => bid.bidAmount));
}

  return (
    <div className="min-h-screen bg-gray-100">
      <TopMenu />
      <MainHeader />
      <SubMenu />

      <main className="max-w-[1300px] mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <nav className="flex mb-2 text-xs" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1">
            <li>
              <Link
                to="/"
                className="text-[#555555] hover:text-[#0053A0] hover:underline"
              >
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <FiChevronRight className="h-3 w-3 text-gray-400 mx-1" />
              <Link
                to={`/list-category/${product.categoryId}`}
                className="text-[#555555] hover:text-[#0053A0] hover:underline"
              >
                {product.categoryName || "Category"}
              </Link>
            </li>
            <li className="flex items-center">
              <FiChevronRight className="h-3 w-3 text-gray-400 mx-1" />
              <span className="text-[#555555]">{product.title}</span>
            </li>
          </ol>
        </nav>

        <div className="bg-white">
          <div className="lg:flex">
            {/* Left Column - Images */}
            <div className="lg:w-[40%] p-2 lg:p-4 border-b lg:border-b-0 lg:border-r border-gray-200">
              <div className="relative mb-2">
                <img
                  src={`${productImages[selectedImage].url}/600`}
                  alt={product.title}
                  className="w-full h-[400px] object-contain"
                />
              </div>

              {/* Thumbnail images */}
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {productImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 overflow-hidden border ${
                      selectedImage === index
                        ? "border-[#0053A0]"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={`${image.url}/100`}
                      alt={`Product view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Image actions */}
              <div className="flex justify-center mt-4 text-xs text-[#0053A0]">
                <button className="flex items-center hover:underline mx-2">
                  <FiShare2 className="mr-1 h-3 w-3" />
                  Share
                </button>
                <button className="flex items-center hover:underline mx-2">
                  <FiPrinter className="mr-1 h-3 w-3" />
                  Print
                </button>
                <button className="flex items-center hover:underline mx-2">
                  <FiFlag className="mr-1 h-3 w-3" />
                  Report
                </button>
              </div>

              {/* Seller info (mobile only) */}
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 lg:hidden">
                <div className="flex items-center">
                  <div className="text-sm">
                    <p className="font-medium">Seller information</p>
                    <p className="text-[#0053A0] hover:underline cursor-pointer">
                      seller123 (254)
                    </p>
                    <div className="flex items-center text-xs mt-1">
                      <div className="flex items-center text-[#0053A0]">
                        98.7% Positive feedback
                      </div>
                    </div>
                  </div>
                  <button className="ml-auto text-xs text-[#0053A0] hover:underline">
                    Contact seller
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Product Details */}
            <div className="lg:w-[60%] p-2 lg:p-4">
              <div className="border-b border-gray-200 pb-2">
                <h1 className="text-xl font-medium text-gray-900">
                  {product.title}
                </h1>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <span className="text-[#0053A0] hover:underline cursor-pointer">
                    Brand New
                  </span>
                  <span className="mx-1">|</span>
                  <span>
                    Condition: <span className="font-medium">New</span>
                  </span>
                </div>
              </div>

              {/* Auction or Buy Now Section */}
              <div className="py-4 border-b border-gray-200">
                {product.isAuction ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-gray-500">
                          Current bid:
                        </div>
                        <div className="text-2xl font-medium text-gray-900">
                          £{(product.price / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          [Approximately US $
                          {((product.price / 100) * 1.25).toFixed(2)}]
                        </div>
                      </div>

                      {new Date() < new Date(product.auctionEndTime) && (
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            Time left:
                          </div>
                          <div className="text-[#e43147] font-medium">
                            {/* You may want to add a real countdown timer here */}
                            2d 3h 45m
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(
                              product.auctionEndTime
                            ).toLocaleDateString()}{" "}
                            {new Date(
                              product.auctionEndTime
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            BST
                          </div>
                        </div>
                      )}
                    </div>

                    {new Date() < new Date(product.auctionEndTime) ? (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500">£</span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              placeholder={`${(product.price / 100 + 1).toFixed(
                                2
                              )} or more`}
                              className="block w-full pl-7 pr-12 py-2 border border-gray-300 focus:ring-[#0053A0] focus:border-[#0053A0]"
                            />
                          </div>
                          <button
                            onClick={handlePlaceBid}
                            className="bg-[#0053A0] hover:bg-[#00438A] text-white py-2 px-6 font-medium"
                          >
                            Place bid
                          </button>
                        </div>

                        <div className="text-xs text-gray-500">
                          [Enter £{(product.price / 100 + 1).toFixed(2)} or
                          more]
                        </div>

                        <div className="flex items-center justify-between pt-3">
                          <div>
                            <div className="text-sm text-gray-500">
                              Buy it now:
                            </div>
                              <div className="text-xl font-medium text-gray-900">
                                £{(
                                  (product.buyNowPrice && product.buyNowPrice > highestBid
                                    ? product.buyNowPrice
                                    : highestBid
                                  ) / 100
                                ).toFixed(2)}
                              </div>
                            <div className="text-xs text-gray-500 mt-1">
                              [Approximately US $
                              {(((product.price * 1.2) / 100) * 1.25).toFixed(
                                2
                              )}
                              ]
                            </div>
                          </div>
                            <button
                              onClick={handleBuyItNow}
                              className="bg-[#0053A0] hover:bg-[#00438A] text-white py-2 px-6 font-medium"
                            >
                              Buy it now
                            </button>
                        </div>

                        <div className="flex items-center text-xs text-[#0053A0] mt-2">
                          <button
                            onClick={() => navigate(`/bidHistory/${id}`)}
                            className="hover:underline flex items-center"
                          >
                            {bidHistory?.length || 0} bids
                          </button>
                          <span className="mx-2">|</span>
                          <button className="hover:underline">
                            Add to watchlist
                          </button>
                        </div>

                        {showBidHistory && (
                          <div className="mt-2 border text-xs">
                            <div className="bg-gray-100 p-2 font-medium">
                              Bid History ({bidHistory?.length || 0} bids)
                            </div>
                            <table className="min-w-full">
                              <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                  <th className="px-2 py-1 text-left">
                                    Bidder
                                  </th>
                                  <th className="px-2 py-1 text-left">
                                    Bid Amount
                                  </th>
                                  <th className="px-2 py-1 text-left">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {bidHistory && bidHistory.length > 0 ? (
                                  bidHistory.map((bid) => (
                                    <tr key={bid.id}>
                                      <td className="px-2 py-1 whitespace-nowrap">
                                        u***{bid.userId.substring(0, 2)}
                                      </td>
                                      <td className="px-2 py-1 whitespace-nowrap font-medium">
                                        £{(bid.bidAmount / 100).toFixed(2)}
                                      </td>
                                      <td className="px-2 py-1 whitespace-nowrap text-gray-500">
                                        {new Date(bid.bidDate).toLocaleString()}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={3}
                                      className="px-2 py-2 text-center text-gray-500"
                                    >
                                      No bids yet. Be the first to bid!
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 p-3 text-sm">
                        <div className="font-medium text-red-800">
                          This auction has ended
                        </div>
                        <p className="mt-1 text-red-700">
                          The auction for this item has ended. Check out similar
                          products below.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500">Price:</div>
                      <div className="flex items-baseline">
                        <div className="text-2xl font-medium text-gray-900">
                          £
                          {(
                            (product.price *
                              (1 - (appliedDiscount?.discount || 0) / 100)) /
                            100
                          ).toFixed(2)}
                        </div>
                        {appliedDiscount && (
                          <div className="ml-2 text-sm text-gray-500 line-through">
                            £{(product.price / 100).toFixed(2)}
                          </div>
                        )}
                        {!appliedDiscount && (
                          <div className="ml-2 text-sm text-gray-500 line-through">
                            £{((product.price * 1.2) / 100).toFixed(2)}
                          </div>
                        )}
                        {!appliedDiscount && (
                          <div className="ml-2 text-sm font-medium text-green-600">
                            Save 20%
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        [Approximately US $
                        {(
                          ((product.price *
                            (1 - (appliedDiscount?.discount || 0) / 100)) /
                            100) *
                          1.25
                        ).toFixed(2)}
                        ]
                      </div>
                    </div>

                    {product.quantity > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <label
                            htmlFor="quantity"
                            className="block text-sm text-gray-700 mr-4"
                          >
                            Quantity:
                          </label>
                          <div className="flex items-center border border-gray-300">
                            <button
                              type="button"
                              className="p-1 text-gray-500 hover:text-gray-600"
                              onClick={() =>
                                setQuantity(Math.max(1, quantity - 1))
                              }
                            >
                              <span className="sr-only">Decrease</span>
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 12H4"
                                />
                              </svg>
                            </button>
                            <input
                              type="number"
                              id="quantity"
                              name="quantity"
                              min="1"
                              max={product.quantity}
                              value={quantity}
                              onChange={(e) =>
                                setQuantity(
                                  Math.max(
                                    1,
                                    Math.min(
                                      product.quantity,
                                      parseInt(e.target.value) || 1
                                    )
                                  )
                                )
                              }
                              className="w-12 text-center border-0 focus:ring-0"
                            />
                            <button
                              type="button"
                              className="p-1 text-gray-500 hover:text-gray-600"
                              onClick={() =>
                                setQuantity(
                                  Math.min(product.quantity, quantity + 1)
                                )
                              }
                            >
                              <span className="sr-only">Increase</span>
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v16m8-8H4"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="ml-2 text-xs text-gray-500">
                            {product.quantity > 10
                              ? "More than 10 available"
                              : `${product.quantity} available`}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={handleCartAction}
                            disabled={isLoading}
                            className={`w-full flex items-center justify-center px-6 py-2 text-base font-medium text-white ${
                              isItemAdded
                                ? "bg-[#e43147] hover:bg-[#c52b3d]"
                                : "bg-[#0053A0] hover:bg-[#00438A]"
                            } ${
                              isLoading ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                          >
                            {isLoading ? (
                              <span className="flex items-center">
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Processing...
                              </span>
                            ) : (
                              <>
                                <FiShoppingCart className="mr-2 h-5 w-5" />
                                {isItemAdded
                                  ? "Remove from cart"
                                  : "Add to cart"}
                              </>
                            )}
                          </button>

                          <button
                            onClick={toggleWishlist}
                            className="w-full flex items-center justify-center px-6 py-2 border border-gray-300 text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <FiHeart
                              className={`mr-2 h-5 w-5 ${
                                isWishlist
                                  ? "text-[#e43147] fill-[#e43147]"
                                  : ""
                              }`}
                            />
                            {isWishlist
                              ? "Remove from watchlist"
                              : "Add to watchlist"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 p-3 text-sm">
                        <div className="font-medium text-red-800">
                          Out of Stock
                        </div>
                        <p className="mt-1 text-red-700">
                          This item is currently out of stock. Please check back
                          later or browse similar products below.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shipping & Payment */}
              <div className="py-4 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-medium">Shipping</h3>
                      <button
                        onClick={() => setShowShipping(!showShipping)}
                        className="text-xs text-[#0053A0]"
                      >
                        {showShipping ? "Hide" : "Show"} details
                      </button>
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Item location:</span>
                        <span>London, United Kingdom</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Shipping to:</span>
                        <span>United Kingdom</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Delivery:</span>
                        <span className="text-green-600 font-medium">
                          Free Standard Delivery
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Estimated between:</span>
                        <span>Wed, 15 Jun and Mon, 20 Jun</span>
                      </div>
                    </div>

                    {showShipping && (
                      <div className="mt-3 text-xs bg-gray-50 p-3 border border-gray-200">
                        <table className="w-full">
                          <thead className="text-gray-500">
                            <tr>
                              <th className="text-left py-1">Service</th>
                              <th className="text-right py-1">Delivery*</th>
                              <th className="text-right py-1">Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="py-1">Standard Delivery</td>
                              <td className="text-right py-1">
                                3-5 business days
                              </td>
                              <td className="text-right py-1 font-medium">
                                Free
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1">Express Delivery</td>
                              <td className="text-right py-1">
                                1-2 business days
                              </td>
                              <td className="text-right py-1">£4.99</td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="mt-2">* Estimated delivery times</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-medium">Payment</h3>
                      <button
                        onClick={() => setShowPayment(!showPayment)}
                        className="text-xs text-[#0053A0]"
                      >
                        {showPayment ? "Hide" : "Show"} details
                      </button>
                    </div>
                    <div className="text-sm">
                      <div className="flex items-center gap-1 mb-1">
                        <img
                          src="https://ir.ebaystatic.com/cr/v/c1/payment-icons/visa.svg"
                          alt="Visa"
                          className="h-6"
                        />
                        <img
                          src="https://ir.ebaystatic.com/cr/v/c1/payment-icons/mastercard.svg"
                          alt="Mastercard"
                          className="h-6"
                        />
                        <img
                          src="https://ir.ebaystatic.com/cr/v/c1/payment-icons/paypal.svg"
                          alt="PayPal"
                          className="h-6"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        *Terms and conditions apply
                      </div>
                    </div>

                    {showPayment && (
                      <div className="mt-3 text-xs bg-gray-50 p-3 border border-gray-200">
                        <p>Payment methods accepted:</p>
                        <ul className="list-disc list-inside mt-1">
                          <li>Credit/Debit Cards (Visa, Mastercard, Amex)</li>
                          <li>PayPal</li>
                          <li>Google Pay</li>
                          <li>Apple Pay</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Returns */}
              <div className="py-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-medium">Returns</h3>
                  <button
                    onClick={() => setShowReturns(!showReturns)}
                    className="text-xs text-[#0053A0]"
                  >
                    {showReturns ? "Hide" : "Show"} details
                  </button>
                </div>
                <div className="text-sm">
                  <p>30 day returns. Buyer pays for return shipping.</p>
                </div>

                {showReturns && (
                  <div className="mt-3 text-xs bg-gray-50 p-3 border border-gray-200">
                    <p className="font-medium">Return policy details:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>
                        Returns accepted within 30 days after the buyer receives
                        the item
                      </li>
                      <li>Buyer pays for return shipping</li>
                      <li>Item must be returned in original condition</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="py-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-medium">Description</h3>
                  <button
                    onClick={() => setShowDescription(!showDescription)}
                    className="text-xs text-[#0053A0]"
                  >
                    {showDescription ? "Hide" : "Show"} details
                  </button>
                </div>
                <div className="text-sm">
                  <p className="line-clamp-3">{product.description}</p>
                </div>

                {showDescription && (
                  <div className="mt-3 text-sm">
                    <p>{product.description}</p>
                    <div className="mt-4">
                      <h4 className="font-medium">Product Specifications:</h4>
                      <table className="w-full mt-2 text-xs">
                        <tbody>
                          <tr className="border-t border-gray-200">
                            <td className="py-2 w-1/3 text-gray-500">Brand</td>
                            <td className="py-2">Premium Brand</td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="py-2 w-1/3 text-gray-500">Model</td>
                            <td className="py-2">2023 Edition</td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="py-2 w-1/3 text-gray-500">Color</td>
                            <td className="py-2">Black</td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="py-2 w-1/3 text-gray-500">
                              Material
                            </td>
                            <td className="py-2">Premium Quality</td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="py-2 w-1/3 text-gray-500">
                              Dimensions
                            </td>
                            <td className="py-2">30 x 20 x 10 cm</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Seller Information (Desktop) */}
              <div className="hidden lg:block mt-4 p-3 bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Seller information</p>
                    <p className="text-[#0053A0] hover:underline cursor-pointer text-sm">
                      seller123 (254)
                    </p>
                    <div className="flex items-center text-xs mt-1">
                      <div className="flex items-center text-[#0053A0]">
                        98.7% Positive feedback
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <button className="text-xs text-[#0053A0] hover:underline mb-1 block">
                      Contact seller
                    </button>
                    <button className="text-xs text-[#0053A0] hover:underline block">
                      See other items
                    </button>
                  </div>
                </div>
              </div>

              {!currentUser && (
                <div className="mt-4 bg-blue-50 border border-blue-200 p-3 text-sm">
                  <p className="text-blue-700">
                    Please{" "}
                    <button
                      onClick={() => navigate("/auth")}
                      className="font-medium text-[#0053A0] underline"
                    >
                      sign in
                    </button>{" "}
                    to{" "}
                    {product.isAuction
                      ? "place a bid or buy"
                      : "add items to basket"}
                  </p>
                </div>
              )}

              {/* Add DiscountCode component before the cart buttons */}
              <DiscountCode
                onApplyDiscount={handleApplyDiscount}
                productId={id}
              />
            </div>
          </div>
        </div>

        {/* Comment Section */}
        <div className="mt-6">
          <CommentSection productId={id} />
        </div>

        {/* Similar Products Section */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Similar sponsored items
          </h2>
          <SimilarProducts categoryId={product.categoryId._id} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
