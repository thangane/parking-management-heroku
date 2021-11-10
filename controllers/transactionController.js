'use strict';

const firebase = require('../database');
const firestore = firebase.firestore();

const tranactionCollection = 'transaction';
const parkingTicketsIndexCollection = 'parkingTicketsIndex';
const parkingTicketsCollection = 'parkingTickets';
const vacancyKey = 'vacancy';


const payAmount = async (req, res, next) => {
    try {
        const ticketData = req.body;
        const ticketsIndexDocRef = firestore.collection(parkingTicketsIndexCollection).doc(ticketData.id);
        const ticketsIndexDoc = await ticketsIndexDocRef.get()
        if (!ticketsIndexDoc.exists) {
            return res.status(400).send('Index data does not exits');
        } else {
            await ticketsIndexDocRef.update({ 'paid': true });
            await firestore.collection(tranactionCollection).doc().set(ticketData);
            const indexData = ticketsIndexDoc.data();
            const allotedFloorRef = firestore.collection(parkingTicketsCollection)
                .doc(indexData.entryDate)
                .collection(indexData.allotedFloorId)
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



module.exports = {
    payAmount,
    getAllTransaction
}