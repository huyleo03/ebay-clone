import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import TopMenu from "../../../components/TopMenu";
import MainHeader from "../../../components/MainHeader";
import SubMenu from "../../../components/SubMenu";
import Footer from "../../../components/Footer";

export default function BidHistory() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const API_BASE_URL = "http://localhost:9999";

  useEffect(() => {
    const fetchProductAndBids = async () => {
      try {
        // Fetch product information
        const productResponse = await fetch(
          `${API_BASE_URL}/product/${productId}`
        );
        if (productResponse.ok) {
          const productData = await productResponse.json();
          setProduct(productData);
        }

        // Fetch bid history
        const bidsResponse = await fetch(
          `${API_BASE_URL}/auctionBids?productId=${productId}`
        );

        if (bidsResponse.ok) {
          const bidsData = await bidsResponse.json();
          if (Array.isArray(bidsData)) {
            setBidHistory(
              bidsData.sort((a, b) => new Date(b.bidDate) - new Date(a.bidDate))
            );
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductAndBids();
  }, [productId]);

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

  return (
    <div className="min-h-screen bg-gray-100">
      <TopMenu />
      <MainHeader />
      <SubMenu />

      <main className="max-w-[1300px] mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <nav className="flex mb-4 text-xs" aria-label="Breadcrumb">
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
                to={`/product/${productId}`}
                className="text-[#555555] hover:text-[#0053A0] hover:underline"
              >
                {product?.title || "Product"}
              </Link>
            </li>
            <li className="flex items-center">
              <FiChevronRight className="h-3 w-3 text-gray-400 mx-1" />
              <span className="text-[#555555]">Bid History</span>
            </li>
          </ol>
        </nav>

        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate(`/product/${productId}`)}
            className="flex items-center text-[#0053A0] hover:underline text-sm"
          >
            <FiChevronLeft className="h-4 w-4 mr-1" />
            Back to product
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 p-4">
            <h1 className="text-xl font-medium text-gray-900">
              Bid History for: {product?.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {bidHistory.length} bid{bidHistory.length !== 1 ? "s" : ""} placed
            </p>
          </div>

          {/* Product Summary */}
          {product && (
            <div className="border-b border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={product.images?.[0] || "/placeholder.jpg"}
                    alt={product.title}
                    className="w-16 h-16 object-cover border border-gray-200"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{product.title}</h3>
                  <p className="text-sm text-gray-500">
                    Current bid: £{(product.price / 100).toFixed(2)}
                  </p>
                  {product.auctionEndTime && (
                    <p className="text-sm text-gray-500">
                      Auction ends:{" "}
                      {new Date(product.auctionEndTime).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bid History Table */}
          <div className="overflow-x-auto">
            {bidHistory.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bid #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bid Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bidHistory.map((bid, index) => (
                    <tr
                      key={bid._id}
                      className={index === 0 ? "bg-green-50" : ""}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{bidHistory.length - index}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          £{(bid.bidAmount / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          [Approx. US $
                          {((bid.bidAmount / 100) * 1.25).toFixed(2)}]
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(bid.bidDate).toLocaleDateString()} at{" "}
                        {new Date(bid.bidDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {index === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Highest Bid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Outbid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  <p className="text-lg font-medium">No bids yet</p>
                  <p className="text-sm mt-1">
                    Be the first to place a bid on this item!
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    to={`/product/${productId}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-sm text-white bg-[#0053A0] hover:bg-[#00438A]"
                  >
                    Place First Bid
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="text-xs text-gray-500">
              <p>
                • Bid amounts shown are the actual bid prices placed by bidders
              </p>
              <p>• Times shown are in your local timezone</p>
              <p>• Bidder identities are kept private for security reasons</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
