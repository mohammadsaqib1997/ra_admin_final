import firebase from 'firebase'

import addGeneralInfo from "../../partials/components/forms/add_driver/add_general_info.vue"
import addVehicleInfo from "../../partials/components/forms/add_driver/add_vehicle_info.vue"
import addDocs from "../../partials/components/forms/add_driver/add_docs.vue"

export default {
    components: {
        add_general_info: addGeneralInfo,
        add_vehicle_info: addVehicleInfo,
        add_docs: addDocs,
    },
    created: function(){
        let self = this;
        /*$(function(){
            $("#fm_add_driver").find("input[type=file]").on("change", function(event){
                self.fileChange(event);
            });
        });*/
    },
    /*beforeCreate: function () {
        this.csrf = this.$root.csrf;
    },*/
    data(){
        const db = firebase.database();
        return {
            userPushRefKey: db.ref("users").push().key,

            /*formStatus: false,
            formerrors: {},
            formdata: {
                fname: "",
                lname: "",
                email: "",
                password: "",
                confirm_password: "",
                mobile_number: "",
                cnic_number: "",
                driving_license: "",
                vehicle: "",
                model_year: "",
                vehicle_number: "",
                make: ""
            },
            formFilesData: {
                fm_profile_img: null,
                fm_cnic_img: null,
                fm_license_img: null,
                fm_reg_letter_img: null
            }*/
        }

    },
    methods: {
        /*form_submit: function (event) {
            event.preventDefault();
            let self = this;
            if(!self.formStatus){
                self.formerrors = {};
                let form = document.getElementById('fm_add_driver');
                let formData = new FormData(form);
                formData.append('_csrf', self.csrf);

                self.formStatus = true;
                self.$http.post("/admin/drivers/add_driver", formData).then(function (res) {
                    self.formStatus = false;
                    if (res.body.status === "failed") {
                        let errors = res.body.errors;
                        let getErr = {};
                        errors.forEach(function (val) {
                            if (self.formdata.hasOwnProperty(val.param) && !getErr.hasOwnProperty(val.param)) {
                                getErr[val.param] = val;
                            }else if(self.formFilesData.hasOwnProperty(val.param) && !getErr.hasOwnProperty(val.param)){
                                getErr[val.param] = val;
                            }
                        });
                        self.formerrors = getErr;
                    }else{
                        self.$router.push('/admin/drivers');
                    }
                }, function (err) {
                    self.formStatus = false;
                    console.log(err);
                });

            }
        },
        fileChange: function (event) {
            let self = this;
            let grabInput = $("#"+event.target.id);
            let grabFile = grabInput[0].files[0];
            let ValidImageTypes = ["image/jpeg", "image/png"];
            if(typeof grabFile === "undefined"){
                self.formFilesData[event.target.id] = null;
            }else{
                if (ValidImageTypes.indexOf(grabFile["type"]) < 0 || grabFile["size"] > 2000000) {
                    // invalid file
                    grabInput.replaceWith(grabInput.val("").clone(true));
                    self.formFilesData[event.target.id] = null;
                }else{
                    self.formFilesData[event.target.id] = grabFile;
                }
            }
        },
        mergeFields: function(data, m_data){
            let fieldKey = Object.keys(m_data);
            let fieldLength = fieldKey.length;
            if(fieldLength > 0){
                for(let i=0; i < fieldLength; i++){
                    data[fieldKey[i]] = m_data[fieldKey[i]];
                }
                return data;
            }else{
                return data;
            }
        }*/
    }
}