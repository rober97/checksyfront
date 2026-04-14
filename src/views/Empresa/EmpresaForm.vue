<template>
  <q-page>
    <div class="rk-module-shell">
      <section class="rk-module-header">
        <div class="rk-module-icon">
          <q-icon :name="isEditMode ? 'edit_note' : 'add_business'" size="28px" />
        </div>
        <div class="col">
          <h1 class="rk-module-title">{{ isEditMode ? 'Editar empresa' : 'Nueva empresa' }}</h1>
          <p class="rk-module-subtitle">
            Registra la empresa cliente. Luego podrás asignarle un administrador RR.HH. desde el listado de administradores.
          </p>
        </div>
        <div class="rk-module-actions">
          <q-btn flat color="primary" icon="arrow_back" label="Cancelar" @click="goBack" />
        </div>
      </section>

      <section class="rk-module-panel">
        <div class="rk-module-panel__section">
          <div class="row items-center q-col-gutter-md q-mb-lg">
            <div class="col-12 col-md">
              <h2 class="rk-module-panel__title">Datos de la empresa</h2>
              <p class="rk-module-panel__caption">
                Completa la información principal para activar la empresa dentro del sistema.
              </p>
            </div>
            <div class="col-12 col-md-auto">
              <div class="rk-module-stat">
                <div class="rk-module-stat__icon">
                  <q-icon name="domain" size="20px" />
                </div>
                <div>
                  <div class="rk-module-stat__label">Modo</div>
                  <div class="rk-module-stat__value mode-copy">
                    {{ isEditMode ? 'Edición' : 'Creación' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <q-form @submit.prevent="handleSubmit" class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.name"
                label="Nombre de la empresa *"
                outlined
                :rules="[val => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.rut"
                label="RUT *"
                outlined
                placeholder="76123456-7"
                :rules="[val => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.email"
                label="Correo electrónico"
                type="email"
                outlined
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="form.phone" label="Teléfono" outlined />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.address"
                label="Dirección"
                outlined
                type="textarea"
                autogrow
              />
            </div>

            <div class="col-12">
              <div class="row justify-end q-gutter-sm">
                <q-btn flat label="Cancelar" @click="goBack" />
                <q-btn
                  type="submit"
                  unelevated
                  color="primary"
                  :loading="loading"
                  label="Guardar empresa"
                />
              </div>
            </div>
          </q-form>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useCompaniesStore } from '@/stores/companies'
import { useAuthStore } from '@/stores/authStore'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const companiesStore = useCompaniesStore()
const auth = useAuthStore()

const isEditMode = ref(false)
const loading = ref(false)
const form = ref({
  name: '',
  rut: '',
  email: '',
  phone: '',
  address: '',
})

// Listado de vuelta según el rol (cada rol tiene su propia ruta)
const listPath = computed(() => {
  if (auth.role === 'superadmin') return '/superadmin/empresas'
  if (auth.role === 'admin_rrhh') return '/rrhh/empresa'
  return '/'
})

const handleSubmit = async () => {
  if (loading.value) return
  loading.value = true
  try {
    if (isEditMode.value) {
      await companiesStore.updateCompany(route.params.id, { ...form.value })
      $q.notify({ type: 'positive', message: 'Empresa actualizada correctamente' })
    } else {
      await companiesStore.createCompany({ ...form.value })
      $q.notify({ type: 'positive', message: 'Empresa creada correctamente' })
    }
    router.push(listPath.value)
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      'Ocurrió un error al guardar la empresa'
    $q.notify({ type: 'negative', message: msg, timeout: 4000 })
    console.error('[EmpresaForm] submit error:', err)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push(listPath.value)
}

onMounted(async () => {
  const id = route.params.id
  if (id) {
    isEditMode.value = true
    try {
      const c = await companiesStore.fetchCompanyById?.(id)
      if (c) {
        form.value = {
          name: c.name || '',
          rut: c.rut || '',
          email: c.email || '',
          phone: c.phone || '',
          address: c.address || '',
        }
      }
    } catch (err) {
      console.error('[EmpresaForm] load error:', err)
    }
  }
})
</script>

<style scoped>
.mode-copy {
  font-size: 18px;
}
</style>
