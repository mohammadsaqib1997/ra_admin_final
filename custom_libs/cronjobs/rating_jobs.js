let moment = require('moment');

let admin = require("firebase-admin");
let serviceAccount = require("../../config/serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: require('../../config/private.json').config_fb.databaseURL
});
let db = admin.database();
let user_active_requests = db.ref("user_active_requests");

let assignJobs = {};

const jobs = {
    automatedRating() {
        let self = this;
        let tot_rows = 0;
        let count_rows = 0;
        assignJobs = {};


        user_active_requests.on('child_added', function (snap) {
            let data = snap.val();
            if (data !== null) {
                if (data.status === 'req.complete' && data.complete_time > 0) {
                    let comp_time = moment(data.complete_time);
                    let cur_time = moment();
                    let timeOut_ms = cur_time.diff(comp_time);
                    console.log(timeOut_ms);
                    if (timeOut_ms >= 15000) {
                        console.log("Completed: "+timeOut_ms);
                        /* assignJobs[snap.key] = setTimeout(function() {
                            console.log("Autorated shift! "+snap.key);
                        }, parseInt(timeOut_ms)); */
                    }
                    /* console.log(comp_time.format('DD/MM/YYYY hh:mm:ss'));
                    console.log(cur_time.format('DD/MM/YYYY hh:mm:ss'));
                     */

                }
            }
        });

        /* user_active_requests.on('child_changed', function (snap) {
            let data = snap.val();
            if (data !== null) {
                if (data.status === 'req.complete' && data.complete_time > 0) {
                    let time = moment(data.complete_time);
                    let f_time = time.clone().add(15, 's');
                    let timeOut_ms = f_time.diff(time);
                    assignJobs[snap.key] = setTimeout(function() {
                        console.log("Autorated shift! "+snap.key);
                    }, parseInt(timeOut_ms));
                }
            }
        }); */

        user_active_requests.on('child_removed', function (snap) {
            let data = snap.val();
            if (data !== null) {
                if (assignJobs.hasOwnProperty(snap.key)) {
                    clearTimeout(assignJobs[snap.key]);
                    delete assignJobs[snap.key];
                }
            }
        });
    }
};

jobs.automatedRating();

