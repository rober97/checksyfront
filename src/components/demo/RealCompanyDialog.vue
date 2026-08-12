<template>
  <!--
    Alta de la empresa real.

    Se piden pocos datos y todos imprescindibles: el RUT y la razón social salen
    impresos en el contrato, en la liquidación y en el libro DT. Es justamente
    por eso que la empresa de prueba no se puede "reutilizar en modo real": nace
    con un RUT inventado, y ningún documento laboral emitido sobre él sirve.
  -->
  <q-dialog v-model="open" persistent>
    <q-card class="rk-real-dialog">
      <q-card-section class="rk-real-dialog__head">
        <div class="rk-real-dialog__icon"><q-icon name="apartment" size="24px" /></div>
        <div>
          <div class="text-subtitle1 text-weight-bold">Crea tu empresa</div>
          <div class="text-caption text-grey-7">
            Queda vacía y lista para cargar a tu gente. El ambiente de prueba no se borra:
            puedes volver a él cuando quieras.
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <q-input
          v-model="form.name"
          outlined dense
          label="Razón social *"
          hint="Como aparece en tu constitución de sociedad"
          :error="!!errors.name"
          :error-message="errors.name"
          maxlength="120"
          @blur="validateName"
        >
          <template #prepend><q-icon name="business" /></template>
        </q-input>

        <q-input
          v-model="form.rut"
          outlined dense
          label="RUT de la empresa *"
          placeholder="76.543.210-K"
          :error="!!errors.rut"
          :error-message="errors.rut"
          maxlength="14"
          @blur="validateRut"
        >
          <template #prepend><q-icon name="badge" /></template>
        </q-input>

        <q-input v-model="form.address" outlined dense label="Dirección" maxlength="160">
          <template #prepend><q-icon name="place" /></template>
        </q-input>

        <q-input v-model="form.phone" outlined dense label="Teléfono de contacto" maxlength="30">
          <template #prepend><q-icon name="phone" /></template>
        </q-input>

        <div class="rk-real-dialog__note">
          <q-icon name="schedule" size="18px" />
          <span>
            Tu empresa corre bajo el mismo plazo de prueba<template v-if="demo.remainingDays !== null">
              — te quedan <strong>{{ demo.remainingDays }}</strong>
              {{ demo.remainingDays === 1 ? 'día' : 'días' }}</template>.
            Al vencer no se borra nada: queda en solo lectura hasta que actives tu plan.
          </span>
        </div>

        <div v-if="serverError" class="rk-real-dialog__error">
          <q-icon name="error_outline" size="18px" />
          <span>{{ serverError }}</span>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat no-caps label="Cancelar" :disable="busy" @click="open = false" />
        <q-btn
          unelevated no-caps color="primary"
          icon="apartment"
          label="Crear mi empresa"
          :loading="busy"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useDemoStore } from '@/stores/demoStore'

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])

const demo = useDemoStore()
const router = useRouter()
const { notify } = useQuasar()

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const form = reactive({ name: '', rut: '', address: '', phone: '' })
const errors = reactive({ name: '', rut: '' })
const serverError = ref('')
const busy = ref(false)

watch(open, (v) => {
  if (v) {
    serverError.value = ''
    errors.name = ''
    errors.rut = ''
  }
})

/**
 * Dígito verificador módulo 11. Se valida en el front solo para avisar antes de
 * enviar; el backend lo vuelve a calcular, que es donde la validación cuenta.
 */
function rutDv(body) {
  let sum = 0
  let mul = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += mul * Number(body.charAt(i))
    mul = mul === 7 ? 2 : mul + 1
  }
  const rest = 11 - (sum % 11)
  if (rest === 11) return '0'
  if (rest === 10) return 'K'
  return String(rest)
}

function validateName() {
  errors.name = form.name.trim().length >= 3 ? '' : 'Escribe la razón social de tu empresa'
  return !errors.name
}

function validateRut() {
  const raw = form.rut.trim().toUpperCase().replace(/[.\s]/g, '')
  const m = /^(\d{7,8})-?([\dK])$/.exec(raw)
  if (!m) {
    errors.rut = 'Escribe el RUT completo, con dígito verificador'
    return false
  }
  if (rutDv(m[1]) !== m[2]) {
    errors.rut = 'El dígito verificador no corresponde a ese RUT'
    return false
  }
  errors.rut = ''
  form.rut = `${m[1]}-${m[2]}`
  return true
}

async function submit() {
  serverError.value = ''
  const ok = [validateName(), validateRut()].every(Boolean)
  if (!ok) return

  busy.value = true
  try {
    const company = await demo.createRealCompany({
      name: form.name.trim(),
      rut: form.rut,
      address: form.address.trim(),
      phone: form.phone.trim(),
    })
    open.value = false
    notify({
      type: 'positive',
      message: `${company.name} quedó creada`,
      caption: 'Estás dentro de tu empresa. Empieza dando de alta a tu gente.',
      icon: 'apartment',
      position: 'top',
      timeout: 5000,
    })
    // La app trae en caché datos de la empresa anterior en media docena de
    // módulos; refrescarlos uno por uno sería más frágil que recargar.
    router.replace('/rrhh/users')
    window.location.reload()
  } catch (e) {
    serverError.value = e?.response?.data?.message || e?.message || 'No pudimos crear tu empresa'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.rk-real-dialog { width: 100%; max-width: 480px; border-radius: 16px; }
.rk-real-dialog__head {
  display: flex; align-items: flex-start; gap: 0.875rem;
}
.rk-real-dialog__icon {
  width: 44px; height: 44px; flex-shrink: 0;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
}
.rk-real-dialog__note {
  display: flex; align-items: flex-start; gap: 0.5rem;
  padding: 0.75rem 0.875rem;
  background: rgba(59, 130, 246, 0.07);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 10px;
  font-size: 0.8125rem;
  color: #1e40af;
  line-height: 1.4;
}
body.body--dark .rk-real-dialog__note { color: #bfdbfe; }
.rk-real-dialog__note .q-icon { margin-top: 1px; flex-shrink: 0; }

.rk-real-dialog__error {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.7rem 0.875rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #dc2626;
  font-size: 0.8125rem;
}
body.body--dark .rk-real-dialog__error { color: #fca5a5; }
</style>
