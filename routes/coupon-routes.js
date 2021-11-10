const express = require('express');
const { generateCoupon, getCoupons, invalidateCoupon, deleteCoupon, useCoupon } = require('../controllers/couponController');

const router = express.Router();

router.get('/coupon/generate', generateCoupon);
router.get('/coupon', getCoupons);
router.patch('/coupon/invalidate/:id', invalidateCoupon);
router.delete('/coupon/:id', deleteCoupon);
router.get('/coupon/use/:code', useCoupon);

module.exports = {
    routes: router
}