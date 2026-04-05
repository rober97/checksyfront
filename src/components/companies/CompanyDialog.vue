<template>
  <q-dialog v-model="visible" persistent maximized class="cd-overlay">
    <div class="cd-shell" tabindex="-1">

      <!-- ██████████ SIDEBAR ██████████ -->
      <aside class="cd-sidebar">

        <!-- Brand header -->
        <div class="cd-sidebar-head">
          <div class="cd-brand-avatar">
            <q-icon :name="isEdit ? 'edit_square' : 'domain_add'" size="22px" />
          </div>
          <div class="cd-brand-info">
            <span class="cd-brand-label">{{ isEdit ? 'Editar empresa' : 'Nueva empresa' }}</span>
            <span class="cd-brand-sub">{{ isEdit ? (props.editData?.name || '–') : 'Configura paso a paso' }}</span>
          </div>
        </div>

        <!-- Progress bar + label -->
        <div class="cd-progress-section">
          <div class="cd-progress-row">
            <span class="cd-progress-label">Progreso</span>
            <span class="cd-progress-pct">{{ formProgress }}%</span>
          </div>
          <div class="cd-progress-track">
            <div class="cd-progress-fill" :style="{ width: formProgress + '%' }"></div>
          </div>
        </div>

        <!-- Steps navigation -->
        <nav class="cd-nav" role="navigation">
          <button
            v-for="(step, i) in visibleSteps"
            :key="step.value"
            class="cd-step"
            :class="{
              'is-active': tab === step.value,
              'is-done':   tab !== step.value && isStepDone(step.value),
              'is-warn':   step.value === 'payroll' && autoPublicaSinPlantilla && tab !== step.value,
            }"
            @click="tab = step.value"
            :aria-current="tab === step.value ? 'step' : undefined"
          >
            <!-- State icon -->
            <div class="cd-step-badge">
              <template v-if="tab !== step.value && isStepDone(step.value)">
                <q-icon name="check" size="14px" />
              </template>
              <template v-else-if="step.value === 'payroll' && autoPublicaSinPlantilla && tab !== step.value">
                <q-icon name="warning" size="13px" />
              </template>
              <template v-else>
                <q-icon :name="step.icon" size="15px" />
              </template>
            </div>

            <!-- Text -->
            <div class="cd-step-text">
              <span class="cd-step-name">{{ step.label }}</span>
              <span class="cd-step-desc">{{ step.desc }}</span>
            </div>

            <!-- Active indicator -->
            <div class="cd-step-arrow">
              <q-icon name="chevron_right" size="16px" />
            </div>
          </button>
        </nav>

        <!-- Bottom: unsaved + shortcuts hint -->
        <div class="cd-sidebar-footer">
          <transition name="cd-fade">
            <div v-if="tieneCambios" class="cd-unsaved-chip">
              <span class="cd-unsaved-dot"></span>
              Sin guardar
            </div>
          </transition>
          <div class="cd-shortcuts">
            <div class="cd-sc"><kbd>⌘↵</kbd> guardar</div>
            <div v-if="!isEdit" class="cd-sc"><kbd>⌥↵</kbd> y crear otra</div>
            <div class="cd-sc"><kbd>Esc</kbd> cancelar</div>
          </div>
        </div>
      </aside>

      <!-- ██████████ MAIN PANEL ██████████ -->
      <div class="cd-main">

        <!-- Panel header: context strip -->
        <div class="cd-panel-header">
          <div class="cd-ph-left">
            <div class="cd-ph-icon">
              <q-icon :name="currentStep?.icon" size="20px" />
            </div>
            <div class="cd-ph-text">
              <span class="cd-ph-title">{{ currentStep?.label }}</span>
              <span class="cd-ph-hint">{{ currentStep?.hint }}</span>
            </div>
          </div>
          <button class="cd-close-btn" @click="cancelar" aria-label="Cerrar">
            <q-icon name="close" size="18px" />
          </button>
        </div>

        <!-- Scrollable content zone (only this scrolls) -->
        <div class="cd-content-zone">
          <q-form ref="formRef" greedy @submit.prevent="submit" class="cd-form-wrap">
            <q-tab-panels v-model="tab" animated transition-prev="fade" transition-next="fade" class="cd-tab-panels">

              <q-tab-panel name="basicos" class="cd-tab-panel">
                <CompanyBasicsTab v-model="form" :is-edit="isEdit" @validity="v => valid.basicos = v" />
              </q-tab-panel>

              <q-tab-panel name="payroll" class="cd-tab-panel">
                <template v-if="isEdit">
                  <CompanyPayrollTab
                    v-model="form.payrollConfig"
                    :holidays="form.holidays"
                    :company-id="props?.editData?._id"
                    @validity="v => valid.payroll = v"
                  />
                </template>
                <div v-else class="cd-create-payroll">
                  <div class="cd-create-payroll__icon">
                    <q-icon name="receipt_long" size="22px" />
                  </div>
                  <div class="cd-create-payroll__body">
                    <div class="cd-create-payroll__title">Configura la nómina después de crear la empresa</div>
                    <p class="cd-create-payroll__text">
                      Primero guarda la empresa para generar un <b>companyId</b> válido. Luego podrás volver a abrirla y
                      administrar conceptos, plantillas y validaciones de liquidación sin errores.
                    </p>
                    <p class="cd-create-payroll__text cd-create-payroll__text--muted">
                      Los demás datos del formulario sí se guardarán ahora mismo.
                    </p>
                  </div>
                </div>
                <div v-if="autoPublicaSinPlantilla" class="cd-inline-warn">
                  <q-icon name="warning_amber" size="16px" />
                  <span>Publicación automática activa sin plantilla PDF — se usará el diseño por defecto del sistema.</span>
                </div>
              </q-tab-panel>

              <q-tab-panel name="politica" class="cd-tab-panel">
                <CompanyTimeOffTab
                  v-model="form.timeOffPolicy"
                  @apply-preset="applyTimeOffPreset"
                  @validity="v => valid.politica = v"
                />
              </q-tab-panel>

              <q-tab-panel name="feriados" class="cd-tab-panel">
                <CompanyHolidaysTab v-model="form.holidays" @validity="v => valid.feriados = v" />
              </q-tab-panel>

              <q-tab-panel name="logo" class="cd-tab-panel">
                <CompanyLogoTab
                  v-model:logo="form.logo"
                  v-model:file="logoFile"
                  v-model:preview="logoPreview"
                  @validity="v => valid.logo = v"
                />
              </q-tab-panel>

              <q-tab-panel v-if="isEdit" name="conceptos" class="cd-tab-panel">
                <CompanyConceptsTab :company-id="props.editData._id" />
              </q-tab-panel>

            </q-tab-panels>
          </q-form>
        </div>

        <!-- Action footer -->
        <div class="cd-action-footer">
          <button class="cd-action-ghost" @click="cancelar">Cancelar</button>
          <div class="cd-action-right">
            <button
              v-if="!isEdit"
              class="cd-action-secondary"
              :disabled="saving || !validAll"
              @click="submitAndReset"
            >
              <q-icon name="add" size="14px" />
              Guardar y crear otra
            </button>
            <button
              class="cd-action-primary"
              :class="{ 'is-ready': validAll && !saving }"
              :disabled="!validAll || saving"
              @click="submit"
            >
              <q-spinner v-if="saving" size="14px" />
              <q-icon v-else name="check_circle" size="16px" />
              <span>{{ isEdit ? 'Guardar cambios' : 'Crear empresa' }}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import { useCompaniesStore } from '@/stores/companies'

