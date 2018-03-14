import firebase from 'firebase'
import _ from 'lodash'
import func from '../../../../../custom_libs/func.js'

import Promise from 'bluebird'
import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

export default {
    created: function(){
        let self = this;
        self.addaListRef.once('value', function (snap) {
            if (snap.val() !== null) {
                self.addaListData = _.map(snap.val(), function (val) {
                    let obj = val;
                    obj['place_name'] = func.toTitleCase(val.place_name);
                    return obj;
                });
            }
        });
    },
    props: [
        'formdata', 'sel_uid'
    ],
    data(){
        const db = firebase.database();
        return {
            addaListRef: db.ref("adda_list"),
            userRef: db.ref('/users'),
            addaListData: [],
            formStatus: false,
            sucMsg: "",
            errMsg: ""
        }

    },
    validators: {
        'formdata.fname': function (value) {
            return Validator.value(value).required().lengthBetween(3, 20);
        },
        'formdata.lname': function (value) {
            return Validator.value(value).required().lengthBetween(3, 20);
        },
        'formdata.email': function (value) {
            let self = this;
            return Validator.value(value).required().email().maxLength(50).custom(function () {
                if (!Validator.isEmpty(value)) {
                    return Promise.delay(1000)
                        .then(function () {
                            return self.userRef.orderByChild('email').equalTo(value).once('value').then(function (snap) {
                                let snapData = snap.val();
                                if(snapData !== null){
                                    let keys = Object.keys(snap.val());
                                    let valid = true;
                                    keys.forEach(function (row) {
                                        let selItem = snapData[row];
                                        if(row === self.sel_uid){
                                            return false;
                                        }
                                        if(selItem.type === "driver"){
                                            valid = false;
                                            return false;
                                        }
                                    });
                                    if(!valid){
                                        return 'Already taken!';
                                    }
                                }
                            });
                        });
                }
            });
        },
        'formdata.mobile_number': function (value) {
            let self = this;
            return Validator.value(value).required().digit().lengthBetween(12, 12, "Invalid Mobile Number!").custom(function () {
                if (!Validator.isEmpty(value)) {
                    return Promise.delay(1000)
                        .then(function () {
                            return self.userRef.orderByChild('mob_no').equalTo(value).once('value').then(function (snap) {
                                let snapData = snap.val();
                                if(snapData !== null){
                                    let keys = Object.keys(snap.val());
                                    let valid = true;
                                    keys.forEach(function (row) {
                                        let selItem = snapData[row];
                                        if(row === self.sel_uid){
                                            return false;
                                        }
                                        if(selItem.type === "driver"){
                                            valid = false;
                                            return false;
                                        }
                                    });
                                    if(!valid){
                                        return 'Already taken!';
                                    }
                                }
                            });
                        });
                }
            });
        },
        'formdata.cnic_number': function (value) {
            return Validator.value(value).required().digit().lengthBetween(13, 13, "Invalid CNIC Number!");
        },
        'formdata.driving_license': function (value) {
            return Validator.value(value).required().minLength(5).maxLength(35);
        },
        'formdata.vehicle': function (value) {
            return Validator.value(value).required().in(['Bike', 'Car', 'Pickup', 'Truck']);
        },
        'formdata.model_year': function (value) {
            return Validator.value(value).required().digit().lengthBetween(4, 4, "Invalid Year!");
        },
        'formdata.vehicle_number': function (value) {
            return Validator.value(value).required().lengthBetween(7, 8, "Invalid Vehicle Number!");
        },
        'formdata.make': function (value) {
            return Validator.value(value).required().minLength(3).maxLength(20);
        },
        'formdata.sel_adda': function(value) {
            return Validator.value(value).maxLength(30);
        }
    },
    methods: {
        form_submit: function () {
            let self = this;
            self.formStatus = true;
            self.$validate().then(function (success) {
                if(success){
                    self.userRef.child(self.sel_uid).update({
                        'first_name': self.formdata.fname,
                        'last_name': self.formdata.lname,
                        'email': self.formdata.email,
                        'mob_no': self.formdata.mobile_number,
                        'cnic_no': self.formdata.cnic_number,
                        'driving_license': self.formdata.driving_license,
                        'vehicle': self.formdata.vehicle,
                        'v_model_year': self.formdata.model_year,
                        'v_number': self.formdata.vehicle_number,
                        'v_make': self.formdata.make,
                        'v_owner': (self.formdata.owner) ? "Yes": "No",
                        'adda_ref': self.formdata.sel_adda,
                        'offline': self.formdata.offline_driver
                    }, function (err) {
                        if(err){
                            self.errMsg = err.message;
                        }else{
                            self.errMsg = "";
                            self.sucMsg = "Successfully updated data!";
                            setTimeout(function () {
                                self.sucMsg = "";
                            }, 1500);
                        }
                        self.formStatus = false;
                    });
                }else{
                    self.formStatus = false;
                }
            });
        }
    }
}