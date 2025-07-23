import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import moment from "moment"
import { Truck } from "lucide-react"

import Footer from "../../components/Footer"
import TopMenu from "../../components/TopMenu"
import MainHeader from "../../components/MainHeader"
import SubMenu from "../../components/SubMenu"
import TestOrder from '../../components/TestOrder';

export default function Orders() {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        if (!currentUser?.id) {
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`http://localhost:9999/orders/history/${currentUser.id}`);
            if (!res.ok) {
                throw new Error('Failed to fetch orders');
            }
            const data = await res.json();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            setError("Có lỗi xảy ra khi tải danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    const handleReturnRequest = async (orderId) => {
        try {
            if (!currentUser?.id) {
                alert("Vui lòng đăng nhập để gửi yêu cầu hoàn trả!");
                return;
            }

            const reason = prompt("Nhập lý do hoàn trả:");
            if (!reason) return;

            const response = await fetch(`http://localhost:9999/orders/${orderId}/return-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    reason: reason
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Gửi yêu cầu hoàn trả thành công!');
                fetchOrders();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Lỗi khi gửi yêu cầu hoàn trả:', error);
            alert('Có lỗi xảy ra khi gửi yêu cầu hoàn trả: ' + error.message);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [currentUser]);

    if (!currentUser?.id) {
        return (
            <div className="text-center py-20">
                Vui lòng <span onClick={() => navigate("/auth")} className="text-blue-500 underline cursor-pointer">đăng nhập</span> để xem đơn hàng.
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
                <TestOrder onOrderCreated={fetchOrders} />
                <div id="OrdersPage" className="mt-4 max-w-[1200px] mx-auto px-2 min-h-[50vh]">
                    <div className="bg-white w-full p-6 min-h-[150px]">
                        <div className="flex items-center text-xl">
                            <Truck className="text-green-500" size={35} />
                            <span className="pl-4">Đơn hàng của tôi</span>
                        </div>

                        {loading ? (
                            <div className="text-center py-20 text-gray-500">Đang tải...</div>
                        ) : error ? (
                            <div className="text-center py-20 text-red-500">{error}</div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-20">Bạn chưa có đơn hàng nào</div>
                        ) : (
                            <div className="space-y-4 mt-4">
                                {orders.map((order) => (
                                    <div key={order.id || order._id} className="border rounded-lg p-4">
                                        <div className="flex justify-between mb-2">
                                            <div>
                                                <span className="font-bold">Mã đơn hàng:</span> {order.order_id}
                                            </div>
                                            <div>
                                                <span className="font-bold">Ngày đặt:</span>{" "}
                                                {moment(order.order_date).format("DD/MM/YYYY HH:mm")}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="font-bold">Trạng thái:</span>{" "}
                                            <span className={`${
                                                order.status === "completed" ? "text-green-600" :
                                                order.status === "processing" ? "text-blue-600" :
                                                order.status === "cancelled" ? "text-red-600" :
                                                "text-gray-600"
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="font-bold">Tổng tiền:</span> ${order.total_price}
                                        </div>
                                        {order.items && (
                                            <div className="mt-2">
                                                {order.items.map((item, index) => (
                                                    <div key={index} className="flex items-center gap-4 mt-2">
                                                        <div>{item.product?.name || item.product_name}</div>
                                                        <div>x{item.quantity}</div>
                                                        <div>${item.price || item.unitPrice}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <Footer />
                </div>
            </div>
        </>
    )
}

