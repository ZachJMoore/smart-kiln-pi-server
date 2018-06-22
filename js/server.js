const app = require("./app");
const localtunnel = require('localtunnel');
const port = 2222;
const userDB = require("./static/firebase/firebaseDB");
const waitForLogin = require("./static/firebase/firebaseUserManager");
const config = require("./static/config");
const fetch = require("node-fetch")
const socketTunnel = require("./socket-tunnel/lib/api")

waitForLogin().then(()=>{

    const server = app.listen(port, console.log(new Date() + ": server running on port " + port));

    socketTunnel.connect("https://smartkiln.xyz", `${config.uuid}`, port)
        .then(url =>{
            console.log(url)
            userDB.updateKiln(url)
        })
        .catch(err=>{
            console.log(err);
            socketTunnel.connect("https://smartkiln.xyz", `${config.uuid}-${Math.floor(Math.random()*10)}`, port)
                .then(url =>{
                    console.log(url)
                    userDB.updateKiln(url)
                })
                .catch(err=>{
                    console.log(err);
                    userDB.updateKiln({
                        url: "",
                        error: {
                            message: "Could not establish a tunnel to the kiln",
                            serverMessage: err
                        }
                    })
                })
        })

})