import firebase from 'firebase'
import bcrypt from "bcrypt-nodejs"
import SimpleVueValidation from 'simple-vue-validator'

const saltRounds = 10;
const Validator = SimpleVueValidation.Validator;

export default {
    created: function(){
        let self = this;
        const db = firebase.database();
        self.userRef = db.ref('/users');
    },
    props: [
        'sel_uid'
    ],
    data(){
        return {
            formStatus: false,
            password: "",
            repeat: "",
            userRef: null,
            sucMsg: "",
            errMsg: ""
        }

    },
    validators: {
        password: function (value) {
            return Validator.value(value).required().minLength(6).maxLength(35);
        },
        'repeat, password': function (repeat, password) {
            return Validator.value(repeat).required().match(password);
        }
    },
    methods: {
        form_submit: function () {
            let self = this;
            self.$validate().then(function (success) {
                if(success){
                    self.formStatus = true;
                    let salt = bcrypt.genSaltSync(saltRounds);
                    let newHash = bcrypt.hashSync(self.password, salt);
                    self.userRef.child(self.sel_uid).update({
                        'password': newHash
                    }, function (err) {
                        if(err){
                            self.errMsg = err.message;
                        }else{
                            self.errMsg = "";
                            self.sucMsg = "Successfully updated data!";
                            self.password = "";
                            self.repeat = "";
                            self.validation.reset();
                            setTimeout(function () {
                                self.sucMsg = "";
                            }, 1500);
                        }
                        self.formStatus = false;
                    });
                }
            });
        }
    }
}