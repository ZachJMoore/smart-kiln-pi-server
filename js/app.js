const express = require("express");
const app = express();
const errorHandler = require('errorhandler')

const kilnController = require("./routes/kilnController");

app.use((req, res, next)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "x-access-token, Content-Type");
    next();
})
app.use("/api/kiln", kilnController);
app.use(errorHandler({ dumpExceptions: true, showStack: true }));
app.get("*", (req, res)=>{
    res.status(404).send()
})

module.exports = app;