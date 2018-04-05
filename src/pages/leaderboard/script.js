import firebase from 'firebase'
import moment from 'moment'
import _ from 'lodash'

import tableComp from '../../partials/components/html_utils/tabel_comp.vue'

export default {
    components: {
        'table_comp': tableComp
    },
    mounted() {
        this.dataByMonth(_.find(this.months_sel, { unix: this.selected_m }).mm);
    },
    data() {
        const db = firebase.database();
        const storage = firebase.storage();
        let months_sel = [];
        for (let i = 0; i < 12; i++) {
            let date = moment().subtract(i, 'M');
            months_sel.push({ date: date.format("MMM YYYY"), unix: date.format("x"), mm: date })
        }
        return {
            driverRef: db.ref("users").orderByChild("type").equalTo("driver"),
            sessionsRef: db.ref("sessions"),
            completeReqRef: db.ref("complete_requests"),
            bidRef: db.ref("driver_bids"),
            profileImgSRef: storage.ref("profile_images"),
            top3Images: ["/images/avatar.png", "/images/avatar.png", "/images/avatar.png"],
            data: [],
            loader: true,
            months_sel: months_sel,
            selected_m: months_sel[0].unix,
        }
    },
    watch: {
        selected_m(val) {
            this.loader = true;
            this.data = [];
            this.load_percent = 0
            this.top3Images = ["/images/avatar.png", "/images/avatar.png", "/images/avatar.png"];
            this.dataByMonth(_.find(this.months_sel, { unix: val }).mm);
        },
        loader(val) {
            let self = this;
            if (val === false && this.data.length > 0) {
                this.data = _.orderBy(this.data, ['points', 'time.m', 'rating', 'earning', 'bids'], ['desc', 'desc', 'desc', 'desc', 'desc']);
                this.profileImgUrlSet([this.data[0].id, this.data[1].id, this.data[2].id]);
            }
        }
    },
    methods: {
        ratingPoints(rate) {
            switch (rate) {
                case 5:
                    return 10;
                case 4:
                    return 8;
                case 3:
                    return 5;
                case 2:
                    return 2;
                case 1:
                    return -1;
            }
            return 0;
        },
        profileImgUrlSet(uids) {
            let self = this;
            uids.forEach(function (val, ind) {
                self.profileImgSRef.child(val + '.jpg').getDownloadURL().then(function (res) {
                    self.$set(self.top3Images, ind, res);
                }).catch(function (err) { });
            });
        },
        async dataByMonth(m_moment) {
            const self = this;
            let grabLeaderData = []

            // drivers place bids snapshot
            const bidsSnap = await self.bidRef.once('value')
            const bidsData = (bidsSnap.val() !== null) ? bidsSnap.val() : {}

            // drivers snapshot
            let driversSnap = await self.driverRef.once('value');
            if (driversSnap.val() !== null) {
                await Promise.all(_.map(driversSnap.val(), async (driver, uid) => {

                    // check active driver
                    if (driver.status === 1) {
                        let rowData = {};

                        // default point
                        rowData['points'] = 0

                        // default time
                        let defDuration = moment.duration();
                        rowData['time'] = { m: (defDuration.get('h') * 60) + defDuration.get("m") };

                        // default rating
                        rowData['rating'] = 0;

                        // default bid count
                        rowData['bids'] = 0;

                        // default earning
                        rowData['earning'] = 0

                        // driver data
                        rowData['id'] = uid
                        rowData['name'] = driver.first_name + " " + driver.last_name

                        // ----- Database triggers -----

                        // driver time session snapshot
                        let driverSessionSnap = await self.sessionsRef.orderByChild("userID").equalTo(uid).once('value')
                        if (driverSessionSnap.val() !== null) {
                            await Promise.all(_.map(driverSessionSnap.val(), async (row, key) => {
                                if (row.hasOwnProperty("loginTime") && row.hasOwnProperty("logoutTime")) {
                                    if (moment(row.loginTime).format("MM/YYYY") === m_moment.format("MM/YYYY")) {
                                        defDuration.add(moment.duration(moment(row.logoutTime).diff(moment(row.loginTime))));
                                    }
                                }
                            }))
                            rowData['time'] = { m: (defDuration.get('h') * 60) + defDuration.get("m") };
                            rowData['points'] += Math.round(rowData.time.m / 100);
                        }

                        // grab driver bids
                        let driver_bids = []
                        await Promise.all(_.map(bidsData, async (r_bids_val, r_bids_key) => {
                            await Promise.all(_.map(r_bids_val, async (f_obj_val, f_obj_key) => {
                                if (f_obj_key === uid && f_obj_val.hasOwnProperty('first_bid_time')) {
                                    if (moment(f_obj_val.first_bid_time).format("MM/YYYY") === m_moment.format("MM/YYYY")) {
                                        let push_obj = f_obj_val
                                        push_obj['req_id'] = r_bids_key
                                        driver_bids.push(push_obj)
                                    }
                                }
                            }))
                        }))
                        rowData['bids'] = driver_bids.length;
                        rowData['points'] += driver_bids.length;

                        // driver jobs complete snapshot
                        let driverJobsCompleteSnap = await self.completeReqRef.orderByChild("driver_uid").equalTo(uid).once('value')
                        if (driverJobsCompleteSnap.val() !== null) {
                            // grab rating for completed jobs
                            let rating_count = 0
                            await Promise.all(_.map(driverJobsCompleteSnap.val(), async (c_job_val, c_job_key) => {
                                if (moment(c_job_val.complete_time).format("MM/YYYY") === m_moment.format("MM/YYYY")) {
                                    rating_count += c_job_val.rating;
                                    rowData['points'] += await self.ratingPoints(c_job_val.rating);

                                    // here find request bid price
                                    if (driver_bids.length > 0) {
                                        let f_req_p_bid = _.find(driver_bids, { 'req_id': c_job_key })
                                        if (typeof f_req_p_bid !== 'undefined') {
                                            rowData['earning'] = parseInt(f_req_p_bid.amount)
                                            rowData['points'] += Math.round(parseInt(f_req_p_bid.amount) / 100);
                                        }
                                    }
                                }
                            }))
                            rowData['rating'] = rating_count
                        }

                        // here is the end of grabing data
                        grabLeaderData.push(rowData)
                    }
                }))
                // here set the final data
                self.data = grabLeaderData
                self.loader = false
            } else {
                self.loader = false
            }
        }
    }
}