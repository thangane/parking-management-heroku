const admin = require('firebase-admin');
var serviceAccount = require("./serviceAccountKey.json");

const database = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });;

module.exports = database;



