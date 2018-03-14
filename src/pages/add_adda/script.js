import firebase from "firebase";
import Promise from 'bluebird'

import SimpleVueValidation from 'simple-vue-validator'
const Validator = SimpleVueValidation.Validator;

import googleStyle from '../new_req/style_json.json'


export default {
    created: function(){
        let self = this;

        $(function () {
            if (!self.$root.mapLoaded) {
                $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyCeDfncmN-9FXb-1Gv4wcRpDWZ4AUnrqws&libraries=places")
                    .done(function (script, textStatus) {
                        self.$root.mapLoaded = true;
                        self.mapInit();
                    })
                    .fail(function (jqxhr, settings, exception) {
                        console.log("Triggered ajaxError handler.");
                    });
            } else {
                self.mapInit();
            }
        });
    },
    validators: {
        aName (val) {
            const self = this;
            return Validator.value(val).required().lengthBetween(3, 100).custom(function () {
                if (!Validator.isEmpty(val)) {
                    return Promise.delay(1000)
                        .then(function () {
                            return self.addaListRef.orderByChild('place_name').equalTo(val.toString().toLowerCase()).once('value').then(function (snap) {
                                let snapData = snap.val();
                                if(snapData !== null){
                                    return 'Already taken!';
                                }
                            });
                        });
                }
            });
        },
        "location.lat": function (val) {
            return Validator.value(val).required("Latitude is required!").custom(function () {
                if (!Validator.isEmpty(val)) {
                    if (isNaN(val)) {
                        return "Please provide valid number!";
                    }
                }
            });
        },
        "location.lng": function (val) {
            return Validator.value(val).required("Longitude is required!").custom(function () {
                if (!Validator.isEmpty(val)) {
                    if (isNaN(val)) {
                        return "Please provide valid number!";
                    }
                }
            });
        }
    },
    data(){
        const db = firebase.database();
        return {
            formCB: {
                err: '',
                suc: ''
            },
            formSubStatus: false,
            aName: '',
            location: {
                lat: '',
                lng: ''
            },
            map: null,
            centerMarker: null,
            placeACInput: null,
            placeAC: null,
            checkAC: false,
            addaListRef: db.ref('adda_list')
        }

    },
    methods: {
        mapInit() {
            const self = this;
            setTimeout(function () {
                let latlng = new google.maps.LatLng(25.047486081295794, 67.26028803808595);
                let mapOptions = {
                    center: latlng,
                    zoom: 9,
                    styles: googleStyle
                };
                self.map = new google.maps.Map(document.getElementById('map'), mapOptions);

                self.placeACInput = document.getElementById('pac_input');
                self.placeAC = new google.maps.places.Autocomplete(self.placeACInput);
                self.placeAC.bindTo('bounds', self.map);
                self.placeAC.addListener('place_changed', function () {
                    let place = self.placeAC.getPlace();
                    self.checkAC = true;
                    if(!place.geometry) {
                        return;
                    }
                    if (place.geometry.viewport) {
                        self.map.fitBounds(place.geometry.viewport);
                    } else {
                        self.map.setCenter(place.geometry.location);
                        self.map.setZoom(17);
                    }
                });

                self.centerMarker = new google.maps.Marker({
                    position: latlng,
                    map: self.map
                });

                self.location.lat = self.map.getCenter().lat();
                self.location.lng = self.map.getCenter().lng();

                self.map.addListener('idle', function () {
                    self.location.lat = self.map.getCenter().lat();
                    self.location.lng = self.map.getCenter().lng();

                    if (!self.checkAC) {
                        self.placeACInput.value = "";
                    }
                    self.checkAC = false;
                });

                self.map.addListener('center_changed', function () {
                    self.centerMarker.setPosition({lat: self.map.getCenter().lat(), lng: self.map.getCenter().lng()});
                });
            }, 1000);
        },
        insertAdda () {
            const self = this;
            self.formSubStatus = true;
            self.$validate().then(function (success) {
                if(success){
                    let key = self.addaListRef.push();
                    key.set({
                        id: key.key,
                        location: self.location,
                        place_name: self.aName.toLowerCase()
                    }, function (err) {
                        if(err){
                            self.formCB.err = err.message;
                        }else{
                            self.resetForm();
                            self.formCB.err = "";
                            self.formCB.suc = 'Successfully add adda.';
                            setTimeout(function () {
                                self.formCB.suc = "";
                            }, 1500);
                        }
                        self.formSubStatus = false;
                    });
                }else{
                    self.formSubStatus = false;
                }
            });
        },
        resetForm () {
            const self = this;
            self.map.setCenter(new google.maps.LatLng(25.047486081295794, 67.26028803808595));
            self.map.setZoom(9);
            self.aName = '';
            self.validation.reset();
        },
        changeLLMapSet () {
            const self = this;
            if (!self.validation.hasError("location.lat") && !self.validation.hasError("location.lng")) {
                if (self.map) {
                    self.map.setCenter(new google.maps.LatLng(self.location.lat, self.location.lng));
                    self.map.setZoom(15);
                } else {
                    setTimeout(function () {
                        self.changeLLMapSet();
                    }, 500);
                }
            }
        }
    }
}