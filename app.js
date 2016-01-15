var express = require("express")
var app = express()
var schedule = require('node-schedule')
var xmlparser = require('xml2json')
var http = require('http')
var MongoClient = require("mongodb").MongoClient
var url = "mongodb://localhost:27017/doriancheminade_webProject_splitWise"
var port = 3000;
var europeanBanquApi = {
    host: 'www.ecb.europa.eu',
    port: 80,
    path: '/stats/eurofxref/eurofxref-daily.xml',
    method: 'GET'
}

MongoClient.connect(url, function(err, db) {
    var bills = db.collection('bills')
    var currencies = db.collection('currencies')
    
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
      
    app.get("/api/update-exchange-rates/",function(req,resp){
        var r = http.request(europeanBanquApi, function(res) {
            var xml = ''
            res.on('data', function (chunk) {
                xml += chunk
            })
            res.on('end', function(chunk) {
                var txtjson = xmlparser.toJson(xml)
                console.log('JSON: \n' + txtjson)
                var json = JSON.parse(txtjson)
                cur = json['gesmes:Envelope']['Cube']['Cube']['Cube']
                cur.push({"currency":"EUR","rate":1})
                resp.send(cur)
                currencies.update(
                    {"inuse":true},
                    {"currencies":cur}
                )
            })
            res.on('error', function(e) {
                resp.send('failed to update currencies:'+e)
            })
        })
        r.end()
    })  
    app.get("/api/exchange-rates/",function(req,resp){
        currencies.find({inuse:true},function(err,data){
            if(err) return resp.send(err)
            data.toArray(function(err, d){
		        if (err) return resp.json(err)
		            resp.json(d[0].currencies);
		        })
        })
    })
    
    schedule.scheduleJob({hour: 16, minute: 50}, function(){        
        var req = http.request(europeanBanquApi, function(res) {
            var xml = ''
            res.on('data', function (chunk) {
                xml += chunk
            })
            res.on('end', function(chunk) {
                var txtjson = xmlparser.toJson(xml)
                console.log('JSON: \n' + txtjson)
                var json = JSON.parse(txtjson)
                cur = json['gesmes:Envelope']['Cube']['Cube']['Cube']
                cur.push({"currency":"EUR","rate":1})
                currencies.update(
                    {"inuse":true},
                    {"currencies":cur}
                )
            })
            res.on('error', function(e) {
                console.log('failed to update currencies:'+e)
            })
        })
        req.end()
    })

    app.listen(port, function() {
        console.log("Server running on port "+port)
    })
})

app.use(express.static("public"))
app.use("/bower_components", express.static("bower_components"))

