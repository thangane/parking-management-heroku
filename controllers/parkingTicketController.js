'use strict';

const firebase = require('../database');
const firestore = firebase.firestore();
const Floor = require('../models/floor');
const { getAllFloors } = require('../controllers/floorController');
const ParkingTicket = require('../models/parkingTicket');
const ParkingTicketIndex = require('../models/parkingTicketIndex');


const parkingTicketsCollection = 'parkingTickets';
const vacancyKey = 'vacancy';
const ticketsKey = 'ticketsDoc';
const ticketsCollectionKey = 'ticketsCollection';
const parkingTicketsIndexCollection = 'parkingTicketsIndex';
const parkingChargesCollection = 'parkingCharges';
const parkingChargesDocumentId = 'parking-charges';
const tranactionCollection = 'transaction';


const generateTicket = async (req, res, next) => {
    try {
        const inputFloorId = req.body.floorId;
        const vehicleType = req.body.vehicleType;
        const vehicleNumber = req.body.vehicleNumber;
        const entryTime = parseInt(req.body.entryTime);
        const entryDate = trimSpace(new Date(entryTime).toDateString());
        const docRef = firestore.collection(parkingTicketsCollection).doc(entryDate)
        const ticketData = await docRef.get();
        if (!ticketData.exists) {
            return res.status(201).send('Entry not available for the date ', entryDate);
        } else {
            const floorIds = ticketData.data().floorIds;
            const vacantFloorIds = [];
            const vancancyDatabyFloors = {};
            for (const index in floorIds) {
                const vacancyDoc = await docRef.collection(floorIds[index]).doc(vacancyKey).get();
                const vacancyData = vacancyDoc.data();
                const vehicleVacancy = vacancyData[vehicleType];
                if (vehicleVacancy > 0) {
                    vacantFloorIds.push(floorIds[index]);
                    vancancyDatabyFloors[floorIds[index]] = vehicleVacancy;
                }
            }
            if (vacantFloorIds.length == 0) {
                return res.status(201).send('All floors housefull');
            }
            const allotedFloorId = inputFloorId ? inputFloorId : vacantFloorIds[0];
            const allotedFloorRef = docRef.collection(allotedFloorId);
            const floor = await getFloorById(allotedFloorId);
            const ticketId = generateTicketId(entryTime, vehicleType);
            const data = {
                'id': ticketId,
                'vehicleType': vehicleType,
                'vehicleNumber': vehicleNumber,
                'entryTime': entryTime,
                'allotedFloorId': floor.id,
                'allotedFloorName': floor.name
            }
            const ticketDocRef = allotedFloorRef.doc(ticketsKey);
            await ticketDocRef.set({ created: true });
            await ticketDocRef
                .collection(ticketsCollectionKey)
                .doc(ticketId).set(data);
            const allotedFloorVacancy = vancancyDatabyFloors[allotedFloorId];
            const updateData = {};
            updateData[vehicleType] = (allotedFloorVacancy - 1);
            await allotedFloorRef.doc(vacancyKey).update(updateData);
            await updateTicketIndexCollection(ticketId,
                { ticketId, vehicleType, entryDate, allotedFloorId }
            )
            return res.status(200).send(data);
        }
    } catch (error) {
        return res.status(400).send(error.message);
    }
}

const deleteReservation = async (req, res, next) => {
    try {
        const reservationId = req.param('id');
        const ticketsIndexDocRef = firestore.collection(parkingTicketsIndexCollection).doc(reservationId);
        const ticketsIndexDoc = await ticketsIndexDocRef.get()
        if (!ticketsIndexDoc.exists) {
            return res.status(400).send('Index data does not exits');
        } else {
            const indexData = ticketsIndexDoc.data();
            const allotedFloorRef = firestore.collection(parkingTicketsCollection)
                .doc(indexData.entryDate)
                .collection(indexData.allotedFloorId)
            await allotedFloorRef
                .doc(ticketsKey)
                .collection(ticketsCollectionKey)
                .doc(indexData.ticketId).delete();
            await ticketsIndexDocRef.delete();
            const vacancyDoc = await allotedFloorRef.doc(vacancyKey).get();
            const vacancyData = vacancyDoc.data();
            const updateData = {};
            const vehicleType = indexData.vehicleType;
            const vehicleVacancy = vacancyData[vehicleType];
            updateData[vehicleType] = (vehicleVacancy + 1);
            await allotedFloorRef.doc(vacancyKey).update(updateData);
            return res.status(200).send(true);
        }
    } catch (error) {
        return res.status(400).send(error.message);
    }
}


const getReservationDetails = async (req, res, next) => {
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
            resultArray.push(new Floor(
                floor.id,
                floor.name,
                floor.totalSpaces,
                vancancyDatabyFloors[floor.id].CAR.toString(),
                vancancyDatabyFloors[floor.id].BIKE.toString(),
                vancancyDatabyFloors[floor.id].BUS.toString(),
                floor.createdAt
            ));
        });
        return res.status(200).send(resultArray);
    } catch (error) {
        return res.status(400).send(error.message);
    }
}



