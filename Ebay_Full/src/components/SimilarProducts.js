import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

function ProductCard({ product }) {
  return (
    <div className="border rounded-lg hover:shadow-lg transition-shadow">
      <a href={`/product/${product._id}`}>
        <div className="w-full">
          <img
            src={product.images?.[0] || "/placeholder.jpg"}
            alt={product.title}
            className="w-full h-[200px] object-cover rounded-t-lg"
          />
        </div>

        <div className="p-2">
          <div className="font-semibold hover:text-blue-600 truncate">
            {product.title}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {product.description}
          </div>
          <div className="font-bold text-lg">
            £{(product.price / 100).toFixed(2)}
          </div>
        </div>
      </a>
    </div>
  );
}

export default function SimilarProducts({ categoryId }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `http://localhost:9999/product/category/${categoryId}`
        );
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching similar products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  return (
    <div>
      <div className="border-b py-1 max-w-[1200px] mx-auto" />

      <div className="max-w-[1200px] mx-auto">
        <div className="font-bold text-2xl py-2 mt-4">
          Similar sponsored items
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={30} className="text-blue-400 animate-spin" />
            <span className="ml-4">Loading Products...</span>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">
            No similar products found.
          </p>
        )}
      </div>
    </div>
  );
}
