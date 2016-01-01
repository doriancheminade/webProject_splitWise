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
        var $u= "$"+u;
        var e = {"split_with":{}};
        
        var b = bills.aggregate([{
            $match: {
                $or: 
                [{payed_by: u}, 
                {split_with: {$elemMatch: {name: u}}}
                ]}
            },{
            $project: {
                payed_by: "$payed_by",
                split_with: "$split_with",
                price: "$price",
                size: {$size: "$split_with"}
                }
            },{
            $unwind: "$split_with"
            },{
            $project: {
                payed: {$cond: [{$eq: ["$payed_by", u]}, "$price", 0]},
                received: {$cond: [{$eq: ["$payed_by", u]}, "$split_with", e]},
                owed: {$cond: [{$eq: ["$payed_by", u]}, "$split_with", e]},
                debt:{$cond: [{$eq: ["$payed_by", u]}, e, "$split_with"]},
                size: "$size"
                }            
            },{
            $group:{
                _id: u,
                payed: {$sum: {$divide: ["$payed", "$size"]}},
                received: {$sum: "$received.payed"},
                owed: {$sum: "$owed.owe"},
                debt:{$sum: "$debt.owe"}
                }
            }              
        ]).toArray(function(err, d){
		    if (err) return resp.json(err)
		    resp.json(d);
		}) 
        /*
        var b1 = bills.aggregate([
            {$match: {payed_by: u}},
            {$group:{
                _id:"$payed_by",
                //what the user payed
                out: {$sum: "$price"},
            }}
        ]);
        
        var b2 = bills.aggregate([
            {$match: {payed_by: u}},
            {$unwind: "$split_with"},
            {$group:{
                _id:"$payed_by",
                //what the user has been payed
                in1: {$sum: "$split_with.payed"},
                //what the user owe
                in2: {$sum: "$split_with.owe"}
            }}
        ]);
        
        var b3 = bills.aggregate([
            {$match: {split_with: {$elemMatch: {name: u}}}},
            {$unwind: "$split_with"},
            {$group: {
                _id: "$split_with.name",
                //what the user owe
                debt:{$sum: "$split_with.owe"}
            }}
        ]);
        
        b1.toArray(function(err, d1){
		    if (err) return resp.json(err)
        b2.toArray(function(err, d2){
		    if (err) return resp.json(err)
        b3.toArray(function(err, d3){
		    if (err) return resp.json(err)
		    resp.json(d1[0],d2[0],d3[0]);
		})  
		}) 
		}) 
		*/
		
    })

    app.listen(port, function() {
        console.log("Server running on port "+port)
    })
})

app.use(express.static("public"))
app.use("/bower_components", express.static("bower_components"))
