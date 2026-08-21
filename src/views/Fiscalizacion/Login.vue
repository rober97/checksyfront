<template>
  <q-page padding class="flex flex-center">
    <q-card flat bordered style="width:100%;max-width:420px">
      <q-card-section>
        <div class="text-h6">Acceso fiscalizador DT</div>
        <div class="text-caption text-grey-7">
          Res. Ex. N°38/2024, art. 23 — solo con tu correo institucional.
        </div>
      </q-card-section>

      <q-card-section v-if="step === 'email'">
        <q-form @submit.prevent="onRequestAccess">
          <q-input
            v-model="email"
            label="Correo institucional"
            type="email"
            outlined
            dense
            placeholder="nombre.apellido@dt.gob.cl"
            :rules="[v => /^[^\s@]+@dt\.gob\.cl$/i.test(v) || 'Debe ser un correo @dt.gob.cl']"
            autofocus
          />
          <q-banner v-if="portal.error" class="bg-red-1 text-red-9 q-mt-sm" dense rounded>
            {{ portal.error }}
          </q-banner>
          <q-btn
            class="q-mt-md full-width"
            type="submit"
            color="primary"
            unelevated
            no-caps
            label="Solicitar clave"
            :loading="portal.loading"
          />
        </q-form>
      </q-card-section>

      <q-card-section v-else>
        <div class="text-body2 q-mb-md">
          Te enviamos una clave a <b>{{ email }}</b>, vigente 5 días corridos. Ingrésala para continuar.
        </div>
        <q-form @submit.prevent="onLogin">
          <q-input
            v-model="password"
            label="Clave"
            outlined
            dense
            autofocus
            :rules="[v => !!v || 'Ingresa la clave que recibiste']"
          />
          <q-banner v-if="portal.error" class="bg-red-1 text-red-9 q-mt-sm" dense rounded>
            {{ portal.error }}
          </q-banner>
          <q-btn
            class="q-mt-md full-width"
            type="submit"
            color="primary"
            unelevated
            no-caps
            label="Ingresar"
            :loading="portal.loading"
          />
          <q-btn
            class="q-mt-sm full-width"
            flat
            no-caps
            label="Pedir otra clave"
            @click="step = 'email'"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useDtPortalStore } from '@/stores/dtPortalStore'

const portal = useDtPortalStore()
const router = useRouter()
const $q = useQuasar()

const step = ref('email')
const email = ref('')
const password = ref('')

onMounted(() => {
  if (portal.isAuthenticated) {
    router.replace(portal.hasCompany ? '/fiscalizacion/reportes' : '/fiscalizacion/empresas')
  }
})

async function onRequestAccess() {
  if (!/^[^\s@]+@dt\.gob\.cl$/i.test(email.value)) return
  try {
    const data = await portal.requestAccess(email.value)
    $q.notify({ type: 'positive', message: data?.message || 'Clave enviada' })
    step.value = 'password'
  } catch {
    // portal.error ya queda seteado para mostrarse en pantalla
  }
}

async function onLogin() {
  if (!password.value) return
  try {
    await portal.login(email.value, password.value)
    router.push('/fiscalizacion/empresas')
  } catch {
    // portal.error ya queda seteado para mostrarse en pantalla
  }
}
</script>
