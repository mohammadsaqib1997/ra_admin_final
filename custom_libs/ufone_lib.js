var method = UfoneLib.prototype;

var http = require("http");
var parseString = new require("xml2js").parseString;

function UfoneLib(){
    this._opt = null;
}

method.set_sms = function(msg, mob_num){
    this._opt = {
        hostname: "bsms.ufone.com",
        path: encodeURI("/bsms_app5/sendapi-0.3.jsp?id=03359693847&message="+msg+"&shortcode=B-SMS&lang=English&mobilenum="+mob_num+"&password=123456")
    };
};

method.send = function(callback){
    if(this._opt === null){
        return callback({status: "failed", msg: "Option not set"});
    }
    http.get(this._opt, function (response) {
        var completeResponse = '';
        response.on('data', function (chunk) {
            completeResponse += chunk;
        });
        response.on('end', function() {
            parseString(completeResponse, function(err, result){
                return callback(result);
            });

        })
    }).on('error', function (e) {
        return callback({status: "failed", msg: "Problem with send SMS: " + e.message});
    });
};

module.exports  = UfoneLib;