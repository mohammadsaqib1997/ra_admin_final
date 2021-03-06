var express = require('express');
var router = express.Router();
var admin = require('firebase-admin');
var db = admin.database();
var userRef = db.ref('users');
var bcrypt = require("bcrypt-nodejs");
var saltRounds = 10;
var csrf = require("csurf");

var webName = "RoadioApp";

var twilioConf = require('../config/private').twilio;
var LookupsClient = require('twilio').LookupsClient;
var lookup_client = new LookupsClient(twilioConf.accountSid, twilioConf.authToken);

var config_gc = {
    projectId: 'radioapp-a8558',
    keyFilename: './config/serviceAccountKey.json'
};
var storage = require('@google-cloud/storage')(config_gc);
var bucket = storage.bucket('radioapp-a8558.appspot.com');

router.get('/', function (req, res, next) {
    res.render('new_pages/home', {title: webName + ' | Home', tag: 'home'});
});
router.get('/partner', csrf(), function (req, res, next) {
    res.render('new_pages/partner', {csrf: req.csrfToken(), title: webName + ' | Partner'});
});

router.get('/privacy', function (req, res, next) {
    res.render('new_pages/privacy', {title: webName + ' | Privacy'});
});

router.get('/faqs', function (req, res, next) {
    res.render('new_pages/faqs', {title: webName + ' | FAQs'});
});

router.post('/sec_1_check', csrf(), function (req, res, next) {
    req.sanitize("fname").trimVal();
    req.sanitize("lname").trimVal();
    req.sanitize("mobile_number").trimValRis();
    req.sanitize("cnic_number").trimValRis();
    req.sanitize("driving_license").trimVal();
    req.sanitize("email").trimVal();


    req.assert('fname', 'First Name is required!').notEmpty().isLength({min: 2}).withMessage("First Name is too short!").isLength({max: 20}).withMessage("First Name is too long!");
    req.assert('lname', 'Last Name is required!').notEmpty().isLength({min: 2}).withMessage("Last Name is too short!").isLength({max: 20}).withMessage("Last Name is too long!");
    req.assert('mobile_number', 'Mobile Number is invalid!').notEmpty().withMessage("Mobile Number is required!").isInt().isLength({
        min: 11,
        max: 11
    });
    req.assert('cnic_number', 'CNIC Number is invalid!').notEmpty().withMessage("CNIC Number is required!").isInt().isLength({
        min: 13,
        max: 13
    });
    req.assert('driving_license', 'Driving License is required!').notEmpty().isLength({
        min: 5,
        max: 30
    }).withMessage("Driving License must be between 5 and 30 chars long!");
    req.assert('email', 'Email is required!').notEmpty().isEmail().withMessage("Invalid Email").isLength({max: 50}).withMessage("Email is too long!");
    req.assert('password', 'Password is required!').notEmpty().isLength({
        min: 6,
        max: 30
    }).withMessage("Password must be between 6 and 30 chars long!");
    req.assert('confirm_password', 'Confirm Password is required!').notEmpty().matchVal((typeof req.body.password !== "undefined") ? req.body.password : "").withMessage("Password not match!");


    var errors;
    req.getValidationResult().then(function (result) {
        errors = result.useFirstErrorOnly().array();
        if (errors.length > 0) {
            return res.json({status: "failed", errors: errors, csrf: req.csrfToken()});
        } else {
            driverMobExist(req.body.mobile_number, "mobile_number", function (obj) {
                if (!obj.status) {
                    errors.push(obj.err);
                }
                driverEmailExist(req.body.email, 'email', function (obj1) {
                    if (!obj1.status) {
                        errors.push(obj1.err);
                    }
                    if (errors.length > 0) {
                        return res.json({status: "failed", errors: errors, csrf: req.csrfToken()});
                    } else {
                        return res.json({status: "ok", errors: "", csrf: req.csrfToken()});
                    }
                });
            });
        }
    });
});

