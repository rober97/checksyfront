import { createApp } from 'vue'
import App from './App.vue'

import { createPinia } from 'pinia'
import router from './router'

// ⬇️ Registra Quasar + Dialog/Notify aquí
import { Quasar, Dialog, Notify } from 'quasar'
import quasarUserOptions from './quasar-user-options'

import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import './css/theme.css'
import './css/base.css'

// 👉 Instancia principal de la app
const app = createApp(App)

// 👉 Plugins
app.use(Quasar, {
  // Mantenemos lo que ya tengas en quasar-user-options
  ...quasarUserOptions,
  // Aseguramos que Dialog y Notify queden registrados
  plugins: { ...(quasarUserOptions.plugins || {}), Dialog, Notify },
  // (Opcional) Config global del Notify
  config: {
    ...(quasarUserOptions.config || {}),
    notify: { position: 'top-right', timeout: 2500 }
  }
})

app.use(Toast, {
  position: POSITION.TOP_RIGHT,
  timeout: 4000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  hideProgressBar: false,
  theme: 'dark'
})
app.use(createPinia())
app.use(router)

// 👉 Montar la aplicación al final
app.mount('#app')
