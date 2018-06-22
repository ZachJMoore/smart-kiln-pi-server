const max31855 = require('max31855');
const Gpio = require('onoff').Gpio;
const relayOne = new Gpio(27, 'out');
const thermoSensor = new max31855();
const userDB = require("../firebase/firebaseDB")
const basicBisque = require("../../basicBisque")
const fs = require("fs")


let kiln = {
    temp: 0,
    isFiring: false,
    firingProgress: 0,
    currentSchedule: {name: "No Current Schedule", default: true},
    tempLog: [],
    getTemp: () => {
        return new Promise((resolve, reject) => {
            thermoSensor.readTempC((temp) =>{
                //if invalid reading, reject
                if (isNaN(temp)) {
                    let error = {
                        error: true,
                        message: "thermocouple may be broken or not attached"
                    }
                    console.error(error.message);
                    reject(error);
                } else {
                    //else, resolve temperature converted to fahrenheit
                    let tempF = ((temp * 1.8) + 32).toFixed(2)
                    resolve(tempF)
                }

            })
        })
    },
    getPackage: ()=>{
        return new Promise((resolve, reject)=>{
            kiln.getTemp().then(temp=>{
                let package = {
                    temp: temp,
                    firingProgress: kiln.firingProgress,
                    isFiring: kiln.isFiring,
                    currentSchedule: kiln.currentSchedule,
                    tempLog: kiln.tempLog
                }
                resolve(package)
            }).catch(err=>{
                let package = {
                    error: err,
                    isFiring: kiln.isFiring,
                    tempLog: kiln.tempLog
                }
                reject(package)
            })
        })
    },
    setRelayOn: (relay = relayOne) => {
        relay.writeSync(1);
        console.log(`Changing relay value. New value is ${relay.readSync()}`);
    },
    setRelayOff: (relay = relayOne) => {
        relay.writeSync(0);
        console.log(`Changing relay value. New value is ${relay.readSync()}`);
    },
    readRelay: (relay = relayOne) =>{
        return relay.readSync()
    },
    startFiring: (schedule)=>{
        return new Promise((resolve, reject)=>{
            kiln.isFiring = true;
            kiln.currentSchedule = schedule
            if (kiln.isFiring) {resolve()} else {reject()}
        })
    },
    stopFiring: ()=>{
        return new Promise((resolve, reject)=>{
            kiln.isFiring = false;
            if (!kiln.isFiring) {resolve()} else {reject()}
        })
        
    }
}

setInterval(()=>{
    kiln.firingProgress++
}, 20000)

let persistentTempLog = []
let persistentTempLogInterval = setInterval(()=>{
    kiln.getTemp().then((temp)=>{
        //if its not 12 hours worth of time keep adding to it
        if (persistentTempLog.length < 72){
            persistentTempLog.unshift(temp)
        } else { //otherwise update the database and start over
            userDB.updatePersistentLog(persistentTempLog)
            console.log(new Date() + ": persistent temp log uploaded to database")
            persistentTempLog = []
        }
    }).catch(console.log)
}, 600000)


kiln.getTemp().then(temp=>{
    kiln.tempLog = [temp]
})
let tempLogInterval = setInterval(()=>{
    kiln.getTemp().then(temp=>{
        let tempLog = kiln.tempLog.slice()
        if (!tempLog){
            tempLog = [temp]
        } else if (tempLog.length < 12){
            tempLog.unshift(temp)
            kiln.tempLog = tempLog
        } else {
            tempLog.unshift(temp)
            tempLog.pop()
            kiln.tempLog = tempLog
        }
    })
}, 300000)


kiln.getTemp().then(temp=>{
    kiln.temp = temp
})
let tempStateInterval = setInterval(()=>{
    kiln.getTemp().then(temp=>{
        kiln.temp = temp
    })
}, 1000)



// class PID{
//     constructor(startingTemp){
//         this.target = startingTemp;
//         this.shouldForceStop = false;
//         this.forceStop = ()=>{
//             this.shouldForceStop = true
//             clearInterval(this.holdTargetInterval)
//             kiln.isFiring = false;
//         }
//         this.startFiring = ()=>{
//             this.shouldForceStop = false
//             this.holdTarget()
//             kiln.isFiring = true;
//         }
//         this.setTarget = (target, override = false)=>{
//             override ? this.target = target : this.target = (((this.target * 1000) + (target * 1000)) / 1000).toFixed(2)
//         }
//         this.holdTarget = ()=>{
//             let self = this;
//             this.shouldForceStop = false
//             clearInterval(this.holdTargetInterval)
//             this.holdTargetInterval = setInterval(()=>{
//                 if (kiln.temp > self.target){
//                     kiln.setRelayOff()
//                 } else if (kiln.temp < self.target){
//                     kiln.setRelayOn()
//                 }
                
//                 if (self.shouldForceStop){
//                     clearInterval(self.holdTargetInterval)
//                     self.forceStop
//                 }
//                 console.log("temp", kiln.temp, " | ", "target", self.target)
//             }, 1000)
//         }
//     }
// }



// let fireSchedule = (function* (schedule = basicBisque){
//     let controllerPID = new PID(kiln.temp)
//     controllerPID.startFiring()
//     for(let e = 0; e < schedule.length; e++){
//         let ramp = schedule[e]
//         console.log("Entering ramp", e+1)
//         console.log("Target temperature is: ", ramp.target)
//         let difference = ramp.target - kiln.temp;
//         let hoursNeeded = (difference / ramp.rate);
//         let minutesNeeded = hoursNeeded * 60
//         let secondsNeeded = minutesNeeded * 60
//         let risePerSecond = difference / secondsNeeded
//         console.log(difference, "Difference")
//         console.log(hoursNeeded, "hoursNeeded")
//         console.log(minutesNeeded, "minutesNeeded")
//         console.log(secondsNeeded, "secondsNeeded")
//         console.log(risePerSecond, "rise per second")
//         for (let i = 0; i < secondsNeeded; i++){
//             setTimeout(()=>{
//                 controllerPID.setTarget(risePerSecond)
//             },1000*i)
//         }
//         setTimeout(()=>{
//             let firingProgress = fireSchedule.next()
//             if (firingProgress.done) controllerPID.forceStop()
//         }, (secondsNeeded * 1000) + (ramp.hold * 60 * 60 * 1000))
//         yield
//     }
// })()



// setTimeout(()=>{
//     fireSchedule.next()
// }, 2000)

// setInterval(()=>{
//     kiln.getTemp().then((temp)=>{
//         console.log("Temp", temp
//     )})
// }, 10000)

module.exports = kiln;
