import firebase from 'firebase'
import moment from 'moment'
import _ from 'lodash'

import tableComp from '../../partials/components/html_utils/tabel_comp.vue'

export default {
    components: {
        'table_comp': tableComp
    },
    mounted() {
        this.dataByMonth(_.find(this.months_sel, {unix: this.selected_m}).mm, this.data, 'loader');
    },
    data() {
        const db = firebase.database();
        const storage = firebase.storage();
        let months_sel = [];
        for (let i=0; i<12; i++) {
            let date = moment().subtract(i, 'M');
            months_sel.push({date: date.format("MMM YYYY"), unix: date.format("x"), mm: date})
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
        selected_m (val) {
            this.loader = true;
            this.data = [];
            this.top3Images = ["/images/avatar.png", "/images/avatar.png", "/images/avatar.png"];
            this.dataByMonth(_.find(this.months_sel, {unix: val}).mm, this.data, 'loader');
        },
        loader (val) {
            let self = this;
            if (val === false) {
                this.data = _.orderBy(this.data, ['points', 'time.m', 'rating', 'earning', 'bids'], ['desc', 'desc', 'desc', 'desc', 'desc']);
                this.profileImgUrlSet([this.data[0].id, this.data[1].id, this.data[2].id]);
            }
        }
    },
    methods: {
        complete_pros (push_row, ind, tot_length, setData, loader) {
            if(push_row !== null){
                setData.push(push_row);
                ind++;
            }
            if(ind === tot_length){
                this[loader] = false;
            }
            return ind;
        },
        ratingPoints (rate) {
            switch (rate){
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
        profileImgUrlSet (uids) {
            let self = this;
            uids.forEach(function (val, ind) {
                self.profileImgSRef.child(val+'.jpg').getDownloadURL().then(function (res) {
                    self.$set(self.top3Images, ind, res);
                }).catch(function (err) {});
            });
        },
        async driverEarning (com_reqs_snap, driver_key, m_moment) {
            const self = this;
            let earnings = 0;
            if(com_reqs_snap.numChildren() > 0){
                const keys = Object.keys(com_reqs_snap.val());
                for (let key of keys) {
                    earnings += await self.comJobBid(key, driver_key, m_moment);
                }
            }
            return earnings;
        },
        async comJobBid (req_key, driver_key, m_moment) {
            let earn = 0;
            await this.bidRef.child(req_key+"/"+driver_key).once('value', function (bid_snap) {
                if(moment(bid_snap.val().first_bid_time).format("M") === m_moment.format("M")) {
                    earn = parseInt(bid_snap.val().amount);
                }
            });
            return earn;
        },
        async driverBids (driver_key, m_moment) {
            let count = 0;
            await this.bidRef.once('value', function (bid_snap) {
                if(bid_snap.val() !== null){
                    let res = _.filter(bid_snap.val(), driver_key);
                    if(res.length > 0) {
                        for (let [p_key, p_val] of Object.entries(res)) {
                            for (let [i_key, i_val] of Object.entries(p_val)) {
                                if(moment(i_val.first_bid_time).format("M") === m_moment.format("M")) {
                                    count++;
                                }
                            }
                        }
                    }
                }
            });
            return count;
        },
        dataByMonth (m_moment, setData, loader) {
            const self = this;
            // hit db callback --users
            self.driverRef.once('value', function (snap) {
                if (snap.val() !== null) {
                    const all_snap = snap.val();
                    let new_snap = _.filter(all_snap, {status: 1});
                    let ind = 0;
                    new_snap.forEach(function (driver, l_ind) {
                        const driver_key = _.findKey(all_snap, {status: 1, email: driver.email});
                        let grabData = {};
                        grabData['points'] = 0;
                        grabData['id'] = driver_key;
                        grabData['name'] = driver.first_name + " " + driver.last_name;
                        // hit db callback --sessions
                        self.sessionsRef.orderByChild("userID").equalTo(driver_key).once('value', function (sess_snap) {
                            // time getters
                            let defDuration = moment.duration();
                            if(sess_snap.val() !== null){
                                sess_snap.forEach(function (sess_item) {
                                    let sess_item_val = sess_item.val();
                                    if(sess_item_val.hasOwnProperty("loginTime") && sess_item_val.hasOwnProperty("logoutTime")){
                                        if(moment(sess_item_val.loginTime).format('M') === m_moment.format('M')) {
                                            defDuration.add(moment.duration(moment(sess_item_val.logoutTime).diff(moment(sess_item_val.loginTime))));
                                        }
                                    }
                                });
                            }
                            grabData['time'] = {m: (defDuration.get('h')*60) + defDuration.get("m")};
                            grabData['points'] += Math.round(grabData.time.m/100);
                            // hit db callback --complete_requests
                            self.completeReqRef.orderByChild("driver_uid").equalTo(driver_key).once('value', function (creq_snap) {
                                // complete jobs and rating getters
                                let rating_count = 0;
                                if(creq_snap.val() !== null){
                                    creq_snap.forEach(function (c_job) {
                                        if(moment(c_job.val().complete_time).format('M') === m_moment.format('M')) {
                                            rating_count += c_job.val().rating;
                                            grabData['points'] += self.ratingPoints(c_job.val().rating);
                                        }
                                    });
                                }
                                grabData['rating'] = rating_count;
                                // complete jobs earnings getters
                                self.driverEarning(creq_snap, driver_key, m_moment).then(function (res) {
                                    grabData['earning'] = res;
                                    grabData['points'] += Math.round(res/100);
                                    // driver place bids getters
                                    self.driverBids(driver_key, m_moment).then(function (res) {
                                        grabData['bids'] = res;
                                        grabData['points'] += res;

                                        ind = self.complete_pros(grabData, ind, new_snap.length, setData, loader);
                                    });
                                });
                            });
                        });
                    });
                }else{
                    self.complete_pros(null, 1, 1, setData, loader);
                }
            });
        }
    }
}