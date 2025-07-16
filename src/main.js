import { createApp } from 'vue';
import App from './App.vue';

import { createPinia } from 'pinia';
import router from './router';

import { Quasar } from 'quasar';
import quasarUserOptions from './quasar-user-options';

import './css/theme.css';
import './css/base.css';

// 👉 Instancia principal de la app
const app = createApp(App);

// 👉 Configuración de Quasar (tema, iconos, etc.)
app.use(Quasar, quasarUserOptions);

// 👉 Instancia de Pinia (store global)
const pinia = createPinia();
app.use(pinia);

// 👉 Router para navegación
app.use(router);

// 👉 Montar la aplicación
app.mount('#app');
