import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'      // 👉 Agrega Pinia
import router from './router/index.js'
import { Quasar } from 'quasar'
import quasarUserOptions from './quasar-user-options'

const app = createApp(App)
  .use(Quasar, quasarUserOptions)

const pinia = createPinia()              // 👉 Crea instancia Pinia

app.use(pinia)                           // 👉 Usa Pinia en la app
app.use(router)                          // Mantén el router (igual que antes)

app.mount('#app')
