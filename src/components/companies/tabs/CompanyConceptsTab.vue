<template>
  <div class="cc-root">

    <div class="cc-layout">
      <!-- ══ LEFT ══ -->
      <div class="cc-left">

        <!-- Requisitos mínimos -->
        <div class="cc-section">
          <div class="cc-section-header">
            <div class="cc-section-title">
              <q-icon name="verified_user" size="16px" />
              Requisitos para poder liquidar
            </div>
            <div class="cc-req-status" :class="allMet ? 'cc-rs--ok' : 'cc-rs--pending'">
              <q-icon :name="allMet ? 'check_circle' : 'pending'" size="13px" />
              {{ metCount }}/{{ REQS.length }} configurados
            </div>
          </div>

          <div class="cc-req-list">
            <div
              v-for="req in REQS"
              :key="req.calcKey || req.valuePath"
              class="cc-req-item"
              :class="`cc-ri--${reqStatus(req)}`"
            >
              <div class="cc-ri-icon">
                <q-icon
                  :name="reqStatus(req) === 'ok' ? 'check_circle' : reqStatus(req) === 'inactive' ? 'pause_circle' : 'radio_button_unchecked'"
                  size="18px"
                />
              </div>
              <div class="cc-ri-body">
                <div class="cc-ri-name">{{ req.humanName }}</div>
                <div class="cc-ri-desc">{{ req.humanDesc }}</div>
                <div v-if="reqStatus(req) === 'inactive'" class="cc-ri-warn">
                  <q-icon name="info" size="12px" /> Existe pero está desactivado — actívalo para liquidar
                </div>
              </div>
              <div class="cc-ri-action">
                <button v-if="reqStatus(req) === 'missing'" class="cc-btn-fix" :disabled="saving" @click="quickAdd(req)">
                  <q-icon name="add" size="14px" /> Agregar
                </button>
                <button v-else-if="reqStatus(req) === 'inactive'" class="cc-btn-activate" :disabled="saving" @click="quickActivate(req)">
                  <q-icon name="play_arrow" size="14px" /> Activar
                </button>
                <button v-else class="cc-btn-edit-sm" @click="openEdit(findConcept(req))">
                  <q-icon name="edit" size="13px" /> Editar
                </button>
              </div>
            </div>
          </div>

          <button v-if="missingCount > 0" class="cc-btn-fix-all" :disabled="saving" @click="quickAddAll">
            <q-spinner v-if="saving" size="14px" color="indigo" />
            <q-icon v-else name="auto_fix_high" size="16px" />
            Agregar los {{ missingCount }} que faltan automáticamente
          </button>
        </div>

        <div class="cc-divider"></div>

        <!-- Todos los conceptos -->
        <div class="cc-section cc-section--flex">
          <div class="cc-section-header">
            <div class="cc-section-title">
              <q-icon name="list_alt" size="16px" />
              Todos los conceptos
              <span class="cc-count-badge">{{ store.items?.length || 0 }}</span>
            </div>
            <div class="cc-header-actions">
              <q-input v-model="searchQ" outlined dense placeholder="Buscar…" style="width:145px" clearable>
                <template #prepend><q-icon name="search" size="15px" color="grey" /></template>
              </q-input>
              <button class="cc-btn-new" @click="openCreate">
                <q-icon name="add" size="15px" /> Nuevo
              </button>
            </div>
          </div>

          <div class="cc-concept-list">
            <div v-if="store.loading" class="cc-state-msg">
              <q-spinner size="22px" color="indigo" /><span>Cargando…</span>
            </div>
            <div v-else-if="!filteredItems.length" class="cc-state-msg cc-state-empty">
              <q-icon name="receipt_long" size="26px" />
              <span>{{ searchQ ? 'Sin resultados' : 'Sin conceptos configurados' }}</span>
              <small v-if="!searchQ">Usa los botones de arriba para agregar los requisitos mínimos</small>
            </div>

            <div v-for="c in filteredItems" :key="c._id" class="cc-concept-row" :class="{ 'cc-cr--inactive': !c.active }">
              <div class="cc-cr-kind" :class="c.kind === 'EARNING' ? 'cc-kind--earn' : 'cc-kind--disc'">
                <q-icon :name="c.kind === 'EARNING' ? 'add' : 'remove'" size="12px" />
              </div>
              <div class="cc-cr-info">
                <div class="cc-cr-name">
                  {{ c.name }}
                  <span v-if="isRequired(c)" class="cc-req-tag">requerido</span>
                </div>
                <div class="cc-cr-meta">
                  <span class="cc-cr-code">{{ c.code }}</span>
                  <span class="cc-cr-type">{{ humanValueType(c) }}</span>
                </div>
              </div>
              <div class="cc-cr-toggles">
                <div class="cc-cr-toggle-item" :class="{ active: c.active }">
                  <q-toggle v-model="c.active" dense size="xs" @update:model-value="patchConcept(c, { active: c.active })" />
                  <span>Activo</span>
                </div>
                <div class="cc-cr-toggle-item" :class="{ active: c.taxable }">
                  <q-toggle v-model="c.taxable" dense size="xs" @update:model-value="patchConcept(c, { taxable: c.taxable })" />
                  <span>Imponible</span>
                </div>
              </div>
              <button class="cc-cr-edit" @click="openEdit(c)"><q-icon name="edit" size="14px" /></button>
            </div>
          </div>

          <transition name="cc-slide">
            <div v-if="patches.length" class="cc-save-bar">
              <div class="cc-save-dot"></div>
              <span><strong>{{ patches.length }}</strong> cambio(s) sin guardar</span>
              <div style="flex:1"></div>
              <button class="cc-btn-ghost-sm" @click="discardPatches">Descartar</button>
              <button class="cc-btn-save" :disabled="saving" @click="saveBulk">
                <q-spinner v-if="saving" size="13px" />
                <q-icon v-else name="save" size="14px" />
                Guardar
              </button>
            </div>
          </transition>
        </div>
      </div>

      <!-- ══ RIGHT: Plantillas + Guía ══ -->
      <div class="cc-right">
        <div class="cc-panel">
          <div class="cc-panel-title"><q-icon name="library_books" size="15px" />Importar plantilla</div>
          <p class="cc-panel-desc">Importa todos los conceptos habituales de una liquidación chilena preconfigurados.</p>

          <div class="cc-field">
            <label class="cc-label">Plantilla</label>
            <q-select v-model="templateId" :options="templateOptions" outlined dense emit-value map-options :loading="store.loading" label="Selecciona una…" class="cc-select" />
          </div>
          <div class="cc-field">
            <label class="cc-label">¿Qué hacer con los conceptos actuales?</label>
            <div class="cc-mode-opts">
              <label v-for="opt in applyModeOpts" :key="opt.value" class="cc-mode-opt" :class="{ selected: applyMode === opt.value }">
                <input type="radio" v-model="applyMode" :value="opt.value" />
                <q-icon :name="opt.icon" size="15px" />
                <div>
                  <div class="cc-mode-name">{{ opt.label }}</div>
                  <div class="cc-mode-sub">{{ opt.desc }}</div>
                </div>
              </label>
            </div>
          </div>
          <button class="cc-btn-apply" :disabled="!templateId || saving" @click="applyTemplate">
            <q-spinner v-if="saving" size="14px" /><q-icon v-else name="download" size="16px" />
            Importar plantilla
          </button>
        </div>

        <div class="cc-guide">
          <div class="cc-guide-title"><q-icon name="help_outline" size="13px" />¿Qué es un concepto?</div>
          <div class="cc-gi cc-gi--earn"><div class="cc-gi-dot"></div><div><strong>Haber</strong> — suma al sueldo<div>Ej: sueldo base, bonos, horas extra</div></div></div>
          <div class="cc-gi cc-gi--disc"><div class="cc-gi-dot"></div><div><strong>Descuento</strong> — resta al sueldo<div>Ej: AFP, salud (7%), cesantía</div></div></div>
          <div class="cc-guide-note"><q-icon name="lock" size="11px" />Los marcados como <strong>imponible</strong> afectan el cálculo de cotizaciones.</div>
        </div>
      </div>
    </div>

    <!-- ══ DIÁLOGO ══ -->
    <q-dialog v-model="dlg" persistent>
      <div class="cc-dialog">
        <div class="cc-dlg-head">
          <div class="cc-dlg-icon"><q-icon name="receipt_long" size="18px" /></div>
          <div>
            <div class="cc-dlg-title">{{ editingId ? 'Editar concepto' : 'Nuevo concepto' }}</div>
            <div class="cc-dlg-sub">{{ editingId ? 'Modifica los datos del concepto' : 'Agrega un nuevo haber o descuento' }}</div>
          </div>
          <button class="cc-dlg-close" @click="dlg = false"><q-icon name="close" size="16px" /></button>
        </div>

        <div class="cc-dlg-body">
          <!-- Tipo -->
          <div class="cc-field">
            <label class="cc-label">¿Qué tipo de concepto es?</label>
            <div class="cc-kind-opts">
              <label class="cc-kind-opt" :class="{ selected: edit.kind === 'EARNING' }">
                <input type="radio" v-model="edit.kind" value="EARNING" />
                <q-icon name="add_circle" size="20px" :color="edit.kind === 'EARNING' ? 'green' : 'grey'" />
                <div><div class="cc-ko-name">Haber</div><div class="cc-ko-sub">Suma al sueldo</div></div>
              </label>
              <label class="cc-kind-opt" :class="{ selected: edit.kind === 'DEDUCTION' }">
                <input type="radio" v-model="edit.kind" value="DEDUCTION" />
                <q-icon name="remove_circle" size="20px" :color="edit.kind === 'DEDUCTION' ? 'red' : 'grey'" />
                <div><div class="cc-ko-name">Descuento</div><div class="cc-ko-sub">Resta al sueldo</div></div>
              </label>
            </div>
          </div>

          <!-- Nombre / Código -->
          <div class="cc-row2">
            <div class="cc-field">
              <label class="cc-label">Nombre visible <span class="cc-req">*</span></label>
              <q-input v-model="edit.name" outlined dense placeholder="Ej: Sueldo Base" class="cc-input" />
              <div class="cc-field-hint">Como aparece en la liquidación</div>
            </div>
            <div class="cc-field">
              <label class="cc-label">Código interno <span class="cc-req">*</span></label>
              <q-input v-model="edit.code" outlined dense placeholder="Ej: SUELDO_BASE" class="cc-input" @update:model-value="v => edit.code = (v||'').toUpperCase().replace(/\s+/g,'_')" />
              <div class="cc-field-hint">Identificador único, sin espacios</div>
            </div>
          </div>

          <!-- Origen del valor -->
          <div class="cc-field">
            <label class="cc-label">¿De dónde viene el monto? <span class="cc-req">*</span></label>
            <div class="cc-source-opts">
              <label v-for="s in sourceOpts" :key="s.value" class="cc-source-opt" :class="{ selected: edit.valueType === s.value }">
                <input type="radio" v-model="edit.valueType" :value="s.value" />
                <q-icon :name="s.icon" size="16px" />
                <div><div class="cc-so-name">{{ s.label }}</div><div class="cc-so-sub">{{ s.desc }}</div></div>
              </label>
            </div>
          </div>

          <!-- Detalle condicional -->
          <transition name="cc-fade">
            <div v-if="edit.valueType === 'PATH'" class="cc-detail-card">
              <div class="cc-detail-title"><q-icon name="info_outline" size="13px" />Campo del contrato del empleado</div>
              <q-select v-model="edit.valuePath" :options="pathOptions" outlined dense emit-value map-options label="Selecciona el campo…" class="cc-input" />
              <div class="cc-detail-note">Sueldo base → <code>baseSalary</code> · Gratificación → <code>gratification</code></div>
            </div>
          </transition>
          <transition name="cc-fade">
            <div v-if="edit.valueType === 'CALC'" class="cc-detail-card">
              <div class="cc-detail-title"><q-icon name="info_outline" size="13px" />Cálculo legal a aplicar</div>
              <q-select v-model="edit.calcKey" :options="calcKeyOptions" outlined dense emit-value map-options label="Selecciona el cálculo…" class="cc-input" />
            </div>
          </transition>
          <transition name="cc-fade">
            <div v-if="edit.valueType === 'PARAM'" class="cc-detail-card">
              <div class="cc-detail-title"><q-icon name="info_outline" size="13px" />Parámetro de configuración</div>
              <div class="cc-row3">
                <div class="cc-field"><label class="cc-label">Tipo</label><q-input v-model="edit.param.type" outlined dense class="cc-input" /></div>
                <div class="cc-field"><label class="cc-label">Scope</label><q-input v-model="edit.param.scope" outlined dense class="cc-input" /></div>
                <div class="cc-field"><label class="cc-label">Key</label><q-input v-model="edit.param.key" outlined dense class="cc-input" /></div>
              </div>
            </div>
          </transition>

          <!-- Opciones -->
          <div class="cc-field">
            <label class="cc-label">Opciones</label>
            <div class="cc-opts-grid">
              <label class="cc-opt-toggle" :class="{ on: edit.active }">
                <q-toggle v-model="edit.active" dense />
                <div><div class="cc-ot-name">Activo</div><div class="cc-ot-sub">Se incluye en liquidaciones</div></div>
              </label>
              <label class="cc-opt-toggle" :class="{ on: edit.taxable }">
                <q-toggle v-model="edit.taxable" dense />
                <div><div class="cc-ot-name">Imponible</div><div class="cc-ot-sub">Afecta al cálculo de AFP, salud, etc.</div></div>
              </label>
              <label class="cc-opt-toggle" :class="{ on: edit.prorate }">
                <q-toggle v-model="edit.prorate" dense />
                <div><div class="cc-ot-name">Prorratea</div><div class="cc-ot-sub">Se divide en días en contratos parciales</div></div>
              </label>
            </div>
          </div>
        </div>

        <div class="cc-dlg-foot">
          <button class="cc-btn-ghost" @click="dlg = false">Cancelar</button>
          <button class="cc-btn-primary" :disabled="!edit.name || !edit.code || saving" @click="saveOne">
            <q-spinner v-if="saving" size="13px" /><q-icon v-else name="check" size="15px" />
            {{ editingId ? 'Guardar cambios' : 'Crear concepto' }}
          </button>
        </div>
      </div>
    </q-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { usePayrollConceptsStore } from '@/stores/payrollConceptsStore'