import CompanyBasicsTab   from './tabs/CompanyBasicsTab.vue'
import CompanyTimeOffTab  from './tabs/CompanyTimeOffTab.vue'
import CompanyHolidaysTab from './tabs/CompanyHolidaysTab.vue'
import CompanyLogoTab     from './tabs/CompanyLogoTab.vue'
import CompanyPayrollTab  from './tabs/CompanyPayrollTab.vue'
import CompanyConceptsTab from './tabs/CompanyConceptsTab.vue'

const props = defineProps({ modelValue: { type: Boolean, required: true }, editData: { type: Object, default: null } })
const emit  = defineEmits(['update:modelValue', 'saved'])

const $q        = useQuasar()
const companies = useCompaniesStore()

const visible = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const isEdit  = computed(() => !!props.editData?._id)

const tab         = ref('basicos')
const formRef     = ref(null)
const saving      = ref(false)
const logoFile    = ref(null)
const logoPreview = ref('')

const ALL_STEPS = [
  { value:'basicos',   label:'Empresa',    desc:'Datos legales',      icon:'business',         hint:'Nombre, RUT y datos de contacto de la empresa' },
  { value:'payroll',   label:'Nómina',     desc:'Pagos y ciclos',     icon:'payments',         hint:'Frecuencia de pago, corte y ejecución de nóminas' },
  { value:'politica',  label:'Vacaciones', desc:'Política de días',   icon:'beach_access',     hint:'Reglas de acumulación, traslado y tope de días' },
  { value:'feriados',  label:'Feriados',   desc:'Días no laborables', icon:'event_busy',       hint:'Días feriados para calcular días hábiles correctamente' },
  { value:'logo',      label:'Logo',       desc:'Imagen corporativa', icon:'image',            hint:'Imagen que aparecerá en liquidaciones y documentos' },
  { value:'conceptos', label:'Conceptos',  desc:'Liquidación',        icon:'receipt_long',     hint:'Haberes y descuentos de las liquidaciones de sueldo', editOnly: true },
]

