const moment = require('moment');
const _ = require('lodash');

var express = require('express');
var router = express.Router();
var bcrypt = require("bcrypt-nodejs");
var saltRounds = 10;

var admin = require("firebase-admin");
var db = admin.database();
var userRef = db.ref("users");
var forgotPassToken = db.ref("forgot_pass_token");
var sessionsRef = db.ref("sessions");
var completeReqRef = db.ref("complete_requests");
var bidRef = db.ref("driver_bids");

var twilioCred = require('../config/private').twilio;
// var RestClient = require('twilio').RestClient;
var LookupsClient = require('twilio').LookupsClient;

// var rest_client = new RestClient(accountSid, authToken);
var lookup_client = new LookupsClient(twilioCred.accountSid, twilioCred.authToken);

//var MobilinkLib = require("./../custom_libs/mobilink_lib");
var config = require("../config/private.json").nexmo;
var Nexmo = require("nexmo");
var nexmo = new Nexmo({
    apiKey: config.api_key,
    apiSecret: config.api_secret,
});

router.post('/forgot_password', function (req, res, next) {
    req.sanitize("mob_no").trimVal();
    req.sanitize("type").trimVal();
    req.assert('mob_no', "Mobile Number is invalid!").notEmpty().withMessage('Mobile Number is required!').isLength({
        min: 12,
        max: 12
    }).isInt();
    req.assert('type', 'Type is required!').notEmpty().matchVal("client|driver").withMessage("Type is invalid!");

    req.getValidationResult().then(function (result) {
        var errors = result.useFirstErrorOnly().array();
        if (errors.length > 0) {
            return res.json({status: "failed", message: errors[0].msg});
        } else {
            var mob_no = req.body.mob_no;
            var type = req.body.type;
            userRef.orderByChild("mob_no").equalTo(mob_no).once("value", function (snap) {
                var data = snap.val();
                if (data !== null) {
                    var valid = false;
                    var selData;
                    var selKey;
                    for (var item in data) {
                        selData = data[item];
                        selKey = item;
                        if (selData.type === type) {
                            valid = true;
                            break;
                        }
                    }
                    if (valid) {
                        var code = Math.floor(Math.random() * 900000) + 100000;
                        var setData = {
                            mob_no: mob_no,
                            token: code,
                            type: type,
                            time: admin.database.ServerValue.TIMESTAMP
                        };
                        forgotPassToken.child(selKey).set(setData, function (err) {
                            if (err) {
                                return res.json({status: "failed", message: err.message});
                            }
                            /*var sms_api = new MobilinkLib();
                            sms_api.set_sms('Forgot Password token is: "' + code, mob_no);
                            sms_api.send(function (result) {
                                if (result === "Message Sent Successfully!") {
                                    return res.json({"status": "ok", "token": code});
                                } else {
                                    return res.json({
                                        "status": "failed",
                                        "message": result
                                    });
                                }
                            });*/
                            nexmo.message.sendSms(config.from, mob_no, 'Forgot Password token is: "' + code, {type: 'unicode'}, function (err, resData) {
                                if (err) {
                                    return res.json({
                                        "status": "failed",
                                        "message": err
                                    });
                                }
                                if (resData.messages[0].status === "0") {
                                    return res.json({"status": "ok", "token": code});
                                } else {
                                    return res.json({
                                        "status": "failed",
                                        "message": resData.messages[0]["error-text"]
                                    });
                                }
                            });
                        });
                    } else {
                        return res.json({status: "failed", message: "Mobile Number is not found!"});
                    }
                } else {
                    return res.json({status: "failed", message: "Mobile Number is not found!"});
                }
            });
        }
    });
});

