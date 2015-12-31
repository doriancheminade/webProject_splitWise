var express = require("express")
var app = express()

var MongoClient = require("mongodb").MongoClient
var url = "mongodb://localhost:27017/doriancheminade_webProject_splitWise"
var port = 3000;
MongoClient.connect(url, function(err, db) {
    var bills = db.collection('bills');
    
    app.get("/api/bill", function(req, resp){
        var u = req.query.user;
        var b = bills.find({user: u});
        b.toArray(function(err, data){
		    if (err) return next(err)
		    resp.json(data)
		})
    })

    app.listen(port, function() {
        console.log("Server running on port "+port)
    })
})

app.use(express.static("public"))
app.use("/bower_components", express.static("bower_components"))
