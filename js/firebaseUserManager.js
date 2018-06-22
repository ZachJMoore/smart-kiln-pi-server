const firebaseAuth = require("./static/firebase/firebaseAuth");
const fb = require("./static/firebase/firebase");
const firebase = fb.firebase;
const config = require("./static/config");
const loginInfo = config.user;

//sign into firebase

const waitForLogin = ()=>{
    return new Promise((resolve, reject)=>{
        if (!firebaseAuth.currentUser){
            firebaseAuth.signInUser(loginInfo.email, loginInfo.password)
            .then(user=>{
                console.log("login success")
            })
            .catch(err=>{
                reject({
                    error: true,
                    message: "could not sign in"
                })
                console.log("Error signing in: ", err.code)
            })
        }
        firebase.auth().onAuthStateChanged(authUserO => {
            if (authUserO !== null) {
                console.log(authUserO.email)
                resolve(authUser)
            } else {
                console.log("user signed out")
            }
            authUser = authUserO
        })
    })
}

module.exports = waitForLogin