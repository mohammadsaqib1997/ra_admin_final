require('babel-core/register');
require('babel-polyfill');

import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from "vue-resource"
import SimpleVueValidation from 'simple-vue-validator'
import firebase from 'firebase'

import config_fb from '../../config/clientPrivate.json'
firebase.initializeApp(config_fb.config_fb);

import routes from './routes'

Vue.use(VueRouter);
Vue.use(VueResource);
Vue.use(SimpleVueValidation);

const router = new VueRouter({
    mode: 'history',
    routes,
    scrollBehavior (to, from, savedPosition) {
        return { x: 0, y: 0 }
    }
});

/*const fromReq = '';
router.beforeEach(function (to, from, next) {
    console.log(to.path);
    next();
});*/

new Vue({
    router,
    beforeCreate: function(){
        let self = this;
        let checkRouteAuth = self.$route.matched.some(function (record) {return record.meta.requiresAuth;});
        let route = self.$route.path;
        firebase.auth().onAuthStateChanged(function(user) {
            self.compileProc = false;
            if (user) {
                if(checkRouteAuth){
                    self.$router.push(route);
                }else{
                    self.$router.push('/admin');
                }
            } else {
                self.$router.push('/admin/login');
            }
        });
    },
    data: {
        csrf: '',
        compileProc: true,
        mapLoaded: false
    },
    beforeMount: function () {
        this.csrf = this.$el.attributes.csrf.value;
    },
    methods: {
        isNumber: function (val, oldVal, length) {
            if (val !== "") {
                if (isNaN(val)) {
                    return oldVal;
                } else {
                    if(length){
                        if (val > length){
                            return oldVal;
                        }
                    }
                    return parseInt(val);
                }
            } else {
                return 0;
            }
        },
        trim: function (val) {
            return val.replace(/\s{2,}/g, ' ');
        }
    }
}).$mount("#app");