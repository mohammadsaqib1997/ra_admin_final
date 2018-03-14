<template lang="pug">
    div
        // Modal
        #parcel_details.modal.fade.bs-example-modal-lg(role='dialog')
            .modal-dialog.modal-lg
                // Modal content
                .modal-content
                    .modal-header
                        button.close(type='button', data-dismiss='modal') ×
                        h4.modal-title Parcel Details
                    .modal-body
                        template(v-if="Object.keys(parcel_obj).length > 0")
                            h3 Parcel Info
                            h4 Created Time:&nbsp;
                                b {{ parcel_obj.req_data['createdAt'] }}
                            h4 Origin:&nbsp;
                                b {{ parcel_obj.req_data['orgText'] }}
                            h4 Destination:&nbsp;
                                b {{ parcel_obj.req_data['desText'] }}
                            h4 Est. Time:&nbsp;
                                b {{ parcel_obj.req_data['durText'] }}
                            h4 Est. Distance:&nbsp;
                                b {{ parcel_obj.req_data['disText'] }}
                            h4 Floor:&nbsp;
                                b {{ parcel_obj.req_data['floors'] }}
                            h4 Labour:&nbsp;
                                b {{ parcel_obj.req_data['labours'] }}
                            h4 Vehicle Required:&nbsp;
                                b {{ parcel_obj.req_data['vecType'] }}
                            h4 Parcel Images:&nbsp;
                                button.btn.btn-sm.btn-info(data-toggle='modal' data-target='#pDetailImgPP' v-on:click='openImagePP(parcel_obj.req_data["parcelUriArray"])')
                                    i.fa.fa-eye
                            h3 Driver Info
                            template(v-if="!loaders.driver")
                                h4 Driver:&nbsp;
                                    router-link(v-bind:to="'/admin/drivers/profile/'+data.driver['uid']" target="_blank")
                                        b {{ data.driver['first_name'] }} {{ data.driver['last_name'] }}
                                h4 Number:&nbsp;
                                    b {{ data.driver['mob_no'] }}
                            b(v-else) Loading...
                            h3 Client Info
                            template(v-if="!loaders.client")
                                h4 Client:&nbsp;
                                    router-link(v-bind:to="'/admin/users/profile/'+data.client['uid']" target="_blank")
                                        b {{ data.client['first_name'] }} {{ data.client['last_name'] }}
                                h4 Number:&nbsp;
                                    b {{ data.client['mob_no'] }}
                            b(v-else) Loading...
        parcel_images(v-bind:images="sel_images" id='pDetailImgPP')

</template>

<script>
    import firebase from 'firebase'

    import parcelImages from '../modals/parcel_images.vue'

    export default {
        components: {
            'parcel_images': parcelImages,
        },
        name: "parcel_details",
        props: {
            parcel_obj: {
                type: Object,
                default: {}
            }
        },
        data () {
            const db = firebase.database();
            return {
                loaders: {
                    driver: true,
                    client: true
                },
                data: {
                    driver: {},
                    client: {}
                },
                sel_images: [],

                userRef: db.ref('/users'),
            }
        },
        watch: {
            parcel_obj (val) {
                if(val.hasOwnProperty('pend_req_data')) {
                    this.dataLoad(val.pend_req_data);
                }
            }
        },
        methods: {
            async dataLoad (pReqData) {
                this.loaders['driver'] = true;
                this.loaders['client'] = true;
                await this.driverDataLoad(pReqData.driver_uid);
                await this.clientDataLoad(pReqData.user_uid);
            },
            async driverDataLoad (uid) {
                const self = this;
                await self.userRef.child(uid).once('value', function (snap) {
                    let item = snap.val();
                    item['uid'] = uid;
                    self.data['driver'] = item;
                    self.loaders['driver'] = false;
                });
            },
            async clientDataLoad (uid) {
                const self = this;
                await self.userRef.child(uid).once('value', function (snap) {
                    let item = snap.val();
                    item['uid'] = uid;
                    self.data['client'] = item;
                    self.loaders['client'] = false;
                });
            },
            openImagePP (images) {
                this.sel_images = images;
            }
        }
    }
</script>