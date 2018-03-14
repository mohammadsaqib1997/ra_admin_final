<template lang="pug">
    .box
        .box-header
            h3.box-title Documents
        .box-body
            .row
                .col-md-12
                    .form-group
                        label Profile Image
                        div
                            button.btn.btn-info.btn-sm.mar-bot-5(v-if='formFiles.fm_profile_img.form_util.loader' disabled='disabled')
                                i.fa.fa-refresh.fa-spin.fa-fw
                            template(v-else)
                                input.form-control.change_file.hidden(type='file' id='fm_profile_img')
                                button.btn.btn-success.btn-sm.mar-bot-5.mar-lf-5(v-on:click.prevent='change_img_trigger("fm_profile_img")') Change Image
                                template(v-if='formFiles.fm_profile_img.sel_file !== null')
                                    button.btn.btn-success.btn-sm.mar-bot-5.mar-lf-5(v-on:click.prevent='upload_img("fm_profile_img")') Upload
                                    button.btn.btn-danger.btn-sm.mar-bot-5.mar-lf-5(v-on:click.prevent='cancel_img("fm_profile_img")') Cancel
                        div(v-if="formFiles.fm_profile_img.form_util.err !== '' || formFiles.fm_profile_img.form_util.suc !== ''")
                            p.alert.alert-danger(v-if="formFiles.fm_profile_img.form_util.err !== ''") {{ formFiles.fm_profile_img.form_util.err }}
                            p.alert.alert-success(v-if="formFiles.fm_profile_img.form_util.suc !== ''") {{ formFiles.fm_profile_img.form_util.suc }}
                .col-md-12
                    .form-group
                        label Scanned CNIC
                        div
                            button.btn.btn-info.btn-sm.mar-bot-5(v-if='formFiles.fm_cnic_img.form_util.loader' disabled='disabled')
                                i.fa.fa-refresh.fa-spin.fa-fw
                            template(v-else)
                                input.form-control.change_file.hidden(type='file' id='fm_cnic_img')
                                button.btn.btn-success.btn-sm.mar-bot-5.mar-lf-5(v-on:click.prevent='change_img_trigger("fm_cnic_img")') Change Image
                                template(v-if='formFiles.fm_cnic_img.sel_file !== null')
                                    button.btn.btn-success.btn-sm.mar-bot-5.mar-lf-5(v-on:click.prevent='upload_img("fm_cnic_img")') Upload
                                    button.btn.btn-danger.btn-sm.mar-bot-5.mar-lf-5(v-on:click.prevent='cancel_img("fm_cnic_img")') Cancel
                        div(v-if="formFiles.fm_cnic_img.form_util.err !== '' || formFiles.fm_cnic_img.form_util.suc !== ''")
                            p.alert.alert-danger(v-if="formFiles.fm_cnic_img.form_util.err !== ''") {{ formFiles.fm_cnic_img.form_util.err }}
                            p.alert.alert-success(v-if="formFiles.fm_cnic_img.form_util.suc !== ''") {{ formFiles.fm_cnic_img.form_util.suc }}
                .col-md-12
                    .form-group
                        label Scanned License
                        div
                            button.btn.btn-info.btn-sm.mar-bot-5(v-if='formFiles.fm_license_img.form_util.loader' disabled='disabled')
                                i.fa.fa-refresh.fa-spin.fa-fw
                            template(v-else)
                                input.form-control.change_file.hidden(type='file' id='fm_license_img')
                                button.btn.btn-success.btn-sm.mar-bot-5.mar-lf-5(v-on:click.prevent='change_img_trigger("fm_license_img")') Change Image
                                template(v-if='formFiles.fm_license_img.sel_file !== null')
                                    button.btn.btn-success.btn-sm.mar-bot-5.mar-lf-5(v-on:click.prevent='upload_img("fm_license_img")') Upload
                                    button.btn.btn-danger.btn-sm.mar-bot-5.mar-lf-5(v-on:click.prevent='cancel_img("fm_license_img")') Cancel
                        div(v-if="formFiles.fm_license_img.form_util.err !== '' || formFiles.fm_license_img.form_util.suc !== ''")
                            p.alert.alert-danger(v-if="formFiles.fm_license_img.form_util.err !== ''") {{ formFiles.fm_license_img.form_util.err }}
                            p.alert.alert-success(v-if="formFiles.fm_license_img.form_util.suc !== ''") {{ formFiles.fm_license_img.form_util.suc }}
                .col-md-12
                    .form-group
                        label Scanned Registration Letter
                        div
                            button.btn.btn-info.btn-sm.mar-bot-5(v-if='formFiles.fm_reg_letter_img.form_util.loader' disabled='disabled')
                                i.fa.fa-refresh.fa-spin.fa-fw
                            template(v-else)
                                input.form-control.change_file.hidden(type='file' id='fm_reg_letter_img')
                                button.btn.btn-success.btn-sm.mar-bot-5.mar-lf-5(v-on:click.prevent='change_img_trigger("fm_reg_letter_img")') Change Image
                                template(v-if='formFiles.fm_reg_letter_img.sel_file !== null')
                                    button.btn.btn-success.btn-sm.mar-bot-5.mar-lf-5(v-on:click.prevent='upload_img("fm_reg_letter_img")') Upload
                                    button.btn.btn-danger.btn-sm.mar-bot-5.mar-lf-5(v-on:click.prevent='cancel_img("fm_reg_letter_img")') Cancel
                        div(v-if="formFiles.fm_reg_letter_img.form_util.err !== '' || formFiles.fm_reg_letter_img.form_util.suc !== ''")
                            p.alert.alert-danger(v-if="formFiles.fm_reg_letter_img.form_util.err !== ''") {{ formFiles.fm_reg_letter_img.form_util.err }}
                            p.alert.alert-success(v-if="formFiles.fm_reg_letter_img.form_util.suc !== ''") {{ formFiles.fm_reg_letter_img.form_util.suc }}
