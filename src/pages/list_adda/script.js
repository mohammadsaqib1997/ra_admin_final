import firebase from 'firebase'
import func from '../../../custom_libs/func'
import _ from 'lodash'

import googleStyle from '../new_req/style_json.json'

import confirmPopup from '../../partials/components/modals/confirm_popup.vue'
import tableComp from '../../partials/components/html_utils/tabel_comp.vue'

export default {
    components: {
        confirm_popup: confirmPopup,
        table_comp: tableComp
    },
    created: function () {
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
            $("body").on('click', '.view_row', function () {
                let grabId = $(this).attr("data-id");
                self.viewLoad = true;
                self.loadViewContent(grabId);
            });
        });

        self.addaListRef.on('value', function (snap) {
            if (snap.val() !== null) {
                self.data = _.values(snap.val());
                self.data = _.orderBy(self.data, ['place_name'], ['asc']);
            } else {
                self.data = [];
            }
            self.dataLoad = false;
        });
    },
    destroyed() {
        this.addaListRef.off();
    },
    data: function () {
        const db = firebase.database();
        return {
            dataLoad: true,
            viewLoad: false,
            viewData: null,
            viewMap: null,
            viewMarker: null,
            data: [],
            addaListRef: db.ref('adda_list'),
            search_table: '',
            removeID: "",
        }
    },
    methods: {

        toTitleCase(str) {
            return str.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        },
        showPopup (id) {
            this.removeID = id;
            $("#confirm_popup").modal('show');
        },
        removeItem () {
            const self = this;
            $("#confirm_popup").modal('hide');
            self.addaListRef.child(self.removeID).remove(function (err) {
                if(err) {
                    console.log("Remove Item Error: ", err);
                }
            });
        },
        loadViewContent(id) {
            const self = this;
            self.viewData = null;
            self.mapInit();
            self.addaListRef.child(id).once('value', function (snap) {
                if (snap.val() !== null) {
                    self.viewData = snap.val();
                    self.markerSet();
                }
                self.viewLoad = false;
            });
        },
        mapInit() {
            const self = this;
            if (self.viewMap) {
                self.viewMap.setCenter(new google.maps.LatLng(25.047486081295794, 67.26028803808595));
                self.viewMap.setZoom(9);
            } else {
                setTimeout(function () {
                    let latlng = new google.maps.LatLng(25.047486081295794, 67.26028803808595);
                    if(document.getElementById('map')) {
                        let mapOptions = {
                            center: latlng,
                            zoom: 9,
                            draggable: false,
                            styles: googleStyle
                        };
                        self.viewMap = new google.maps.Map(document.getElementById('map'), mapOptions);
                    }
                }, 1000);
            }
        },
        markerSet() {
            const self = this;
            let latlng = new google.maps.LatLng(this.viewData.location.lat, this.viewData.location.lng);

            if (self.viewMarker) {
                self.viewMarker.setPosition(latlng);
            } else {
                self.viewMarker = new google.maps.Marker({
                    position: latlng,
                    map: self.viewMap
                });
            }
            self.viewMap.setCenter(latlng);
            self.viewMap.setZoom(13);
        },
        moveEdit (key) {
            this.$router.push('/admin/adda/edit/'+key);
        },
    }
}