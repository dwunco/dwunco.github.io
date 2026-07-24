import routes from './routes.js';

const storedTheme = localStorage.getItem('dark');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

export const store = Vue.reactive({
    dark: storedTheme === null ? prefersDark : JSON.parse(storedTheme),
    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
        document.documentElement.style.colorScheme = this.dark ? 'dark' : 'light';
    },
});

document.documentElement.style.colorScheme = store.dark ? 'dark' : 'light';

const app = Vue.createApp({
    data: () => ({ store }),
});

// Make the store globally accessible
app.provide('store', store);

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

app.use(router);
app.mount('#app');
console.log('Vue app mounted');