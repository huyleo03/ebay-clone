const express = require('express');
const router = express.Router();
const Coupon = require('../models/coupon.js');

// Tạo mã giảm giá mới
router.post('/create', async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountValue,
            minPurchaseAmount,
            maxDiscountAmount,
            startDate,
            endDate,
            usageLimit
        } = req.body;

        // Kiểm tra mã đã tồn tại chưa
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ message: 'Mã giảm giá đã tồn tại' });
        }

        const coupon = new Coupon({
            code,
            discountType,
            discountValue,
            minPurchaseAmount,
            maxDiscountAmount,
            startDate,
            endDate,
            usageLimit
        });

        await coupon.save();
        res.status(201).json({ message: 'Tạo mã giảm giá thành công', coupon });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Lấy danh sách mã giảm giá
router.get('/', async (req, res) => {
    try {
        const coupons = await Coupon.find().lean();
        res.json(coupons);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách mã giảm giá:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Lấy thông tin một mã giảm giá
router.get('/:code', async (req, res) => {
    try {
        const coupon = await Coupon.findOne({ code: req.params.code });
        if (!coupon) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
        }
        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Cập nhật mã giảm giá
router.put('/:id', async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!coupon) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
        }
        res.json({ message: 'Cập nhật thành công', coupon });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Xóa mã giảm giá
router.delete('/:id', async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
        }
        res.json({ message: 'Xóa mã giảm giá thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Kiểm tra và áp dụng mã giảm giá
router.post('/apply', async (req, res) => {
    try {
        const { code, productId } = req.body;
        const coupon = await Coupon.findOne({ code });

        if (!coupon) {
            return res.status(404).json({ message: 'Mã giảm giá không hợp lệ' });
        }

        // Kiểm tra thời hạn
        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate) {
            return res.status(400).json({ message: 'Mã giảm giá không trong thời gian hiệu lực' });
        }

        // Kiểm tra sản phẩm
        if (coupon.productId && coupon.productId.toString() !== productId) {
            return res.status(400).json({ message: 'Mã giảm giá không áp dụng cho sản phẩm này' });
        }

        res.json({
            message: 'Áp dụng mã giảm giá thành công',
            couponDetails: {
                code: coupon.code,
                discountPercent: coupon.discountPercent,
                productId: coupon.productId
            }
        });
    } catch (error) {
        console.error('Lỗi khi áp dụng mã giảm giá:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Tìm mã giảm giá theo productId
router.get('/product/:productId', async (req, res) => {
    try {
        const coupons = await Coupon.find({ productId: req.params.productId });
        if (!coupons || coupons.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá cho sản phẩm này' });
        }
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

module.exports = router;
