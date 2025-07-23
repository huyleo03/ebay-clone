import React from 'react';
import moment from 'moment';
import { Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrderDetail({ order, onClose }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h2 className="text-2xl font-bold">Chi tiết đơn hàng</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Thông tin đơn hàng */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-gray-600 mb-1">Mã đơn hàng:</p>
              <p className="font-semibold">{order.order_id || order.id}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Ngày đặt hàng:</p>
              <p className="font-semibold">
                {moment(order.orderDate || order.created_at).format("DD/MM/YYYY HH:mm")}
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Trạng thái:</p>
              <p className={`font-semibold ${
                order.status === "delivered" ? "text-green-600" :
                order.status === "processing" ? "text-blue-600" :
                order.status === "cancelled" ? "text-red-600" :
                "text-gray-600"
              }`}>
                {order.status}
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Tổng tiền:</p>
              <p className="font-semibold text-lg text-blue-600">
                {(order.totalPrice || order.total_amount).toLocaleString()}£
              </p>
            </div>
          </div>

          {/* Địa chỉ giao hàng */}
          <div className="p-4 border rounded-lg bg-white">
            <h3 className="font-semibold text-lg mb-3 text-gray-800">
              Thông tin giao hàng
            </h3>
            <div className="space-y-2 text-gray-600">
              <p className="font-medium text-gray-800">
                {order.addressId?.fullName}
              </p>
              <p>Số điện thoại: {order.addressId?.phone }</p>
              <p>Địa chỉ: {order.addressId?.street }</p>
              <p>Thành phố: {order.addressId?.city }</p>
              <p>Quốc Gia : {order.addressId?.country }</p>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="border rounded-lg">
            <h3 className="font-semibold text-lg p-4 border-b bg-gray-50">
              Danh sách sản phẩm
            </h3>
            <div className="divide-y">
              {(order.items || []).map((item, index) => (
                <div
                  key={item.id || index}
                  className="p-4 hover:bg-gray-50 flex items-center gap-4"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border">
                    {item.images?.[0] ? (
                      <img 
                        src={item.images[0]} 
                        alt={item.product_name} 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package size={30} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium text-lg mb-2 hover:text-blue-600 cursor-pointer"
                        onClick={() => navigate(`/product/${item.productId || item.product_id}`)}>
                      {item.product_name || item.product?.title}
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="text-gray-500">Số lượng</p>
                        <p className="font-medium">{item.quantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Đơn giá</p>
                        <p className="font-medium">{(item.unitPrice || item.price).toLocaleString()}£</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Thành tiền</p>
                        <p className="font-medium text-blue-600">
                          {((item.quantity * (item.unitPrice || item.price))).toLocaleString()}£
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Tổng cộng */}
            <div className="border-t p-4 bg-gray-50">
              <div className="flex justify-end items-center gap-4">
                <span className="text-gray-600">Tổng cộng:</span>
                <span className="text-xl font-bold text-blue-600">
                  {(order.totalPrice || order.total_amount).toLocaleString()}£
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
