var express = require("express")
var app = express()

var MongoClient = require("mongodb").MongoClient
var url = "mongodb://localhost:27017/splitwise"
var port = 3000;
MongoClient.connect(url, function(err, db) {


    app.listen(port, function() {
        console.log("Server running on port "+port)
    })
})

app.use(express.static("public"))
app.use("/bower_components", express.static("bower_components"))
