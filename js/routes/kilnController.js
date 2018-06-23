//kiln controller

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const authVerify = require("./authVerify")

const kiln = require('../static/kiln/kiln');

router.get("/get-temp", authVerify, (req, res) => {
    kiln.getTemp()
    .then(temp => {
        res.send({
            temp: temp
        });
    })
    .catch(error => {
        res.status(503).send(error);
    });
});

router.get("/get-package", authVerify, (req, res)=>{
    kiln.getPackage().then(package=>{
        res.send(package)
    }).catch(err=>{
        res.status(503).send(err)
    })
})

router.get("/stop-firing", authVerify, (req, res)=>{
    kiln.stopFiring().then(()=>{
        res.send({message: "Firing stopped"})
    }).catch(()=>{
        res.status(503).send({message: "Unable to stop the firing"})
    })
})

router.post("/start-firing", authVerify, (req, res)=>{
    let schedule = req.body.schedule
    if (!schedule) {
        res.send({message:"No schedule provided"})
    } else {
        console.log(schedule)
        kiln.startFiring(schedule)
        .then(()=>{
            res.send({message:`schedule ${schedule.name} started successfully`})
        })
        .catch(()=>{
            res.send({message: "Something went wrong turning the kiln on"})
        })
        
    }
    
})

module.exports = router;