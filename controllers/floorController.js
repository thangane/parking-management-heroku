'use strict';

const firebase = require('../database');
const Vacant = require('../models/vacant');
const Floor = require('../models/floor');
const { omit } = require('../controllers/commonUtil');
const firestore = firebase.firestore();

const parkingTicketsCollection = 'parkingTickets';
const vacancyKey = 'vacancy';
const parkingChargesCollection = 'parkingCharges';
const parkingDocumentId = 'parking-charges';

const addFloor = async (req, res, next) => {
    try {
        const params = req.body;
        const data = {
            ...params,
            createdAt: new Date().getTime().toString()
        };
        await firestore.collection('floors').doc().set(data);
        res.send(true);
    } catch (error) {
        res.status(400).send(error.message);
    }
}

const updateFloor = async (req, res, next) => {
    try {
        const param = req.body;
        const id = req.param('id');
        await firestore.collection('floors').doc(id).update(omit('id', param));
        res.send(true);
    } catch (error) {
        res.status(400).send(error.message);
    }
}

const getFloor = async (req, res, next) => {
    try {
        const id = req.param('id');
        const doc = await firestore.collection('floors').doc(id).get();
        if (!doc.exists) {
            res.status(404).send('No record found');
        } else {
            const floor = new Floor(
                doc.id,
                doc.data().name,
                doc.data().totalSpaces,
                doc.data().carSpace,
                doc.data().bikeSpace,
                doc.data().busSpace,
                doc.data().createdAt
            );
            res.send(floor);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
}

const deleteFloor = async (req, res, next) => {
    try {
        const id = req.param('id');
        await firestore.collection('floors').doc(id).delete();
        res.send(true);
    } catch (error) {
        res.status(400).send(error.message);
    }
}

const checkIfSettingsExist = async (req, res, next) => {
    try {
        const floors = firestore.collection('floors');
        const data = await floors.get();
        if (data.empty) {
            return res.status(404).send('No records found');
        }
        const doc = await firestore.collection(parkingChargesCollection).doc(parkingDocumentId).get();
        if (!doc.exists) {
            return res.status(404).send('No record found');
        }
        return res.status(200).send(true);
    } catch (error) {
        return res.status(400).send(error.message);
    }
}

const getAllFloors = async (req, res, next) => {
    try {
        const floors = await firestore.collection('floors');
        const data = await floors.get();
        const floorsArray = [];
        if (data.empty) {
            res.status(404).send('No records found');
        } else {
            data.forEach(doc => {
                const floor = new Floor(
                    doc.id,
                    doc.data().name,
                    doc.data().totalSpaces,
                    doc.data().carSpace,
                    doc.data().bikeSpace,
                    doc.data().busSpace,
                    doc.data().createdAt
                );
                floorsArray.push(floor);
            });
            res.send(floorsArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
}

const getFloorVacancy = async (req, res, next) => {
    try {
        const entryTime = parseInt(req.param('entryTime'));
        const entryDate = trimSpace(new Date(entryTime).toDateString());
        const docRef = firestore.collection(parkingTicketsCollection).doc(entryDate)
        const ticketData = await docRef.get();
        const floorIds = ticketData.data().floorIds;
        const vancancyDatabyFloors = {};
        for (const index in floorIds) {
            const vacancyDoc = await docRef.collection(floorIds[index]).doc(vacancyKey).get();
            const vacancyData = vacancyDoc.data();
            vancancyDatabyFloors[floorIds[index]] = vacancyData;
        }
        const floorsList = await getFloors();
        const resultArray = [];
        floorsList.forEach(floor => {
            if (vancancyDatabyFloors[floor.id]) {
                resultArray.push(new Vacant(
                    floor.id,
                    floor.name,
                    floor.totalSpaces,
                    floor.carSpace,
                    floor.bikeSpace,
                    floor.busSpace,
                    vancancyDatabyFloors[floor.id].CAR.toString(),
                    vancancyDatabyFloors[floor.id].BIKE.toString(),
                    vancancyDatabyFloors[floor.id].BUS.toString(),
                    floor.createdAt
                ));
            } else {
                resultArray.push(new Vacant(
                    floor.id,
                    floor.name,
                    floor.totalSpaces,
                    floor.carSpace,
                    floor.bikeSpace,
                    floor.busSpace,
                    floor.carSpace,
                    floor.bikeSpace,
                    floor.busSpace,
                    floor.createdAt
                ));
            }
        });
        return res.status(200).send(resultArray);
    } catch (error) {
        res.status(400).send(error.message);
    }

}


const getFloors = async () => {
    const floors = firestore.collection('floors');
    const data = await floors.get();
    const floorsArray = []
    if (data.empty) {
        return floorsArray;
    } else {
        data.forEach(doc => {
            const floor = new Floor(
                doc.id,
                doc.data().name,
                doc.data().totalSpaces,
                doc.data().carSpace,
                doc.data().bikeSpace,
                doc.data().busSpace,
                doc.data().createdAt
            );
            floorsArray.push(floor);
        });
        return floorsArray;
    }
}


const trimSpace = (input) => {
    return input.replace(/\s+/g, '');
}

module.exports = {
    addFloor,
    getFloor,
    updateFloor,
    deleteFloor,
    getAllFloors,
    getFloorVacancy,
    checkIfSettingsExist
}