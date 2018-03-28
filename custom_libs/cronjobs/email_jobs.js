let func = require('./../func');
let moment = require('moment');
let pug = require('pug');
let fs = require('fs');

let config = require('../../config/private.json');

let nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport(config.smtp);

let admin = require("firebase-admin");
let serviceAccount = require("../../config/serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: require('../../config/private.json').config_fb.databaseURL
});
let db = admin.database();
let user_req_invoices = db.ref("user_request_invoices");
let driver_commission_invoices = db.ref("driver_commission_invoices");
let wallet = db.ref("wallet");
let userRequests = db.ref("user_requests");
let users = db.ref("users");

let tot_u_inv_count = 0;
let last_u_inv_count = 0;

let tot_d_inv_count = 0;
let last_d_inv_count = 0;

let mail = {
    sendUserInvoiceMail: function () {
        user_req_invoices.once('value', function (totSnap) {
            tot_u_inv_count = totSnap.numChildren();
            user_req_invoices.on('child_added', function (addSnap) {
                last_u_inv_count++;
                if(tot_u_inv_count < last_u_inv_count){
                    tot_u_inv_count = last_u_inv_count;
                    let invData = addSnap.val();

                    users.child(invData.client_uid).once('value', function (clientSnap) {
                        let clientData = clientSnap.val();

                        users.child(invData.driver_uid).once('value', function (driverSnap) {
                            let driverData = driverSnap.val();

                            userRequests.child(invData.client_uid+"/"+invData.req_id).once('value', function (reqSnap) {
                                let reqData = reqSnap.val();

                                invData['createdAt'] = func.set_date_ser(new Date(func.decode_key(addSnap.key)));
                                invData['invoice_no'] = func.getSetInvoiceNo(addSnap.key, invData.invoice_no, 'U');
                                reqData['createdAt'] = func.set_date_ser(new Date(reqData.createdAt));

                                let sendData = {
                                    inv_data: invData,
                                    client_data: clientData,
                                    driver_data: driverData,
                                    req_data: reqData,
                                };

                                if(clientData.email){
                                    let html = pug.renderFile(__dirname + '/../views/email_templates/u_invoice.pug', sendData);
                                    let mailOption = {
                                        from: '"RoadioApp Pakistan" <noreply@roadioapp.com>',
                                        to: clientData.email,
                                        subject: 'Invoice #'+invData['invoice_no'],
                                        html: html
                                    };
                                    transporter.sendMail(mailOption, function (err, info) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            console.log(info);
                                        }
                                    });
                                }
                            });
                        });
                    });
                }
            });
        });
    },
    sendDriverInvoiceMail: function () {
        driver_commission_invoices.once('value', function (totSnap) {
            tot_d_inv_count = totSnap.numChildren();
            driver_commission_invoices.on('child_added', function (addSnap) {
                last_d_inv_count++;
                if(tot_d_inv_count < last_d_inv_count){
                    tot_d_inv_count = last_d_inv_count;
                    let comInvData = addSnap.val();

                    user_req_invoices.child(comInvData.user_invoice_id).once('value', function (invSnap) {
                        let invData = invSnap.val();

                        users.child(comInvData.driver_uid).once('value', function (driverSnap) {
                            let driverData = driverSnap.val();

                            userRequests.child(invData.client_uid+"/"+invData.req_id).once('value', function (reqSnap) {
                                let reqData = reqSnap.val();

                                invData['createdAt'] = func.set_date_ser(new Date(func.decode_key(invSnap.key)));
                                invData['invoice_no'] = func.getSetInvoiceNo(invSnap.key, invData.invoice_no, 'U');

                                comInvData['createdAt'] = func.set_date_ser(new Date(func.decode_key(addSnap.key)));
                                comInvData['invoice_no'] = func.getSetInvoiceNo(addSnap.key, comInvData.invoice_no, 'D');

                                let sendData = {
                                    com_inv_data: comInvData,
                                    inv_data: invData,
                                    driver_data: driverData,
                                    req_data: reqData,
                                };

                                if(driverData.email){
                                    let html = pug.renderFile(__dirname + '/../views/email_templates/d_invoice.pug', sendData);
                                    let mailOption = {
                                        from: '"RoadioApp Pakistan" <noreply@roadioapp.com>',
                                        to: driverData.email,
                                        subject: 'Commission Invoice #'+comInvData['invoice_no'],
                                        html: html
                                    };
                                    transporter.sendMail(mailOption, function (err, info) {
                                        if (err) {
                                            console.log(err);
                                        }else{
                                            console.log(info);
                                        }
                                    });
                                }

                            });
                        });
                    });
                }
            });
        });
    }
};

mail.sendUserInvoiceMail();
mail.sendDriverInvoiceMail();


/*fs.writeFile(__dirname + "/test.html", html, function (err) {
 if (err) {
 return console.log(err);
 }

 console.log("The file was saved!");
 });*/


/*let mailOption = {
 from: '"RoadioApp Pakistan" <noreply@roadioapp.com>',
 to: "mohammadsaqib1997@gmail.com",
 subject: 'New User',
 html: html
 };
 transporter.sendMail(mailOption, function (err, info) {
 if (err) {
 console.log(err);
 }else{
 console.log(info);
 }
 });*/