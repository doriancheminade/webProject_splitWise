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
        var e = {"split_with":{}};
        
        bills.aggregate([{
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
		    resp.json(d[0]);
		})		
    })
    app.get("/api/bill/list/",function(req,resp){
        var u = req.query.user;
        var n = parseInt(req.query.n);
        var l = 10;
        
        bills.aggregate([{
            $match: {
                $or: 
                [{payed_by: u}, 
                {split_with: {$elemMatch: {name: u}}}
                ]}
            },{
            $sort: {date:-1}
            },{
            $skip: n
            },{
            $limit: l
            }
        ]).toArray(function(err, d){
		    if (err) return resp.json(err)
		    resp.json(d);
		})
    })

    app.listen(port, function() {
        console.log("Server running on port "+port)
    })
})

app.use(express.static("public"))
app.use("/bower_components", express.static("bower_components"))
