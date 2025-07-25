const express = require("express");
const router = express.Router();
const db = require("../models");
const paypal = require('@paypal/checkout-server-sdk');
const mongoose = require('mongoose');

const environment = new paypal.core.SandboxEnvironment(
  'ATtgmc45wVQDO2Ddh-5jXzjzOctPod7zKsYNgBF-H_gHkPO-jHpKdOVT4ducL9_fZ7xoXQO7JKTPikDM',
  'EMbCQaFDnhK2zd90S-X7E40IHmC5hqzXWYZWr4imVRkQbEZLzQ_J_x-8pXD5-9wp5KAbQPO90U4wIUiJ'
);
const client = new paypal.core.PayPalHttpClient(environment);

// Lấy danh sách tất cả đơn hàng
router.get("/", async (req, res) => {
  try {
    const orders = await db.Order.find()
      .populate("buyerId")
      .populate("addressId")
      .sort({ orderDate: -1 });

    if (!orders || orders.length === 0) {
      return res.status(200).json({ message: "Không tìm thấy đơn hàng nào" });
    }

    const orderPromises = orders.map(async (order) => {
      const orderItems = await db.OrderItem.find({ orderId: order._id })
        .populate("productId");

      // Kiểm tra xem buyerId và addressId có tồn tại không
      const buyer = order.buyerId ? {
        id: order.buyerId._id,
        name: order.buyerId.username || "Không xác định"
      } : {
        id: "Không xác định",
        name: "Không xác định"
      };
      console.log(buyer);

      const address = order.addressId ? {
        fullName: order.addressId.fullname || "Không xác định",
        phone: order.addressId.phone || "Không xác định",
        street: order.addressId.street || "Không xác định",
        city: order.addressId.city || "Không xác định",
        state: order.addressId.state || "Không xác định",
        country: order.addressId.country || "Không xác định"
      } : {
        fullName: "Không xác định",
        phone: "Không xác định",
        street: "Không xác định",
        city: "Không xác định",
        state: "Không xác định",
        country: "Không xác định"
      };

      return {
        order_id: order._id,
        buyer,
        address,
        total_price: order.totalPrice,
        status: order.status,
        order_date: order.orderDate,
        items: orderItems.map(item => {
          const product = item.productId ? {
            id: item.productId._id,
            name: item.productId.title || "Không xác định",
            price: item.unitPrice,
            images: item.productId.images || []
          } : {
            id: "Không xác định",
            name: "Không xác định",
            price: item.unitPrice,
            images: []
          };

          return {
            product,
            quantity: item.quantity,
            total: item.unitPrice * item.quantity
          };
        })
      };
    });

    const formattedOrders = await Promise.all(orderPromises);
    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// Lấy lịch sử đơn hàng của user
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Tìm các đơn hàng của user theo buyerId
    const orders = await db.Order.find({ buyerId: userId })
      .populate('addressId')  // Chỉ populate addressId vì đó là trường có trong schema
      .sort({ orderDate: -1 });

    if (!orders) {
      return res.json([]);
    }

    // Với mỗi order, tìm các orderItems tương ứng
    const formattedOrders = await Promise.all(orders.map(async (order) => {
      // Tìm orderItems cho order này và populate productId để lấy thông tin sản phẩm
      const orderItems = await db.OrderItem.find({ orderId: order._id })
        .populate({
          path: 'productId',
          select: 'title images' // Chỉ lấy title và images từ Product
        });

      return {
        id: order._id,
        buyerId: order.buyerId,
        addressId: {
          fullName: order.addressId?.fullname,
          phone: order.addressId?.phone,
          street: order.addressId?.street,
          city: order.addressId?.city,
          state: order.addressId?.state,
          country: order.addressId?.country
        },
        orderDate: order.orderDate,
        totalPrice: order.totalPrice,
        status: order.status,
        // Map các orderItems thành format mong muốn
        items: orderItems.map(item => {
          // Xử lý URL ảnh với kích thước
          const imageUrls = item.productId?.images?.map(url => `${url}/190`) || [];
          
          return {
            id: item._id,
            orderId: item.orderId,
            productId: item.productId?._id,
            product_name: item.productId?.title || "Unknown Product",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            images: imageUrls, // URL ảnh đã được thêm kích thước
            product: item.productId ? {
              title: item.productId.title,
              images: imageUrls // URL ảnh đã được thêm kích thước
            } : null
          };
        })
      };
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Lấy chi tiết đơn hàng theo order_id
router.get("/detail/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ message: "Thiếu order_id" });
    }

    const order = await db.Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const orderDetail = {
      order_id: order._id,
      order_date: order.createdAt,
      items: order.items.map(item => ({
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price
      })),
      total_amount: order.totalAmount,
      status: order.status
    };

    res.status(200).json(orderDetail);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// Lấy trạng thái đơn hàng
router.get("/status/:orderId", async (req, res) => {
  try {
    const order = await db.Order.findById(new mongoose.Types.ObjectId(req.params.orderId))
      .select("status orderDate");
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hủy đơn hàng
router.patch("/:id/cancel", async (req, res) => {
  try {
    const order = await db.Order.findById(new mongoose.Types.ObjectId(req.params.id));
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.status === "completed" || order.status === "cancelled") {
      return res.status(400).json({ message: "Không thể hủy đơn hàng này" });
    }

    order.status = "cancelled";
    await order.save();

    res.status(200).json({ message: "Đã hủy đơn hàng thành công", status: order.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", async (req, res) => {
  const { buyerId, addressId, items, shippingMethod } = req.body;

  const feeShipping = shippingMethod === "standard" ? 500 : 1500;

  try {
    if (!buyerId || !addressId || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Thiếu thông tin đặt hàng");
    }

    // Validate buyerId
    const buyer = await db.User.findById(buyerId);
    if (!buyer) {
      throw new Error("Người mua không tồn tại");
    }

    // Validate addressId
    const address = await db.Address.findOne({ _id: addressId, userId: buyerId });
    if (!address) {
      throw new Error("Địa chỉ không tồn tại hoặc không thuộc về người mua");
    }

    const orderItems = await Promise.all(
      items.map(async (item) => {
        if (!item.productId || !item.quantity || item.quantity < 1) {
          throw new Error("Thông tin sản phẩm không hợp lệ");
        }

        const product = await db.Product.findById(item.productId);
        if (!product) {
          throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại`);
        }

        const unitPrice = typeof item.price === "number" ? item.price : product.price;

        const orderItem = new db.OrderItem({
          orderId: null,
          productId: new mongoose.Types.ObjectId(item.productId),
          quantity: item.quantity,
          unitPrice: unitPrice,
        });

        return orderItem;
      })
    );

const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalPrice = ((totalAmount + feeShipping) / 100).toFixed(2);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      application_context: {
        return_url: `http://localhost:9999/orders/success`,
        cancel_url: "http://localhost:9999/orders/cancel",
      },
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: ((totalAmount + feeShipping) / 100).toFixed(2), // ĐÃ CỘNG PHÍ SHIP!
          },
        },
      ],
    });

    const paypalOrder = await client.execute(request);

    if (paypalOrder.statusCode !== 201) {
      throw new Error("Lỗi khi tạo đơn hàng PayPal");
    }

    const newOrder = await db.Order.create({
      buyerId: new mongoose.Types.ObjectId(buyerId),
      addressId: new mongoose.Types.ObjectId(addressId),
      orderDate: new Date(),
      totalPrice: totalPrice,
      status: "shipping",
      paypalOrderId: paypalOrder.result.id,
      items: orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    // Lưu các orderItem
    await Promise.all(
      orderItems.map(async (item) => {
        item.orderId = newOrder._id;
        await item.save();
      })
    );

    const approvalUrl = paypalOrder.result.links.find(
      (link) => link.rel === "approve"
    ).href;

    res.status(200).json({
      message: "Đã tạo đơn hàng thành công",
      order_id: newOrder._id,
      paypal_order_id: paypalOrder.result.id,
      approvalUrl,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
  }
});

router.get("/success", async (req, res) => {
  const { token, PayerID } = req.query;

  if (!token || !PayerID) {
    return res.status(400).json({ message: "Thiếu thông tin PayPal" });
  }

  try {
    console.log("PayPal Token:", token);

    const order = await db.Order.findOne({ paypalOrderId: token }); // Bỏ .session(session)
    if (!order) throw new Error("Không tìm thấy đơn hàng tương ứng");

    if (order.status !== "shipping") {
      throw new Error("Đơn hàng đã được xử lý hoặc có trạng thái không hợp lệ");
    }

    const orderItems = await db.OrderItem.find({ orderId: order._id })
      .populate('productId', 'title price images');
      // Bỏ .session(session)
    if (!orderItems || orderItems.length === 0) {
      throw new Error("Không tìm thấy sản phẩm nào trong đơn hàng");
    }

    console.log("Fetched OrderItems in /success:", orderItems);

    for (const item of orderItems) {
      const product = await db.Product.findById(item.productId); // Bỏ .session(session)
      if (!product) throw new Error(`Sản phẩm ID ${item.productId} không tồn tại`);

      if (product.quantity < item.quantity) {
        throw new Error(
          `Không đủ hàng cho sản phẩm ${product.name}. Còn: ${product.quantity}, yêu cầu: ${item.quantity}`
        );
      }

      product.quantity -= item.quantity;
      await product.save(); // Bỏ { session }
    }

    order.status = "completed";
    order.paymentDate = new Date();
    await order.save(); // Bỏ { session }
    const frontendSuccessUrl = `http://localhost:3000/success?orderId=${order._id}`;
    return res.redirect(frontendSuccessUrl);
  } catch (error) {
    console.error("SUCCESS ORDER ERROR:", error);

    // Redirect to an error page or the checkout page with an error message
    const frontendErrorUrl = `http://localhost:3000/checkout?error=${encodeURIComponent(error.message)}`;
    return res.redirect(frontendErrorUrl);
  }
});


// router.get("/success", async (req, res) => {
//   const { token, PayerID } = req.query;

//   if (!token || !PayerID) {
//     return res.status(400).json({ message: "Thiếu thông tin PayPal" });
//   }

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     console.log("PayPal Token:", token);

//     const order = await db.Order.findOne({ paypalOrderId: token }).session(session);
//     if (!order) throw new Error("Không tìm thấy đơn hàng tương ứng");

//     if (order.status !== "shipping") {
//       throw new Error("Đơn hàng đã được xử lý hoặc có trạng thái không hợp lệ");
//     }

//     const orderItems = await db.OrderItem.find({ orderId: order._id })
//       .populate('productId', 'title price images')
//       .session(session);
//     if (!orderItems || orderItems.length === 0) {
//       throw new Error("Không tìm thấy sản phẩm nào trong đơn hàng");
//     }

//     console.log("Fetched OrderItems in /success:", orderItems);

//     for (const item of orderItems) {
//       const product = await db.Product.findById(item.productId).session(session);
//       if (!product) throw new Error(`Sản phẩm ID ${item.productId} không tồn tại`);

//       if (product.quantity < item.quantity) {
//         throw new Error(
//           `Không đủ hàng cho sản phẩm ${product.name}. Còn: ${product.quantity}, yêu cầu: ${item.quantity}`
//         );
//       }

//       product.quantity -= item.quantity;
//       await product.save({ session });
//     }

//     order.status = "completed";
//     order.paymentDate = new Date();
//     await order.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     // Redirect to the frontend /success page with the orderId as a query parameter
//     const frontendSuccessUrl = `http://localhost:3000/success?orderId=${order._id}`;
//     return res.redirect(frontendSuccessUrl);
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("SUCCESS ORDER ERROR:", error);

//     // Redirect to an error page or the checkout page with an error message
//     const frontendErrorUrl = `http://localhost:3000/checkout?error=${encodeURIComponent(error.message)}`;
//     return res.redirect(frontendErrorUrl);
//   }
// });


// router.post("/create-test", async (req, res) => {
//   try {
//     const { buyerId } = req.body;
    
//     if (!buyerId) {
//       return res.status(400).json({ message: "Thiếu thông tin người mua" });
//     }

//     // Tạo địa chỉ mới cho đơn hàng test
//     const testAddress = new db.Address({
//       userId: buyerId,
//       fullName: "Test User",
//       phone: "0123456789",
//       street: "Test Street",
//       city: "Test City",
//       state: "Test State",
//       country: "Test Country"
//     });
//     await testAddress.save();

//     // Tạo đơn hàng test
//     const testOrder = new db.Order({
//       buyerId: buyerId,
//       addressId: testAddress._id,
//       orderDate: new Date(),
//       totalPrice: 350, // 2 * 100 + 1 * 150
//       status: "chờ xử lý"
//     });

//     await testOrder.save();
//     // Tạo các order items
//     const orderItems = [
//       {
//         orderId: testOrder._id,
//         productId: "6801ee3b608e45c74d616947",
//         quantity: 2,
//         unitPrice: 750
//       },
//       {
//         orderId: testOrder._id,
//         productId: "6801ee3b608e45c74d616945",
//         quantity: 1,
//         unitPrice: 1200
//       }
//     ];

//     await db.OrderItem.insertMany(orderItems);

//     res.status(201).json({
//       message: "Tạo đơn hàng test thành công",
//       order: {
//         ...testOrder.toObject(),
//         items: orderItems
//       }
//     });
//   } catch (error) {
//     console.error("Lỗi khi tạo đơn hàng test:", error);
//     res.status(500).json({ message: "Lỗi server", error: error.message });
//   }
// });

router.post("/:orderId/return-request", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, reason } = req.body;

    // Kiểm tra order tồn tại
    const order = await db.Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    if (order.status !== "completed") {
      return res.status(400).json({ message: "Đơn hàng không đủ điều kiện để hoàn trả" });
    }
    // Tạo return request
    const returnRequest = new db.ReturnRequest({
      orderId,
      userId,
      reason,
      status: "pending",
      createdAt: new Date()
    });

    await returnRequest.save();

    // Cập nhật trạng thái đơn hàng
    order.status = "return_requested";
    await order.save();

    res.status(201).json({
      message: "Tạo yêu cầu hoàn trả thành công",
      returnRequest
    });
  } catch (error) {
    console.error("Lỗi khi tạo yêu cầu hoàn trả:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

module.exports = router;