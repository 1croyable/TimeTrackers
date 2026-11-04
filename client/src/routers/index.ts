import { createRouter, Router, createWebHistory, RouteRecordRaw } from 'vue-router';

import HomeRoutes from './home.routes';

import { useAlertStore } from '../stores';
import { useAuthStore } from '../stores';

const routes: Array<RouteRecordRaw> = [
    ...HomeRoutes,
    { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router: Router = createRouter({
    history: createWebHistory('/'),
    routes,
})

router.beforeEach(async (to, from, next) => {
    const alertStore = useAlertStore();
    const authStore = useAuthStore();
    alertStore.clear();

    if (to.meta.requiresAuth) {
        let user = await authStore.getCurrentUser();
        if (!user) {
            authStore.userToken = null;
            localStorage.removeItem('user');
            authStore.returnUrl = to.fullPath;
            next('/account/login');
        } else {
            next();
        }
    } else if (to.path === '/account/login' || to.path === '/account/register') {
        let user = await authStore.getCurrentUser();
        if (user) {
            alertStore.error('您已登录，请先退出登录');
            next(from.fullPath);
        } else {
            authStore.userToken = null;
            localStorage.removeItem('user');
            next();
        }
    } else {
        next();
    }
});


export default router