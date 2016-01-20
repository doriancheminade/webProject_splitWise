var express = require("express")
var mongo = require("mongodb")
var MongoClient = mongo.MongoClient
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var md5 = require("md5")
var schedule = require('node-schedule')
var http = require('http')


var url = "mongodb://localhost:27017/splitweb"
var app = express()

var europeanBanquApi = {
    host: 'www.ecb.europa.eu',
    port: 80,
    path: '/stats/eurofxref/eurofxref-daily.xml',
    method: 'GET'
}

app.use(express.static("public"));

app.use("/bower_components", express.static("bower_components"));

app.use(cookieParser())
app.use(session({
    secret: "RMratsy2T2SLpwMvqglnkleW43j40iKp",
    resave: true,
    saveUninitialized: true
}))



app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true })) 

MongoClient.connect(url, function(err, db) {
    db.collection("users", function(err, users) {

	app.post('/users/register', function(req, res) {


	    	
	    users.findOne({email:req.body.email}, function(err, user){

		if(err) return;

		if (user != null) res.json({error:"Ce compte existe déjà"}).end()	
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

		if (user == null) res.json({error:"Identifiants incorrects"}).end()
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

    app.listen(3000, function() {
	console.log("Server running on Port 3000")
    })
})


      
    
           
    
})