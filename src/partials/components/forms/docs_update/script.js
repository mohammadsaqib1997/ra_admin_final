import firebase from 'firebase'

export default {
    created: function () {
        let self = this;
        const db = firebase.database();
        self.userRef = db.ref("users");

        self.getImgs(self, self.sel_uid);

        $(function () {
            $('body').on('change', '.change_file', function (event) {
                self.fileChange(event);
            });
        });
    },
    props: [
        'sel_uid'
    ],
    data(){
        return {
            usersRef: null,

            formFilesData: {
                fm_profile_img: null,
                fm_cnic_img: null,
                fm_license_img: null,
                fm_reg_letter_img: null
            },
            filesRefStorage: {
                fm_profile_img: "profile_images",
                fm_cnic_img: "driver_cnic_images",
                fm_license_img: "driver_license_images",
                fm_reg_letter_img: "driver_registration_letter_images"
            },
            filesURLS: {
                fm_profile_img: "",
                fm_cnic_img: "",
                fm_license_img: "",
                fm_reg_letter_img: ""
            },
            filesLoader: {
                fm_profile_img: true,
                fm_cnic_img: true,
                fm_license_img: true,
                fm_reg_letter_img: true
            }
        }

    },
    methods: {
        getImgs: function (self, uid) {
            const storage = firebase.storage();
            if (self.filesLoader.fm_profile_img) {
                let ref = storage.ref('profile_images/' + uid + '.jpg');
                ref.getDownloadURL().then(function (url) {
                    self.filesURLS.fm_profile_img = url;
                    self.filesLoader.fm_profile_img = false;
                }, function (err) {
                    self.filesLoader.fm_profile_img = false;
                });
            }
            if (self.filesLoader.fm_cnic_img) {
                let ref = storage.ref('driver_cnic_images/' + uid + '.jpg');
                ref.getDownloadURL().then(function (url) {
                    self.filesURLS.fm_cnic_img = url;
                    self.filesLoader.fm_cnic_img = false;
                }, function (err) {
                    self.filesLoader.fm_cnic_img = false;
                });
            }
            if (self.filesLoader.fm_license_img) {
                let ref = storage.ref('driver_license_images/' + uid + '.jpg');
                ref.getDownloadURL().then(function (url) {
                    self.filesURLS.fm_license_img = url;
                    self.filesLoader.fm_license_img = false;
                }, function (err) {
                    self.filesLoader.fm_license_img = false;
                });
            }
            if (self.filesLoader.fm_reg_letter_img) {
                let ref = storage.ref('driver_registration_letter_images/' + uid + '.jpg');
                ref.getDownloadURL().then(function (url) {
                    self.filesURLS.fm_reg_letter_img = url;
                    self.filesLoader.fm_reg_letter_img = false;
                }, function (err) {
                    self.filesLoader.fm_reg_letter_img = false;
                });
            }
        },
        change_img_trigger: function (id) {
            $("#" + id).trigger('click');
        },
        cancel_img: function (id) {
            let self = this;
            let grabInput = $("#" + id);
            grabInput.replaceWith(grabInput.val("").clone(true));
            self.formFilesData[id] = null;
        },
        upload_img: function (id) {
            let self = this;
            if (self.formFilesData[id] !== null) {
                let storage = firebase.storage();
                let uploadTask = storage.ref(self.filesRefStorage[id] + "/" + self.sel_uid + ".jpg")
                    .put(self.formFilesData[id]);
                self.filesLoader[id] = true;
                uploadTask.then(function (snap) {
                    if(id === 'fm_profile_img'){
                        self.userRef.child(self.sel_uid+'/profile_update')
                            .set(firebase.database.ServerValue.TIMESTAMP)
                            .then(function () {
                                self.filesURLS[id] = snap.downloadURL;
                                self.cancel_img(id);
                                self.filesLoader[id] = false;
                            });
                    }else{
                        self.filesURLS[id] = snap.downloadURL;
                        self.cancel_img(id);
                        self.filesLoader[id] = false;
                    }
                }, function (err) {
                    console.log(err.message_);
                    self.filesLoader[id] = false;
                });
            }
        },
        fileChange: function (event) {
            let self = this;
            let grabInput = $("#" + event.target.id);
            let grabFile = grabInput[0].files[0];
            let ValidImageTypes = ["image/jpeg", "image/png"];
            if (typeof grabFile === "undefined") {
                self.formFilesData[event.target.id] = null;
            } else {
                if (ValidImageTypes.indexOf(grabFile["type"]) < 0 || grabFile["size"] > 2000000) {
                    // invalid file
                    grabInput.replaceWith(grabInput.val("").clone(true));
                    self.formFilesData[event.target.id] = null;
                } else {
                    self.formFilesData[event.target.id] = grabFile;
                }
            }
        },
    }
}