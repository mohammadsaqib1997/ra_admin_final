<template lang="pug">
    .box
        .box-header
            h3.box-title Vehicle Information
        .box-body
            .row
                .col-md-12(v-if="formUtil.err !== '' || formUtil.suc !== ''")
                    p.alert.alert-danger(v-if="formUtil.err !== ''") {{ formUtil.err }}
                    p.alert.alert-success(v-if="formUtil.suc !== ''") {{ formUtil.suc }}
                .col-md-12
                    .form-group
                        label(for='vehicle') Vehicle Type*
                        select.form-control(id='vehicle' v-model='vehicle')
                            option(value='') Select Vehicle Type
                            option(v-for="v in v_list" v-bind:value='v') {{ v }}
                        p.text-danger.text-right(v-if='validation.hasError("vehicle")') {{ validation.firstError('vehicle') }}
                .col-md-6
                    .form-group
                        label(for='model_year') Model Year
                        input.form-control(type='text' id='model_year' v-model='model_year' placeholder='Eg: 2008')
                        p.text-danger.text-right(v-if='validation.hasError("model_year")') {{ validation.firstError('model_year') }}
                .col-md-6
                    .form-group
                        label(for='vehicle_number') Vehicle Number
                        input.form-control(type='text' id='vehicle_number' v-model='vehicle_number' placeholder='Eg: BEL-923')
                        p.text-danger.text-right(v-if='validation.hasError("vehicle_number")') {{ validation.firstError('vehicle_number') }}
                .col-md-12
                    .form-group
                        label(for='make') Make
                        input.form-control(type='text' id='make' v-model='make' placeholder='Eg: Honda')
                        p.text-danger.text-right(v-if='validation.hasError("make")') {{ validation.firstError('make') }}
                .col-md-12
                    .form-group(style="margin-left: 20px;")
                        .checkbox.text-left
                            label
                                input.cusCheckBox(type='checkbox' v-model="owner_v")
                                | Yes, I am the owner of this vehicle
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
import SimpleVueValidation from "simple-vue-validator";

const Validator = SimpleVueValidation.Validator;

export default {
  name: "add_vehicle_info",
  props: ["push_key"],
  data() {
    const db = firebase.database();
    return {
      userRef: db.ref("users"),
      v_list: ["Bike", "Car", "Pickup", "Truck"],
      formUtil: {
        submitted: false,
        err: "",
        suc: "",
        process: false
      },
      vehicle: "",
      model_year: "",
      vehicle_number: "",
      make: "",
      owner_v: false
    };
  },
  validators: {
    vehicle(value) {
      return Validator.value(value)
        .required()
        .in(this.v_list, "Invalid Value!");
    },
    model_year(value) {
      return Validator.value(value)
        .digit()
        .lengthBetween(4, 4, "Invalid Year!");
    },
    vehicle_number(value) {
      return Validator.value(value).lengthBetween(
        7,
        8,
        "Invalid Vehicle Number!"
      );
    },
    make(value) {
      return Validator.value(value).lengthBetween(3, 30);
    }
  },
  methods: {
    submit() {
      const self = this;
      self.formUtil.process = true;
      self.formUtil.err = "";
      self.$validate().then(function(success) {
        if (success) {
          self.userRef.child(self.push_key).once("value", function(snap) {
            if (snap.val() !== null) {
              self.userRef.child(self.push_key).update(
                {
                  vehicle: self.vehicle,
                  v_model_year: self.model_year,
                  v_number: self.vehicle_number,
                  v_make: self.make,
                  v_owner: self.owner_v ? "Yes" : "No"
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
              self.formUtil.err = "Please first add general information!";
            }
          });
        } else {
          self.formUtil.process = false;
        }
      });
    }
  }
};
</script>