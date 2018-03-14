const csv = require('csvtojson');
const _ = require('lodash');
const fs = require('fs');
const bcrypt = require("bcrypt-nodejs");
const moment = require('moment');
const saltRounds = 10;

const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: require('../config/private.json').config_fb.databaseURL
});
const db = admin.database();
const adda_list_ref = db.ref("adda_list");
const users_ref = db.ref("users");

// read and insert here
let data = {};
let keys = [];
let processInd = 0;

adda_list_ref.once('value', function (snap) {
    if (snap.val() !== null) {
        keys = _.map(snap.val(), function (obj) {
            return parseInt(_.replace(obj.id, 'a', ''));
        });
        keys = _.sortBy(keys);
        readFile();
    } else {
        console.log('No data found!');
    }
});

function readFile() {
    if (typeof keys[processInd] !== 'undefined') {
        fs.stat('..\\config\\adda_list_drivers\\' + keys[processInd] + '.csv', function (err, stats) {
            if (err) {
                console.log(err);
            } else {
                fileReadData(keys[processInd]);
            }
        });
    }
}

function fileReadData(key) {
    csv()
        .fromFile('..\\config\\adda_list_drivers\\' + key + '.csv')
        .on('json', function (obj) {
            let vehicles = _.split(obj['Vehicle'], '|');
            let mob_numbers = _.split(obj['Mobile Number'], '|');
            let ref = users_ref.push();
            let salt = bcrypt.genSaltSync(saltRounds);
            let hash = bcrypt.hashSync(moment().format('x'), salt);
            data[ref.key] = {
                adda_ref: key+'a',
                id: ref.key,
                first_name: obj['Name'],
                vehicle: vehicles[0],
                mob_no: (mob_numbers[0].replace('0', '92')).replace('-', ''),
                email: '',
                password: hash,
                last_name: '',
                status: 1,
                type: 'driver'
            };

        }).on('done', function (err) {
        if (err) {
            console.log(err)
        }

        console.log('complete ref key: ' + key);
        processInd++;
        if (processInd === keys.length) {
            users_ref.update(data, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Successfully adda users insertion.');
                }
            });
        } else {
            readFile();
        }
    });
}
