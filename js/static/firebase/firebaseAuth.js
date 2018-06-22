const fb = require("./firebase");
const firebaseAuth = fb.firebaseAuth;

exports = module.exports

//sign up
exports.createUser = (email, password) => 
    firebaseAuth.createUserWithEmailAndPassword(email, password);

    //sign up
exports.currentUser = firebaseAuth.currentUser;

//sign in
exports.signInUser = (email, password) => 
    firebaseAuth.signInWithEmailAndPassword(email, password);

//sign out
exports.signOutUser = () => firebaseAuth.signOut();

//reset password
exports.passwordReset = (email) => 
    firebaseAuth.sendPasswordResetEmail(email);

//change passward
exports.passwordChange = (password) => 
    firebaseAuth.currentUser.updatePassword(password);