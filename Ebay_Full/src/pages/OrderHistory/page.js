import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { FileText, Package, Search } from "lucide-react";

import Footer from "../../components/Footer";
import TopMenu from "../../components/TopMenu";
import MainHeader from "../../components/MainHeader";
import SubMenu from "../../components/SubMenu";
import OrderDetail from "../../components/OrderDetail";

export default function OrderHistory() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const hasFetchedRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const ordersPerPage = 3;

  const fetchOrders = async () => {
    if (!currentUser?._id) {
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:9999/orders/history/${currentUser._id}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setError("Có lỗi xảy ra khi tải lịch sử đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchOrders();
    }
  }, []);

  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item => 
        item.product?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        Vui lòng{" "}
        <span
          onClick={() => navigate("/auth")}
          className="text-blue-500 underline cursor-pointer"
        >
          đăng nhập
        </span>{" "}
        để xem lịch sử đơn hàng.
      </div>
    );
  }

  const handleReturnRequest = async (orderId) => {
    try {
      const reason = prompt("Nhập lý do hoàn trả:");
      if (!reason) return;

      const response = await fetch(
        `http://localhost:9999/orders/${orderId}/return-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser._id,
            reason,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("Gửi yêu cầu hoàn trả thành công!");
        hasFetchedRef.current = false;
        fetchOrders();
      } else {
        alert("Lỗi: " + data.message);
      }
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu hoàn trả:", error);
      alert("Có lỗi xảy ra khi gửi yêu cầu hoàn trả");
    }
  };

  return (
    <div id="MainLayout" className="min-w-[1050px] max-w-[1300px] mx-auto">
      <TopMenu />
      <MainHeader />
      <SubMenu />

      <div className="my-8 px-4">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText size={24} /> Lịch sử đơn hàng
        </h2>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đơn hàng hoặc tên sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg pl-10"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="shipping">Đang giao</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
            <option value="return_requested">Yêu cầu hoàn trả</option>
            <option value="returned">Đã hoàn trả</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Đang tải...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center text-gray-600">
            {searchTerm || statusFilter !== "all" 
              ? "Không tìm thấy đơn hàng phù hợp với điều kiện tìm kiếm."
              : "Bạn chưa có đơn hàng nào."}
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {currentOrders.map((order) => (
                <div
                  key={order.id || order._id}
                  className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">
                      Mã đơn hàng:{" "}
                      <span className="font-semibold">
                        {order.order_id || order.id}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {moment(order.orderDate || order.created_at).format(
                        "DD/MM/YYYY HH:mm"
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-semibold">Người nhận:</span>{" "}{order.addressId?.fullName}
                      <br/>
                      <span className="font-semibold">Địa chỉ giao hàng:</span>{" "}
                    </div>
                    <div>
                      {order.addressId?.street }
                      , {order.addressId?.city }
                      ,{order.addressId?.state }
                      , {order.addressId?.country }
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {(order.items || []).map((item, index) => (
                      <div
                        key={item.id || index}
                        className="border p-3 rounded-md bg-gray-50 cursor-pointer hover:shadow transition-shadow"
                        onClick={() =>
                          navigate(
                            `/product/${item.productId || item.product_id}`
                          )
                        }
                      >
                        <div className="w-full h-36 bg-gray-200 rounded mb-2 flex items-center justify-center">
                          <img
                            src={item.images?.[0] || item.product?.images?.[0]}
                            alt={item.product?.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <div className="font-semibold mb-1">
                          {item.product?.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          Số lượng: {item.quantity}
                        </div>
                        <div className="text-sm text-gray-600">
                          Giá: {item.unitPrice || item.price}£
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-4 border-t pt-2 text-sm text-gray-700">
                    <div>
                      Trạng thái:{" "}
                      <span
                        className={`font-medium ${
                          order.status === "completed"
                            ? "text-green-600"
                            : order.status === "shipping"
                            ? "text-blue-600"
                            : order.status === "cancelled"
                            ? "text-red-600"
                            : order.status === "return_requested"
                            ? "text-orange-600"
                            : order.status === "returned"
                            ? "text-purple-600"
                            : "text-gray-600"
                        }`}
                      >
                        {order.status === "shipping" && "Đang giao"}
                        {order.status === "completed" && "Hoàn thành"}
                        {order.status === "cancelled" && "Đã hủy"}
                        {order.status === "return_requested" && "Yêu cầu hoàn trả"}
                        {order.status === "returned" && "Đã hoàn trả"}
                      </span>
                    </div>
                    <div>
                      Tổng tiền:{" "}
                      <span className="font-semibold">
                        {order.totalPrice || order.total_amount}£
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Xem chi tiết
                    </button>

                    {(order.status === "shipping" || order.status === "completed") && (
                      <button
                        onClick={() => handleReturnRequest(order.id || order._id)}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Yêu cầu hoàn trả
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 border rounded-lg ${
                      currentPage === page
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      <Footer />
    </div>
  );
}
