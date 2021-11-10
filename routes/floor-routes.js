const express = require('express');
const { addFloor, getFloor, updateFloor, deleteFloor, getAllFloors, getFloorVacancy, checkIfSettingsExist } = require('../controllers/floorController');

const router = express.Router();

router.post('/floor', addFloor);
router.get('/floor/:id', getFloor);
router.patch('/floor/:id', updateFloor);
router.delete('/floor/:id', deleteFloor);
router.get('/floors', getAllFloors);
router.get('/floor/vacant/:entryTime', getFloorVacancy);
router.get('/floors/checkSettings', checkIfSettingsExist);

module.exports = {
    routes: router
}