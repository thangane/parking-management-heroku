const express = require('express');
const { generateTicket,
    checkIfEntryExists,
    getReservationDetails,
    getParkingTicketById,
    calculatePrice,
    payAmount,
    getAllTransaction,
    deleteReservation } = require('../controllers/parkingTicketController');

const router = express.Router();

router.post('/parkingTicket/generate', generateTicket);
router.get('/parkingTicket/:id', getParkingTicketById);
router.post('/parkingTicket/checkIfEntryExists/:entryTime', checkIfEntryExists);
router.get('/parkingTicket/getReservationDetails/:entryTime', getReservationDetails);
router.post('/parkingTicket/calculatePrice', calculatePrice);
router.post('/parkingTicket/payAmount', payAmount);
router.get('/getAllTransaction', getAllTransaction);
router.delete('/parkingTicket/:id', deleteReservation);


module.exports = {
    routes: router
}