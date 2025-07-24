import React from "react";
import axios from "axios";

function PayPalButton({ cart, addressId, buyerId }) {
  const handlePayPal = async () => {
    try {
      // Gửi đơn hàng lên backend để lấy approvalUrl
      const res = await axios.post("http://localhost:9999/orders/create", {
        buyerId,
        addressId,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      });
      // Chuyển hướng sang PayPal
      window.location.href = res.data.approvalUrl;
    } catch (err) {
      alert("Lỗi khi tạo đơn hàng: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <button onClick={handlePayPal} style={{ background: "#ffc439", border: "none", padding: "10px 20px", borderRadius: "5px" }}>
      Thanh toán với PayPal
    </button>
  );
}

export default PayPalButton;