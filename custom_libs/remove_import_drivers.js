const _ = require('lodash');

const admin = require("firebase-admin");
const serviceAccount = require("../config/serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: require('../config/private.json').config_fb.databaseURL
});
const db = admin.database();
//const adda_list_ref = db.ref("adda_list");
const import_users_ref = db.ref("import_users");

// read and insert here
let adda_ref_id = '';
import_users_ref.orderByChild('adda_ref').equalTo(adda_ref_id).once('value', function (snap) {
    if(snap.val()) {
        let data = {};
        _.map(snap.val(), function (obj, key) {
            data[key] = null;
        });
        import_users_ref.update(data, function (err) {
            if(err) {
                console.log(err.message);
            }else{
                console.log("Successfully remove data!");
            }
        });
    }else {
        console.log("No data found!");
    }
});