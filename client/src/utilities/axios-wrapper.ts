import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../stores';

const axiosInstance = axios.create({
    baseURL: `/api`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 请求拦截器里传入token的验证
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore();

    const isLoggedIn = !!authStore.userToken?.token;
    if (isLoggedIn) {
        config.headers.Authorization = `Bearer ${authStore.userToken.token}`;
    } // 如果是情况：用户没有token，但是试图去解码token，在这里不会报错，而是在后端报错，前端的响应拦截器中处理
    return config;
}, (error) => {
    return Promise.reject(error);
});

axiosInstance.interceptors.response.use((response: AxiosResponse) => {
    return response.data;
}, (error) => {
    const authStore = useAuthStore();

    if([401, 403].includes(error.response.status))  {
        if(authStore.userToken) {
            authStore.logout(); // 如果用户已经登录，说明token过期，需要重新登录
        }
        // 在路由守卫里会跳转到登录页并清空状态
    }

    return Promise.reject(error.response.data?.message || error.message);
});

export const axiosWrapper = {
    get: <T>(url: string): Promise<T> => axiosInstance.get(url),
    post: <T>(url: string, body: any): Promise<T> => axiosInstance.post(url, body),
    put: <T>(url: string, body: any): Promise<T> => axiosInstance.put(url, body),
    delete: <T>(url: string): Promise<T> => axiosInstance.delete(url)
};