router.post('/new_password', function (req, res, next) {
    req.sanitize("mob_no").trimVal();
    req.sanitize("type").trimVal();
    req.sanitize("token").trimVal();
    req.assert('mob_no', "Mobile Number is invalid!").notEmpty().withMessage('Mobile Number is required!').isLength({
        min: 12,
        max: 12
    }).isInt();
    req.assert('token', 'Token is invalid!').notEmpty().withMessage("Token is required!").isLength({
        min: 6,
        max: 6
    }).isInt();
    req.assert('password', 'Password is required!').notEmpty().isLength({
        min: 6,
        max: 30
    }).withMessage("Password must be between 6 and 30 chars long!");
    req.assert('type', 'Type is required!').notEmpty().matchVal("client|driver").withMessage("Type is invalid!");

    req.getValidationResult().then(function (result) {
        var errors = result.useFirstErrorOnly().array();
        if (errors.length > 0) {
            return res.json({status: "failed", message: errors[0].msg});
        } else {
            var mob_no = req.body.mob_no;
            var token = req.body.token;
            var password = req.body.password;
            var type = req.body.type;
            forgotPassToken.orderByChild("mob_no").equalTo(mob_no).once("value", function (snap) {
                var data = snap.val();
                if (data !== null) {
                    //var time = new Date(data.time);
                    //var cur_time = new Date();
                    //var diff_time = cur_time.getTime() - time.getTime();
                    var valid = false;
                    var selData;
                    var selKey;
                    for (var item in data) {
                        selData = data[item];
                        selKey = item;
                        if (selData.type === type && selData.token == token) {
                            valid = true;
                            break;
                        }
                    }
                    if (valid) {
                        var salt = bcrypt.genSaltSync(saltRounds);
                        var newHash = bcrypt.hashSync(password, salt);
                        userRef.child(selKey).update({
                            "password": newHash,
                        }, function (err) {
                            if (err) {
                                return res.json({status: "failed", message: "Data could not be saved. " + err});
                            } else {
                                forgotPassToken.child(selKey).remove(function (err) {
                                    if (!err) {
                                        return res.json({status: "ok", message: "Password has been changed!"});
                                    }
                                    return res.json({status: "failed", message: "Data could not be deleted. " + err});
                                });
                            }
                        });
                    } else {
                        return res.json({status: "failed", message: "Invalid Request!"});
                    }
                } else {
                    return res.json({status: "failed", message: "Invalid Request!"});
                }
            });
        }
    });
});

router.post('/update_password', function (req, res, next) {
    req.sanitize("uid").trimVal();
    req.sanitize("type").trimVal();

    req.assert('uid', 'UID is required!').notEmpty();
    req.assert('new_pass', 'New Password is required!').isLength({
        min: 6,
        max: 30
    }).withMessage("Password must be between 6 and 30 chars long!");
    req.assert('old_pass', 'Old Password is required!').notEmpty();
    req.assert('type', 'Type is required!').notEmpty().matchVal("client|driver").withMessage("Type is invalid!");

    req.getValidationResult().then(function (result) {
        var errors = result.useFirstErrorOnly().array();
        if (errors.length > 0) {
            return res.json({status: "failed", message: errors[0].msg});
        } else {
            var uid = req.body.uid;
            var old_pass = req.body.old_pass;
            var new_pass = req.body.new_pass;
            var type = req.body.type;

            userRef.child(uid).once("value").then(function (snap) {
                var data = snap.val();
                if (data === null) {
                    return res.json({status: "failed", message: "Invalid User!"});
                } else {
                    if (data.type === type) {
                        if (bcrypt.compareSync(old_pass, data.password)) {
                            var salt = bcrypt.genSaltSync(saltRounds);
                            var newHash = bcrypt.hashSync(new_pass, salt);
                            userRef.child(uid).update({
                                "password": newHash,
                            }, function (err) {
                                if (err) {
                                    res.json({"status": "failed", message: "Data could not be saved. " + err});
                                } else {
                                    return res.json({status: "ok", message: "Password has been changed!"});
                                }
                            });
                        } else {
                            return res.json({status: "failed", message: "Incorrect Password!"});
                        }
                    } else {
                        return res.json({status: "failed", message: "Invalid User!"});
                    }
                }
            });
        }
    });
});

