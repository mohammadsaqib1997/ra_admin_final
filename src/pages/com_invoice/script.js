import firebase from 'firebase'
import func from '../../../custom_libs/func'

export default {
    created: function () {
        let self = this;

        const db = firebase.database();
        self.userReqRef = db.ref('/user_requests');
        self.userRef = db.ref('/users');
        self.userReqInvoiceRef = db.ref('/user_request_invoices');
        self.comInvoiceRef = db.ref('/driver_commission_invoices');

        self.comInvoiceRef.child(self.$route.params.id).once('value').then(function (comInvSnap) {
            let comInvData = comInvSnap.val();
            if (comInvData !== null) {
                self.userReqInvoiceRef.child(comInvData.user_invoice_id).once('value').then(function (invSnap) {
                    let invData = invSnap.val();
                    invData['inv_key'] = invSnap.key;
                    self.userRef.child(invData.driver_uid).once('value').then(function (driverSnap) {
                        let driverData = driverSnap.val();
                        self.userReqRef.child(invData.client_uid+"/"+invData.req_id).once('value').then(function (reqSnap) {
                            let reqData = reqSnap.val();

                            invData['createdAt'] = func.set_date_ser(new Date(func.decode_key(invSnap.key)));
                            invData['invoice_no'] = func.getSetInvoiceNo(invSnap.key, invData.invoice_no, 'U');

                            comInvData['createdAt'] = func.set_date_ser(new Date(func.decode_key(comInvSnap.key)));
                            comInvData['invoice_no'] = func.getSetInvoiceNo(comInvSnap.key, comInvData.invoice_no, 'D');

                            self.invData = {
                                com_inv_data: comInvData,
                                inv_data: invData,
                                driver_data: driverData,
                                req_data: reqData,
                            };
                            self.dataLoad = false;
                        });
                    });
                });
            } else {
                self.invData = null;
                self.dataLoad = false;
            }
        });
    },
    data: function () {
        return {
            dataLoad: true,
            invData: null,
            userReqInvoiceRef: null,
            comInvoiceRef: null,
            userRef: null
        }
    },
    methods: {}
}