const $q    = useQuasar()
const store = usePayrollConceptsStore()
const props = defineProps({ companyId: { type: String, required: true } })

const REQS = [
  { humanName: 'Sueldo base', humanDesc: 'El salario mensual pactado en el contrato del empleado', kind: 'EARNING', valueType: 'PATH', valuePath: 'baseSalary', taxable: true, prorate: true, defaultCode: 'SUELDO_BASE', defaultName: 'Sueldo Base', matchFn: c => c.kind === 'EARNING' && c.valueType === 'PATH' && c.valuePath === 'baseSalary' },
  { humanName: 'AFP (descuento trabajador)', humanDesc: 'Cotización previsional obligatoria — calculada automáticamente sobre el imponible', kind: 'DEDUCTION', valueType: 'CALC', calcKey: 'AFP_WORKER', taxable: false, defaultCode: 'AFP_TRABAJADOR', defaultName: 'AFP Trabajador', matchFn: c => c.kind === 'DEDUCTION' && c.valueType === 'CALC' && c.calcKey === 'AFP_WORKER' },
  { humanName: 'Salud (FONASA / Isapre)', humanDesc: 'Cotización de salud obligatoria — mínimo 7% del imponible', kind: 'DEDUCTION', valueType: 'CALC', calcKey: 'HEALTH_WORKER', taxable: false, defaultCode: 'SALUD_TRABAJADOR', defaultName: 'Salud Trabajador', matchFn: c => c.kind === 'DEDUCTION' && c.valueType === 'CALC' && c.calcKey === 'HEALTH_WORKER' },
  { humanName: 'Cesantía (descuento trabajador)', humanDesc: 'Seguro de desempleo — 0,6% del imponible por el trabajador', kind: 'DEDUCTION', valueType: 'CALC', calcKey: 'CESANTIA_WORKER', taxable: false, defaultCode: 'CESANTIA_TRABAJADOR', defaultName: 'Cesantía Trabajador', matchFn: c => c.kind === 'DEDUCTION' && c.valueType === 'CALC' && c.calcKey === 'CESANTIA_WORKER' },
]

