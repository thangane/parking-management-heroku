const express = require('express');
const { updateParkingCharges, getParkingCharges } = require('../controllers/parkingChargesController');

const router = express.Router();

router.get('/parkingCharges', getParkingCharges);
router.post('/parkingCharges', updateParkingCharges);

module.exports = {
    routes: router
}