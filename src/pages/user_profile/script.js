import firebase from 'firebase'
import func from '../../../custom_libs/func'

export default {
    created: function () {
        let self = this;

        const db = firebase.database();
        self.completeReqRef = db.ref('/complete_requests');
        self.activeReqRef = db.ref('/user_active_requests');
        self.userReqRef = db.ref('/user_requests');
        self.driverBidsRef = db.ref('/driver_bids');
        self.userReqInvoiceRef = db.ref('/user_request_invoices');
        self.liveReqRef = db.ref('/user_live_requests');
        self.userRef = db.ref('/users');
        self.userRef.child(self.$route.params.id).on('value', function (snap) {
            self.dataLoad = false;
            let renderData = snap.val();
            if (renderData !== null) {
                renderData['key'] = snap.key;
                self.userData = renderData;

            } else {
                self.$router.push('/admin');
            }
        });
    },
    data(){
        return {
            currentlyShowing: 0,
            dataToShow: [],

            dataLoad: true,
            dataLoad1: true,
            dataLoad2: true,
            dataLoad3: true,
            dataLoad4: true,
            userData: {},
            completeReqData: {},
            pendingReqData: {},
            liveReqData: {},
            invoiceReqData: {},
            invoiceReqDataTotal: 0,
            completeReqDataTotal: 0,
            pendingReqDataTotal: 0,
            userRef: null,
            liveReqRef: null,
            completeReqRef: null,
            activeReqRef: null,
            userReqRef: null,
            userReqInvoiceRef: null,
            driverBidsRef: null,
            // load image var
            profileImgLoad: true,
            profileImgURL: "",
            //search bars
            search_table1: "",
            search_table2: "",
            search_table3: "",
            search_table4: "",
        }

    },
    watch: {
        userData: function (val) {
            let self = this;
            if (val.type === 'client') {
                self.complete_req_user(self, val.key, val);
                self.pending_req_user(self, val.key, val);
                self.live_req_user(self, val.key);
                self.user_req_invoices(self, val.key, val);
                self.getImgs(self, val.key);
            }
        },
        search_table1: function (val) {
            func.tableSearch(this.$refs.table1, val);
        },
        search_table2: function (val) {
            func.tableSearch(this.$refs.table2, val);
        },
        search_table3: function (val) {
            func.tableSearch(this.$refs.table3, val);
        },
        search_table4: function (val) {
            func.tableSearch(this.$refs.table4, val);
        }
    },
    methods: {



        deActive: function (key) {
            let self = this;
            if (self.userRef) {
                self.userRef.child(key).update({
                    status: 0
                }, function (err) {
                    if (err) {
                        console.log(err)
                    }
                });
            }
        },
        active: function (key) {
            let self = this;
            if (self.userRef) {
                self.userRef.child(key).update({
                    status: 1
                }, function (err) {
                    if (err) {
                        console.log(err)
                    }
                });
            }
        },
        complete_req_user: function (self, uid, client_data) {
            self.completeReqRef.orderByChild('client_uid').equalTo(uid).once('value').then(function (snap) {
                let com_req_data = snap.val();
                if (com_req_data !== null) {
                    let keys = Object.keys(com_req_data);
                    let key_length = keys.length;
                    let processItem = 0;
                    self.completeReqDataTotal = 0;
                    keys.forEach(function (row) {
                        let completed_req_data = com_req_data[row];
                        self.userReqRef.child(uid + "/" + row).once('value', function (userReqSnap) {
                            let user_req_data = userReqSnap.val();
                            user_req_data['createdAt'] = func.set_date_ser(new Date(user_req_data.createdAt));
                            self.driverBidsRef.child(row + "/" + completed_req_data.driver_uid).once('value', function (bidSnap) {
                                let bid_data = bidSnap.val();
                                self.userRef.child(completed_req_data.driver_uid).once('value', function (driverSnap) {
                                    let driver_data = driverSnap.val();
                                    self.completeReqDataTotal += parseInt(bid_data.amount);
                                    self.completeReqData[row] = {
                                        client_data: client_data,
                                        driver_data: driver_data,
                                        request_data: user_req_data,
                                        bid_data: bid_data
                                    };
                                    processItem++;
                                    if (processItem === key_length) {
                                        self.completeReqData = func.sortObj(self.completeReqData);
                                        self.dataLoad1 = false;
                                    }
                                });
                            });
                        });
                    });
                } else {
                    self.dataLoad1 = false;
                }
            });
        },
        pending_req_user: function (self, uid, client_data) {
            self.activeReqRef.child(uid).once('value').then(function (snap) {
                let pend_req_data = snap.val();
                if (pend_req_data !== null) {
                    self.pendingReqDataTotal = 0;
                    self.userReqRef.child(uid + "/" + pend_req_data.req_id).once('value', function (userReqSnap) {
                        let user_req_data = userReqSnap.val();
                        user_req_data['createdAt'] = func.set_date_ser(new Date(user_req_data.createdAt));
                        self.driverBidsRef.child(pend_req_data.req_id + "/" + pend_req_data.driver_uid).once('value', function (bidSnap) {
                            let bid_data = bidSnap.val();
                            self.userRef.child(pend_req_data.driver_uid).once('value', function (driverSnap) {
                                let driver_data = driverSnap.val();
                                self.pendingReqDataTotal += parseInt(bid_data.amount);
                                self.pendingReqData[pend_req_data.req_id] = {
                                    client_data: client_data,
                                    driver_data: driver_data,
                                    active_req_data: pend_req_data,
                                    request_data: user_req_data,
                                    bid_data: bid_data
                                };
                                self.pendingReqData = func.sortObj(self.pendingReqData);
                                self.dataLoad2 = false;
                            });
                        });
                    });
                } else {
                    self.dataLoad2 = false;
                }
            });
        },
        live_req_user: function (self, uid) {
            self.liveReqRef.child(uid).once('value').then(function (snap) {
                let live_req_data = snap.val();
                if (live_req_data !== null) {
                    self.userReqRef.child(uid+"/"+live_req_data.reqId).once('value').then(function (reqSnap) {
                        let reqVal = reqSnap.val();
                        reqVal['createdAt'] = func.set_date_ser(new Date(reqVal.createdAt));
                        self.driverBidsRef.child(live_req_data.reqId).once('value').then(function (bidsSnap) {
                            if(bidsSnap.val() !== null){
                                let bidsVal = bidsSnap.val();
                                let count_length = Object.keys(bidsVal).length;
                                self.liveReqData[live_req_data.reqId] = {
                                    request_data: reqVal,
                                    num_bids: count_length
                                };
                            }
                            self.dataLoad3 = false;
                        });
                    });
                } else {
                    self.dataLoad3 = false;
                }
            });
        },
        user_req_invoices: function (self, uid, client_data) {
            self.userReqInvoiceRef.orderByChild('client_uid').equalTo(uid).once('value').then(function (userReqInvoiceSnap) {
                let userReqInvoiceData = userReqInvoiceSnap.val();
                if(userReqInvoiceData !== null){
                    let keys = Object.keys(userReqInvoiceData);
                    let key_length = keys.length;
                    let processItem = 0;
                    self.invoiceReqDataTotal = 0;
                    keys.forEach(function (row) {
                        let invoice_data = userReqInvoiceData[row];
                        self.userReqRef.child(uid + "/" + invoice_data.req_id).once('value').then(function (reqSnap) {
                            let reqData = reqSnap.val();
                            self.userRef.child(invoice_data.driver_uid).once('value', function (driverSnap) {
                                let driver_data = driverSnap.val();
                                self.invoiceReqDataTotal += parseInt(invoice_data.amount);
                                self.invoiceReqData[row] = {
                                    client_data: client_data,
                                    driver_data: driver_data,
                                    req_data: reqData,
                                    createdAt: func.set_date_ser(new Date(func.decode_key(row))),
                                    invoice_no: func.getSetInvoiceNo(row, invoice_data.invoice_no, "U"),
                                    amount: invoice_data.amount
                                };
                                processItem++;
                                if (processItem === key_length) {
                                    self.invoiceReqData = func.sortObj(self.invoiceReqData);
                                    self.dataLoad4 = false;
                                }
                            });
                        });
                    });
                }else{
                    self.dataLoad4 = false;
                }
            });
        },
        getImgs: function (self, uid) {
            const storage = firebase.storage();
            if(self.profileImgLoad){
                let ref = storage.ref('profile_images/'+uid+'.jpg');
                ref.getDownloadURL().then(function (url) {
                    self.profileImgURL = url;
                    self.profileImgLoad = false;
                }, function (err) {
                    self.profileImgLoad = false;
                });
            }
        }
    }
}