const searchQ    = ref('')
const templateId = ref(null)
const applyMode  = ref('merge')
const patches    = ref([])
const saving     = ref(false)
const dlg        = ref(false)
const editingId  = ref(null)
const edit       = ref(blank())

const applyModeOpts = [
  { label: 'Conservar los actuales', value: 'merge',   icon: 'merge',      desc: 'Agrega sin borrar lo que ya tienes' },
  { label: 'Reemplazar todo',        value: 'replace', icon: 'swap_horiz', desc: 'Borra los actuales y usa la plantilla' },
]
const sourceOpts = [
  { value: 'PATH',  label: 'Desde el contrato',     icon: 'person',    desc: 'Sueldo base, gratificación — viene del perfil del empleado' },
  { value: 'CALC',  label: 'Cálculo legal',          icon: 'calculate', desc: 'AFP, salud, cesantía — el sistema lo calcula automáticamente' },
  { value: 'PARAM', label: 'Valor fijo / parámetro', icon: 'tune',      desc: 'Un monto o porcentaje que tú configuras' },
]
const pathOptions = [
  { label: 'Sueldo base (baseSalary)', value: 'baseSalary' },
  { label: 'Gratificación (gratification)', value: 'gratification' },
  { label: 'Colación (colacion)', value: 'colacion' },
  { label: 'Movilización (movil)', value: 'movil' },
  { label: 'Horas extra (horasExtra)', value: 'horasExtra' },
]
const calcKeyOptions = [
  { label: 'AFP – Descuento trabajador', value: 'AFP_WORKER' },
  { label: 'AFP – Aporte empleador', value: 'AFP_EMPLOYER' },
  { label: 'Salud – Descuento trabajador', value: 'HEALTH_WORKER' },
  { label: 'Cesantía – Descuento trabajador', value: 'CESANTIA_WORKER' },
  { label: 'Cesantía – Aporte empleador', value: 'CESANTIA_EMPLOYER' },
  { label: 'Impuesto único (IU)', value: 'IU' },
]

