const express = require('express');
const { payAmount, getAllTransaction } = require('../controllers/transactionController');

const router = express.Router();

router.post('/transaction/payAmount', payAmount);
router.get('/transaction/getAllTransaction', getAllTransaction);

module.exports = {
    routes: router
}