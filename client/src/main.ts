import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import App from './App.vue';

const vuetify = createVuetify({
  defaults: {
    VBtn: {
      rounded: 'lg',
      class: 'text-none',
    },
    VCard: {
      rounded: 'xl',
      variant: 'flat',
      border: true,
      color: 'surface',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VFileInput: {
      variant: 'outlined',
    },
    VProgressLinear: {
      rounded: true,
      height: 9,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#6954ff',
          secondary: '#666987',
          background: '#f8f9ff',
          surface: '#ffffff',
          'surface-variant': '#e9e8f4',
          'on-surface': '#131431',
          sidebar: '#f7f7ff',
          focus: '#eae5ff',
          success: '#44c780',
        },
      },
    },
  },
});

createApp(App).use(vuetify).mount('#app');
