<template lang="pug">
    .box
        .box-header
            h3.box-title General Information
        .box-body
            .row
                .col-md-12(v-if="formUtil.err !== '' || formUtil.suc !== ''")
                    p.alert.alert-danger(v-if="formUtil.err !== ''") {{ formUtil.err }}
                    p.alert.alert-success(v-if="formUtil.suc !== ''") {{ formUtil.suc }}
                .col-md-6
                    .form-group
                        label(for='first_name') First Name*
                        input.form-control(type='text' id='first_name' v-model.trim='first_name' placeholder='Eg: Ali')
                        p.text-danger.text-right(v-if='validation.hasError("first_name")') {{ validation.firstError('first_name') }}
                .col-md-6
                    .form-group
                        label(for='last_name') Last Name*
                        input.form-control(type='text' id='last_name' v-model.trim='last_name' placeholder='Eg: Khan')
                        p.text-danger.text-right(v-if='validation.hasError("last_name")') {{ validation.firstError('last_name') }}
                .col-md-12
                    .form-group
                        label(for='email') Email
                        input.form-control(type='email' id='email' v-model.trim='email' placeholder='Eg: example@gmail.com')
                        <!--div.text-right(v-if='validation.isValidating("email")')-->
                            <!--i.fa.fa-spinner.fa-spin-->
                        <!--p.text-danger.text-right(v-if='validation.hasError("email")') {{ validation.firstError('email') }}-->
                .col-md-6
                    .form-group
                        label(for='password') Password*
                        input.form-control(type='password' id='password' v-model='password' placeholder='Must be between 6 to 30 Characters')
                        input.button.btn.btn-success(type='button', value='Generate', v-on:click="generate", tabindex='2')
                        p.text-danger.text-right(v-if='validation.hasError("password")') {{ validation.firstError('password') }}
                .col-md-6
                    .form-group
                        label(for='mobile_number') Mobile No.*
                        input.form-control(type='text' id='mobile_number' v-model.trim='mobile_number' placeholder='Eg: 923002390816 (Without Dashes)')
                        div.text-right(v-if='validation.isValidating("mobile_number")')
                            i.fa.fa-spinner.fa-spin
                        p.text-danger.text-right(v-if='validation.hasError("mobile_number")') {{ validation.firstError('mobile_number') }}
                .col-md-6
                    .form-group
                        label(for='cnic_number') CNIC No.
                        input.form-control(type='text' id='cnic_number' v-model.trim='cnic_number' placeholder='Eg: 3172457197361 (Without Dashes)')
                        p.text-danger.text-right(v-if='validation.hasError("cnic_number")') {{ validation.firstError('cnic_number') }}
                .col-md-12
                    .form-group
                        label(for='driving_license') Driving License
                        input.form-control(type='text' id='driving_license' v-model.trim='driving_license' placeholder='Eg: 3172457197361#832 (Without Dashes)')
                        p.text-danger.text-right(v-if='validation.hasError("driving_license")') {{ validation.firstError('driving_license') }}
                .col-md-6
                    .form-group
                        label(for='sel_adda') Select Adda*
                        select.form-control(id="sel_adda" v-model="sel_adda")
                            option(value="") Select Adda
                            option(v-for="adda in addaListData" v-bind:value="adda.id") {{ adda.place_name }}
                        p.text-danger.text-right(v-if='validation.hasError("sel_adda")') {{ validation.firstError('sel_adda') }}
        .box-footer
            .text-right(v-if="!formUtil.submitted")
                button(type='button' v-on:click.prevent="submit" v-if="!formUtil.process").btn.btn-success Submit
                button(type='button' disabled v-else).btn.btn-success
                    i.fa.fa-refresh.fa-spin.fa-2x.fa-fw
            .text-right(v-else)
                button(type='button' disabled).btn.btn-info Submitted!
</template>

<script>
import firebase from "firebase";
import _ from "lodash";
import bcrypt from "bcrypt-nodejs";
import Promise from "bluebird";
import SimpleVueValidation from "simple-vue-validator";
import func from "../../../../../custom_libs/func";

const saltRounds = 10;
const Validator = SimpleVueValidation.Validator;

