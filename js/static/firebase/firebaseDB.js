const fb = require("./firebase");
const firebaseDB = fb.firebaseDB;
const config = require("../../../config");
const waitForLogin = require("./firebaseUserManager");

//sign into firebase
let authUser = null;
let kilnPath = "";
let metadata = {
    name: config.name,
    uuid: config.uuid
};
waitForLogin().then(user => {
    authUser = user
    kilnPath = `users/${authUser.uid}/kilns/${config.uuid}`
})

const userDB = {
    setName: (data, user = authUser)=>{
        if (user === null) return
        firebaseDB.ref(`users/${user.uid}/name`).set(data)
    },
    doesExist: (uuid = config.uuid, user = authUser)=>{
        if (user === null) return
        firebaseDB.ref(`users/${user.uid}/kilns/${uuid}`).once("value").then(kiln=>{
            if (kiln === null) return false
            return true
        })
    },
    updateKiln: (url)=>{
        // firebaseDB.ref(`${kilnPath}`).set(Object.assign(staticData, data))
        firebaseDB.ref(`${kilnPath}/metadata`).set(metadata)
        firebaseDB.ref(`${kilnPath}/url`).set(url)
    },
    updatePersistentLog: (data)=>{
        let date = Date.now()
        firebaseDB.ref(`${kilnPath}/persistentLog/${date}`).set(JSON.stringify({tempLog: data, date: date}))
    }
}

module.exports = userDB