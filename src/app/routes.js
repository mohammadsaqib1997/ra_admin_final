import PageNotFound from '../pages/error/error.vue'
import app from './app.vue'

import loginLayout from '../partials/layouts/loginLayout/loginLayout.vue'
import login from '../pages/login/login.vue'

import dashboardLayout from '../partials/layouts/dashboardLayout/dashboardLayout.vue'
import dashboard from '../pages/dashboard/dashboard.vue'

import parentComLayout from '../partials/layouts/parentComLayout/parentComLayout.vue'
import addDriver from '../pages/add_driver/add_driver.vue'
import editDriver from '../pages/edit_driver/edit_driver.vue'
import driverList from '../pages/driver_listing/driver_listing.vue'
import driverListDeactive from '../pages/driver_listing_deactive/driver_listing_deactive.vue'
import profile from '../pages/profile/profile.vue'

import userList from '../pages/user_listing/user_listing.vue'
import user_profile from '../pages/user_profile/user_profile.vue'

import completedRequests from '../pages/completed_req/completed_req.vue'
import canceledRequest from '../pages/canceled_req/canceled_req.vue'
import newRequests from '../pages/new_req/new_req.vue'

import userAccount from '../pages/user_account/user_account.vue'
import driverAccount from '../pages/driver_account/driver_account.vue'

import userInvoice from '../pages/user_invoice/user_invoice.vue'
import comInvoice from '../pages/com_invoice/com_invoice.vue'

import leaderboard from '../pages/leaderboard/leaderboard.vue'

import addAdda from '../pages/add_adda/add_adda.vue'
import listAdda from '../pages/list_adda/list_adda.vue'
import editAdda from '../pages/edit_adda/edit_adda.vue'

const routes = [
    {
        path: '/admin',
        component: app,
        children: [
            {
                path: '',
                component: dashboardLayout,
                meta: {
                    requiresAuth: true
                },
                children: [
                    {
                        path: '',
                        component: dashboard
                    },
                    {
                        path: 'adda',
                        component: parentComLayout,
                        children: [
                            {path: 'add', component: addAdda},
                            {path: 'list', component: listAdda},
                            {path: 'edit/:id', component: editAdda}
                        ]
                    },
                    {
                        path: 'users',
                        component: parentComLayout,
                        children: [
                            {path: '', component: userList},
                            {path: 'profile/:id', component: user_profile}
                        ]
                    },
                    {
                        path: 'drivers',
                        component: parentComLayout,
                        children: [
                            {path: '', component: driverList},
                            {path: 'requests', component: driverListDeactive},
                            {path: 'profile/:id', component: profile},
                            {path: 'add_driver', component: addDriver},
                            {path: 'edit_driver/:id', component: editDriver}
                        ]
                    },
                    {
                        path: 'requests',
                        component: parentComLayout,
                        children: [
                            {path: '', component: newRequests},
                            {path: 'completed', component: completedRequests},
                            {path: 'canceled', component: canceledRequest}
                        ]
                    },
                    {
                        path: 'accounts',
                        component: parentComLayout,
                        children: [
                            {path: 'user', component: userAccount},
                            {path: 'driver', component: driverAccount}
                        ]
                    },
                    {
                        path: 'invoice',
                        component: parentComLayout,
                        children: [
                            {path: ':id', component: userInvoice},
                            {path: 'commission/:id', component: comInvoice}
                        ]
                    },
                    {
                        path: 'leaderboard',
                        component: parentComLayout,
                        children: [
                            {path: '', component: leaderboard},
                        ]
                    }
                ]
            },
            {
                path: 'login',
                component: loginLayout,
                meta: {
                    requiresAuth: false
                },
                children: [
                    {path: '', component: login},
                ]
            },
            {
                path: '*',
                component: PageNotFound
            }
        ]
    }
];

module.exports = routes;