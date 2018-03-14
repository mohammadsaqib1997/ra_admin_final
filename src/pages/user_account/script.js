import firebase from 'firebase'
import func from '../../../custom_libs/func'

import tableComp from '../../partials/components/html_utils/tabel_comp.vue'

export default {
    components: {
        'table_comp': tableComp
    },
    created: function () {
        let self = this;
        const db = firebase.database();
        self.userReqInvoiceRef = db.ref('/user_request_invoices');
        self.userReqRef = db.ref('/user_requests');
        self.userRef = db.ref('/users');
        self.userReqInvoiceRef.orderByKey().once('value').then(function (userReqInvoiceSnap) {
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
                        self.userRef.child(invoice_data.driver_uid).once('value', function (driverSnap) {
                            let driver_data = driverSnap.val();
                            self.userRef.child(invoice_data.client_uid).once('value').then(function (clientSnap) {
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
    data: function () {
        return {
            dataLoad1: true,
            invoiceReqData: {},
            invoiceReqDataTotal: 0,
            userReqInvoiceRef: null,
            userReqRef: null,
            userRef: null,
            invoiceReqDataLength: 0,
        }
    },
}