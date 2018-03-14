import firebase from 'firebase'
import func from '../../../custom_libs/func'

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

        let date1 = new Date();
        let date2 = new Date();
        let week_dates = date1.setDate(date1.getDate()-7);
        let actual_date = date2.getDate()+"/"+(date2.getMonth()+1)+"/"+date2.getFullYear();

        self.completeReqRef.once('value').then(function (snap) {
            let comReqDataRender = snap.val();
            let dataKeys = Object.keys(comReqDataRender).reverse();
            let process_complete = 0;
            dataKeys.forEach(function(rq_key){
                let comRqData = comReqDataRender[rq_key];
                self.userReqRef.child(comRqData.client_uid+"/"+rq_key).once('value').then(function (req_snap) {
                    let reqData = req_snap.val();
                    reqData['createdAt'] = func.set_date_ser(new Date(reqData.createdAt));
                    self.all.push(reqData);
                    process_complete++;
                    if(dataKeys.length === process_complete){

                        self.all.forEach(function (val,i) {
                            let split_date = val.createdAt.split(" ")[2];
                            let second_split_date = split_date.split("/");
                            let generate_week_dates = new Date(second_split_date[1]+"-"+second_split_date[0]+"-"+second_split_date[2]).getTime();
                            if(actual_date === split_date){
                                self.today.push(val);
                            }
                            if(week_dates < generate_week_dates){
                                self.week.push(val);
                            }
                        });

                        self.dataLoad = false;
                    }
                });
            });
        });
    },
    data: function(){
        return {
            dataLoad: true,
            all: [],
            week: [],
            today: [],
            userRef: null,
            userReqRef: null,
            completeReqRef: null,
        }
    }
}