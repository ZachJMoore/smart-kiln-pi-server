const max31855 = require('max31855');
const Gpio = require('onoff').Gpio;
const relayOne = new Gpio(27, 'out');
const thermoSensor = new max31855();
const userDB = require("../firebase/firebaseDB")
const fs = require("fs")

class PID{
    constructor(startingTemp, targetKiln, debug = false){
        this.target = startingTemp;
        this.kiln = targetKiln
        this.isRunning = false
        this.debug = debug
        this.stopPID = ()=>{
            clearInterval(this.holdTargetInterval)
            this.isRunning = false
            this.kiln.setRelaysOff()
        }

        this.startPID = ()=>{
            this.isRunning = true;
            clearInterval(this.holdTargetInterval)
            this.holdTarget()
        }

        this.setTarget = (target, override = false)=>{
            override ? this.target = target : this.target = (((this.target * 1000) + (target * 1000)) / 1000).toFixed(2)
        }

        this.holdTarget = ()=>{
            let self = this;
            this.holdTargetInterval = setInterval(()=>{
                if (self.kiln.temp > self.target && self.kiln.checkRelays() !== 0){
                    self.kiln.setRelaysOff()
                } else if (self.kiln.temp < self.target && self.kiln.checkRelays() !== 1){
                    self.kiln.setRelaysOn()
                }

                if (this.debug) console.log("temp", self.kiln.temp, " | ", "target", self.target)

            }, 1000)

        }

    }
}

let placeholderSchedule = {
    name: "No Current Schedule"
}

