var func = require('./../func');
var moment = require('moment');

var admin = require("firebase-admin");
var serviceAccount = require("../../config/serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: require('../../config/private.json').config_fb.databaseURL
});
var db = admin.database();
var user_active_req_ref = db.ref("user_active_requests");
var driver_bids_ref = db.ref("driver_bids");
var commission_ref = db.ref("commission");
var user_req_invoices = db.ref("user_request_invoices");
var driver_commission_invoices = db.ref("driver_commission_invoices");
var onlineDrivers = db.ref("online_drivers");
var wallet = db.ref("wallet");
var userLiveRequests = db.ref("user_live_requests");
var userRequests = db.ref("user_requests");
var users = db.ref("users");
var notificationKeys = db.ref("notification_keys");
var complete_requests_ref = db.ref("complete_requests");

//topics
var allDrivers = "AllDrivers";

var config = require("../../config/private.json").nexmo;
var Nexmo = require("nexmo");
var nexmo = new Nexmo({
    apiKey: config.api_key,
    apiSecret: config.api_secret,
});

var jobs = {
    driver_live_check: function () {
        let self = this;
        let today = moment();
        let prev_time = moment(today).subtract(5, 'minutes');
        let prevTimeMS = parseInt(prev_time.unix()+""+prev_time.get('millisecond'));
        onlineDrivers.orderByChild('addedTime').endAt(prevTimeMS).once('value').then(function (onDriverSnap) {
            let onDriverData = onDriverSnap.val();
            if(onDriverData !== null){
                let keys = Object.keys(onDriverData);
                let keys_length = keys.length;
                let process_item = 0;
                keys.forEach(function (key) {
                    onlineDrivers.child(key).remove();
                    process_item++;
                    if(keys_length === process_item){
                        setTimeout(function () {
                            self.driver_live_check();
                        }, 5000);
                    }
                });
            }else{
                setTimeout(function () {
                    self.driver_live_check();
                }, 5000);
            }
        });
    },
    driver_submit_job: function(){
        var self = this;
        user_active_req_ref.on('child_changed', function (actSnap) {
            var actData = actSnap.val();
            if(actData !== null){
                if(actData.status === 'req.complete'){
                    var user_invoice_record = {
                        invoice_no: "000",
                        client_uid: actSnap.key,
                        driver_uid: actData.driver_uid,
                        req_id: actData.req_id,
                        amount: 0
                    };
                    driver_bids_ref.child(user_invoice_record.req_id+'/'+user_invoice_record.driver_uid).once('value').then(function (bidSnap) {
                        var bidData = bidSnap.val();
                        user_invoice_record['amount'] = parseInt(bidData.amount);
                        user_req_invoices.orderByChild('invoice_no').limitToLast(1).once('value').then(function(userInvSnap){
                            if(userInvSnap.val() !== null){
                                var userInvData = userInvSnap.val();
                                var keys = Object.keys(userInvData);
                                user_invoice_record['invoice_no'] = func.genInvoiceNo(parseInt(userInvData[keys[0]].invoice_no)+1);
                            }else{
                                user_invoice_record['invoice_no'] = func.genInvoiceNo(1);
                            }
                            self.insertUserReqInvoice(user_invoice_record, function (u_invoice_key) {
                                commission_ref.child("percent").once('value').then(function (comSnap) {
                                    let comData = comSnap.val();
                                    var driver_com_invoice_record = {
                                        invoice_no: user_invoice_record['invoice_no'],
                                        driver_uid: user_invoice_record['driver_uid'],
                                        req_id: user_invoice_record['req_id'],
                                        user_invoice_id: u_invoice_key,
                                        apply_commission: parseInt(comData),
                                        commission_amount: func.getPercentAmount(user_invoice_record['amount'], comData)
                                    };
                                    self.insertDriverComInvoice(driver_com_invoice_record, function (d_invoice_key) {
                                        var commission_record = {
                                            credit: 0,
                                            debit: driver_com_invoice_record['commission_amount'],
                                            uid: driver_com_invoice_record['driver_uid'],
                                            narration: "Commission Entry from this order #"+func.getSetInvoiceNo(u_invoice_key, user_invoice_record['invoice_no'], "U"),
                                            type: "driver_w"
                                        };
                                        self.insertWalletVoucher(commission_record, function (wallet_key) {

                                            /*wallet.orderByChild("uid").equalTo(driver_com_invoice_record['driver_uid']).once('value').then(function (walletSnap) {
                                                var walletData = walletSnap.val();
                                                if(walletData !== null){
                                                    var keys = Object.keys(walletData);
                                                    var key_length = keys.length;
                                                    var process_items = 0;
                                                    var credit = 0;
                                                    var debit = 0;
                                                    keys.forEach(function (key) {
                                                        var w_item = walletData[key];
                                                        credit += w_item.credit;
                                                        debit += w_item.debit;
                                                        process_items++;
                                                        if(process_items === key_length){
                                                            console.log(credit+"---"+debit);
                                                        }
                                                    });
                                                }
                                            });*/
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            }
        });
    },
    insertUserReqInvoice: function (record, callback) {
        var self = this;
        if(record !== null){
            let keyRef = user_req_invoices.push();
            keyRef.set(record, function (err) {
                if(err){
                    self.insertUserReqInvoice(record);
                }else{
                    callback(keyRef.key);
                }
            });
        }
    },
    insertDriverComInvoice: function (record, callback) {
        var self = this;
        if(record !== null){
            let keyRef = driver_commission_invoices.push();
            keyRef.set(record, function (err) {
                if(err){
                    self.insertDriverComInvoice(record);
                }else{
                    callback(keyRef.key);
                }
            });
        }
    },
    insertWalletVoucher: function (record, callback) {
        var self = this;
        if(record !== null){
            let keyRef = wallet.push();
            keyRef.set(record, function (err) {
                if(err){
                    self.insertWalletVoucher(record);
                }else{
                    callback(keyRef.key);
                }
            });
        }
    },
    sendNotifLiveReq: function () {
        let self = this;
        let tot_user_live_req = 0;
        let count_user_live_req = 0;
        userLiveRequests.once('value', function (tot_snap) {
            tot_user_live_req = tot_snap.numChildren();
            userLiveRequests.on("child_added", function (live_req) {
                count_user_live_req++;
                if(tot_user_live_req < count_user_live_req){
                    tot_user_live_req = count_user_live_req;
                    users.child(live_req.key).once('value', function (userSnap) {
                        let userData = userSnap.val();
                        let msg = userData.first_name+" "+userData.last_name+" ke parcel ke liye bolee lagaen.";
                        let payload = {
                            data: {
                                title: "New Request",
                                body: msg
                            }
                        };
                        self.sendTopicNotifFunc(allDrivers, payload);
                    });
                }
            });
        });
    },
    driversSubscribeNotification: function () {
        let tot_notificationKeys = 0;
        let count_notificationKeys = 0;
        notificationKeys.once('value', function (tot_snap) {
            tot_notificationKeys = tot_snap.numChildren();
            notificationKeys.on('child_added', function (notiKeySnap) {
                count_notificationKeys++;
                if(tot_notificationKeys < count_notificationKeys){
                    tot_notificationKeys = count_notificationKeys;
                    let notiKeyData = notiKeySnap.val();
                    users.child(notiKeySnap.key).once('value', function (userSnap) {
                        let userData = userSnap.val();
                        if (userData.type === "driver") {
                            admin.messaging().subscribeToTopic(notiKeyData.token, allDrivers)
                                .then(function (res) {
                                    console.log("Line 208: Successfully subscribed to topic:", res);
                                })
                                .catch(function (err) {
                                    console.log("Line 211: Error subscribing to topic:", err);
                                });
                        }
                    });
                }
            });
        });

        notificationKeys.on('child_changed', function (notiKeySnap) {
            let notiKeyData = notiKeySnap.val();
            users.child(notiKeySnap.key).once('value', function (userSnap) {
                let userData = userSnap.val();
                if (userData.type === "driver") {
                    admin.messaging().subscribeToTopic(notiKeyData.token, allDrivers)
                        .then(function (res) {
                            console.log("Successfully subscribed to topic:", res);
                        })
                        .catch(function (err) {
                            console.log("Error subscribing to topic:", err);
                        });
                }
            });
        });
    },
    sendDriverBidReqNoti: function () {
        let self = this;
        let tot_driver_bids_ref = 0;
        let count_driver_bids_ref = 0;
        let save_obj = {};
        driver_bids_ref.once('value', function (tot_snap) {
            tot_driver_bids_ref = tot_snap.numChildren();
            driver_bids_ref.on("child_added", function (driverBidReqSnap) {
                count_driver_bids_ref++;
                if(tot_driver_bids_ref < count_driver_bids_ref){
                    tot_driver_bids_ref = count_driver_bids_ref;
                    // here nested check
                    save_obj["tot_"+driverBidReqSnap.key] = 0;
                    save_obj["count_"+driverBidReqSnap.key] = 0;
                    driver_bids_ref.child(driverBidReqSnap.key).once('value', function (tot_bid_snap) {
                        save_obj["tot_"+driverBidReqSnap.key] = tot_bid_snap.numChildren();
                        driver_bids_ref.child(driverBidReqSnap.key).on("child_added", function (driverBidSnap) {
                            save_obj["count_"+driverBidReqSnap.key]++;
                            if(save_obj["tot_"+driverBidReqSnap.key] < save_obj["count_"+driverBidReqSnap.key]){
                                let bidAmount = driverBidSnap.val();
                                users.child(driverBidSnap.key).once('value', function (driverSnap) {
                                    let driverData = driverSnap.val();
                                    let msg = driverData.first_name+" "+driverData.last_name +" ne Rs."+bidAmount.amount+" ki bolee lagae.";
                                    let payload = {
                                        data: {
                                            title: "Place Bid in Request",
                                            body: msg
                                        }
                                    };
                                    userLiveRequests.orderByChild("reqId").equalTo(driverBidReqSnap.key).once('value', function (userLiveReqSnap) {
                                        if(userLiveReqSnap.val() !== null){
                                            let userKey = Object.keys(userLiveReqSnap.val())[0];
                                            notificationKeys.child(userKey).once('value', function (userNotiToken) {
                                                let userNotiData = userNotiToken.val();
                                                if(userNotiData !== null){
                                                    self.sendDevNotifFunc(userNotiData.token, payload);
                                                }
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    });
                }
                driver_bids_ref.child(driverBidReqSnap.key).on("child_changed", function (driverBidSnap) {
                    let bidAmount = driverBidSnap.val();
                    users.child(driverBidSnap.key).once('value', function (driverSnap) {
                        let driverData = driverSnap.val();
                        let msg = driverData.first_name+" "+driverData.last_name +" ne Rs."+bidAmount.amount+" ki bolee lagae.";
                        let payload = {
                            data: {
                                title: "Place Bid in Request",
                                body: msg
                            }
                        };
                        userLiveRequests.orderByChild("reqId").equalTo(driverBidReqSnap.key).once('value', function (userLiveReqSnap) {
                            if(userLiveReqSnap.val() !== null){
                                let userKey = Object.keys(userLiveReqSnap.val())[0];
                                notificationKeys.child(userKey).once('value', function (userNotiToken) {
                                    let userNotiData = userNotiToken.val();
                                    if(userNotiData !== null){
                                        admin.messaging().sendToDevice(userNotiData.token, payload)
                                            .then(function (res) {
                                                console.log("Successfully sent message:", res);
                                            })
                                            .catch(function (error) {
                                                console.log("Error sending message:", error);
                                            });
                                    }
                                });
                            }
                        });
                    });
                });
            });
        });
    },
    sendActiveReqNoti: function () {
        let self = this;
        let tot_user_active_req_ref = 0;
        let count_user_active_req_ref = 0;
        user_active_req_ref.once('value', function (tot_snap) {
            tot_user_active_req_ref = tot_snap.numChildren();
            user_active_req_ref.on("child_added", function (activeReqSnap) {
                count_user_active_req_ref++;
                if(tot_user_active_req_ref < count_user_active_req_ref){
                    tot_user_active_req_ref = count_user_active_req_ref;
                    let activeReqData = activeReqSnap.val();
                    users.child(activeReqSnap.key).once('value', function (userSnap) {
                        let userData = userSnap.val();
                        let msg = userData.first_name+" "+userData.last_name +" ne aap ki bolee manzoor karli.";
                        notificationKeys.child(activeReqData.driver_uid).once('value', function (userNotiToken) {
                            let userNotiData = userNotiToken.val();
                            if(userNotiData !== null){
                                let payload = {
                                    data: {
                                        title: "Bid Confirm",
                                        body: msg
                                    }
                                };
                                self.sendDevNotifFunc(userNotiData.token, payload);
                            }
                        });
                        users.child(activeReqData.driver_uid).once('value', function (driverSnap) {
                            let driverData = driverSnap.val();
                            nexmo.message.sendSms(config.from, driverData.mob_no, msg, {type: 'unicode'}, function (err, resData) {
                                if(err){
                                    console.log(err);
                                }else{
                                    if(resData.messages[0].status !== "0"){
                                        console.log(resData.messages[0]["error-text"]);
                                    }
                                }
                            });
                        });
                    });
                }
            });
        });

        user_active_req_ref.on("child_changed", function (activeReqSnap) {
            let actReqData = activeReqSnap.val();
            users.child(actReqData.driver_uid).once('value', function (userSnap) {
                let driverData = userSnap.val();
                let name = driverData.first_name+" "+driverData.last_name;

                notificationKeys.child(activeReqSnap.key).once('value', function (userNotiToken) {
                    let userNotiData = userNotiToken.val();
                    if(userNotiData !== null){
                        if(actReqData.status === "req.accept"){
                            let payload = {
                                data: {
                                    title: "Request Active",
                                    body: name+" aapka parcel lene ke liye araha hay."
                                }
                            };
                            self.sendDevNotifFunc(userNotiData.token, payload);
                        }else if(actReqData.status === "req.active"){
                            let payload = {
                                data: {
                                    title: "Request In Progress",
                                    body: name+" ne aapka parcel utha liya hay."
                                }
                            };
                            self.sendDevNotifFunc(userNotiData.token, payload);
                        }else if(actReqData.status === "req.complete"){
                            let payload = {
                                data: {
                                    title: "Request Complete",
                                    body: name + " ne aapka parcel pohcha dia hay. "+name+" ko rating dein."
                                }
                            };
                            self.sendDevNotifFunc(userNotiData.token, payload);

                            users.child(activeReqSnap.key).once('value', function (userSnap) {
                                nexmo.message.sendSms(config.from, userSnap.val().mob_no, payload.data.body, {type: 'unicode'}, function (err, resData) {
                                    if(err){
                                        console.log(err);
                                    }else{
                                        if(resData.messages[0].status !== "0"){
                                            console.log(resData.messages[0]["error-text"]);
                                        }
                                    }
                                });
                            });
                        }
                    }
                });
            });
        });
    },
    sendCompleteReqNoti: function () {
        let self = this;
        let tot_complete_requests_ref = 0;
        let count_complete_requests_ref = 0;
        complete_requests_ref.once('value', function (tot_snap) {
            tot_complete_requests_ref = tot_snap.numChildren();
            complete_requests_ref.on("child_added", function (compReqSnap) {
                count_complete_requests_ref++;
                if(tot_complete_requests_ref < count_complete_requests_ref){
                    tot_complete_requests_ref = count_complete_requests_ref;
                    let compReqData = compReqSnap.val();
                    users.child(compReqData.client_uid).once('value', function (userSnap) {
                        let userData = userSnap.val();
                        let name = userData.first_name+" "+userData.last_name;
                        notificationKeys.child(compReqData.driver_uid).once('value', function (userNotiToken) {
                            let userNotiData = userNotiToken.val();
                            if (userNotiData !== null) {
                                let payload = {
                                    data: {
                                        title: "Request Rating",
                                        body: name+" ne aapko "+compReqData.rating+" rating di."
                                    }
                                };
                                self.sendDevNotifFunc(userNotiData.token, payload);
                            }
                        });
                    });
                }
            });
        });

    },


    sendDevNotifFunc: function (token, payload) {
        let self = this;
        admin.messaging().sendToDevice(token, payload)
            .then(function (res) {
                console.log("Line 413: Successfully sent message:", res);
            })
            .catch(function (error) {
                //self.sendDevNotifFunc(token, payload);
                console.log("Line 417: Error sent message:", error);
            });
    },
    sendTopicNotifFunc: function (topic, payload) {
        let self = this;
        admin.messaging().sendToTopic(topic, payload)
            .then(function (res) {
                console.log("Line 424: Successfully sent message:", res);
            })
            .catch(function (error) {
                //self.sendTopicNotifFunc(topic, payload);
                console.log("Line 428: Error sent message:", error);
            });
    }
};

// Functions Call Here
jobs.driversSubscribeNotification();
jobs.driver_live_check();
jobs.driver_submit_job();

jobs.sendNotifLiveReq();
jobs.sendDriverBidReqNoti();
jobs.sendActiveReqNoti();
jobs.sendCompleteReqNoti();