const visibleSteps = computed(() => ALL_STEPS.filter(s => !s.editOnly || isEdit.value))
const currentStep  = computed(() => ALL_STEPS.find(s => s.value === tab.value))

const valid    = ref({ basicos: false, payroll: true, politica: true, feriados: true, logo: true })
const validAll = computed(() => Object.values(valid.value).every(Boolean))

const formProgress = computed(() => {
  const f = form.value; let p = 0
  if (f.name)                                   p += 20
  if (f.rut)                                    p += 20
  if (f.payrollConfig?.frequency)               p += 15
  if (f.payrollConfig?.cutoffDay)               p += 15
  if (f.timeOffPolicy?.vacation?.accrual?.mode) p += 10
  if (f.holidays?.length > 0)                   p += 10
  if (f.logo || logoFile.value)                 p += 10
  return Math.min(p, 100)
})

const isStepDone = (name) => {
  const f = form.value
  return ({
    basicos:   !!(f.name && f.rut),
    payroll:   !!(f.payrollConfig?.frequency && f.payrollConfig?.cutoffDay),
    politica:  !!(f.timeOffPolicy?.vacation?.accrual?.mode),
    feriados:  f.holidays?.length > 0,
    logo:      !!(f.logo || logoFile.value),
    conceptos: false,
  })[name] ?? false
}

const autoPublicaSinPlantilla = computed(() =>
  isEdit.value &&
  form.value?.payrollConfig?.autoPublish &&
  !form.value?.payrollConfig?.templateId
)

const defaultTimeOff = () => ({ vacation: { accrual: { mode:'DAILY', perYearDays:15, perMonthDays:null, accrueOnBusinessDays:true, startAfterDays:0, prorateFromStartDate:true }, carryOver: { enabled:true, maxCarry:5, resetMonth:1, resetDay:1 }, cap: { enabled:true, maxDays:30 } }, policyVersion:1 })
const defaultPayroll = () => ({ frequency:'monthly', cutoffDay:25, paydayRule:'last_business_day', paydayDayOfMonth:5, businessDayAdjust:'previous', generateTime:'20:00', timezone:'America/Santiago', autoPublish:true, notifyOnPublish:true, templateId:'', rounding:'0', lastRunAt:null, nextRunAt:null })
const defaultForm    = () => ({ name:'', rut:'', email:'', phone:'', address:'', status:'active', logo:'', timeOffPolicy:defaultTimeOff(), payrollConfig:defaultPayroll(), holidays:[] })

const form = ref(defaultForm())

let snapshot = ''
const snap = () => { snapshot = JSON.stringify(form.value) }
const tieneCambios = computed(() => JSON.stringify(form.value) !== snapshot)

