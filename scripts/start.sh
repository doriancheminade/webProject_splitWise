#!/bin/bash
mongod --dbpath db & 
sleep 5
nodejs app.js

