import { Link } from "react-router-dom";

export default function Product({ product }) {
  // Safely handle product id
  const productId = product?._id || product?.id;

  // Safely handle category display
  const renderCategory = () => {
    if (!product?.categoryId) return "Unknown";

    // If categoryId is an object with a name property
    if (typeof product.categoryId === "object" && product.categoryId !== null) {
      return product.categoryId.name || "Unknown";
    }

    return String(product.categoryId);
  };

  return (
    <>
      <Link
        to={`/product/${productId}`}
        className="max-w-[200px] p-1.5 border border-gray-50 hover:border-gray-200 hover:shadow-xl bg-gray-100 rounded mx-auto"
      >
        {product?.images?.length > 0 ? (
          <div className="relative">
            <img
              className="rounded cursor-pointer"
              src={`${product.images[0]}/190`} // nếu ảnh là từ picsum thì thêm /190 hợp lý, nếu không thì xài ảnh gốc
              alt={product.title || "Product image"}
            />
            {product.status === "unavailable" && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                Sold Out
              </div>
            )}
          </div>
        ) : null}

        <div className="pt-2 px-1">
          <div className="font-semibold text-[15px] hover:underline cursor-pointer">
            {product?.title || "Untitled Product"}
          </div>
          <div className="font-extrabold">
            £{((product?.price || 0) / 100).toFixed(2)}
          </div>

          <div className="relative flex items-center text-[12px] text-gray-500">
            <div className="line-through">
              £{(((product?.price || 0) * 1.2) / 100).toFixed(2)}
            </div>
            <div className="px-2">-</div>
            <div className="line-through">20%</div>
          </div>

          {/* Category badge - enhanced safety */}
          <div className="mt-1 inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs">
            Category: {renderCategory()}
          </div>
        </div>
      </Link>
    </>
  );
}