router.post('/validate', function (req, res, next) {
    if ((typeof req.body.phone_num === "undefined" || req.body.phone_num === "") || (typeof req.body.type === "undefined" || req.body.type === "")) {
        res.json({"status": "failed", "message": "Invalid Request!"});
    } else {
        var phone_num = req.body.phone_num;
        var user_type = req.body.type;
        lookup_client.phoneNumbers("+" + phone_num).get(function (error, number) {
            if (error) {
                res.json({"status": "failed", "message": error.message});
            } else {
                userRef.once("value", function (snap) {
                    var data = snap.val();
                    var check = false;
                    for (var dd in data) {
                        var singleRow = data[dd];
                        if (singleRow["mob_no"] === phone_num && user_type === singleRow["type"]) {
                            check = true;
                            break;
                        }
                    }
                    if (check) {
                        res.json({"status": "failed", "message": "User already exist!"});
                    } else {
                        var code = Math.floor(Math.random() * 900000) + 100000;
                        /*var sms_api = new MobilinkLib();
                        sms_api.set_sms('Your auth token is: "' + code, phone_num);
                        sms_api.send(function (result) {
                            if(result === "Message Sent Successfully!"){
                                return res.json({"status": "ok", "token": code});
                            }else{
                                return res.json({"status": "failed", "message": result});
                            }
                        });*/
                        nexmo.message.sendSms(config.from, phone_num, 'Your auth token is: "' + code, {type: 'unicode'}, function (err, resData) {
                            if (err) {
                                return res.json({
                                    "status": "failed",
                                    "message": err
                                });
                            }
                            if (resData.messages[0].status === "0") {
                                return res.json({"status": "ok", "token": code});
                            } else {
                                return res.json({
                                    "status": "failed",
                                    "message": resData.messages[0]["error-text"]
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});

router.post('/register', function (req, res, next) {
    var params = req.body;

    req.sanitize("first_name").trimVal();
    req.sanitize("last_name").trimVal();
    req.sanitize("email").trimVal();
    req.sanitize("mob_no").trimValRis();

    if (params['email']) {
        req.assert('email', 'Invalid Email!').isEmail().isLength({max: 50}).withMessage("Email is too long!");
    }
    req.assert('mob_no', 'Mobile Number is invalid!').notEmpty().withMessage("Mobile Number is required!").isInt().isLength({
        min: 12,
        max: 12
    });
    req.assert('first_name', "First Name is required!").isLength({
        min: 3,
        max: 30
    }).withMessage("First Name must be between 3 and 30 chars long!");
    req.assert('last_name', "Last Name is required!").isLength({
        min: 3,
        max: 30
    }).withMessage("Last Name must be between 3 and 30 chars long!");
    req.assert('password', 'Password is required!').isLength({
        min: 6,
        max: 30
    }).withMessage("Password must be between 6 and 30 chars long!");
    req.assert('type', 'Type is required!').notEmpty().matchVal("client|driver").withMessage("Type is invalid!");
    if (params['type'] === 'driver') {
        req.assert('vehicle', "Invalid vehicle!").notEmpty().matchVal("Bike|Car|Pickup|Truck");
    }

    let errors;
    req.getValidationResult().then(function (result) {
        errors = result.useFirstErrorOnly().array();
        if (errors.length > 0) {
            return res.json({status: "failed", message: errors[0].msg});
        } else {
            lookup_client.phoneNumbers("+" + params["mob_no"]).get(function (error, number) {
                if (error) {
                    res.json({"status": "failed", "message": error.message});
                } else {
                    userMobCheck(params['mob_no'], params['type'], function (exist) {
                        if (exist) {
                            res.json({"status": "failed", "message": "Mobile number is already exist!"});
                        } else {
                            if (params['email'] !== "") {
                                userEmailCheck(params['email'], params['type'], function (exist) {
                                    if (exist) {
                                        res.json({"status": "failed", "message": "Email is already exist!"});
                                    } else {
                                        userInsert(params, function (err, token) {
                                            if (err) {
                                                res.json({"status": "failed", "message": err});
                                            } else {
                                                res.json({"status": "ok", "token": token});
                                            }
                                        });
                                    }
                                });
                            } else {
                                userInsert(params, function (err, token) {
                                    if (err) {
                                        res.json({"status": "failed", "message": err});
                                    } else {
                                        res.json({"status": "ok", "token": token});
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

router.post('/login', function (req, res, next) {
    var params = req.body;

    req.assert('email', 'Email/Mobile Number is required!').notEmpty();
    req.assert('password', 'Password is required!').notEmpty();
    req.assert('type', 'Invalid Type!').notEmpty().matchVal("client|driver");

    let errors;
    req.getValidationResult().then(function (result) {
        errors = result.useFirstErrorOnly().array();
        if (errors.length > 0) {
            return res.json({status: "failed", message: errors[0].msg});
        } else {
            userLoginCheck('mob_no', params, function (err, uid) {
                if (err) {
                    userLoginCheck('email', params, function (err, uid) {
                        if (err) {
                            res.json({status: 'failed', message: err});
                        } else {
                            userLoginToken(uid, function (err, token) {
                                if (err) {
                                    res.json({status: 'failed', message: err});
                                } else {
                                    return res.json({"status": "ok", "token": token});
                                }
                            });
                        }
                    });
                } else {
                    userLoginToken(uid, function (err, token) {
                        if (err) {
                            res.json({status: 'failed', message: err});
                        } else {
                            return res.json({"status": "ok", "token": token});
                        }
                    });
                }
            });
        }
    });
});

router.get('/get_top_10', customTokenMW, function (req, res) {
    if(req.query.date && req.query.date !== "") {
        const sel_month = moment(req.query.date);
        const min_month = moment().subtract(12, 'M');
        const max_month = moment();
        if(sel_month.isValid()) {
            if(sel_month.unix() >= min_month.unix() && sel_month.unix() <= max_month.unix()) {
                userRef.orderByChild("type").equalTo("driver").once('value', function (snap) {
                    if (snap.val() !== null) {
                        const all_snap = snap.val();
                        let new_snap = _.filter(all_snap, {status: 1});
                        let ind = 0;
                        let sendData = [];
                        if (new_snap.length > 0) {
                            new_snap.forEach(function (driver) {
                                const driver_key = _.findKey(all_snap, {status: 1, email: driver.email});
                                let grabData = {};
                                grabData['points'] = 0;
                                grabData['id'] = driver_key;
                                grabData['name'] = driver.first_name + " " + driver.last_name;
                                // hit db callback --sessions
                                sessionsRef.orderByChild("userID").equalTo(driver_key).once('value', function (sess_snap) {
                                    // time getters
                                    let defDuration = moment.duration();
                                    if (sess_snap.val() !== null) {
                                        sess_snap.forEach(function (sess_item) {
                                            let sess_item_val = sess_item.val();
                                            if (sess_item_val.hasOwnProperty("loginTime") && sess_item_val.hasOwnProperty("logoutTime")) {
                                                if(moment(sess_item_val.loginTime).format('M') === sel_month.format('M')) {
                                                    defDuration.add(moment.duration(moment(sess_item_val.logoutTime).diff(moment(sess_item_val.loginTime))));
                                                }
                                            }
                                        });
                                    }
                                    grabData['time'] = {m: (defDuration.get('h') * 60) + defDuration.get("m")};
                                    grabData['points'] += Math.round(grabData.time.m / 100);
                                    // hit db callback --complete_requests
                                    completeReqRef.orderByChild("driver_uid").equalTo(driver_key).once('value', function (creq_snap) {
                                        // complete jobs and rating getters
                                        let rating_count = 0;
                                        if (creq_snap.val() !== null) {
                                            creq_snap.forEach(function (c_job) {
                                                if(moment(c_job.val().complete_time).format('M') === sel_month.format('M')) {
                                                    rating_count += c_job.val().rating;
                                                    grabData['points'] += ratingPoints(c_job.val().rating);
                                                }
                                            });
                                        }
                                        grabData['rating'] = rating_count;

                                        // complete jobs earnings getters
                                        driverEarning(creq_snap, driver_key, sel_month).then(function (result) {
                                            grabData['earning'] = result;
                                            grabData['points'] += Math.round(result / 100);
                                            // driver place bids getters
                                            driverBids(driver_key, sel_month).then(function (result) {
                                                grabData['bids'] = result;
                                                grabData['points'] += result;

                                                ind = complete_pros(grabData, ind, new_snap.length, sendData, res, req);
                                            });
                                        });
                                    });
                                });
                            });
                        } else {
                            res.json({status: "failed", message: "No Top Driver Found!"});
                        }
                    } else {
                        res.json({status: "failed", message: "No Top Driver Found!"});
                    }
                });
            }else{
                res.json({status: "failed", message: "No Match Date!"});
            }
        }else{
            res.json({status: "failed", message: "Invalid date!"});
        }
    }else{
        res.json({status: "failed", message: "Date not found!"});
    }
});

module.exports = router;

function userMobCheck(mobNum, type, callback) {
    userRef.orderByChild('mob_no').equalTo(mobNum).once('value').then(function (userSnap) {
        let userData = userSnap.val();
        if (userData !== null) {
            let keys = Object.keys(userData);
            let type_check = false;
            keys.forEach(function (key) {
                let row = userData[key];
                if (row.type === type) {
                    type_check = true;
                }
            });
            if (type_check) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
}

function userEmailCheck(email, type, callback) {
    userRef.orderByChild('email').equalTo(email).once('value').then(function (userSnap) {
        let userData = userSnap.val();
        if (userData !== null) {
            let keys = Object.keys(userData);
            let type_check = false;
            keys.forEach(function (key) {
                let row = userData[key];
                if (row.type === type) {
                    type_check = true;
                }
            });
            if (type_check) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
}

function userInsert(params, callback) {
    var newUser = userRef.push();
    var uid = newUser.key;
    var salt = bcrypt.genSaltSync(saltRounds);
    var hash = bcrypt.hashSync(params.password, salt);
    var sendVal;
    if (params['type'] === 'driver') {
        sendVal = {
            "email": params.email,
            "password": hash,
            "first_name": params.first_name,
            "last_name": params.last_name,
            "mob_no": params.mob_no,
            "vehicle": params.vehicle,
            "status": 0,
            "type": params.type
        };
    } else {
        sendVal = {
            "email": params.email,
            "password": hash,
            "first_name": params.first_name,
            "last_name": params.last_name,
            "mob_no": params.mob_no,
            "status": 1,
            "type": params.type
        };
    }

    newUser.set(sendVal, function (err) {
        if (err) {
            callback("Data could not be saved. " + err);
        } else {
            admin.auth().createCustomToken(uid).then(function (token) {
                callback(false, token);
            }).catch(function (err) {
                callback("Error creating custom token: " + err);
            });
        }
    });
}

function userLoginCheck(field, params, callback) {
    userRef.orderByChild(field).equalTo(params['email']).once('value').then(function (userSnap) {
        let userData = userSnap.val();
        let err = "Invalid Credentials!";
        if (userData !== null) {
            let keys = Object.keys(userData);
            let userExist = false;
            let grabUID = '';
            keys.forEach(function (key) {
                let row = userData[key];
                if (row.type === params['type'] && bcrypt.compareSync(params['password'], row.password)) {
                    if(typeof row.blocked !== 'undefined') {
                        if(row.blocked === true) {
                            err = "Your account is blocked!";
                            return false;
                        }
                    }
                    grabUID = key;
                    userExist = true;
                    return false;
                }
            });
            if (userExist) {
                callback(false, grabUID);
            } else {
                callback(err);
            }
        } else {
            callback(err);
        }
    });
}

function userLoginToken(uid, callback) {
    admin.auth().createCustomToken(uid).then(function (token) {
        callback(false, token);
    }).catch(function (err) {
        callback("Error creating custom token: " + err);
    });
}

function complete_pros(push_row, ind, tot_length, allData, res, req) {
    if (push_row !== null) {
        allData.push(push_row);
        ind++;
    }
    if (ind === tot_length) {
        allData = _.orderBy(allData, ['points', 'time.m', 'rating', 'earning', 'bids'], ['desc', 'desc', 'desc', 'desc', 'desc']);
        let top_10 = _.take(allData, 10);
        let rankGet = _.findIndex(allData, {id: req.query.uid});
        if (rankGet > -1) {
            if (_.some(top_10, {id: req.query.uid})) {
                res.json({status: "ok", data: top_10});
            } else {
                let grabRankItem = allData[rankGet];
                top_10.push(grabRankItem);
                res.json({status: "ok", data: top_10, rank: rankGet + 1});
            }
        } else {
            res.json({status: "failed", message: "Driver is not active!"});
        }
    }
    return ind;
}

function ratingPoints(rate) {
    switch (rate) {
        case 5:
            return 10;
        case 4:
            return 8;
        case 3:
            return 5;
        case 2:
            return 2;
        case 1:
            return -1;
    }
    return 0;
}

async function driverEarning(com_reqs_snap, driver_key, m_moment) {
    let earnings = 0;
    if (com_reqs_snap.numChildren() > 0) {
        const keys = Object.keys(com_reqs_snap.val());
        for (let key of keys) {
            earnings += await comJobBid(key, driver_key, m_moment);
        }
    }
    return earnings;
}

async function comJobBid(req_key, driver_key, m_moment) {
    let earn = 0;
    await bidRef.child(req_key + "/" + driver_key).once('value', function (bid_snap) {
        if(moment(bid_snap.val().first_bid_time).format("M") === m_moment.format("M")) {
            earn = parseInt(bid_snap.val().amount);
        }
    });
    return earn;
}

async function driverBids(driver_key, m_moment) {
    let count = 0;
    await bidRef.once('value', function (bid_snap) {
        if (bid_snap.val() !== null) {
            let res = _.filter(bid_snap.val(), driver_key);
            if(res.length > 0) {
                for (let [p_key, p_val] of Object.entries(res)) {
                    for (let [i_key, i_val] of Object.entries(p_val)) {
                        if(moment(i_val.first_bid_time).format("M") === m_moment.format("M")) {
                            count++;
                        }
                    }
                }
            }
        }
    });
    return count;
}

function customTokenMW(req, res, next) {
    let token = req.body.token || req.params.token || req.query.token;
    if (token && token !== "") {
        admin.auth().verifyIdToken(token)
            .then(function (decodeToken) {
                req.query['uid'] = decodeToken.uid;
                next();
            })
            .catch(function (err) {
                res.json({status: "failed", message: err.message});
            });
    } else {
        res.json({status: "failed", message: "Token Required!"});
    }
}