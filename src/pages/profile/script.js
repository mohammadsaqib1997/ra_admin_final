import firebase from 'firebase'
import func from '../../../custom_libs/func'

import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

import driverLogsSection from '../../partials/components/sections/driver_logs/index.vue'

export default {
    components: {
        driverLogsSection
    },
    created: function () {
        let self = this;

        self.$watch('debitTxt', function (val, oldVal) {
            self.debitTxt = self.$root.isNumber(val, oldVal);
        });
        self.$watch('creditTxt', function (val, oldVal) {
            self.creditTxt = self.$root.isNumber(val, oldVal);
        });
        self.$watch('narrationTxt', function (val, oldVal) {
            self.narrationTxt = self.$root.trim(val, oldVal);
        });

        const db = firebase.database();
        self.walletRef = db.ref('/wallet');
        self.driverComInvoiceRef = db.ref('/driver_commission_invoices');
        self.userReqInvoiceRef = db.ref('/user_request_invoices');
        self.completeReqRef = db.ref('/complete_requests');
        self.activeReqRef = db.ref('/user_active_requests');
        self.userReqRef = db.ref('/user_requests');
        self.driverBidsRef = db.ref('/driver_bids');
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
            dataLoad: true,
            dataLoad1: true,
            dataLoad2: true,
            dataLoad3: true,
            dataLoad4: true,
            dataLoad5: true,
            // loaded in variables
            userData: {},
            completeReqData: {},
            pendingReqData: {},
            invoiceReqData: {},
            invoiceComData: {},
            walletData: {},
            invoiceComDataTotal: 0,
            invoiceReqDataTotal: 0,
            completeReqDataTotal: 0,
            pendingReqDataTotal: 0,
            // image load var
            profileImgLoad: true,
            cnicImgLoad: true,
            licenceImgLoad: true,
            letterImgLoad: true,
            profileImgURL: "",
            cnicImgURL: "",
            licenceImgURL: "",
            letterImgURL: "",
            // wallet var
            totDebit: 0,
            totCredit: 0,
            // database reference
            userRef: null,
            completeReqRef: null,
            activeReqRef: null,
            userReqRef: null,
            userReqInvoiceRef: null,
            driverComInvoiceRef: null,
            driverBidsRef: null,
            walletRef: null,
            // add voucher fields
            debitTxt: 0,
            creditTxt: 0,
            narrationTxt: "",
            mainErr: "",
            mainMsg: "",
            // search table
            search_table1: '',
            search_table2: '',
            search_table3: '',
            search_table4: '',
            search_table5: '',
        }

    },
    validators: {
        narrationTxt: function (value) {
            return Validator.value(value).required().minLength(6).maxLength(100);
        }
    },
    watch: {
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
        },
        search_table5: function (val) {
            func.tableSearch(this.$refs.table5, val);
        },
        userData: function (val) {
            let self = this;
            if (val.type === 'driver') {
                self.complete_req_driver(self, val.key, val);
                self.pending_req_driver(self, val.key, val);
                self.user_req_invoices(self, val.key, val);
                self.driver_com_invoices(self, val.key);
                self.driver_wallet(self, val.key);
                self.getImgs(self, val.key);
            }
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
        complete_req_driver: function (self, uid, driver_data) {
            self.completeReqRef.orderByChild('driver_uid').equalTo(uid).once('value').then(function (snap) {
                let com_req_data = snap.val();
                if (com_req_data !== null) {
                    let keys = Object.keys(com_req_data);
                    let key_length = keys.length;
                    let processItem = 0;
                    self.completeReqDataTotal = 0;
                    keys.forEach(function (row) {
                        let completed_req_data = com_req_data[row];
                        self.userReqRef.child(completed_req_data.client_uid + "/" + row).once('value', function (userReqSnap) {
                            let user_req_data = userReqSnap.val();
                            user_req_data['createdAt'] = func.set_date_ser(new Date(user_req_data.createdAt));
                            self.driverBidsRef.child(row + "/" + uid).once('value', function (bidSnap) {
                                let bid_data = bidSnap.val();
                                self.userRef.child(completed_req_data.client_uid).once('value', function (clientSnap) {
                                    let client_data = clientSnap.val();
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
        pending_req_driver: function (self, uid, driver_data) {
            self.activeReqRef.orderByChild('driver_uid').equalTo(uid).once('value').then(function (snap) {
                let pend_req_data = snap.val();
                /*console.log(pend_req_data);
                 self.dataLoad2 = false;*/
                if (pend_req_data !== null) {
                    let keys = Object.keys(pend_req_data);
                    let key_length = keys.length;
                    let processItem = 0;
                    self.pendingReqDataTotal = 0;
                    keys.forEach(function (row) {
                        let pending_req_data = pend_req_data[row];
                        self.userReqRef.child(row + "/" + pending_req_data.req_id).once('value', function (userReqSnap) {
                            let user_req_data = userReqSnap.val();
                            user_req_data['createdAt'] = func.set_date_ser(new Date(user_req_data.createdAt));
                            self.driverBidsRef.child(pending_req_data.req_id + "/" + uid).once('value', function (bidSnap) {
                                let bid_data = bidSnap.val();
                                self.userRef.child(row).once('value', function (clientSnap) {
                                    let client_data = clientSnap.val();
                                    self.pendingReqDataTotal += parseInt(bid_data.amount);
                                    self.pendingReqData[pending_req_data.req_id] = {
                                        client_data: client_data,
                                        driver_data: driver_data,
                                        active_req_data: pending_req_data,
                                        request_data: user_req_data,
                                        bid_data: bid_data
                                    };
                                    processItem++;
                                    if (processItem === key_length) {
                                        self.pendingReqData = func.sortObj(self.pendingReqData);
                                        self.dataLoad2 = false;
                                    }
                                });
                            });
                        });
                    });
                } else {
                    self.dataLoad2 = false;
                }
            });
        },
        user_req_invoices: function (self, uid, driver_data) {
            self.userReqInvoiceRef.orderByChild('driver_uid').equalTo(uid).once('value').then(function (userReqInvoiceSnap) {
                let userReqInvoiceData = userReqInvoiceSnap.val();
                if (userReqInvoiceData !== null) {
                    let keys = Object.keys(userReqInvoiceData);
                    let key_length = keys.length;
                    let processItem = 0;
                    self.invoiceReqDataTotal = 0;
                    keys.forEach(function (row) {
                        let invoice_data = userReqInvoiceData[row];
                        self.userReqRef.child(invoice_data.client_uid + "/" + invoice_data.req_id).once('value').then(function (reqSnap) {
                            let reqData = reqSnap.val();
                            self.userRef.child(invoice_data.client_uid).once('value', function (clientSnap) {
                                let client_data = clientSnap.val();
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
                                    self.dataLoad3 = false;
                                }
                            });
                        });
                    });
                } else {
                    self.dataLoad3 = false;
                }
            });
        },
        driver_com_invoices: function (self, uid) {
            self.driverComInvoiceRef.orderByChild('driver_uid').equalTo(uid).once('value').then(function (driverComInvoiceSnap) {
                let driverComInvoiceData = driverComInvoiceSnap.val();
                if (driverComInvoiceData !== null) {
                    let keys = Object.keys(driverComInvoiceData);
                    let key_length = keys.length;
                    let processItem = 0;
                    self.invoiceComDataTotal = 0;
                    keys.forEach(function (key) {
                        let comInvItemData = driverComInvoiceData[key];
                        comInvItemData['createdAt'] = func.set_date_ser(new Date(func.decode_key(key)));
                        comInvItemData['invoice_no'] = func.getSetInvoiceNo(key, comInvItemData.invoice_no, "D");
                        self.userReqInvoiceRef
                            .child(comInvItemData.user_invoice_id)
                            .once('value')
                            .then(function (userReqInvSnap) {
                                let userReqInvData = userReqInvSnap.val();
                                comInvItemData['order_invoice'] = func.getSetInvoiceNo(userReqInvSnap.key, userReqInvData.invoice_no, "U");
                                comInvItemData['order_inv_key'] = userReqInvSnap.key;
                                self.invoiceComData[key] = comInvItemData;
                                self.invoiceComDataTotal += comInvItemData.commission_amount;
                                processItem++;
                                if (processItem === key_length) {
                                    self.invoiceComData = func.sortObj(self.invoiceComData);
                                    self.dataLoad4 = false;
                                }
                            });
                    });
                } else {
                    self.dataLoad4 = false;
                }
            });
        },
        driver_wallet: function (self, uid) {
            self.walletRef.orderByChild('uid').equalTo(uid).on('value', function (walletSnap) {
                let walletData = walletSnap.val();
                if (walletData !== null) {
                    let keys = Object.keys(walletData);
                    let key_length = keys.length;
                    let processItem = 0;
                    let oldBalance = 0;
                    self.totDebit = 0;
                    self.totCredit = 0;
                    keys.forEach(function (row) {
                        let rowSel = walletData[row];
                        rowSel['addedAt'] = func.set_date_ser(new Date(func.decode_key(row)));
                        rowSel['balance'] = oldBalance = func.getBalance(oldBalance, rowSel.debit, rowSel.credit);

                        self.totDebit += rowSel.debit;
                        self.totCredit += rowSel.credit;
                        self.walletData[row] = rowSel;
                        processItem++;
                        if (processItem === key_length) {
                            self.walletData = func.sortObj(self.walletData, false);
                            self.dataLoad5 = false;
                        }
                    });
                } else {
                    self.dataLoad5 = false;
                }
            });
        },
        addVoucher: function () {
            let self = this;
            if (self.userData !== null) {
                self.$validate().then(function (success) {
                    if (success) {
                        self.walletRef.push({
                            uid: self.userData.key,
                            narration: self.narrationTxt,
                            debit: self.debitTxt,
                            credit: self.creditTxt,
                            type: "driver_w"
                        }, function (err) {
                            if(err){
                                self.mainErr = err.message;
                            }else{
                                self.narrationTxt = "";
                                self.debitTxt = 0;
                                self.creditTxt = 0;
                                self.validation.reset();
                                self.mainMsg = "Successfully add amount!";
                                setTimeout(function(){
                                    self.mainMsg = "";
                                }, 3000);
                            }
                        });
                    }
                });
            }
        },
        getLastRow: function (obj) {
            let keys = Object.keys(obj);
            let key_length = keys.length;
            return obj[keys[key_length - 1]];
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
            if(self.cnicImgLoad){
                let ref = storage.ref('driver_cnic_images/'+uid+'.jpg');
                ref.getDownloadURL().then(function (url) {
                    self.cnicImgURL = url;
                    self.cnicImgLoad = false;
                }, function (err) {
                    self.cnicImgLoad = false;
                });
            }
            if(self.licenceImgLoad){
                let ref = storage.ref('driver_license_images/'+uid+'.jpg');
                ref.getDownloadURL().then(function (url) {
                    self.licenceImgURL = url;
                    self.licenceImgLoad = false;
                }, function (err) {
                    self.licenceImgLoad = false;
                });
            }
            if(self.letterImgLoad){
                let ref = storage.ref('driver_registration_letter_images/'+uid+'.jpg');
                ref.getDownloadURL().then(function (url) {
                    self.letterImgURL = url;
                    self.letterImgLoad = false;
                }, function (err) {
                    self.letterImgLoad = false;
                });
            }
        }
    }
}