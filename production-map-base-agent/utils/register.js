var crypto = require('crypto');
var fs = require('fs');
var mkdirp = require('mkdirp');
var auth = require('./auth');
var request = require('superagent');
var os = require("os");
var ip = require('ip');
var path = require('path');

var CONFIGURATION_PATH = path.join(__dirname, "/../conf/baseagent.json");
var KEYSDIR = path.join(__dirname, "../keys");
var KEYDIR = path.join(__dirname, "../keys/key.pm");
var port = 3000;
var baseUrl = "http://" + ip.address() + ":" + port;

function sendKeyToServer(username, password, userKey, server, baseUrl){
	console.log("Registering agent at the server");
	auth.login(username, password, server).fail(function(res){
			console.log("Authentication Failed User: '" + username+"'");
			return;
		}).then(function(authRes){
			var res = authRes.res;
			var agent = authRes.agent;
       	 	console.log("Authentication success " + res.body.username);
       	 	agent
		       .post(server + "/BaseAgent/addAgent")
		       .withCredentials()
		       .send({name: os.hostname() + '-' + process.platform , url: baseUrl, key: userKey})
		       .set('Accept', 'application/json, text/plain, */*')
		       .set('Content-Type', 'application/json;charset=UTF-8')
		       .end(function (err, res) {
		       	 if(err){
		       	 	if(!res){
			      		console.log(err);
			       	}
		       	 	else{
		       	 		console.log(err + " (" + res.status + ")\n" + res.error);
		       	 	}
		       	 }
		       	 else{
				      	console.log("Baseagent installed successfuly.");
		       	 }
		       });
		});
}

function randomValueHex (len) {
	return crypto.randomBytes(Math.ceil(len/2))
		.toString('hex') // convert to hexadecimal format
		.slice(0,len);   // return required number of characters
}

exports.registerAgent = function(cb) {
	fs.readFile(CONFIGURATION_PATH, 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		var configData = JSON.parse(data);
		var keyValue = randomValueHex(128);

		mkdirp(KEYSDIR, function(err) {
			if(err){
				console.log(err);
			}
			fs.writeFile(KEYDIR, keyValue, function(err) {
				if(err) {
					return console.log(err);
				}
				console.log("Key was written to `keys/key.pm`");
				sendKeyToServer(configData.username, configData.password, keyValue, configData.serverUrl, baseUrl);
				cb(keyValue);
			});
		});
	});
};

exports.updateAgent = function(key) {
	fs.readFile(CONFIGURATION_PATH, 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		var configData = JSON.parse(data);
		sendKeyToServer(configData.username, configData.password, key, configData.serverUrl, baseUrl);
	});
};

exports.registerCLI = function() {
	if(process.argv.length < 5){
		console.log("Not enough parameters try:");
		console.log("node register `USERNAME` `PASSWORD` `SERVERURL`");
		return;
	}

	var keyValue = randomValueHex(128);

	mkdirp(KEYSDIR, function(err) {
		if(err){
			console.log(err);
		}
		fs.writeFile(KEYDIR, keyValue, function(err) {
			if(err) {
				return console.log(err);
			}
			console.log("Key was written to `keys/key.pm`");
			sendKeyToServer(process.argv[2], process.argv[3], keyValue, process.argv[4], baseUrl);
		});
	});
};

exports.setPort = function(sport) {
	port = sport;
	baseUrl = "http://" + ip.address() + ":"+sport;
};