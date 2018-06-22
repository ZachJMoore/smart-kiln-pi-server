const waitForLogin = require("../static/firebase/firebaseUserManager")

//sign into firebase
let authUser = null;
waitForLogin().then(user => {
    authUser = user
})

//verify
let authVerify = (req, res, next)=>{
    authorization = req.headers["x-access-token"]
    if (!authorization) return res.status(403).send({error: true, message: "no authorization provided"})

    if (authUser == null){
        return res.status(503).send({error: true, message: "user not signed in on server"})
    } else if (authUser.uid !== authorization) {
        return res.status(403).send({error: true, message: "invalid authorization"})
    } else if (authUser.uid === authorization){
        req.userId = authorization;
        next()
    }
};

module.exports = authVerify