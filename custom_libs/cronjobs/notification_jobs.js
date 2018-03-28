const _ = require('lodash');
const moment = require('moment');

const admin = require("firebase-admin");
const conf = require("../../config/private");
const serviceAccount = require("../../config/serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: conf.config_fb.databaseURL
});
const db = admin.database();
const adminNotificationsRef = db.ref("admin_notifications");
let users = db.ref("users");

const jobs = {
    new_user_notify () {
        let tot_users = 0;
        let count_users = 0;
        users.once('value', function (snap) {
            tot_users = snap.numChildren();
            users.on('child_added', function (userSnap) {
                count_users++;
                if(tot_users < count_users) {
                    tot_users = count_users;
                    const snapVal = userSnap.val();
                    let noti_body = {
                        body: "",
                        seen: false,
                        link: "",
                        id: userSnap.key,
                        created_at: parseInt(moment().format('x'))
                    };
                    snapVal.type = (snapVal.type === "client") ? "user": snapVal.type;
                    noti_body['body'] = snapVal.first_name+" "+snapVal.last_name+" joined as "+snapVal.type;
                    noti_body['link'] = "/admin/"+snapVal.type+"s/profile/"+noti_body.id;
                    adminNotificationsRef.child(noti_body.id).set(noti_body, function (err) {
                        if (err) {
                            console.log("Set notification errors: ",err);
                        }else{
                            console.log("Successfully Notification Inserted!");
                        }
                    });
                }
            });
        });
    }
};

jobs.new_user_notify();