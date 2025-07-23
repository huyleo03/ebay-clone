import React from 'react';

export default function TestOrder({ onOrderCreated }) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  const createTestOrder = async () => {
    try {
      if (!currentUser?.id) {
        alert("Vui lòng đăng nhập để tạo đơn hàng!");
        return;
      }

      const response = await fetch('http://localhost:9999/orders/create-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buyerId: currentUser.id
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Tạo đơn hàng test thành công!');
        if (onOrderCreated) {
          onOrderCreated(); // Gọi callback function nếu được truyền vào
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng test:', error);
      alert('Có lỗi xảy ra khi tạo đơn hàng test: ' + error.message);
    }
  };

  return (
    <button
      onClick={createTestOrder}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
    >
      Tạo đơn hàng test
    </button>
  );
}