router.post('/sec_2_check', csrf(), function (req, res, next) {
    req.sanitize("model_year").trimValRis();
    req.sanitize("vehicle_number").trimValRis();
    req.sanitize("make").trimVal();

    req.assert('vehicle', 'Transportation Type is required!').notEmpty().matchVal("Bike|Car|Pickup|Truck").withMessage("Transportation Type is invalid!");
    req.assert('model_year', 'Model Year is invalid!').notEmpty().withMessage("Model Year is required!").isLength({
        min: 4,
        max: 4
    }).isInt();
    req.assert('vehicle_number', 'Vehicle Number is required!').notEmpty().isLength({
        min: 7,
        max: 7
    }).withMessage("Vehicle Number is invalid!");
    req.assert('make', 'Make is required!').notEmpty().isLength({
        min: 3,
        max: 20
    }).withMessage("Make must be between 3 and 20 chars long!");

    var errors;
    req.getValidationResult().then(function (result) {
        errors = result.useFirstErrorOnly().array();
        if (errors.length > 0) {
            return res.json({status: "failed", errors: errors, csrf: req.csrfToken()});
        } else {
            return res.json({status: "ok", errors: "", csrf: req.csrfToken()});
        }
    });
});

router.post('/partner', csrf(), function (req, res, next) {
    req.sanitize("fname").trimVal();
    req.sanitize("lname").trimVal();
    req.sanitize("mobile_number").trimValRis();
    req.sanitize("cnic_number").trimValRis();
    req.sanitize("driving_license").trimVal();
    req.sanitize("email").trimVal();
    req.sanitize("model_year").trimValRis();
    req.sanitize("vehicle_number").trimValRis();
    req.sanitize("make").trimVal();

    req.assert('fname', 'First Name is required!').notEmpty().isLength({min: 2}).withMessage("First Name is too short!").isLength({max: 20}).withMessage("First Name is too long!");
    req.assert('lname', 'Last Name is required!').notEmpty().isLength({min: 2}).withMessage("Last Name is too short!").isLength({max: 20}).withMessage("Last Name is too long!");
    req.assert('mobile_number', 'Mobile Number is invalid!').notEmpty().withMessage("Mobile Number is required!").isInt().isLength({
        min: 11,
        max: 11
    });
    req.assert('cnic_number', 'CNIC Number is invalid!').notEmpty().withMessage("CNIC Number is required!").isInt().isLength({
        min: 13,
        max: 13
    });
    req.assert('driving_license', 'Driving License is required!').notEmpty().isLength({
        min: 5,
        max: 30
    }).withMessage("Driving License must be between 5 and 30 chars long!");
    req.assert('email', 'Email is required!').notEmpty().isEmail().withMessage("Invalid Email").isLength({max: 50}).withMessage("Email is too long!");
    req.assert('password', 'Password is required!').notEmpty().isLength({
        min: 6,
        max: 30
    }).withMessage("Password must be between 6 and 30 chars long!");
    req.assert('confirm_password', 'Confirm Password is required!').notEmpty().matchVal((typeof req.body.password !== "undefined") ? req.body.password : "").withMessage("Password not match!");
    req.assert('vehicle', 'Transportation Type is required!').notEmpty().matchVal("Bike|Car|Pickup|Truck").withMessage("Transportation Type is invalid!");
    req.assert('model_year', 'Model Year is invalid!').notEmpty().withMessage("Model Year is required!").isLength({
        min: 4,
        max: 4
    }).isInt();
    req.assert('vehicle_number', 'Vehicle Number is required!').notEmpty().isLength({
        min: 7,
        max: 7
    }).withMessage("Vehicle Number is invalid!");
    req.assert('make', 'Make is required!').notEmpty().isLength({
        min: 3,
        max: 20
    }).withMessage("Make must be between 3 and 20 chars long!");

    var errors;
    req.getValidationResult().then(function (result) {
        errors = result.useFirstErrorOnly().array();
        if (errors.length > 0) {
            return res.json({status: "failed", errors: errors, csrf: req.csrfToken()});
        } else {
            driverMobExist(req.body.mobile_number, "mobile_number", function (obj) {
                if (!obj.status) {
                    errors.push(obj.err);
                }
                driverEmailExist(req.body.email, 'email', function (obj1) {
                    if (!obj1.status) {
                        errors.push(obj1.err);
                    }
                    if (errors.length > 0) {
                        return res.json({status: "failed", errors: errors, csrf: req.csrfToken()});
                    } else {
                        var salt = bcrypt.genSaltSync(saltRounds);
                        var hash = bcrypt.hashSync(req.body.password, salt);
                        var v_owner = (typeof req.body.vehicle_owner !== "undefined") ? "Yes" : "No";

                        var lastIdRef = userRef.push();
                        lastIdRef.set({
                            first_name: req.body.fname,
                            last_name: req.body.lname,
                            mob_no: "92" + (req.body.mobile_number * 1),
                            cnic_no: req.body.cnic_number,
                            driving_license: req.body.driving_license,
                            email: req.body.email,
                            password: hash,
                            vehicle: req.body.vehicle,
                            v_model_year: req.body.model_year,
                            v_number: req.body.vehicle_number,
                            v_make: req.body.make,
                            v_owner: v_owner,
                            status: 0,
                            type: 'driver',
                        }, function (err) {
                            if (err)
                                return res.json({
                                    status: "failed",
                                    errors: "Insertion Error: " + err,
                                    csrf: req.csrfToken()
                                });
                            else {
                                if (Object.keys(req.files).length > 0) {
                                    fileUpload(req.files.fm_profile_img, lastIdRef.key, "profile_images/", function (err) {
                                        if(err){
                                            return res.json({
                                                status: "failed",
                                                errors: "Profile Image Upload Error: " + err,
                                                csrf: req.csrfToken()
                                            });
                                        }else{
                                            fileUpload(req.files.fm_cnic_img, lastIdRef.key, "driver_cnic_images/", function (err) {
                                                if(err){
                                                    return res.json({
                                                        status: "failed",
                                                        errors: "CNIC Image Upload Error: " + err,
                                                        csrf: req.csrfToken()
                                                    });
                                                }else{
                                                    fileUpload(req.files.fm_license_img, lastIdRef.key, "driver_license_images/", function (err) {
                                                        if(err){
                                                            return res.json({
                                                                status: "failed",
                                                                errors: "License Image Upload Error: " + err,
                                                                csrf: req.csrfToken()
                                                            });
                                                        }else{
                                                            fileUpload(req.files.fm_reg_letter_img, lastIdRef.key, "driver_registration_letter_images/", function (err) {
                                                                if(err){
                                                                    return res.json({
                                                                        status: "failed",
                                                                        errors: "Registration Letter Image Upload Error: " + err,
                                                                        csrf: req.csrfToken()
                                                                    });
                                                                }else{
                                                                    return res.json({status: "ok"});
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    return res.json({status: "ok", lastId: lastIdRef.key});
                                }
                            }
                        });
                    }
                });
            });
        }
    });

    /*if(Object.keys(req.files).length < 1){
     return res.json({status: "failed", posts: req.body, csrf: req.csrfToken()});
     }
     return res.json({status: "ok", files: req.files, posts: req.body});*/
});

module.exports = router;

function driverMobExist(mobile_number, f_name, callback) {
    mobile_number = "92" + (mobile_number * 1);
    lookup_client.phoneNumbers("+" + mobile_number).get(function (error, number) {
        if (error) {
            callback({"status": false, "err": {param: f_name, msg: "Mobile Number is invalid!"}});
        } else {
            userRef.orderByChild("mob_no").equalTo(mobile_number).once("value", function (snap) {
                var data = snap.val();
                if (data !== null) {
                    var match = false;
                    for (var item in data) {
                        var row = data[item];
                        if (row['type'] === "driver") {
                            match = true;
                            break;
                        }
                    }
                    if (match) {
                        callback({"status": false, "err": {param: f_name, msg: "Mobile Number is already exist!"}});
                    } else {
                        callback({"status": true});
                    }
                } else {
                    callback({"status": true});
                }
            });
        }
    });
}

function driverEmailExist(email, f_name, callback) {
    userRef.orderByChild("email").equalTo(email).once("value", function (snap) {
        var data = snap.val();
        if (data !== null) {
            var match = false;
            for (var item in data) {
                var row = data[item];
                if (row['type'] === "driver") {
                    match = true;
                    break;
                }
            }
            if (match) {
                callback({"status": false, "err": {param: f_name, msg: "Email is already exist!"}});
            } else {
                callback({"status": true});
            }
        } else {
            callback({"status": true});
        }
    });
}

function fileUpload(file, name, dir, callback) {
    if(typeof file !== "undefined"){
        var img_file = bucket.file(dir + name + ".jpg");
        var stream = img_file.createWriteStream({
            metadata: {
                contentType: "image/jpeg"
            },
            resumable: false
        });

        stream.on('error', (err) => {
            callback(err);
        });

        stream.on('finish', () => {
            callback(null);
        });

        stream.end(file.data);
    }else{
        callback("Invalid File!");
    }

}