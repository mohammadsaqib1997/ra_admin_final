import firebase from 'firebase'
import func from '../../../custom_libs/func'

export default {
    created: function () {
        let self = this;
        const db = firebase.database();
        self.userReqRef = db.ref('/user_requests');
        self.userRef = db.ref('/users');
        self.userReqInvoiceRef = db.ref('/user_request_invoices');
        self.userReqInvoiceRef.child(self.$route.params.id).once('value').then(function (invSnap) {
            let invData = invSnap.val();
            if(invData !== null){
                self.userRef.child(invData.client_uid).once('value').then(function (clientSnap) {
                    let clientData = clientSnap.val();
                    self.userRef.child(invData.driver_uid).once('value').then(function (driverSnap) {
                        let driverData = driverSnap.val();
                        self.userReqRef.child(invData.client_uid+"/"+invData.req_id).once('value').then(function (reqSnap) {
                            let reqData = reqSnap.val();

                            invData['createdAt'] = func.set_date_ser(new Date(func.decode_key(invSnap.key)));
                            invData['invoice_no'] = func.getSetInvoiceNo(invSnap.key, invData.invoice_no, 'U');

                            reqData['createdAt'] = func.set_date_ser(new Date(reqData.createdAt));

                            self.invData = {
                                inv_data: invData,
                                client_data: clientData,
                                driver_data: driverData,
                                req_data: reqData,
                            };
                            self.dataLoad = false;
                        });
                    });
                });
            }else{
                self.invData = null;
                self.dataLoad = false;
            }
        });
    },
    data: function(){
        return {
            dataLoad: true,
            invData: null,
            userReqInvoiceRef: null,
            userReqRef: null,
            userRef: null
        }
    },
    methods: {
        
    }
}