class Kiln{
    constructor(relays, debug = false){
        this.temp = 0
        this.isFiring = false;
        this.firingProgress = 0;
        this.currentSchedule = {...placeholderSchedule}
        this.tempLog = []
        this.controller = null;
        this.relays = relays;
        this.debug = debug

        this.init = ()=>{

            let self = this;

            // Make sure Relays are all turned off by default

            this.setRelaysOff()

            // Init PID

            this.controller = new PID(this.temp, this)

            // Keep a log of the past 12 hours

            this.persistentTempLog = []
            this.persistentTempLogInterval = setInterval(()=>{
                self.getTemp().then((temp)=>{
                    //if its not 12 hours worth of time keep adding to it
                    if (self.persistentTempLog.length < 72){
                        self.persistentTempLog.unshift(temp)
                    } else { //otherwise update the database and start over
                        userDB.updatePersistentLog(persistentTempLog)
                        console.log(new Date() + ": persistent temp log uploaded to database")
                        self.persistentTempLog = []
                    }
                }).catch(console.log)
            }, 600000)

           
            // Update 1 hour temp log

            

            if (this.tempLog.length === 0){ // ran immediately to make sure there is a starting temp
                this.getTemp().then((temp)=>{
                    this.tempLog = [temp]
                }).catch(console.log)
            }

            this.tempLogInterval = setInterval(()=>{
                self.getTemp().then(temp=>{

                    let tempLog = this.tempLog.slice()
                    
                    if (tempLog.length < 12){
                        tempLog.unshift(temp)
                    } else {
                        tempLog.unshift(temp)
                        tempLog.pop()
                    }
                    this.tempLog = tempLog

                    this.fsLog.push(temp)
                    let self = this
                    fs.writeFile("fsLog.json", JSON.stringify(self.fsLog), function(err) {
                        if(err) {
                            return console.log(err);
                        }
                    });

                }).catch(console.log)
            }, 300000)

            // continually update the temperature

            if (this.temp === 0){
                this.getTemp().then(temp=>{
                    this.temp = temp
                }).catch(console.log)
            }
            this.tempStateInterval = setInterval(()=>{
                self.getTemp().then(temp=>{
                    self.temp = temp
                }).catch(console.log)
            }, 1000)

            // debug log on device

            if (this.debug){
                this.fsLog = []
                this.fsLog.push(temp)
                let self = this
                let writeFsLog = ()=>{
                    fs.writeFile("fsLog.json", JSON.stringify(self.fsLog), function(err) {
                        if(err) {
                            return console.log(err);
                        }
                    });
                }
                writeFsLog()
                this.fsLogInterval = setInterval(writeFsLog,60000)
            }

        }

        this.getTemp = ()=>{
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
        }

        this.getPackage = ()=>{
            return new Promise((resolve, reject)=>{
                if (this.temp !== 0){
                    resolve({
                        temp: this.temp,
                        firingProgress: this.firingProgress,
                        isFiring: this.isFiring,
                        currentSchedule: this.currentSchedule,
                        tempLog: this.tempLog
                    })
                } else {
                    reject({
                        temp: "Thermo Error",
                        firingProgress: this.firingProgress,
                        isFiring: this.isFiring,
                        currentSchedule: this.currentSchedule,
                        tempLog: this.tempLog
                    })
                }
            })
        }

        this.setRelaysOn = () => {
            this.relays.forEach(relay=>{
                relay.writeSync(1);
                console.log(`Changing relay value. New value is ${relay.readSync()}`);
            })
        }

        this.setRelaysOff = () => {
            this.relays.forEach(relay=>{
                relay.writeSync(0);
                console.log(`Changing relay value. New value is ${relay.readSync()}`);
            })
        }

        this.checkRelays = () =>{
            let sum = 0;
            this.relays.forEach(relay=>{
                sum += relay.readSync()
            })
            if (sum === this.relays.length){
                return (1)
            } else {
                return (0)
            }
        }

        this.startFiring = (schedule)=>{
            return new Promise((resolve, reject)=>{
                this.isFiring = true;
                if ( typeof schedule.ramps === typeof ""){
                    schedule.ramps = JSON.parse(schedule.ramps)
                }
                this.currentSchedule = schedule
                this.fireScheduleInstance = this.fireSchedule(schedule)
                this.fireScheduleInstance.next()

                if (this.isFiring && this.controller.isRunning) {resolve()} else {reject()}
            })
        }

        this.stopFiring = ()=>{
            return new Promise((resolve, reject)=>{
                this.isFiring = false;
                this.currentSchedule = {...placeholderSchedule}
                console.log("Sending: `stopFiring`")

                setTimeout(()=>{
                    if (!this.isFiring && !this.controller.isRunning) {
                        resolve("StopFiring: Successful")
                    } else {
                        reject("StopFiring: Unsuccessful")
                    }
                }, 2000)
            })
            
        }

        this.fireSchedule = function* (schedule){
            if (!schedule){
                return
            }
            
            this.controller.setTarget(this.temp, true)
            this.controller.startPID()

            this.timeoutes = []

            let self = this;

            for(let e = 0; e < schedule.ramps.length; e++){
                let ramp = schedule.ramps[e]
                console.log("Entering ramp", e+1)
                console.log("Target temperature is: ", ramp.target)

                let difference = ramp.target - self.temp;
                let hoursNeeded = (difference / ramp.rate);
                let minutesNeeded = hoursNeeded * 60
                let secondsNeeded = minutesNeeded * 60
                let risePerSecond = difference / secondsNeeded
    
                if (Math.sign(secondsNeeded) === -1){
                    secondsNeeded = Math.abs(secondsNeeded)
                    risePerSecond = -risePerSecond
                    console.log("Converted to down ramp")
                }
    
                console.log("Difference | ", difference)
                console.log("hoursNeeded | ", hoursNeeded)
                console.log("minutesNeeded | ", minutesNeeded)
                console.log("secondsNeeded | ", secondsNeeded, )
                console.log("rise per second | ", risePerSecond)
    
                for (let i = 0; i < secondsNeeded; i++){
                    let timeout = setTimeout(()=>{
                        self.controller.setTarget(risePerSecond)
                        if (!self.isFiring){
                            self.timeoutes.forEach(timeout=>{
                                clearTimeout(timeout)
                            })
                            self.controller.stopPID()
                            console.log("Firing Stopped")
                        }
                    },1000*i)
                    self.timeoutes.push(timeout)
                }

                let timeout = setTimeout(()=>{
                    if (self.fireScheduleInstance.next().done){
                         self.controller.stopPID()
                         self.stopFiring().then(console.log).catch(console.log)
                         console.log("Firing Completed")
                    }
                }, (secondsNeeded * 1000) + (ramp.hold * 60 * 60 * 1000))

                self.timeoutes.push(timeout)

                yield
            }
        }
    }
}

let kiln = new Kiln([relayOne])
kiln.init()

module.exports = kiln