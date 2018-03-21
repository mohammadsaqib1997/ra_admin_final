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
    created: function () {
        let self = this;
    },
    data() {
        const db = firebase.database();
        return {
            userPushRefKey: db.ref("users").push().key
        }
    }
}