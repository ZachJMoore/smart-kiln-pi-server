const firebaseAuth = require("./firebaseAuth");
const fb = require("./firebase");
const firebase = fb.firebase;
const config = require("../../../config");
const loginInfo = config.user;

//sign into firebase
let authUser = null
if (!firebaseAuth.currentUser){
    firebaseAuth.signInUser(loginInfo.email, loginInfo.password)
    .then(user=>{
        console.log("login success")
        console.log(user.email)
    })
    .catch(err=>{
        reject({
            error: true,
            message: "could not sign in"
        })
        console.log("Error signing in: ", err.code)
    })
}

const waitForLogin = ()=>{
    return new Promise((resolve, reject)=>{
        firebase.auth().onAuthStateChanged(user => {
            if (user !== null) {
                authUser = user
                // console.log("user signed in")
                resolve(user)
            } else {
                // console.log("user signed out")
            }
        })
    })
}

module.exports = waitForLogin