const filteredItems    = computed(() => { const q = searchQ.value.toLowerCase(); return (store.items||[]).filter(c => !q || (c.name||'').toLowerCase().includes(q)||(c.code||'').toLowerCase().includes(q)) })
const templateOptions  = computed(() => (store.templates||[]).map(t => ({ label: t.name||t.code||t._id, value: t._id })))
const findConcept      = req => (store.items||[]).find(c => req.matchFn(c)) || null
const reqStatus        = req => { const f = findConcept(req); return !f ? 'missing' : !f.active ? 'inactive' : 'ok' }
const metCount         = computed(() => REQS.filter(r => reqStatus(r) === 'ok').length)
const missingCount     = computed(() => REQS.filter(r => reqStatus(r) === 'missing').length)
const allMet           = computed(() => metCount.value === REQS.length)
const isRequired       = c => REQS.some(r => r.matchFn(c))
const humanValueType   = c => c.valueType === 'PATH' ? `Desde contrato · ${c.valuePath||''}` : c.valueType === 'CALC' ? `Cálculo · ${c.calcKey||''}` : 'Parámetro'

onMounted(async () => {
  await Promise.allSettled([store.fetchConcepts(props.companyId), store.fetchTemplates(), store.validateCompanyPayroll?.(props.companyId)])
})

async function quickAdd(req) {
  saving.value = true
  try {
    await store.upsertConcept({ companyId: props.companyId, concept: { code:req.defaultCode, name:req.defaultName, kind:req.kind, valueType:req.valueType, valuePath:req.valuePath||undefined, calcKey:req.calcKey||undefined, taxable:req.taxable, prorate:req.prorate||false, active:true, order:100 } })
    await store.fetchConcepts(props.companyId)
    $q.notify({ type:'positive', message:`"${req.humanName}" agregado`, position:'top' })
  } catch(e) { $q.notify({ type:'negative', message:e?.message||'Error', position:'top' }) }
  finally { saving.value = false }
}

async function quickAddAll() {
  const missing = REQS.filter(r => reqStatus(r) === 'missing')
  saving.value = true
  try {
    for (const req of missing) await store.upsertConcept({ companyId: props.companyId, concept: { code:req.defaultCode, name:req.defaultName, kind:req.kind, valueType:req.valueType, valuePath:req.valuePath||undefined, calcKey:req.calcKey||undefined, taxable:req.taxable, prorate:req.prorate||false, active:true, order:100 } })
    await store.fetchConcepts(props.companyId)
    $q.notify({ type:'positive', message:`${missing.length} conceptos agregados`, position:'top' })
  } catch(e) { $q.notify({ type:'negative', message:e?.message||'Error', position:'top' }) }
  finally { saving.value = false }
}

async function quickActivate(req) {
  const found = findConcept(req)
  if (!found) return
  saving.value = true
  try {
    await store.upsertConcept({ companyId: props.companyId, concept: { ...found, active: true } })
    await store.fetchConcepts(props.companyId)
    $q.notify({ type:'positive', message:`"${req.humanName}" activado`, position:'top' })
  } catch(e) { $q.notify({ type:'negative', message:e?.message||'Error', position:'top' }) }
  finally { saving.value = false }
}

function patchConcept(row, patch) { const i = patches.value.findIndex(p => p._id===row._id); if(i===-1) patches.value.push({_id:row._id,...patch}); else patches.value[i]={...patches.value[i],...patch} }
function discardPatches() { patches.value=[]; store.fetchConcepts(props.companyId) }

async function saveBulk() {
  saving.value = true
  try { await store.bulkUpdate({ companyId:props.companyId, patches:patches.value }); patches.value=[]; await store.fetchConcepts(props.companyId); $q.notify({ type:'positive', message:'Cambios guardados', position:'top' }) }
  catch(e) { $q.notify({ type:'negative', message:e?.message||'Error', position:'top' }) }
  finally { saving.value = false }
}

