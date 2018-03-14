import firabase from 'firebase'
import _ from 'lodash'

import dashboardLayout from '../../partials/layouts/dashboardLayout/dashboardLayout.vue'

export default {
    created () {
        const self = this;

        self.userRef.once('value', function (snap) {
            if(snap.val() !== null){
                self.user.active.count = _.filter(snap.val(), {status: 1}).length;
                self.user.inactive.count = _.filter(snap.val(), {status: 0}).length;
            }
            self.user.loader = false;
        });

        self.driverRef.once('value', function (snap) {
            if(snap.val() !== null){
                self.driver.active.count = _.filter(snap.val(), {status: 1}).length;
                self.driver.inactive.count = _.filter(snap.val(), {status: 0}).length;
                self.driver.bikers.count = _.filter(snap.val(), {status: 1, vehicle: "Bike"}).length;
                self.driver.cars.count = _.filter(snap.val(), {status: 1, vehicle: "Car"}).length;
                self.driver.pickup.count = _.filter(snap.val(), {status: 1, vehicle: "Pickup"}).length;
                self.driver.truck.count = _.filter(snap.val(), {status: 1, vehicle: "Truck"}).length;
            }
            self.driver.loader = false;
        });

        self.requestsRef.once('value', function (snap) {
            if(snap.val() !== null){
                let grab = 0;
                snap.forEach(function (c_snap) {
                    let user_jobs = c_snap.val();
                    grab += Object.keys(user_jobs).length;
                });
                self.jobs.total.count = grab;
            }
            self.jobs.loader = false;
        });

    },
    data: function(){
        const db = firabase.database();
        return {
            userRef: db.ref("users").orderByChild("type").equalTo("client"),
            driverRef: db.ref("users").orderByChild("type").equalTo("driver"),
            requestsRef: db.ref("user_requests"),
            user: {
                active: {
                    count: 0
                },
                inactive: {
                    count: 0
                },
                loader: true
            },
            driver: {
                bikers: {
                    count: 0
                },
                cars: {
                    count: 0
                },
                pickup: {
                    count: 0
                },
                truck: {
                    count: 0
                },
                active: {
                    count: 0
                },
                inactive: {
                    count: 0
                },
                loader: true,
            },
            jobs: {
                loader: true,
                total: {
                    count: 0
                }
            }
        }
    },
    methods: {

    },
    components: {
        dashboardLayout
    }
}