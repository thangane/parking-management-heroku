'use strict';

const firebase = require('../database');
const ParkingCharges = require('../models/parkingCharges');
const firestore = firebase.firestore();

const collection = 'parkingCharges';
const documentId = 'parking-charges';


const getParkingCharges = async (req, res, next) => {
    try {
        const doc = await firestore.collection(collection).doc(documentId).get();
        if (!doc.exists) {
            res.status(404).send('No record found');
        } else {
            const data = new ParkingCharges(
                doc.data().firstHourCharge,
                doc.data().laterHourCharge
            );
            res.send(data);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
}


const updateParkingCharges = async (req, res, next) => {
    try {
        const param = req.body;
        await firestore.collection(collection).doc(documentId).set(param);
        res.send(param);
    } catch (error) {
        res.status(400).send(error.message);
    }
}


module.exports = {
    getParkingCharges,
    updateParkingCharges,
}