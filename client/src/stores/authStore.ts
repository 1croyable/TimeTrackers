import { defineStore } from 'pinia';
import { axiosWrapper } from '../utilities/axios-wrapper';
import router from '../routers';
import { useAlertStore } from './alertStore';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        userToken: JSON.parse(localStorage.getItem('user') || 'null'),
        returnUrl: null as string | null // 某个页面需要用户登录，但是用户没登录，这个时候会让用户登录并保存这个页面到returnUrl
    }),
    actions: {
        async login(username: string, password: string) {
            const alertStore = useAlertStore();

            try {
                const userToken = await axiosWrapper.post<{ token: string }>('/user/authenticate', { username, password });

                // 跟新user状态
                this.userToken = userToken;

                // 使用 localStorage 保存用户信息，以便刷新页面时保持登录状态
                localStorage.setItem('user', JSON.stringify(userToken));

                router.push(this.returnUrl || '/');
                this.returnUrl = null;
            } catch (error) {
                alertStore.error(error as string);
            }
        },
        logout() {
            this.userToken = null;
            this.returnUrl = null;
            localStorage.removeItem('user');
            router.push('/account/login');
        },
        async authLevel(userId: number) {
            const level = await axiosWrapper.get<{ level: number }>('/user/authLevel:' + userId);
            return level;
        },
        async register(user: Record<string, any>) {
            await axiosWrapper.post('/user/register', user);
        },
        async getCurrentUser() { // 获取用户的信息并返回直接使用，不保存，在任何需要使用的地方使用就行
            try {
                return await axiosWrapper.get<Record<string, any>>('/user/verifyToken');
            } catch (error) {
                const alertStore = useAlertStore();
                alertStore.error(error as string); // 并返回undefined
            }
        }
    }
});