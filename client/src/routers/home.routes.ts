import { RouteRecordRaw } from 'vue-router';

const HomeRoutes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@views/Home.vue'),
        meta: { title: '首页', requiresAuth: false },
    },
];

export default HomeRoutes;