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
    app.get("/api/bill/total/", function(req, resp){
        var u = req.query.user;
        /*        
        var b = bills.aggregate([
            {$match: {$or: [{payed_by: u}, {split_with: {$elemMatch: {name: u}}}]}},
            {$group:{
                    payed:{$sum: {$cond: {if:{payed_by: u}, then: 'price', else: 0}}},
                    debt:{$sum: {$cond: {if:{split_with: {$elemMatch: {name: u}}}, then: split_with.u, else: 0}}}                    
                    }
             }
        ]);
        */      
        var p = bills.aggregate([
            {$match: {payed_by: u}},
            {$group:{
                _id:"$payed_by",
                count:{$sum: 1},
                payed: {$sum: "$price"}           
            }}
        ]);
        var d = bills.aggregate([
            {$match: {split_with: {$elemMatch: {name: u}}}},
            {$unwind: "$split_with"},
            {$group: {
                _id: "$split_with.name",
                count:{$sum: 1},
                debt:{$sum: "$split_with.owe"}
            }}
        ]);
        
        p.toArray(function(err, d1){
		    if (err) return resp.json(err)
		        d.toArray(function(err, d2){
		        if (err) return resp.json(err)
		        resp.json([d1[0],d2[0]]);
		    })
		})  
		
    })

    app.listen(port, function() {
        console.log("Server running on port "+port)
    })
})

app.use(express.static("public"))
app.use("/bower_components", express.static("bower_components"))