watch(() => visible.value, v => {
  if (!v) return
  tab.value = 'basicos'
  if (props.editData) {
    form.value = { name:props.editData.name||'', rut:props.editData.rut||'', email:props.editData.email||'', phone:props.editData.phone||'', address:props.editData.address||'', status:props.editData.status||'active', logo:props.editData.logo||'', timeOffPolicy:props.editData.timeOffPolicy||defaultTimeOff(), payrollConfig:props.editData.payrollConfig||defaultPayroll(), holidays:Array.isArray(props.editData.holidays)?props.editData.holidays:[] }
    logoPreview.value = props.editData.logo||''
  } else {
    form.value = defaultForm(); logoFile.value=null; logoPreview.value=''
  }
  valid.value = { basicos:false, payroll:true, politica:true, feriados:true, logo:true }
  snap()
})

const applyTimeOffPreset = (key) => {
  if (key==='cl_basica') { form.value.timeOffPolicy=defaultTimeOff(); $q.notify({ type:'info', message:'Preset: Chile – Básica aplicado' }) }
  if (key==='acumulacion_mensual') { form.value.timeOffPolicy={ vacation:{ accrual:{ mode:'MONTHLY', perYearDays:15, perMonthDays:1.25, accrueOnBusinessDays:false, startAfterDays:0, prorateFromStartDate:true }, carryOver:{ enabled:true, maxCarry:5, resetMonth:1, resetDay:1 }, cap:{ enabled:true, maxDays:30 } }, policyVersion:1 }; $q.notify({ type:'info', message:'Preset: Mensual 1,25 días aplicado' }) }
}

async function submit() {
  const ok = await formRef.value?.validate?.().catch(()=>false)
  if (!ok || !validAll.value) { $q.notify({ type:'negative', message:'Revisa los campos obligatorios' }); return }
  try {
    saving.value = true
    const p = { ...form.value }; if (logoFile.value) p._logoFile = logoFile.value
    const res = isEdit.value ? await companies.updateCompany(props.editData._id, p) : await companies.createCompany(p)
    $q.notify({ type:'positive', message: isEdit.value ? 'Cambios guardados' : 'Empresa creada' })
    emit('saved', res); visible.value = false
  } catch(e) { $q.notify({ type:'negative', message: companies.error||e?.message||'Error al guardar' }) }
  finally { saving.value = false }
}

async function submitAndReset() {
  const ok = await formRef.value?.validate?.().catch(()=>false)
  if (!ok || !validAll.value) { $q.notify({ type:'negative', message:'Revisa los campos obligatorios' }); return }
  try {
    saving.value = true
    const p = { ...form.value }; if (logoFile.value) p._logoFile = logoFile.value
    const res = await companies.createCompany(p)
    $q.notify({ type:'positive', message:'Empresa creada. Puedes crear otra.' })
    emit('saved', res)
    form.value = defaultForm(); logoFile.value=null; logoPreview.value=''; tab.value='basicos'; snap()
  } catch(e) { $q.notify({ type:'negative', message: companies.error||e?.message||'Error' }) }
  finally { saving.value = false }
}

function cancelar() {
  if (tieneCambios.value) {
    $q.dialog({ title:'¿Descartar cambios?', message:'Perderás todo lo que no hayas guardado.', ok:{ label:'Sí, cerrar', color:'negative', unelevated:true }, cancel:{ label:'Seguir editando', flat:true }, persistent:true }).onOk(()=>visible.value=false)
  } else visible.value = false
}

const hotkey = e => {
  if (!visible.value) return
  if (e.key==='Escape')                             { e.preventDefault(); cancelar() }
  if (e.ctrlKey && e.key==='Enter')                 { e.preventDefault(); submit() }
  if (!isEdit.value && e.altKey && e.key==='Enter') { e.preventDefault(); submitAndReset() }
}
onMounted(()       => window.addEventListener('keydown', hotkey))
onBeforeUnmount(() => window.removeEventListener('keydown', hotkey))
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* ═══════════════════════════════════ OVERLAY */
.cd-overlay :deep(.q-dialog__inner) { display:flex; align-items:center; justify-content:center; padding:16px }
.cd-overlay :deep(.q-dialog__backdrop) { background:rgba(8,10,18,0.72); backdrop-filter:blur(8px) }

