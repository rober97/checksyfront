<template>
  <q-page padding class="fisc-page">
    <div class="text-h6 q-mb-xs">Selecciona el empleador a fiscalizar</div>
    <div class="text-caption text-grey-7 q-mb-md">
      Res. Ex. N°38/2024, art. 24 a) — búsqueda por nombre o RUT, o la lista completa ordenada alfabéticamente.
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <q-input
          v-model="q"
          outlined
          dense
          label="Buscar por nombre o RUT"
          debounce="300"
          clearable
          @update:model-value="load"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </q-card-section>
    </q-card>

    <q-card flat bordered>
      <q-list separator>
        <q-item
          v-for="c in companies"
          :key="c._id"
          clickable
          @click="select(c)"
        >
          <q-item-section avatar><q-icon name="apartment" /></q-item-section>
          <q-item-section>
            <q-item-label>{{ c.name }}</q-item-label>
            <q-item-label caption>{{ c.rut }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
        <q-item v-if="!loading && !companies.length">
          <q-item-section class="text-grey">Sin empleadores que coincidan con la búsqueda.</q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useDtPortalStore } from '@/stores/dtPortalStore'
import dtPortalAxios from '@/utils/dtPortalRequest'

const portal = useDtPortalStore()
const router = useRouter()
const $q = useQuasar()

const q = ref('')
const companies = ref([])
const loading = ref(false)

onMounted(() => {
  if (!portal.isAuthenticated) {
    router.replace('/fiscalizacion')
    return
  }
  load()
})

async function load() {
  loading.value = true
  try {
    const { data } = await dtPortalAxios.get('/dt/portal/companies', { params: { q: q.value || undefined } })
    companies.value = data.companies || []
  } catch (err) {
    $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Error cargando empleadores' })
  } finally {
    loading.value = false
  }
}

async function select(company) {
  try {
    const { data } = await dtPortalAxios.post('/dt/portal/select-company', { companyId: company._id })
    portal.setCompany(data.token, data.company)
    router.push('/fiscalizacion/reportes')
  } catch (err) {
    $q.notify({ type: 'negative', message: err?.response?.data?.message || 'Error seleccionando empleador' })
  }
}
</script>

<style scoped>
.fisc-page { max-width: 720px; margin: 0 auto; }
</style>
