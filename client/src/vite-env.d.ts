/// <reference types="vite/client" />

// Vuetify exports this stylesheet without a TypeScript declaration.
declare module 'vuetify/styles';
declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
    const component: DefineComponent<{}, {}, any>
    export default component
}

declare module '@/store/index.js'
declare module 'js-cookie'
