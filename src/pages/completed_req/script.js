import firebase from 'firebase'
import func from '../../../custom_libs/func'
import moment from 'moment'
import _ from 'lodash'

import tableComp from '../../partials/components/html_utils/tabel_comp.vue'

export default {
    components: {
        'table_comp': tableComp
    },
    created: function () {
        let self = this;

        const db = firebase.database();
        self.userRef = db.ref('/users');
        self.userReqRef = db.ref('/user_requests');
        self.completeReqRef = db.ref('/complete_requests');

        self.completeRequestListener();
    },
    destroyed() {
        this.completeReqRef.off();
    },
    data: function () {
        return {
            dataLoad: true,
            all: [],
            week: [],
            today: [],
            userRef: null,
            userReqRef: null,
            completeReqRef: null,
        }
    },
    methods: {
        dateFormat(ms) {
            return moment(ms).format("hh:mm A, DD/MM/YYYY")
        },
        genWeekDays() {
            let grabDates = []
            let m_date = moment();
            grabDates.push(m_date.format('DD/MM/YYYY'))
            for(let i=1; i < 7; i++){
                grabDates.push(m_date.subtract(1, 'd').format('DD/MM/YYYY'))
            }
            return grabDates
        },
        async completeRequestListener() {
            const self = this;
            // snap means total number of snapshot in complete request list
            await self.completeReqRef.on('value', async function (snap) {
                self.dataLoad = true;
                self.all = [];
                self.week = [];
                self.today = [];

                let grabData = [];

                if (snap.numChildren() > 0) {

                    // compReqSnap means inner item in complete request list
                    await Promise.all(_.map(snap.val(), async (compReqData, key) => {
                        let reqSnap = await self.userReqRef.child(compReqData.client_uid + "/" + key).once('value')
                        let clientSnap = await self.userRef.child(compReqData.client_uid).once('value')
                        let driverSnap = await self.userRef.child(compReqData.driver_uid).once('value')

                        grabData.push({
                            compReqData,
                            reqData: reqSnap.val(),
                            clientData: clientSnap.val(),
                            driverData: driverSnap.val()
                        });
                    }))

                    // sorted here desc/asc
                    self.all = await _.orderBy(grabData, function (row) { return row.reqData.createdAt }, ['desc'])

                    // grabdata for today date
                    let today_grabData = [];
                    const today_date = moment().format("DD/MM/YYYY")
                    await Promise.all(_.map(self.all, async (row) => {
                        const req_date = moment(row.reqData.createdAt).format("DD/MM/YYYY");
                        if(req_date === today_date) {
                            today_grabData.push(row)
                        }
                    }))
                    self.today = today_grabData;

                    // grabdata here week dates
                    let week_dates = await self.genWeekDays()
                    let week_grabData = []
                    await Promise.all(_.map(self.all, async (row) => {
                        const req_date = moment(row.reqData.createdAt).format("DD/MM/YYYY");
                        const search = await _.find(week_dates, function (date) { return date === req_date })
                        if(typeof search !== 'undefined') {
                            week_grabData.push(row)
                        }
                    }))
                    self.week = week_grabData;

                    self.dataLoad = false;
                } else {
                    self.dataLoad = false;
                }
            });
        }
    }
}