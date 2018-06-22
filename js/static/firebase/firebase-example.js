const firebase = require("firebase");
let config = {
    apiKey: "YourKey",
    authDomain: "Domain",
    databaseURL: "DatabaseUrl",
    projectId: "projectID",
    storageBucket: "storageBucket",
    messagingSenderId: "SenderID"
};
firebase.initializeApp(config);

const firebaseAuth = firebase.auth()
const firebaseDB = firebase.database()

module.exports = {
    firebase,
    firebaseAuth,
    firebaseDB
} 