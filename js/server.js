const app = require("./app");
const port = 2222;
const userDB = require("./static/firebase/firebaseDB");
const waitForLogin = require("./static/firebase/firebaseUserManager");
const config = require("./static/config");
const socketTunnel = require("./socket-tunnel/lib/api")

let generateUUID = () => { // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

let requestTunnel = (random = true)=>{
    return socketTunnel.connect("https://smartkiln.xyz", `${random ? generateUUID() : config.uuid}`, port)
}

waitForLogin().then(()=>{

    const server = app.listen(port, console.log(new Date() + ": server running on port " + port));

    requestTunnel()
        .then((url)=>{
            console.log(url)
            userDB.updateKiln(url)
        })
        .catch((err)=>{
            console.log(err)
            requestTunnel()
                .then((url)=>{
                    console.log(url)
                    userDB.updateKiln(url)
                })
                .catch((err)=>{
                    console.log(err)
                    requestTunnel()
                        .then((url)=>{
                            console.log(url)
                            userDB.updateKiln(url)
                        })
                        .catch((err)=>{
                            console.log(err)
                        })
                })
        })

    // socketTunnel.connect("https://smartkiln.xyz", `${config.uuid}`, port)
    //     .then(url =>{
    //         console.log(url)
    //         userDB.updateKiln(url)
    //     })
    //     .catch(err=>{
    //         console.log(err);
    //         socketTunnel.connect("https://smartkiln.xyz", `${config.uuid}-${Math.floor(Math.random()*10)}`, port)
    //             .then(url =>{
    //                 console.log(url)
    //                 userDB.updateKiln(url)
    //             })
    //             .catch(err=>{
    //                 console.log(err);
    //                 userDB.updateKiln({
    //                     url: "",
    //                     error: {
    //                         message: "Could not establish a tunnel to the kiln",
    //                         serverMessage: err
    //                     }
    //                 })
    //             })
    //     })

})