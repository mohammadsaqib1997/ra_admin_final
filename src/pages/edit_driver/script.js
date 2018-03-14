import firebase from 'firebase'

import formGenInfoUpdate from '../../partials/components/forms/gen_info_update/gen_info_update.vue'
import formPasswordUpdate from '../../partials/components/forms/password_update/password_update.vue'
import formDocsUpdate from '../../partials/components/forms/docs_update/docs_update.vue'

export default {
    created: function(){
        let self = this;

        const db = firebase.database();
        self.userRef = db.ref('/users');
        self.userRef.child(self.$route.params.id).on('value', function (snap) {
            let renderData = snap.val();
            if (renderData !== null && renderData.type === "driver") {
                self.sel_uid = snap.key;
                self.formdata.fname = renderData.first_name;
                self.formdata.lname = renderData.last_name;
                self.formdata.email = renderData.email;
                self.formdata.mobile_number = renderData.mob_no;
                self.formdata.cnic_number = self.checkField(renderData.cnic_no);
                self.formdata.driving_license = self.checkField(renderData.driving_license);
                self.formdata.sel_adda = self.checkField(renderData.adda_ref);
                self.formdata.offline_driver = self.checkField(renderData.offline);
                self.formdata.vehicle = renderData.vehicle;
                self.formdata.model_year = self.checkField(renderData.v_model_year);
                self.formdata.vehicle_number = self.checkField(renderData.v_number);
                self.formdata.make = self.checkField(renderData.v_make);
                self.formdata.owner = renderData.v_owner === "Yes";
                self.dataLoad = false;
            } else {
                self.$router.push('/admin');
            }
        });
    },
    data(){
        return {
            dataLoad: true,
            sel_uid: null,
            formdata: {
                fname: "",
                lname: "",
                email: "",
                mobile_number: "",
                cnic_number: "",
                driving_license: "",
                vehicle: "",
                model_year: "",
                vehicle_number: "",
                make: "",
                sel_adda: "",
                offline_driver: false
            },
            userRef: null
        }

    },
    methods: {
        checkField: function(val, assignVal){
            return (typeof val !== 'undefined') ? val: ((assignVal) ? assignVal: '');
        }
    },
    components: {
        'form_gen_info': formGenInfoUpdate,
        'form_password': formPasswordUpdate,
        'form_docs': formDocsUpdate,
    }
}