<template lang="pug">
    div
        .box
            .box-header
                h3.box-title New Request
            .box-body
                div.table-responsive
                    div.text-center(v-if='dataLoad')
                        i.fa.fa-refresh.fa-spin.fa-3x.fa-fw
                    h3.text-center(style='margin: 15px 0;' v-if='!dataLoad && all.length === 0')
                        | No Data Found!
                    table_comp(v-if='!dataLoad && all.length > 0' v-bind:per_page="10")
                        template(slot="thead")
                            tr
                                th S.No#
                                th Date
                                th Request ID
                                th User
                                th Origin
                                th Destination
                                th Distance
                                th Duration
                                th Parcel
                                th Require Vehicle
                                th Number Of Bids
                                th Action
                        template(slot="tbody")
                            tr(v-for='(row, ind) in all')
                                td {{ ind+1 }}
                                td {{ row.createdAt }}
                                td {{ row.id }}
                                td {{ row.username }}
                                td {{ row.orgText }}
                                td {{ row.desText }}
                                td {{ row.disText }}
                                td {{ row.durText }}
                                td
                                    button.btn.btn-sm.btn-info(data-toggle='modal' data-target='#parcel_images' v-on:click='openImagePP(row.parcelUriArray)' style="margin-bottom: 5px;margin-right: 5px;")
                                        i.fa.fa-eye
                                td {{ row.vecType }}
                                td {{ row.num_bids }}
                                td
                                    button.btn.btn-sm.btn-info(data-toggle='modal' data-target='#push_modal' v-on:click='openBidsReq(row.id)' style="margin-bottom: 5px;margin-right: 5px;") Push Bids
                                    button.btn.btn-sm.btn-danger(type="button" v-on:click='cancelReq(row.id)') Cancel
        push_bids(v-bind:sel_req_id="assign_req_id_md")
        parcel_images(v-bind:images="sel_images")
</template>

<script>
    import firebase from 'firebase'
    import moment from 'moment'
    import _ from 'lodash'

    import pushBids from '../modals/push_bids.vue'
    import parcelImages from '../modals/parcel_images.vue'
    import tableComp from '../html_utils/tabel_comp.vue'

    export default {
        name: "new_request",
        components: {
            'push_bids': pushBids,
            'parcel_images': parcelImages,
            'table_comp': tableComp
        },
        watch: {
            all (val) {
                const self = this;
                if (val.length > 0) {
                    val.forEach(function (obj) {
                        self.driverBidsRef.child(obj.id).on('value', function (bidSnap) {
                            let bidData = bidSnap.val();
                            self.$set(self.all[_.findIndex(self.all, {id: obj.id})], 'num_bids', (bidData !== null) ? Object.keys(bidData).length : 0);
                        });
                    });
                }
            }
        },
        created () {
            this.loadLiveReq();
        },
        destroyed () {
            this.liveReqRef.off();
            this.driverBidsRef.off();
        },
        data () {
            const db = firebase.database();
            return {
                liveReqRef: db.ref('/user_live_requests'),
                userRef: db.ref('/users'),
                userReqRef: db.ref('/user_requests'),
                driverBidsRef: db.ref('/driver_bids'),

                sel_images: [],

                dataLoad: true,
                all: [],
                assign_req_id_md: ''
            }
        },
        methods: {
            loadLiveReq () {
                const self = this;
                self.liveReqRef.on('value', function (snap) {
                    self.dataLoad = true;
                    self.all = [];

                    if (snap.val() !== null) {
                        let process_complete = 0;
                        let grab_data = [];
                        snap.forEach(function (liveReq) {
                            self.userReqRef.child(liveReq.key + "/" + liveReq.val().reqId).once('value').then(function (reqSnap) {
                                let reqData = reqSnap.val();
                                if (reqData !== null) {
                                    reqData['createdAt'] = moment(reqData.createdAt).format('hh:mm A DD/MM/YYYY');
                                    self.userRef.child(liveReq.key).once('value').then(function (userSnap) {
                                        let userData = userSnap.val();
                                        reqData['username'] = userData.first_name + " " + userData.last_name;
                                        reqData["liveReqKey"] = liveReq.key;
                                        reqData["num_bids"] = 0;

                                        grab_data.push(reqData);

                                        if (self.dataLoad) {
                                            process_complete++;
                                            if (snap.numChildren() === process_complete) {
                                                self.all = grab_data;
                                                self.dataLoad = false;
                                            }
                                        }
                                    });
                                } else {
                                    self.dataLoad = false;
                                }
                            });
                        });
                    } else {
                        self.dataLoad = false;
                    }
                });
            },
            openBidsReq: function (req_id) {
                this.assign_req_id_md = req_id;
            },
            cancelReq: function (key) {
                let self = this;
                if(confirm("Are You Sure! You want to cancel this request!")){
                    self.liveReqRef.child(_.find(self.all, {id: key}).liveReqKey).remove(function (err) {
                        if(err){
                            console.log(err);
                        }
                    });
                }
            },
            openImagePP (images) {
                this.sel_images = images;
            }
        }
    }
</script>