import { createApp } from 'vue'
import App from './App.vue'
import Axios from 'axios'
import router from './routers/index.ts'
import 'vuetify/iconsets/mdi'
import colors from 'vuetify/util/colors'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { mdiAccount } from '@mdi/js'

import { createPinia } from 'pinia'

const pinia = createPinia()

const vuetify = createVuetify({
    icons: {
        defaultSet: 'mdi',
        aliases: {
            ...aliases,
            account: mdiAccount,
        },
        sets: {
            mdi,
        },
    },
    ssr: true,
    theme: {
        themes: {
            light: {
                dark: false,
                colors: {
                    primary: colors.red.darken1, // #E53935
                    secondary: colors.red.lighten4, // #FFCDD2
                },
            },
        },
    }
})

let app = createApp(App);
app.use(router).use(vuetify).use(pinia);
app.config.globalProperties.Axios = Axios;
app.mount('#app');