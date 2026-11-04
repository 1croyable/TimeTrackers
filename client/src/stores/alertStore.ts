import { defineStore } from 'pinia';

interface Alert {
    message: string;
    type: 'alert-success' | 'alert-danger';
}

interface AlertState {
    alert: Alert | null;
}

export const useAlertStore = defineStore('alert',{
    state: (): AlertState => ({
        alert: null
    }),
    actions: {
        success(message: string) {
            this.alert = { message, type: 'alert-success' };
        },
        error(message: string) {
            this.alert = { message, type: 'alert-danger' };
        },
        clear() {
            this.alert = null;
        }
    }
});