async function applyTemplate() {
  if (!templateId.value) return
  saving.value = true
  try { await store.applyTemplate({ companyId:props.companyId, templateId:templateId.value, mode:applyMode.value }); await store.fetchConcepts(props.companyId); $q.notify({ type:'positive', message:'Plantilla importada', position:'top' }) }
  catch(e) { $q.notify({ type:'negative', message:e?.message||'Error', position:'top' }) }
  finally { saving.value = false }
}

function blank() { return { code:'', name:'', kind:'EARNING', valueType:'PATH', valuePath:'', calcKey:'', param:{type:'',scope:'',key:''}, taxable:false, prorate:false, active:true, order:100 } }
function openCreate() { editingId.value=null; edit.value=blank(); dlg.value=true }
function openEdit(row) { if(!row) return; editingId.value=row._id; edit.value={...blank(),...JSON.parse(JSON.stringify(row)), param:row.param||{type:'',scope:'',key:''}}; dlg.value=true }

async function saveOne() {
  if (!edit.value.name||!edit.value.code) { $q.notify({ type:'warning', message:'Nombre y código son requeridos', position:'top' }); return }
  saving.value = true
  try { await store.upsertConcept({ companyId:props.companyId, concept:edit.value }); await store.fetchConcepts(props.companyId); dlg.value=false; $q.notify({ type:'positive', message:editingId.value?'Concepto actualizado':'Concepto creado', position:'top' }) }
  catch(e) { $q.notify({ type:'negative', message:e?.message||'Error', position:'top' }) }
  finally { saving.value = false }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.cc-root { font-family:'Plus Jakarta Sans',system-ui,sans-serif; height:100%; min-height:0; display:flex; flex-direction:column; }
.cc-layout { display:grid; grid-template-columns:1fr 230px; gap:16px; flex:1; min-height:0; overflow:hidden; }
.cc-left { display:flex; flex-direction:column; gap:0; overflow-y:auto; min-height:0; scrollbar-width:thin; scrollbar-color:#e2e8f0 transparent; }
.cc-left::-webkit-scrollbar { width:4px; }
.cc-left::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:99px; }
.body--dark .cc-left::-webkit-scrollbar-thumb { background:#1e293b; }
.cc-right { display:flex; flex-direction:column; gap:12px; overflow-y:auto; min-height:0; scrollbar-width:none; }
.cc-right::-webkit-scrollbar { display:none; }
.cc-section { padding:0 0 16px; flex-shrink:0; }
.cc-section--flex { flex:1; display:flex; flex-direction:column; }
.cc-section-header { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
.cc-section-title { display:flex; align-items:center; gap:7px; font-size:.84rem; font-weight:800; color:#111827; }
.body--dark .cc-section-title { color:#f1f5f9; }
.cc-section-title .q-icon { color:#6366f1; }
.cc-header-actions { display:flex; align-items:center; gap:8px; }
.cc-req-status { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:.72rem; font-weight:800; }
.cc-rs--ok      { background:#f0fdf4; border:1px solid #86efac; color:#15803d; }
.cc-rs--pending { background:#fffbeb; border:1px solid #fde68a; color:#92400e; }
.body--dark .cc-rs--ok      { background:rgba(21,128,61,.12); border-color:rgba(134,239,172,.2); color:#86efac; }
.body--dark .cc-rs--pending { background:rgba(245,158,11,.08); border-color:rgba(251,191,36,.18); color:#fcd34d; }
.cc-count-badge { background:#4f46e5; color:#fff; border-radius:20px; font-size:.66rem; font-weight:800; padding:1px 7px; }

/* Req items */
.cc-req-list { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
.cc-req-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; border:1.5px solid transparent; transition:all .15s; }
.cc-ri--ok       { background:#f0fdf4; border-color:#bbf7d0; }
.cc-ri--inactive { background:#fffbeb; border-color:#fde68a; }
.cc-ri--missing  { background:#fff; border-color:#e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,.04); }
.cc-ri--missing:hover { border-color:#c7d2fe; background:#fafbff; }
.body--dark .cc-ri--ok       { background:rgba(21,128,61,.08); border-color:rgba(134,239,172,.18); }
.body--dark .cc-ri--inactive { background:rgba(245,158,11,.06); border-color:rgba(251,191,36,.18); }
.body--dark .cc-ri--missing  { background:#1e293b; border-color:#2d3748; }
.body--dark .cc-ri--missing:hover { border-color:rgba(99,102,241,.35); }
.cc-ri-icon { flex-shrink:0; }
.cc-ri--ok .cc-ri-icon       { color:#16a34a; }
.cc-ri--inactive .cc-ri-icon { color:#d97706; }
.cc-ri--missing .cc-ri-icon  { color:#d1d5db; }
.cc-ri-body { flex:1; min-width:0; }
.cc-ri-name { font-size:.82rem; font-weight:700; color:#111827; }
.body--dark .cc-ri-name { color:#f1f5f9; }
.cc-ri-desc { font-size:.73rem; color:#6b7280; margin-top:1px; }
.cc-ri-warn { display:flex; align-items:center; gap:4px; font-size:.7rem; color:#d97706; margin-top:3px; }
.cc-ri-action { flex-shrink:0; }

/* Action buttons */
.cc-btn-fix { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:7px; border:1.5px solid #c7d2fe; background:#fff; font-family:inherit; font-size:.76rem; font-weight:700; color:#4f46e5; cursor:pointer; transition:all .13s; white-space:nowrap; }
.cc-btn-fix:hover:not(:disabled) { background:#eef2ff; border-color:#a5b4fc; box-shadow:0 2px 8px rgba(99,102,241,.18); }
.cc-btn-fix:disabled { opacity:.5; cursor:not-allowed; }
.body--dark .cc-btn-fix { background:rgba(99,102,241,.08); border-color:rgba(99,102,241,.25); color:#a5b4fc; }

.cc-btn-activate { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:7px; border:1.5px solid #fde68a; background:#fffbeb; font-family:inherit; font-size:.76rem; font-weight:700; color:#92400e; cursor:pointer; transition:all .13s; white-space:nowrap; }
.cc-btn-activate:hover:not(:disabled) { border-color:#fcd34d; }
.cc-btn-activate:disabled { opacity:.5; cursor:not-allowed; }
.body--dark .cc-btn-activate { background:rgba(245,158,11,.08); border-color:rgba(251,191,36,.22); color:#fcd34d; }

.cc-btn-edit-sm { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:7px; border:1px solid #e2e8f0; background:transparent; font-family:inherit; font-size:.74rem; font-weight:600; color:#94a3b8; cursor:pointer; transition:all .12s; }
.cc-btn-edit-sm:hover { background:#f8fafc; color:#4f46e5; border-color:#c7d2fe; }
.body--dark .cc-btn-edit-sm { border-color:#2d3748; color:#64748b; }

.cc-btn-fix-all { width:100%; display:flex; align-items:center; justify-content:center; gap:7px; padding:9px 16px; border-radius:9px; border:1.5px dashed #a5b4fc; background:#fafbff; font-family:inherit; font-size:.8rem; font-weight:700; color:#4f46e5; cursor:pointer; transition:all .14s; }
.cc-btn-fix-all:hover:not(:disabled) { background:#eef2ff; border-style:solid; box-shadow:0 3px 10px rgba(99,102,241,.2); }
.cc-btn-fix-all:disabled { opacity:.5; cursor:not-allowed; }
.body--dark .cc-btn-fix-all { background:rgba(99,102,241,.05); border-color:rgba(99,102,241,.22); color:#a5b4fc; }

.cc-divider { height:1px; background:#f1f5f9; margin:4px 0 16px; flex-shrink:0; }
.body--dark .cc-divider { background:#1e293b; }

/* Concept rows */
.cc-concept-list { display:flex; flex-direction:column; gap:4px; flex:1; }
.cc-state-msg { display:flex; align-items:center; justify-content:center; flex-direction:column; gap:6px; padding:28px; color:#94a3b8; text-align:center; font-size:.8rem; }
.cc-state-msg .q-icon { opacity:.4; }
.cc-state-empty { }
.cc-concept-row { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; border:1px solid #f1f5f9; background:#fff; transition:all .12s; }
.cc-concept-row:hover { border-color:#e0e7ff; background:#fafbff; }
.body--dark .cc-concept-row { background:#1e293b; border-color:#1e2d3d; }
.body--dark .cc-concept-row:hover { border-color:rgba(99,102,241,.2); }
.cc-cr--inactive { opacity:.55; }
.cc-cr-kind { width:22px; height:22px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-weight:800; }
.cc-kind--earn { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; }
.cc-kind--disc { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }
.body--dark .cc-kind--earn { background:rgba(22,163,74,.1); color:#86efac; border-color:rgba(134,239,172,.2); }
.body--dark .cc-kind--disc { background:rgba(220,38,38,.1); color:#fca5a5; border-color:rgba(252,165,165,.15); }
.cc-cr-info { flex:1; min-width:0; }
.cc-cr-name { font-size:.8rem; font-weight:700; color:#111827; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.body--dark .cc-cr-name { color:#f1f5f9; }
.cc-req-tag { font-size:.62rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; padding:1px 5px; border-radius:4px; background:#eff6ff; color:#3b82f6; border:1px solid #bfdbfe; }
.body--dark .cc-req-tag { background:rgba(59,130,246,.1); color:#93c5fd; border-color:rgba(59,130,246,.2); }
.cc-cr-meta { display:flex; align-items:center; gap:7px; margin-top:2px; }
.cc-cr-code { font-size:.68rem; font-family:monospace; font-weight:700; color:#6366f1; background:#f0f0ff; padding:1px 5px; border-radius:4px; }
.body--dark .cc-cr-code { background:rgba(99,102,241,.1); color:#a5b4fc; }
.cc-cr-type { font-size:.7rem; color:#9ca3af; }
.cc-cr-toggles { display:flex; gap:8px; flex-shrink:0; }
.cc-cr-toggle-item { display:flex; align-items:center; gap:4px; font-size:.7rem; font-weight:600; color:#94a3b8; }
.cc-cr-toggle-item.active { color:#4f46e5; }
.body--dark .cc-cr-toggle-item.active { color:#a5b4fc; }
.cc-cr-edit { width:28px; height:28px; border-radius:7px; border:1px solid #e2e8f0; background:transparent; color:#94a3b8; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:all .12s; }
.cc-cr-edit:hover { background:#eef2ff; border-color:#c7d2fe; color:#4f46e5; }
.body--dark .cc-cr-edit { border-color:#2d3748; }
.body--dark .cc-cr-edit:hover { background:rgba(99,102,241,.1); border-color:rgba(99,102,241,.25); color:#a5b4fc; }

/* Save bar */
.cc-save-bar { display:flex; align-items:center; gap:8px; margin-top:10px; padding:9px 12px; border-radius:9px; flex-shrink:0; background:#eff6ff; border:1.5px solid #93c5fd; font-size:.8rem; color:#1d4ed8; }
.body--dark .cc-save-bar { background:rgba(59,130,246,.07); border-color:rgba(147,197,253,.2); color:#93c5fd; }
.cc-save-dot { width:7px; height:7px; border-radius:50%; background:currentColor; animation:pulse 1.4s ease-in-out infinite; flex-shrink:0; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.2} }

.cc-btn-new { display:inline-flex; align-items:center; gap:5px; padding:6px 13px; border-radius:8px; border:none; background:#4f46e5; color:#fff; font-family:inherit; font-size:.78rem; font-weight:700; cursor:pointer; transition:all .13s; white-space:nowrap; }
.cc-btn-new:hover { background:#4338ca; box-shadow:0 4px 12px rgba(99,102,241,.35); }
.cc-btn-ghost-sm { padding:5px 10px; border-radius:7px; border:none; background:transparent; font-family:inherit; font-size:.76rem; font-weight:600; color:#64748b; cursor:pointer; }
.cc-btn-ghost-sm:hover { background:rgba(0,0,0,.05); }
.cc-btn-save { display:inline-flex; align-items:center; gap:5px; padding:6px 13px; border-radius:7px; border:none; background:#4f46e5; color:#fff; font-family:inherit; font-size:.78rem; font-weight:700; cursor:pointer; transition:all .13s; }
.cc-btn-save:hover:not(:disabled) { background:#4338ca; }
.cc-btn-save:disabled { opacity:.5; cursor:not-allowed; }

/* Right panel */
.cc-panel { background:#fff; border:1px solid #f1f5f9; border-radius:12px; padding:14px 16px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
.body--dark .cc-panel { background:#1e293b; border-color:#1e2d3d; }
.cc-panel-title { display:flex; align-items:center; gap:7px; font-size:.82rem; font-weight:800; color:#111827; margin-bottom:10px; }
.body--dark .cc-panel-title { color:#f1f5f9; }
.cc-panel-title .q-icon { color:#6366f1; }
.cc-panel-desc { font-size:.75rem; color:#6b7280; margin-bottom:12px; line-height:1.55; }
.body--dark .cc-panel-desc { color:#94a3b8; }
.cc-field { display:flex; flex-direction:column; gap:5px; margin-bottom:12px; }
.cc-label { font-size:.73rem; font-weight:700; color:#6b7280; }
.body--dark .cc-label { color:#94a3b8; }
.cc-select :deep(.q-field__control) { border-radius:8px; }
.cc-mode-opts { display:flex; flex-direction:column; gap:6px; }
.cc-mode-opt { display:flex; align-items:flex-start; gap:9px; padding:9px 11px; border-radius:9px; border:1.5px solid #e2e8f0; background:#fff; cursor:pointer; transition:all .13s; }
.cc-mode-opt input { display:none; }
.cc-mode-opt.selected { border-color:#a5b4fc; background:#eef2ff; }
.body--dark .cc-mode-opt { background:#1e293b; border-color:#2d3748; }
.body--dark .cc-mode-opt.selected { border-color:rgba(99,102,241,.4); background:rgba(99,102,241,.08); }
.cc-mode-opt .q-icon { flex-shrink:0; margin-top:1px; color:#6366f1; }
.cc-mode-name { font-size:.78rem; font-weight:700; color:#111827; }
.body--dark .cc-mode-name { color:#f1f5f9; }
.cc-mode-sub { font-size:.7rem; color:#9ca3af; margin-top:1px; line-height:1.4; }
.cc-btn-apply { width:100%; display:flex; align-items:center; justify-content:center; gap:7px; padding:9px; border-radius:9px; border:none; background:#4f46e5; color:#fff; font-family:inherit; font-size:.82rem; font-weight:700; cursor:pointer; transition:all .13s; }
.cc-btn-apply:hover:not(:disabled) { background:#4338ca; box-shadow:0 4px 14px rgba(99,102,241,.35); }
.cc-btn-apply:disabled { background:#e2e8f0; color:#9ca3af; cursor:not-allowed; }
.body--dark .cc-btn-apply:disabled { background:#1e293b; color:#374151; }

.cc-guide { background:linear-gradient(160deg,#0d1117 0%,#141c2f 100%); border:1px solid rgba(99,102,241,.18); border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:10px; }
.cc-guide-title { display:flex; align-items:center; gap:6px; font-size:.74rem; font-weight:800; color:#a5b4fc; }
.cc-gi { display:flex; gap:9px; align-items:flex-start; font-size:.74rem; line-height:1.5; }
.cc-gi-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:4px; }
.cc-gi--earn .cc-gi-dot { background:#4ade80; }
.cc-gi--disc .cc-gi-dot { background:#f87171; }
.cc-gi strong { display:block; color:#e2e8f0; font-weight:700; margin-bottom:2px; }
.cc-gi div { color:#64748b; }
.cc-guide-note { display:flex; align-items:flex-start; gap:5px; font-size:.71rem; color:#475569; line-height:1.5; }
.cc-guide-note strong { color:#94a3b8; }

/* Dialog */
.cc-dialog { width:580px; max-width:96vw; max-height:88vh; background:#fff; border-radius:16px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,.2); }
.body--dark .cc-dialog { background:#111827; }
.cc-dlg-head { display:flex; align-items:center; gap:12px; padding:16px 20px; background:#fafbff; border-bottom:1px solid #f1f5f9; flex-shrink:0; }
.body--dark .cc-dlg-head { background:#0f172a; border-bottom-color:#1e293b; }
.cc-dlg-icon { width:36px; height:36px; border-radius:9px; background:linear-gradient(135deg,#4f46e5,#6366f1); color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 10px rgba(99,102,241,.35); }
.cc-dlg-title { font-size:.9rem; font-weight:800; color:#111827; flex:1; }
.body--dark .cc-dlg-title { color:#f1f5f9; }
.cc-dlg-sub { font-size:.71rem; color:#9ca3af; margin-top:1px; }
.cc-dlg-close { width:30px; height:30px; border-radius:7px; border:1px solid #e5e7eb; background:transparent; color:#9ca3af; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .12s; }
.cc-dlg-close:hover { background:#fee2e2; border-color:#fca5a5; color:#ef4444; }
.body--dark .cc-dlg-close { border-color:#1e293b; }
.cc-dlg-body { padding:18px 20px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:14px; }
.cc-dlg-body::-webkit-scrollbar { width:4px; }
.cc-dlg-body::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:99px; }
.cc-kind-opts { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.cc-kind-opt { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:10px; border:2px solid #e2e8f0; background:#fff; cursor:pointer; transition:all .13s; }
.cc-kind-opt input { display:none; }
.cc-kind-opt.selected { border-color:#4f46e5; background:#eef2ff; }
.body--dark .cc-kind-opt { background:#1e293b; border-color:#2d3748; }
.body--dark .cc-kind-opt.selected { border-color:#6366f1; background:rgba(99,102,241,.1); }
.cc-ko-name { font-size:.82rem; font-weight:700; color:#111827; }
.body--dark .cc-ko-name { color:#f1f5f9; }
.cc-ko-sub { font-size:.7rem; color:#9ca3af; }
.cc-source-opts { display:flex; flex-direction:column; gap:6px; }
.cc-source-opt { display:flex; align-items:flex-start; gap:9px; padding:9px 12px; border-radius:9px; border:1.5px solid #e2e8f0; background:#fff; cursor:pointer; transition:all .13s; }
.cc-source-opt input { display:none; }
.cc-source-opt.selected { border-color:#a5b4fc; background:#eef2ff; }
.body--dark .cc-source-opt { background:#1e293b; border-color:#2d3748; }
.body--dark .cc-source-opt.selected { border-color:rgba(99,102,241,.4); background:rgba(99,102,241,.08); }
.cc-source-opt .q-icon { flex-shrink:0; margin-top:1px; color:#6366f1; }
.cc-so-name { font-size:.8rem; font-weight:700; color:#111827; }
.body--dark .cc-so-name { color:#f1f5f9; }
.cc-so-sub { font-size:.71rem; color:#9ca3af; margin-top:1px; }
.cc-detail-card { padding:13px 14px; background:#f8faff; border:1px solid #e0e7ff; border-radius:9px; display:flex; flex-direction:column; gap:8px; }
.body--dark .cc-detail-card { background:rgba(99,102,241,.05); border-color:rgba(99,102,241,.15); }
.cc-detail-title { display:flex; align-items:center; gap:6px; font-size:.76rem; font-weight:700; color:#4f46e5; }
.body--dark .cc-detail-title { color:#a5b4fc; }
.cc-detail-note { font-size:.72rem; color:#6b7280; line-height:1.5; }
.cc-detail-note code { background:#e0e7ff; color:#4338ca; padding:1px 5px; border-radius:4px; font-size:.7rem; }
.body--dark .cc-detail-note code { background:rgba(99,102,241,.15); color:#a5b4fc; }
.cc-input :deep(.q-field__control) { border-radius:8px; }
.cc-opts-grid { display:flex; flex-direction:column; gap:6px; }
.cc-opt-toggle { display:flex; align-items:flex-start; gap:10px; padding:9px 12px; border-radius:9px; border:1.5px solid #e2e8f0; background:#fff; cursor:pointer; transition:all .13s; }
.cc-opt-toggle.on { border-color:#a5b4fc; background:#eef2ff; }
.body--dark .cc-opt-toggle { background:#1e293b; border-color:#2d3748; }
.body--dark .cc-opt-toggle.on { border-color:rgba(99,102,241,.3); background:rgba(99,102,241,.07); }
.cc-ot-name { font-size:.8rem; font-weight:700; color:#111827; }
.body--dark .cc-ot-name { color:#f1f5f9; }
.cc-ot-sub { font-size:.71rem; color:#9ca3af; margin-top:1px; }
.cc-row2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.cc-row3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
.cc-req { color:#ef4444; }
.cc-field-hint { font-size:.7rem; color:#9ca3af; margin-top:2px; }
.cc-dlg-foot { display:flex; align-items:center; justify-content:flex-end; gap:8px; padding:14px 20px; border-top:1px solid #f1f5f9; background:#fafbff; flex-shrink:0; }
.body--dark .cc-dlg-foot { background:#0f172a; border-top-color:#1e293b; }
.cc-btn-ghost { padding:7px 15px; border-radius:8px; border:none; background:transparent; font-family:inherit; font-size:.82rem; font-weight:600; color:#6b7280; cursor:pointer; transition:all .12s; }
.cc-btn-ghost:hover { background:#f3f4f6; color:#374151; }
.cc-btn-primary { display:inline-flex; align-items:center; gap:6px; padding:8px 18px; border-radius:8px; border:none; background:#4f46e5; color:#fff; font-family:inherit; font-size:.82rem; font-weight:700; cursor:pointer; transition:all .13s; }
.cc-btn-primary:hover:not(:disabled) { background:#4338ca; box-shadow:0 4px 12px rgba(99,102,241,.35); }
.cc-btn-primary:disabled { background:#e2e8f0; color:#9ca3af; cursor:not-allowed; }
.body--dark .cc-btn-primary:disabled { background:#1e293b; color:#374151; }
.cc-slide-enter-active,.cc-slide-leave-active { transition:all .2s; }
.cc-slide-enter-from,.cc-slide-leave-to { opacity:0; transform:translateY(6px); }
.cc-fade-enter-active,.cc-fade-leave-active { transition:opacity .15s,max-height .2s; max-height:200px; overflow:hidden; }
.cc-fade-enter-from,.cc-fade-leave-to { opacity:0; max-height:0; }
@media (max-width:860px) { .cc-layout { grid-template-columns:1fr; } .cc-right { display:none; } }
@media (max-width:540px) { .cc-row2 { grid-template-columns:1fr; } .cc-kind-opts { grid-template-columns:1fr; } }
</style>