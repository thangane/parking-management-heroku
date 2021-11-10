'use strict';

const firebase = require('../database');
const Coupon = require('../models/coupon');
const { omit } = require('./commonUtil');
const firestore = firebase.firestore();

const randomInput = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const collection = 'coupons';

const randomString = (length, chars) => {
    let result = '';
    for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

const generateCoupon = async (req, res, next) => {
    let batch = firestore.batch();
    try {
        const count = parseInt(req.query.count);
        const startAt = parseInt(req.query.startAt);
        const endAt = parseInt(req.query.endAt);
        const startAtDate = new Date(startAt);
        const endAtDate = new Date(endAt);
        for (let i = 0; i < count; i++) {
            const code = randomString(5, randomInput);
            var docRef = firestore.collection(collection).doc();
            batch.set(docRef, {
                code: code,
                startAt: startAt,
                endAt: endAt,
                startAtDate: startAtDate,
                endAtDate: endAtDate,
                invalidated: false,
                used: false
            })
        }
        await batch.commit();
        return getCoupons(req, res, next);
    } catch (error) {
        res.status(400).send(error.message); l
    }
}

const invalidateAllUnused = async (req, res, next) => {
    const coupons = await firestore.collection(collection);
    const data = await coupons.get();
    if (!data.empty) {
        let expiredIds = [];
        data.forEach(doc => {
            if (parseInt(doc.data().endAt) < new Date().getTime() && !doc.data().used) {
                expiredIds.push(doc.id)
            }
        });
        if (expiredIds.length > 0) {
            let batch = firestore.batch();
            for (const index in expiredIds) {
                var docRef = firestore.collection(collection).doc(expiredIds[index]);
                batch.update(docRef, { invalidated: true })
            }
            await batch.commit();
        }
    }

}

const getCoupons = async (req, res, next) => {
    try {
        await invalidateAllUnused(req, res, next);
        const coupons = await firestore.collection(collection);
        const data = await coupons.get();
        const couponsArray = [];
        if (data.empty) {
            res.status(404).send('No records found');
        } else {
            data.forEach(doc => {
                const coupon = new Coupon(
                    doc.id,
                    doc.data().code,
                    doc.data().startAt,
                    doc.data().endAt,
                    doc.data().used,
                    doc.data().invalidated,
                );
                couponsArray.push(coupon);
            });
            return res.send(couponsArray);
        }
    } catch (error) {
        return res.status(400).send(error.message);
    }
}

const useCoupon = async (req, res, next) => {
    try {
        const code = req.param('code');
        const querySnapshot = await firestore.collection(collection).where('code', '==', code)
            .where('used', '==', false).where('invalidated', '==', false).get();
        if (querySnapshot.empty) {
            return res.status(400).send('Coupon not available');
        }
        const docSnapshots = querySnapshot.docs;
        var couponData = docSnapshots[0].data();
        var couponId = docSnapshots[0].id;
        if (parseInt(couponData.endAt) < new Date().getTime()) {
            return res.status(400).send('Coupon expired');
        }
        await firestore.collection(collection).doc(couponId).update({
            used: true
        });
        const coupon = new Coupon(
            couponId,
            couponData.code,
            couponData.startAt,
            couponData.endAt,
            true,
            couponData.invalidated,
        );
        return res.status(200).send(coupon);
    } catch (error) {
        return res.status(400).send(error.message);
    }
}

const invalidateCoupon = async (req, res, next) => {
    try {
        const param = req.body;
        const id = req.param('id');
        await firestore.collection(collection).doc(id).update({
            invalidated: true
        });
        res.send(true);
    } catch (error) {
        res.status(400).send(error.message);
    }
}


const deleteCoupon = async (req, res, next) => {
    try {
        const id = req.param('id');
        await firestore.collection(collection).doc(id).delete();
        res.send(true);
    } catch (error) {
        res.status(400).send(error.message);
    }
}


module.exports = {
    generateCoupon,
    getCoupons,
    invalidateCoupon,
    deleteCoupon,
    useCoupon
}