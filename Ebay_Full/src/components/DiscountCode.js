import { useState, useEffect } from 'react';
import { FiTag } from 'react-icons/fi';

const DiscountCode = ({ onApplyDiscount, productId }) => {
  const [discountCode, setDiscountCode] = useState('');
  const [showDiscountList, setShowDiscountList] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available discount codes for the product
  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:9999/coupons/product/${productId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch discount codes');
        }
        const data = await response.json();
        setAvailableDiscounts(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching discount codes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiscounts();
  }, [productId]);

  const handleApplyDiscount = async () => {
    if (!discountCode) return;

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:9999/coupons/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          code: discountCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply discount code');
      }

      const data = await response.json();
      setSelectedDiscount(data);
      onApplyDiscount(data);
      alert(data.message);
    } catch (err) {
      setError(err.message);
      alert('Mã giảm giá không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDiscount = (discount) => {
    setSelectedDiscount(discount);
    setDiscountCode(discount.code);
    setShowDiscountList(false);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <FiTag className="text-[#0053A0]" />
        <span className="text-sm font-medium">Mã giảm giá</span>
      </div>
      
      <div className="mt-2 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Nhập mã giảm giá"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0053A0]"
            onClick={() => setShowDiscountList(true)}
          />
          
          {showDiscountList && !isLoading && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg">
              {availableDiscounts.length > 0 ? (
                availableDiscounts.map((discount) => (
                  <div
                    key={discount.code}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectDiscount(discount)}
                  >
                    <div className="font-medium text-[#0053A0]">{discount.code}</div>
                    <div className="text-sm text-gray-600">{discount.description}</div>
                    <div className="text-xs text-gray-500">
                      Giảm {discount.discountPercent}% - Hết hạn: {new Date(discount.endDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-500">Không có mã giảm giá nào</div>
              )}
            </div>
          )}
        </div>
        
        <button
          onClick={handleApplyDiscount}
          disabled={isLoading}
          className="px-4 py-2 bg-[#0053A0] text-white rounded hover:bg-[#00438A] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang xử lý...' : 'Áp dụng'}
        </button>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {selectedDiscount && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
          <div className="text-sm text-green-800">
            Đã áp dụng mã giảm giá: {selectedDiscount.code} (-{selectedDiscount.discount}%)
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountCode; 