/* ═══════════════════════════════════ SHELL */
.cd-shell {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  display: flex;
  width: min(1080px, 97vw);
  height: min(680px, 94vh);
  border-radius: 18px;
  overflow: hidden;
  outline: none;
  box-shadow: 0 0 0 1px rgba(255,255,255,.06), 0 32px 80px rgba(0,0,0,.5), 0 8px 24px rgba(0,0,0,.3);
}

/* ═══════════════════════════════════ SIDEBAR */
.cd-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #0d1117;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  position: relative;
}

/* Subtle grid texture */
.cd-sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(99,102,241,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99,102,241,.03) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
}

/* Brand */
.cd-sidebar-head {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid rgba(255,255,255,.06);
  flex-shrink: 0;
}

.cd-brand-avatar {
  width: 40px; height: 40px; border-radius: 11px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  box-shadow: 0 4px 14px rgba(99,102,241,.45);
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}

.cd-brand-info { display: flex; flex-direction: column; min-width: 0; }
.cd-brand-label { font-size: .82rem; font-weight: 700; color: #f1f5f9; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cd-brand-sub { font-size: .7rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; max-width: 140px; }

/* Progress */
.cd-progress-section { padding: 14px 16px 10px; border-bottom: 1px solid rgba(255,255,255,.04); flex-shrink: 0; }
.cd-progress-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
.cd-progress-label { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #475569; }
.cd-progress-pct { font-size: .75rem; font-weight: 800; color: #6366f1; font-variant-numeric: tabular-nums; }
.cd-progress-track { height: 4px; background: rgba(255,255,255,.06); border-radius: 99px; overflow: hidden; }
.cd-progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #818cf8); border-radius: 99px; transition: width .4s cubic-bezier(.4,0,.2,1); }

/* Steps nav */
.cd-nav { display: flex; flex-direction: column; gap: 2px; padding: 10px 10px 0; flex: 1; overflow-y: auto; scrollbar-width: none; }
.cd-nav::-webkit-scrollbar { display: none }

.cd-step {
  position: relative;
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px;
  border: none; background: transparent; border-radius: 10px;
  cursor: pointer; width: 100%; text-align: left;
  transition: background .15s, transform .1s;
  color: inherit;
}
.cd-step:hover:not(.is-active) { background: rgba(255,255,255,.04); }
.cd-step:active { transform: scale(.98); }

/* ▶ ACTIVE STATE — impossible to miss */
.cd-step.is-active {
  background: linear-gradient(135deg, rgba(99,102,241,.22) 0%, rgba(99,102,241,.12) 100%);
  box-shadow: inset 0 0 0 1px rgba(99,102,241,.35), 0 4px 12px rgba(99,102,241,.15);
}

.cd-create-payroll {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 16px;
  background:
    radial-gradient(circle at top right, rgba(99, 102, 241, 0.14), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
  color: #0f172a;
}

.cd-create-payroll__icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0e7ff, #eef2ff);
  color: #4338ca;
  box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.14);
  flex-shrink: 0;
}

.cd-create-payroll__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cd-create-payroll__title {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.35;
}

.cd-create-payroll__text {
  margin: 0;
  font-size: .92rem;
  line-height: 1.6;
  color: #334155;
}

.cd-create-payroll__text--muted {
  color: #64748b;
}
.cd-step.is-active::before {
  content: '';
  position: absolute;
  left: 0; top: 50%; transform: translateY(-50%);
  width: 3px; height: 65%;
  background: linear-gradient(180deg, #818cf8, #6366f1);
  border-radius: 0 4px 4px 0;
  box-shadow: 2px 0 8px rgba(99,102,241,.6);
}

/* Badge circle */
.cd-step-badge {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  color: #64748b;
  font-size: .68rem; font-weight: 800;
  transition: all .2s;
}
.cd-step.is-active .cd-step-badge {
  background: rgba(99,102,241,.3);
  border-color: rgba(99,102,241,.5);
  color: #a5b4fc;
  box-shadow: 0 0 10px rgba(99,102,241,.25);
}
.cd-step.is-done .cd-step-badge { background: rgba(34,197,94,.12); border-color: rgba(34,197,94,.3); color: #4ade80; }
.cd-step.is-warn .cd-step-badge { background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.3); color: #fbbf24; }

/* Text */
.cd-step-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.cd-step-name { font-size: .8rem; font-weight: 600; color: #94a3b8; line-height: 1.25; }
.cd-step.is-active .cd-step-name { color: #c7d2fe; font-weight: 700; }
.cd-step.is-done .cd-step-name   { color: #86efac; }
.cd-step-desc { font-size: .67rem; color: #334155; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cd-step.is-active .cd-step-desc { color: #6366f1; }

/* Arrow */
.cd-step-arrow { color: #1e293b; opacity: 0; transition: opacity .15s, transform .15s; }
.cd-step.is-active .cd-step-arrow { opacity: 1; color: #6366f1; transform: translateX(2px); }

/* Sidebar footer */
.cd-sidebar-footer {
  padding: 12px 16px 16px;
  border-top: 1px solid rgba(255,255,255,.04);
  display: flex; flex-direction: column; gap: 10px;
  flex-shrink: 0;
}

.cd-unsaved-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 10px; border-radius: 20px;
  background: rgba(251,191,36,.1); border: 1px solid rgba(251,191,36,.22);
  font-size: .7rem; font-weight: 700; color: #fbbf24;
  width: fit-content;
}
.cd-unsaved-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #fbbf24;
  animation: blink 1.6s ease-in-out infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }

.cd-shortcuts { display: flex; flex-direction: column; gap: 3px; }
.cd-sc { display: flex; align-items: center; gap: 5px; font-size: .67rem; color: #334155; }
.cd-sc kbd {
  display: inline-block; padding: 1px 5px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
  border-radius: 4px; font-size: .63rem; font-weight: 700; color: #64748b;
  font-family: inherit; letter-spacing: .02em;
}

/* Transitions */
.cd-fade-enter-active, .cd-fade-leave-active { transition: opacity .2s, transform .2s }
.cd-fade-enter-from, .cd-fade-leave-to { opacity:0; transform: translateY(4px) }

/* ═══════════════════════════════════ MAIN AREA */
.cd-main { flex: 1; display: flex; flex-direction: column; background: #ffffff; min-width: 0; overflow: hidden; }
.body--dark .cd-main { background: #111827; }

/* Panel header */
.cd-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.body--dark .cd-panel-header { background: #0f172a; border-bottom-color: #1e2d3d; }

.cd-ph-left { display: flex; align-items: center; gap: 12px; }
.cd-ph-icon {
  width: 36px; height: 36px; border-radius: 9px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border: 1px solid #c7d2fe;
  display: flex; align-items: center; justify-content: center; color: #4f46e5; flex-shrink: 0;
}
.body--dark .cd-ph-icon { background: rgba(99,102,241,.12); border-color: rgba(99,102,241,.25); color: #818cf8; }

.cd-ph-title { font-size: .95rem; font-weight: 800; color: #111827; display: block; line-height: 1.2; }
.body--dark .cd-ph-title { color: #f1f5f9; }
.cd-ph-hint { font-size: .75rem; color: #6b7280; display: block; margin-top: 1px; }
.body--dark .cd-ph-hint { color: #475569; }

.cd-close-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid #e5e7eb; background: #fff;
  color: #9ca3af; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .14s;
}
.cd-close-btn:hover { background: #fee2e2; border-color: #fca5a5; color: #ef4444; }
.body--dark .cd-close-btn { background: #1e293b; border-color: #334155; color: #64748b; }
.body--dark .cd-close-btn:hover { background: rgba(239,68,68,.12); border-color: rgba(239,68,68,.3); color: #f87171; }

/* Content zone */
.cd-content-zone { flex: 1; overflow: hidden; position: relative; min-height: 0; }
.cd-form-wrap { height: 100%; display: flex; flex-direction: column; }
.cd-tab-panels { height: 100%; background: transparent !important; flex: 1; }
.cd-tab-panels :deep(.q-tab-panels) { height: 100%; }
.cd-tab-panels :deep(.q-panel) { height: 100%; overflow-y: auto; }
.cd-tab-panels :deep(.q-panel)::-webkit-scrollbar { width: 5px; }
.cd-tab-panels :deep(.q-panel)::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
.body--dark .cd-tab-panels :deep(.q-panel)::-webkit-scrollbar-thumb { background: #1e293b; }

.cd-tab-panel { padding: 24px; min-height: 0; }

/* Inline warning */
.cd-inline-warn {
  display: flex; align-items: flex-start; gap: 9px;
  padding: 12px 15px; margin-top: 14px;
  background: #fffbeb; border: 1px solid #fde68a;
  border-left: 3px solid #f59e0b; border-radius: 9px;
  font-size: .82rem; color: #92400e; line-height: 1.5;
}
.cd-inline-warn .q-icon { flex-shrink: 0; margin-top: 1px; }
.body--dark .cd-inline-warn { background: rgba(245,158,11,.06); border-color: rgba(251,191,36,.2); color: #fcd34d; }

/* Action footer */
.cd-action-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.body--dark .cd-action-footer { background: #0f172a; border-top-color: #1e2d3d; }

.cd-action-right { display: flex; align-items: center; gap: 8px; }

.cd-action-ghost {
  padding: 8px 16px; border-radius: 8px;
  border: none; background: transparent;
  font-family: inherit; font-size: .83rem; font-weight: 600;
  color: #9ca3af; cursor: pointer; transition: all .14s;
}
.cd-action-ghost:hover { background: #f3f4f6; color: #374151; }
.body--dark .cd-action-ghost:hover { background: #1e293b; color: #d1d5db; }

.cd-action-secondary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px;
  border: 1.5px solid #e5e7eb; background: #fff;
  font-family: inherit; font-size: .83rem; font-weight: 600;
  color: #374151; cursor: pointer; transition: all .14s;
}
.cd-action-secondary:hover:not(:disabled) { border-color: #d1d5db; background: #f9fafb; }
.cd-action-secondary:disabled { opacity: .4; cursor: not-allowed; }
.body--dark .cd-action-secondary { background: #1e293b; border-color: #334155; color: #94a3b8; }
.body--dark .cd-action-secondary:hover:not(:disabled) { background: #253347; }

.cd-action-primary {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 20px; border-radius: 8px;
  border: none;
  background: #e5e7eb;
  font-family: inherit; font-size: .83rem; font-weight: 700;
  color: #9ca3af; cursor: not-allowed;
  transition: all .2s cubic-bezier(.4,0,.2,1);
}
.cd-action-primary.is-ready {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: #fff; cursor: pointer;
  box-shadow: 0 4px 14px rgba(99,102,241,.35);
}
.cd-action-primary.is-ready:hover {
  background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%);
  box-shadow: 0 6px 20px rgba(99,102,241,.5);
  transform: translateY(-1px);
}
.cd-action-primary.is-ready:active { transform: translateY(0); box-shadow: 0 2px 8px rgba(99,102,241,.3); }
.cd-action-primary:disabled { opacity: 1; }

/* ═══════════════════════════════════ RESPONSIVE */
@media (max-width: 680px) {
  .cd-shell { width: 100vw; height: 100dvh; border-radius: 0; flex-direction: column; }
  .cd-sidebar { width: 100%; flex-direction: row; height: auto; padding: 0; overflow-x: auto; }
  .cd-sidebar::before, .cd-sidebar-head, .cd-progress-section, .cd-sidebar-footer { display: none; }
  .cd-nav { flex-direction: row; padding: 6px 12px; gap: 3px; flex: none; overflow-x: auto; overflow-y: visible; width: 100%; }
  .cd-step { flex-shrink: 0; padding: 7px 12px 8px; border-radius: 8px 8px 0 0; }
  .cd-step.is-active::before { width: 100%; height: 3px; top: auto; bottom: 0; left: 0; transform: none; border-radius: 0; }
  .cd-step-desc, .cd-step-arrow { display: none; }
  .cd-action-footer { padding: 10px 16px; }
}
</style>
