<template lang="pug">
    section.content
        h2 Logs
        .row
            .tab-content
                ul.nav.nav-tabs(role='tablist')
                    li(role='tablist')
                        a(href='#today' aria-controls='today' role='tab' data-toggle='tab') Today
                    li(role='tablist')
                        a(href='#week' aria-controls='week' role='tab' data-toggle='tab') Week
                    li.active(role='tablist')
                        a(href='#all' aria-controls='all' role='tab' data-toggle='tab') All
            .tab-content
                //tab today
                div.tab-pane#today(role='tabpanel')
                    .col-xs-12
                        div.table-responsive
                            div.text-center(v-if='loading')
                                i.fa.fa-refresh.fa-spin.fa-3x.fa-fw
                            template(v-else)
                                h3.text-center(style='margin: 15px 0;' v-if='todayLogs.length < 1')
                                    | No Data Found!
                                table.table.table-hover(v-else)
                                    thead
                                        tr
                                            th Login Date/Time
                                            th Logout Date/Time
                                            th Duration
                                    tbody
                                        tr(v-for="log in todayLogs")
                                            td {{ log.loginTime }}
                                            td {{ log.logoutTime }}
                                            td {{ timeFormat(log.duration) }}
                                    tfoot
                                        tr
                                            td.text-right(colspan='2') Total Spent Time
                                            td {{ timeFormat(todayLogsTSTime) }}
                //tab week
                div.tab-pane#week(role='tabpanel')
                    .col-xs-12
                        div.table-responsive
                            div.text-center(v-if='loading')
                                i.fa.fa-refresh.fa-spin.fa-3x.fa-fw
                            template(v-else)
                                h3.text-center(style='margin: 15px 0;' v-if='weekLogs.length < 1')
                                    | No Data Found!
                                table.table.table-hover(v-else)
                                    thead
                                        tr
                                            th Login Date/Time
                                            th Logout Date/Time
                                            th Duration
                                    tbody
                                        tr(v-for="log in weekLogs")
                                            td {{ log.loginTime }}
                                            td {{ log.logoutTime }}
                                            td {{ timeFormat(log.duration) }}
                                    tfoot
                                        tr
                                            td.text-right(colspan='2') Total Spent Time
                                            td {{ timeFormat(weekLogsTSTime) }}
                //tab all
                div.tab-pane.active#all(role='tabpanel')
                    .col-xs-12
                        div.table-responsive
                            div.text-center(v-if='loading')
                                i.fa.fa-refresh.fa-spin.fa-3x.fa-fw
                            template(v-else)
                                h3.text-center(style='margin: 15px 0;' v-if='allLogs.length < 1')
                                    | No Data Found!
                                table.table.table-hover(v-else)
                                    thead
                                        tr
                                            th Login Date/Time
                                            th Logout Date/Time
                                            th Duration
                                    tbody
                                        tr(v-for="log in dataToShow")
                                            td {{ log.loginTime }}
                                            td {{ log.logoutTime }}
                                            td {{ timeFormat(log.duration) }}
                                    tfoot
                                        tr
                                            td.text-right(colspan='2') Total Spent Time
                                            td {{ timeFormat(allLogsTSTime) }}
                        span.o_pager_value.center-block.pagination-centered.text-center {{counter}}
                            |  /
                            span.o_pager_limit(style="padding-right: 6px;") 38
                            span.btn-group.btn-group-sm
                                button.fa.fa-chevron-left.btn.btn-icon.o_pager_previous(v-if='isPrevAvaliable',v-on:click="btnPrev",style='background-color:white;border-color: #adadad;color: #4c4c4c;',type='button', accesskey='p')
                                button.fa.fa-chevron-right.btn.btn-icon.o_pager_next(v-if='isNextAvaliable', v-on:click="btnNext" style='background-color:white;border-color: #adadad;color: #4c4c4c;',type='button',accesskey='n')
</template>

