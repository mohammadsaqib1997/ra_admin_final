var method = MobilinkLib.prototype;

var http = require("http");
var config = require("./../config/private.json").mobilink_cred;

function MobilinkLib(){
    this._opt = null;
}

method.set_sms = function(msg, mob_num){
    this._opt = {
        hostname: "119.160.92.2",
        port: 7700,
        path: encodeURI("/sendsms_url.html?Username="+config.number+"&Password="+config.password+"&From="+config.mask+"&To="+mob_num+"&Message="+msg)
    };
};

method.send = function(callback){
    if(this._opt === null){
        return callback("Option not set!");
    }
    http.get(this._opt, function (response) {
        var completeResponse = '';
        response.on('data', function (chunk) {
            completeResponse += chunk;
        });
        response.on('end', function() {
            callback(completeResponse);
        })
    }).on('error', function (e) {
        return callback("Problem with send SMS: " + e.message);
    });
};

module.exports  = MobilinkLib;