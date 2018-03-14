const csv = require('csvtojson');
const _ = require('lodash');

const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: require('../config/private.json').config_fb.databaseURL
});
const db = admin.database();
const adda_list_ref = db.ref("adda_list");

// read and insert here

let data = {};
let ind = 0;
csv()
    .fromFile('..\\config\\drivers_adda_list.csv')
    .on('json', function (obj) {
        let item = _.values(obj);
        let grab = _.split(item[0], '\t');
        grab.push(item[1]);

        let err = false;
        grab.forEach(function (value) {
            if(typeof value === 'undefined') {
                err = true;
            }
        });
        if(!err){
            ind++;
            data[ind+"a"] = {
                id: ind+"a",
                location: {
                    lat: parseFloat(_.replace(grab[4], '"', '')),
                    lng:parseFloat(_.replace(grab[5], '"', ''))
                },
                place_name: grab[1].toLowerCase()
            };
        }
    }).on('done', function (err) {
        if (err){
            console.log(err)
        }
        adda_list_ref.set(data, function (err) {
            if (err) {
                console.log(err);
            }else{
                console.log('Successfully insertion');
            }
        });
        console.log('end');
});