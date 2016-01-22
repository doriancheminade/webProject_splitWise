var express = require("express")
var app = express()
var schedule = require('node-schedule')
var xmlparser = require('xml2json')
var http = require('http')
var MongoClient = require("mongodb").MongoClient
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var md5 = require("md5")
var session = require('express-session')
var url = "mongodb://localhost:27017/doriancheminade_webProject_splitWise"
var port = 3000;
var europeanBanquApi = {
    host: 'www.ecb.europa.eu',
    port: 80,
    path: '/stats/eurofxref/eurofxref-daily.xml',
    method: 'GET'
}

app.use(cookieParser())
app.use(session({
    secret: "RMratsy2T2SLpwMvqglnkleW43j40iKp",
    resave: true,
    saveUninitialized: true
}))
app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true })) 

MongoClient.connect(url, function(err, db) {
    var bills = db.collection('bills')
    var currencies = db.collection('currencies')
    var users = db.collection('users')
    
    app.post('/users/register', function(req, res) {
	    users.findOne({email:req.body.email}, function(err, user){
		    if(err) return;
		    if (user != null) res.json({error:"this account already exists"}).end()	
		    else{
		        users.insert({email:req.body.email, password:md5(req.body.password), pseudo:req.body.pseudo}, function(err, user){
			        req.session.user = user.ops[0]
			        res.json(user.ops[0]).end()
		        })
		    }
	    })
	});

	app.post('/users/login', function(req, res) {
	    users.findOne({email:req.body.email, password:md5(req.body.password)}, function(err, user){
		    if(err) return;
		    if (user == null) res.json({error:"incorrect user name"}).end()
		    else{
		        req.session.user = user
		        res.json(user)
		    }	
	    })
	});

	app.get('/users/logout', function(req, res) {
	    req.session.user = null
	    res.end()
	});
    
    app.get("/api/bill", function(req, resp){
        var u;
        if(req.session.user){
            u = req.session.user.email;
        bills.find({user: u})
        .toArray(function(err, data){
		    if (err) return next(err)
		    resp.json(data)
		})
        }else{
            resp.json([]);
        }
    })
    app.get("/api/bill/total/:month?*", function(req, resp){
        var u;
        var month;
        var date = new Date();
        if(req.query.month){
            month = {date:{
                $gte: new Date(date.getFullYear(), date.getMonth(), 1)
                }
            }
        }else{
            month = { price: { $exists: true } } ;
        }
        if(req.session.user){
            u = req.session.user.email;
        var e = {"split_with":{}};
        
        bills.aggregate([{
            $match: {
                $and: [{
                    $or: [
                        {payed_by: u}, 
                        {split_with: {$elemMatch: {name: u}}}
                    ]},
                    month
                ]}
            },{
            $project: {
                payed_by: "$payed_by",
                split_with: "$split_with",
                price: "$price",
                size: {$size: "$split_with"},
                currency: "$currency"
                }
            },{
            $unwind: "$split_with"
            },{
            $project: {
                payed: {$cond: [{$eq: ["$payed_by", u]}, "$price", 0]},
                received: {$cond: [{$eq: ["$payed_by", u]}, "$split_with", e]},
                owed: {$cond: [{$eq: ["$payed_by", u]}, "$split_with", e]},
                debt:{$cond: [{$eq: ["$payed_by", u]}, e, "$split_with"]},
                size: "$size",
                currency: "$currency"
                }            
            },{
            $group:{
                _id: "$currency",
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
        }else{
            resp.json([]);
        }	
    })
    app.get("/api/bill/upcomming/list", function(req,resp){
        var u;
        var d = (new Date().getTime()/1000).toFixed(0);
        
        if(req.session.user && req.session.user.email){
            u = req.session.user.email;
        bills.aggregate([{
            $match: {
                $and:[
                    {$or:[
                        {payed_by: u}, 
                        {split_with: {$elemMatch: {name: u}}}
                    ]},
                    {due:{ $gte: d }},
                    {reccurent: {$exists: true}}
                ]}
            },{
            $sort: {date:-1}
            }
        ]).toArray(function(err, d){
		    if (err) return resp.json(err)
		    resp.json(d);
		})
        }else{
            resp.json([]);
        }    
    })
    app.get("/api/bill/list/",function(req,resp){
        var u;
        if(req.session.user && req.session.user.email){
            u = req.session.user.email;
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
        }else{
            resp.json([]);
        }
    })
    app.get("/api/bill/owedList/",function(req,resp){
        var u;
        if(req.session.user){
            u = req.session.user.email;
        
        bills.aggregate([{
            $unwind: "$split_with"
            },{
            $match: {
                $and: [{
                    payed_by: u
                    },{
                    settled: false
                    }]
                }
            },{
            $project: {
                split_with: "$split_with",                
                currency: "$currency"
                }
            },{
            $group: {
                _id: "$split_with.name",
                owed: {$sum: "$split_with.owe"}
                }
            }
        ]).toArray(function(err, d){
		    if (err) return resp.json(err)
		    resp.json(d);
		})
        }else{
            resp.json([]);
        }
    })
    app.get("/api/bill/oweList/",function(req,resp){
        var u;
        if(req.session.user){
            u = req.session.user.email;
        
        bills.aggregate([{
            $unwind: "$split_with"
            },{
            $match: {
                $and: [{
                    split_with: {name: u}
                    },{
                    settled: false
                    }]
                }
            },{
            $project: {
                split_with: "$split_with",                
                currency: "$currency"
                }
            },{
            $group: {
                _id: "$split_with.name",
                owed: {$sum: "$split_with.owe"}
                }
            }
        ]).toArray(function(err, d){
		    if (err) return resp.json(err)
		    resp.json(d);
		})
        }else{
            resp.json([]);
        }
    })
      
    app.get("/api/update-exchange-rates/",function(req,resp){
        var r = http.request(europeanBanquApi, function(res) {
            var xml = ''
            res.on('data', function (chunk) {
                xml += chunk
            })
            res.on('end', function(chunk) {
                var txtjson = xmlparser.toJson(xml)
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
		            resp.json(d.currencies);
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
                var json = JSON.parse(txtjson)
                cur = json['gesmes:Envelope']['Cube']['Cube']['Cube']
                cur.push({"currency":"EUR","rate":1})
                currencies.update(
                    {"inuse":true},
                    {"currencies":cur}
                )
                console.log('updated currencies')
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