</template>

<script>
    import firebase from 'firebase'

    export default {
        name: "add_docs",
        props: ['push_key'],
        created () {
            const self = this;
            $(function () {
                $('body').on('change', '.change_file', function (event) {
                    self.fileChange(event);
                });
            });
        },
        data () {
            const db = firebase.database();
            return {
                userRef: db.ref("users"),
                formFiles: {
                    fm_profile_img: {
                        sel_file: null,
                        ref: 'profile_images',
                        form_util: {
                            suc: '',
                            err: '',
                            loader: false
                        }
                    },
                    fm_cnic_img: {
                        sel_file: null,
                        ref: 'driver_cnic_images',
                        form_util: {
                            suc: '',
                            err: '',
                            loader: false
                        }
                    },
                    fm_license_img: {
                        sel_file: null,
                        ref: 'driver_license_images',
                        form_util: {
                            suc: '',
                            err: '',
                            loader: false
                        }
                    },
                    fm_reg_letter_img: {
                        sel_file: null,
                        ref: 'driver_registration_letter_images',
                        form_util: {
                            suc: '',
                            err: '',
                            loader: false
                        }
                    }
                }
            }
        },
        methods: {
            fileChange: function (event) {
                let self = this;
                let grabInput = $("#" + event.target.id);
                let grabFile = grabInput[0].files[0];
                let ValidImageTypes = ["image/jpeg", "image/png"];
                if (typeof grabFile === "undefined") {
                    self.formFiles[event.target.id].sel_file = null;
                } else {
                    if (ValidImageTypes.indexOf(grabFile["type"]) < 0 || grabFile["size"] > 2000000) {
                        // invalid file
                        grabInput.replaceWith(grabInput.val("").clone(true));
                        self.formFiles[event.target.id].sel_file = null;
                    } else {
                        self.formFiles[event.target.id].sel_file = grabFile;
                    }
                }
            },
            change_img_trigger: function (id) {
                $("#" + id).trigger('click');
            },
            cancel_img: function (id) {
                let self = this;
                let grabInput = $("#" + id);
                grabInput.replaceWith(grabInput.val("").clone(true));
                self.formFiles[id].sel_file = null;
            },
            upload_img: function (id) {
                let self = this;
                if (self.formFiles[id].sel_file !== null) {
                    self.formFiles[id].form_util.loader = true;
                    self.formFiles[id].form_util.err = '';
                    self.userRef.child(self.push_key).once('value', function (snap) {
                        if (snap.val() !== null) {
                            let storage = firebase.storage();
                            let uploadTask = storage.ref(self.formFiles[id].ref + "/" + self.push_key + ".jpg")
                                .put(self.formFiles[id].sel_file);
                            uploadTask.then(function (snap) {
                                if(id === 'fm_profile_img'){
                                    self.userRef.child(self.push_key+'/profile_update')
                                        .set(firebase.database.ServerValue.TIMESTAMP)
                                        .then(function () {
                                            self.formFiles[id].form_util.suc = "Successfully upload image!";
                                            setTimeout(function () {
                                                self.formFiles[id].form_util.suc = "";
                                            }, 1500);
                                            self.cancel_img(id);
                                            self.formFiles[id].form_util.loader = false;
                                        });
                                }else{
                                    self.formFiles[id].form_util.suc = "Successfully upload image!";
                                    setTimeout(function () {
                                        self.formFiles[id].form_util.suc = "";
                                    }, 1500);
                                    self.cancel_img(id);
                                    self.formFiles[id].form_util.loader = false;
                                }
                            }, function (err) {
                                self.formFiles[id].form_util.err = err.message;
                                self.formFiles[id].form_util.loader = false;
                            });
                        } else {
                            self.formFiles[id].form_util.err = "Please first add general information!";
                            self.formFiles[id].form_util.loader = false;
                        }
                    });
                }
            },
        }
    }
</script>