const checkIfEntryExists = async (req, res, next) => {
    const entryTime = parseInt(req.param('entryTime'));
    const entryDate = trimSpace(new Date(entryTime).toDateString());
    try {
        const docRef = firestore.collection(parkingTicketsCollection).doc(entryDate)
        const entryDateData = await docRef.get();
        if (!entryDateData.exists) {
            let batch = firestore.batch();
            const floorsArray = await getFloors();
            if (floorsArray.length > 0) {
                const floorIds = floorsArray.map(floor => floor.id);
                await docRef.set({ 'floorIds': floorIds });
                for (const index in floorsArray) {
                    const floor = floorsArray[index];
                    var floorsCollectionRef = docRef.collection(floor.id).doc(vacancyKey);
                    const vacantData = {
                        'CAR': parseInt(floor.carSpace),
                        'BIKE': parseInt(floor.bikeSpace),
                        'BUS': parseInt(floor.busSpace)
                    }
                    batch.set(floorsCollectionRef, vacantData);
                }
                await batch.commit()
            }
        } else {
            console.log('data exists');
        }
        return res.status(200).send(true);
    } catch (error) {
        return res.status(400).send(error.message);
    }

}

const generateTicketId = (entryTime, vehicleType) => {
    const type = vehicleType.charAt(0) + vehicleType.charAt(1);
    const entryDateNumber = new Date(entryTime)
    const ticketNumer = entryDateNumber.getHours().toString() + entryDateNumber.getMinutes().toString() + entryDateNumber.getSeconds().toString();
    return type + ticketNumer;
}

const updateTicketIndexCollection = async (id, parkingTicketsIndex) => {
    const ticketsIndex = firestore.collection(parkingTicketsIndexCollection).doc(id);
    await ticketsIndex.set(parkingTicketsIndex);
}

const getParkingTicketById = async (req, res, next) => {
    try {
        const id = req.param('id');
        const ticketsIndexDoc = await firestore.collection(parkingTicketsIndexCollection).doc(id).get();
        if (!ticketsIndexDoc.exists) {
            return res.status(400).send('Index data does not exits');
        } else {
            const indexData = ticketsIndexDoc.data();
            if (indexData.paid) {
                return res.status(400).send('Already Paid');
            }
            const ticketData = await firestore.collection(parkingTicketsCollection)
                .doc(indexData.entryDate)
                .collection(indexData.allotedFloorId)
                .doc(ticketsKey)
                .collection(ticketsCollectionKey)
                .doc(indexData.ticketId).get();
            return res.status(200).send(ticketData.data());
        }
    } catch (error) {
        return res.status(400).send(error.message);
    }
}

const calculatePrice = async (req, res, next) => {
    try {
        const ticketData = req.body.ticketData;
        const couponData = req.body.couponData;
        const entryTime = parseInt(ticketData.entryTime);
        const exitTime = new Date().getTime();
        const difference = exitTime - new Date(entryTime).getTime();
        const mins = Math.round(difference / 60000);
        const totalHours = Math.ceil(mins / 60);
        const parkingChargesDoc = await firestore.collection(parkingChargesCollection).doc(parkingChargesDocumentId).get();
        if (!parkingChargesDoc.exists) {
            return res.status(400).send('Parking charges not defined');
        }
        const firstHourCharge = parkingChargesDoc.data().firstHourCharge;
        const laterHourCharge = parkingChargesDoc.data().laterHourCharge;
        const firstHourAmount = 1 * firstHourCharge;
        let remainingHoursAmount = 0;
        if (totalHours > 1) {
            remainingHoursAmount = (totalHours - 1) * laterHourCharge;
        }
        let totalDiscountedPrice = 0;
        if (couponData) {
            totalDiscountedPrice = (firstHourAmount * .50) + (remainingHoursAmount * .10);
        }
        const totalAmount = firstHourAmount + remainingHoursAmount;
        const netAmount = totalAmount - totalDiscountedPrice;
        let resultData = {
            'id': ticketData.id,
            'vehicleType': ticketData.vehicleType,
            'vehicleNumber': ticketData.vehicleNumber,
            'entryTime': ticketData.entryTime,
            'exitTime': exitTime,
            'parkingAmount': totalAmount,
            'allotedFloorId': ticketData.allotedFloorId,
            'allotedFloorName': ticketData.allotedFloorId,
            'discountedAmount': totalDiscountedPrice,
            'netAmount': netAmount,
            'allotedFloorId': ticketData.allotedFloorId,
            'allotedFloorName': ticketData.allotedFloorName
        }
        if (couponData) {
            resultData = {
                ...resultData,
                'couponId': couponData.id,
                'couponCode': couponData.code,
            }
        }
        return res.status(200).send(resultData);
    } catch (error) {
        return res.status(400).send(error.message);
    }
}

const payAmount = async (req, res, next) => {
    try {
        const ticketData = req.body;
        await firestore.collection(tranactionCollection).doc().set(ticketData);
        return res.status(200).send(true);
    } catch (error) {
        return res.status(400).send(error.message);
    }
}

const getAllTransaction = async (req, res, next) => {
    try {
        const ticketData = req.body.ticketData;
        const transactionData = await firestore.collection(tranactionCollection).get();
        const transactionArray = [];
        if (!transactionData.empty) {
            transactionData.forEach(doc => {
                transactionArray.push(doc.data());
            });
        }
        return res.status(200).send(transactionArray);
    } catch (error) {
        return res.status(400).send(error.message);
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

const getFloorById = async (id) => {
    const floor = firestore.collection('floors').doc(id);
    const doc = await floor.get();
    return new Floor(
        doc.id,
        doc.data().name,
        doc.data().totalSpaces,
        doc.data().carSpace,
        doc.data().bikeSpace,
        doc.data().busSpace,
        doc.data().createdAt
    );
}

const trimSpace = (input) => {
    return input.replace(/\s+/g, '');
}



module.exports = {
    generateTicket,
    checkIfEntryExists,
    getReservationDetails,
    getParkingTicketById,
    calculatePrice,
    payAmount,
    getAllTransaction,
    deleteReservation
}