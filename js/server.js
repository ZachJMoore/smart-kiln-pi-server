const app = require("./app");
const port = 2222;
const userDB = require("./static/firebase/firebaseDB");
const config = require("../config");
const socketTunnel = require("./socket-tunnel/lib/api")
const generateUUID = require("./generateUUID")
const waitForLogin = require("./static/firebase/firebaseUserManager");

let requestTunnel = (random = true)=>{
    return socketTunnel.connect("https://smartkiln.xyz", `${random ? generateUUID() : config.uuid}`, port)
}

const server = app.listen(port, console.log(new Date() + ": server running on port: " + port));

let hasLoggedIn = false
waitForLogin().then(()=>{

    if (!hasLoggedIn){
        requestTunnel()
            .then((url)=>{
                console.log(url)
                userDB.updateKiln(url)
            })
            .catch((response)=>{
                response = JSON.parse(response)
                if (response === null ) return
                console.log(response.error)
                if (response.url !== undefined){
                    userDB.updateKiln(response.url)
                }
            })
    }

    hasLoggedIn = true

})