export default {
  name: "add_general_info",
  props: ["push_key"],
  created() {
    const self = this;
    self.addaListRef.once("value", function(snap) {
      if (snap.val() !== null) {
        self.addaListData = _.map(snap.val(), function(val) {
          let obj = val;
          obj["place_name"] = func.toTitleCase(val.place_name);
          return obj;
        });
      }
    });
  },
  data() {
    const db = firebase.database();
    return {
      addaListRef: db.ref("adda_list"),
      userRef: db.ref("users"),
      addaListData: [],
      formUtil: {
        submitted: false,
        err: "",
        suc: "",
        process: false
      },
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
      mobile_number: "",
      cnic_number: "",
      driving_license: "",
      sel_adda: ""
    };
  },
  validators: {
    first_name(value) {
      return Validator.value(value)
        .required()
        .lengthBetween(3, 20);
    },
    last_name(value) {
      return Validator.value(value)
        .required()
        .lengthBetween(3, 20);
    },
    email(value) {
      let self = this;
      return Validator.value(value)
        .email()
        .maxLength(50)
        .custom(function() {
          if (!Validator.isEmpty(value)) {
            return Promise.delay(1000).then(function() {
              return self.userRef
                .orderByChild("email")
                .equalTo(value)
                .once("value")
                .then(function(snap) {
                  let snapData = snap.val();
                  if (snapData !== null) {
                    if (_.find(snapData, { type: "driver" })) {
                      return "Already taken!";
                    }
                  }
                });
            });
          }
        });
    },
    password(value) {
      return Validator.value(value)
        .required()
        .minLength(6)
        .maxLength(35);
    },
    mobile_number(value) {
      let self = this;
      return Validator.value(value)
        .required()
        .digit()
        .lengthBetween(12, 12, "Invalid Mobile Number!")
        .custom(function() {
          if (!Validator.isEmpty(value)) {
            return Promise.delay(1000).then(function() {
              return self.userRef
                .orderByChild("mob_no")
                .equalTo(value)
                .once("value")
                .then(function(snap) {
                  let snapData = snap.val();
                  if (snapData !== null) {
                    if (_.find(snapData, { type: "driver" })) {
                      return "Already taken!";
                    }
                  }
                });
            });
          }
        });
    },
    cnic_number(value) {
      return Validator.value(value)
        .digit()
        .lengthBetween(13, 13, "Invalid CNIC Number!");
    },
    driving_license(value) {
      return Validator.value(value)
        .minLength(5)
        .maxLength(35);
    },
    sel_adda(value) {
      return Validator.value(value).required().maxLength(30);
    }
  },
  methods: {
    generate() {
      const self = this;
      var chars =
        "abcdefghijklmnopqrstuvwxyz!@#$%^&*()-+<>ABCDEFGHIJKLMNOP1234567890";
      var pass = "";
      for (var x = 0; x < 10; x++) {
        var i = Math.floor(Math.random() * chars.length);
        pass += chars.charAt(i);
      }
      self.password = pass;
    },
    submit() {
      const self = this;
      self.formUtil.process = true;
      self.formUtil.err = "";
      self.$validate().then(function(success) {
        if (success) {
          let salt = bcrypt.genSaltSync(saltRounds);
          let newHash = bcrypt.hashSync(self.password, salt);
          self.userRef.child(self.push_key).set(
            {
              first_name: self.first_name,
              last_name: self.last_name,
              email: self.email,
              password: newHash,
              mob_no: self.mobile_number,
              cnic_no: self.cnic_number,
              driving_license: self.driving_license,
              adda_ref: self.sel_adda,
              offline: false,
              type: "driver",
              status: 0
            },
            function(err) {
              if (err) {
                self.formUtil.err = err.message;
              } else {
                self.formUtil.submitted = true;
                self.formUtil.err = "";
                self.formUtil.suc = "Successfully insert data!";
                setTimeout(function() {
                  self.formUtil.suc = "";
                }, 1500);
              }
              self.formUtil.process = false;
            }
          );
        } else {
          self.formUtil.process = false;
        }
      });
    }
  }
};
</script>

<style scoped>
.ml-0 {
  margin-left: 0 !important;
}
</style>