<script>
    import firebase from 'firebase'
    import moment from 'moment'

    export default {
        watch: {
            allLogs: function (val) {
                this.filterLogs(this, val);
            }
        },
        mounted() {
            const self = this;
            if(self.$route.params.id) {
                self.sessionCol.orderByChild("userID").equalTo(self.$route.params.id).on('value', function (snap) {
                    self.allLogs = [];
                    self.allLogsTSTime = moment.duration();
                    if(snap.val() !== null){
                        snap.forEach(function (item) {
                            let data_set = {};
                            data_set.loginTimeM = moment(item.val().loginTime);
                            data_set.loginTime = moment(item.val().loginTime).format("DD/MM/YYYY, hh:mm:ss a");
                            data_set.logoutTime = "";
                            data_set.duration = moment.duration();


                            if(item.val().hasOwnProperty("logoutTime")){
                                data_set.logoutTime = moment(item.val().logoutTime).format("DD/MM/YYYY, hh:mm:ss a");
                                data_set.duration.add(moment.duration(moment(item.val().logoutTime).diff(moment(item.val().loginTime))));
                            }

                            self.allLogsTSTime.add(data_set.duration);
                            self.allLogs.push(data_set);
                        });
                        if (self.allLogs.length > 10) {
                            console.log("Length is gretaer the 10");
                            self.dataToShow = self.allLogs.slice(0, 10);
                            self.currentlyShowing = self.dataToShow.length;
                            self.isNextAvaliable = true;
                        }
                        else {
                            self.dataToShow = self.allLogs;
                            console.log("Length is gretaer the 10");
                        }
                        self.isPrevAvaliable = false;
                    }
                    self.loading = false;
                });
            }
        },
        destroyed () {
            this.sessionCol.off();
        },
        data() {
            const db = firebase.database();
            return {
                loading: true,
                sessionCol: db.ref("sessions"),
                todayLogs: [],
                weekLogs: [],
                allLogs: [],
                todayLogsTSTime: moment.duration(),
                weekLogsTSTime: moment.duration(),
                allLogsTSTime: moment.duration(),


                currentlyShowing: 0,
                dataToShow: [],
                isNextAvaliable: false,
                isPrevAvaliable: false,
                counter: 1,
            }
        },
        methods: {
            btnNext: function () {
                let self = this;
                self.dataToShow = self.allLogs.slice(self.currentlyShowing,self.currentlyShowing+10);
                self.currentlyShowing += self.dataToShow.length;
                self.counter++;
                if(self.allLogs.length <= self.currentlyShowing){
                    self.isNextAvaliable = false;
                }
                self.isPrevAvaliable = true;
            },
            btnPrev: function () {
                let self = this;
                self.currentlyShowing -= self.dataToShow.length;
                self.dataToShow = self.allLogs.slice(self.allLogs.length-self.dataToShow.length-10,self.allLogs.length-self.dataToShow.length);

                self.isNextAvaliable = true;
                self.counter--;
                if( self.currentlyShowing - self.dataToShow.length <= 0){
                    self.isPrevAvaliable = false;
                }
            },


            filterLogs: function (self, allLogs) {
                self.todayLogs = [];
                self.weekLogs = [];
                self.todayLogsTSTime = moment.duration();
                self.weekLogsTSTime = moment.duration();
                if(allLogs.length > 0){
                    const todayDate = moment().set({hour: 0, minute: 0, second: 0});
                    const weekDate = todayDate.clone().subtract(7, "days");
                    allLogs.forEach(function (item) {
                        if(todayDate.unix() <= item.loginTimeM.unix()){
                            self.todayLogs.push(item);
                            self.todayLogsTSTime.add(item.duration);
                        }
                        if(weekDate.unix() <= item.loginTimeM.unix()){
                            self.weekLogs.push(item);
                            self.weekLogsTSTime.add(item.duration);
                        }
                    });
                }
            },
            timeFormat: function (mDuration) {
                let hours = (mDuration.get('h').toString().length < 2) ? "0"+mDuration.get('h'): mDuration.get('h');
                let min = (mDuration.get('m').toString().length < 2) ? "0"+mDuration.get('m'): mDuration.get('m');
                let sec = (mDuration.get('s').toString().length < 2) ? "0"+mDuration.get('s'): mDuration.get('s');
                return hours+":"+min+":"+sec;
            }
        }
    }
</script>