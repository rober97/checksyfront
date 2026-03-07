<template>
  <div class="ctt-root">

    <!-- Preset strip -->
    <div class="ctt-preset-strip">
      <span class="ctt-preset-label"><q-icon name="auto_fix_high" size="14px" /> Presets rápidos</span>
      <button class="ctt-preset-btn" @click="$emit('apply-preset', 'cl_basica')">
        <q-icon name="flag" size="13px" />
        Chile básica · 15 días/año
      </button>
      <button class="ctt-preset-btn" @click="$emit('apply-preset', 'acumulacion_mensual')">
        <q-icon name="calendar_month" size="13px" />
        Mensual · 1,25 días/mes
      </button>
    </div>

    <div class="ctt-grid">
      <!-- LEFT: Config -->
      <div class="ctt-config">

        <!-- Block 1: Acumulación -->
        <div class="ctt-card">
          <div class="ctt-card-head">
            <div class="ctt-card-icon ctt-ci--indigo"><q-icon name="trending_up" size="15px" /></div>
            <div class="ctt-card-title">Acumulación de días</div>
            <div v-if="!tieneTasa" class="ctt-badge ctt-badge--warn">
              <q-icon name="warning" size="11px" /> Incompleto
            </div>
            <div v-else class="ctt-badge ctt-badge--ok">
              <q-icon name="check" size="11px" /> Configurado
            </div>
          </div>

          <div class="ctt-row2">
            <div class="ctt-field">
              <label class="ctt-label">Modo</label>
              <q-select
                v-model="vm.vacation.accrual.mode"
                :options="accrualModes" emit-value map-options
                outlined dense
                :rules="[v => !!v || 'Requerido']"
                @update:model-value="emitValid"
                class="ctt-input"
              />
              <div class="ctt-hint-text">{{ hintModo }}</div>
            </div>
            <div class="ctt-field">
              <label class="ctt-label">Días por año <span class="ctt-req">*</span></label>
              <q-input
                v-model.number="vm.vacation.accrual.perYearDays"
                type="number" min="0" step="0.5"
                outlined dense
                :rules="[v => (Number(v) >= 0) || 'Valor inválido']"
                @update:model-value="emitValid"
                class="ctt-input"
              >
                <template #append><span class="ctt-unit">días</span></template>
              </q-input>
              <div class="ctt-hint-text">≈ {{ tasaMensualCalc }} por mes</div>
            </div>
          </div>

          <div class="ctt-row2">
            <div class="ctt-field">
              <label class="ctt-label">Días por mes <span class="ctt-opt">(opcional)</span></label>
              <q-input
                v-model.number="vm.vacation.accrual.perMonthDays"
                type="number" min="0" step="0.05"
                outlined dense
                @update:model-value="emitValid"
                class="ctt-input"
              >
                <template #append><span class="ctt-unit">días</span></template>
              </q-input>
              <div class="ctt-hint-text">Vacío = año ÷ 12 automático</div>
            </div>
            <div class="ctt-field">
              <label class="ctt-label">Carencia</label>
              <q-input
                v-model.number="vm.vacation.accrual.startAfterDays"
                type="number" min="0"
                outlined dense
                @update:model-value="emitValid"
                class="ctt-input"
              >
                <template #append><span class="ctt-unit">días</span></template>
              </q-input>
              <div class="ctt-hint-text">Acumula después de este período</div>
            </div>
          </div>

          <div class="ctt-toggles">
            <label class="ctt-toggle-row">
              <q-toggle v-model="vm.vacation.accrual.accrueOnBusinessDays" dense @update:model-value="emitValid" />
              <div class="ctt-toggle-info">
                <span class="ctt-toggle-name">Solo días hábiles</span>
                <span class="ctt-toggle-sub">Excluye fines de semana y feriados al acumular</span>
              </div>
            </label>
            <label class="ctt-toggle-row">
              <q-toggle v-model="vm.vacation.accrual.prorateFromStartDate" dense @update:model-value="emitValid" />
              <div class="ctt-toggle-info">
                <span class="ctt-toggle-name">Prorrateo desde inicio de contrato</span>
                <span class="ctt-toggle-sub">El primer período se calcula en proporción</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Block 2: Traslado -->
        <div class="ctt-card">
          <div class="ctt-card-head">
            <div class="ctt-card-icon ctt-ci--teal"><q-icon name="event_repeat" size="15px" /></div>
            <div class="ctt-card-title">Traslado de saldo</div>
            <div class="ctt-toggle-badge">
              <q-toggle v-model="vm.vacation.carryOver.enabled" dense @update:model-value="emitValid" />
              <span>{{ vm.vacation.carryOver.enabled ? 'Activado' : 'Desactivado' }}</span>
            </div>
          </div>

          <transition name="ctt-slide">
            <div v-if="vm.vacation.carryOver.enabled">
              <div class="ctt-row3">
                <div class="ctt-field">
                  <label class="ctt-label">Máx. días a trasladar</label>
                  <q-input
                    v-model.number="vm.vacation.carryOver.maxCarry"
                    type="number" min="0" step="0.5"
                    outlined dense
                    @update:model-value="emitValid"
                    class="ctt-input"
                  >
                    <template #append><span class="ctt-unit">días</span></template>
                  </q-input>
                </div>
                <div class="ctt-field">
                  <label class="ctt-label">Mes de corte</label>
                  <q-select
                    v-model="vm.vacation.carryOver.resetMonth"
                    :options="mesesOpts" emit-value map-options
                    outlined dense
                    @update:model-value="emitValid"
                    class="ctt-input"
                  />
                </div>
                <div class="ctt-field">
                  <label class="ctt-label">Día de corte</label>
                  <q-input
                    v-model.number="vm.vacation.carryOver.resetDay"
                    type="number" min="1" :max="maxDia"
                    outlined dense
                    :hint="`Máx. ${maxDia} para este mes`"
                    @update:model-value="emitValid"
                    class="ctt-input"
                  />
                </div>
              </div>

              <div class="ctt-next-transfer">
                <q-icon name="schedule" size="14px" />
                <span>Próximo traslado: <strong>{{ proximoLabel }}</strong></span>
              </div>
            </div>
          </transition>
        </div>

        <!-- Block 3: Tope -->
        <div class="ctt-card ctt-card--inline">
          <div class="ctt-card-head">
            <div class="ctt-card-icon ctt-ci--orange"><q-icon name="layers" size="15px" /></div>
            <div class="ctt-card-title">Tope de acumulación</div>
            <div class="ctt-toggle-badge">
              <q-toggle v-model="vm.vacation.cap.enabled" dense @update:model-value="emitValid" />
              <span>{{ vm.vacation.cap.enabled ? 'Activado' : 'Sin límite' }}</span>
            </div>
          </div>
          <transition name="ctt-slide">
            <div v-if="vm.vacation.cap.enabled" class="ctt-cap-field">
              <div class="ctt-field" style="max-width:200px">
                <label class="ctt-label">Máximo acumulable</label>
                <q-input
                  v-model.number="vm.vacation.cap.maxDays"
                  type="number" min="0" step="0.5"
                  outlined dense
                  @update:model-value="emitValid"
                  class="ctt-input"
                >
                  <template #append><span class="ctt-unit">días</span></template>
                </q-input>
              </div>
              <div class="ctt-cap-note">
                <q-icon name="info_outline" size="13px" />
                El empleado dejará de acumular al llegar a este tope.
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- RIGHT: Summary -->
      <div class="ctt-summary-col">
        <div class="ctt-sum-label">Resumen de política</div>
        <div class="ctt-summary-card">
          <div class="ctt-sum-section">
            <div class="ctt-sum-title">Acumulación</div>
            <div class="ctt-sum-row"><span>Modo</span><strong>{{ lbl(accrualModes, vm.vacation.accrual.mode) || '–' }}</strong></div>
            <div class="ctt-sum-row"><span>Anual</span><strong>{{ fmtN(vm.vacation.accrual.perYearDays) }} días</strong></div>
            <div class="ctt-sum-row"><span>Mensual</span><strong>{{ tasaMensualCalc }}</strong></div>
            <div class="ctt-sum-row"><span>Carencia</span><strong>{{ vm.vacation.accrual.startAfterDays || 0 }} días</strong></div>
          </div>
          <div class="ctt-sum-divider"></div>
          <div class="ctt-sum-section">
            <div class="ctt-sum-title">Opciones</div>
            <div class="ctt-sum-row"><span>Solo hábiles</span><strong :class="vm.vacation.accrual.accrueOnBusinessDays ? 'ctt-yes' : 'ctt-no'">{{ vm.vacation.accrual.accrueOnBusinessDays ? 'Sí' : 'No' }}</strong></div>
            <div class="ctt-sum-row"><span>Prorrateo</span><strong :class="vm.vacation.accrual.prorateFromStartDate ? 'ctt-yes' : 'ctt-no'">{{ vm.vacation.accrual.prorateFromStartDate ? 'Sí' : 'No' }}</strong></div>
          </div>
          <div class="ctt-sum-divider"></div>
          <div class="ctt-sum-section">
            <div class="ctt-sum-title">Traslado y tope</div>
            <div class="ctt-sum-row">
              <span>Traslado</span>
              <strong :class="vm.vacation.carryOver.enabled ? 'ctt-yes' : 'ctt-no'">
                {{ vm.vacation.carryOver.enabled ? `Máx. ${fmtN(vm.vacation.carryOver.maxCarry)} d` : 'Sin traslado' }}
              </strong>
            </div>
            <div class="ctt-sum-row">
              <span>Tope</span>
              <strong :class="vm.vacation.cap.enabled ? 'ctt-yes' : 'ctt-no'">
                {{ vm.vacation.cap.enabled ? `${fmtN(vm.vacation.cap.maxDays)} días` : 'Sin tope' }}
              </strong>
            </div>
          </div>
        </div>

        <!-- Visual illustration of the accrual -->
        <div class="ctt-sim">
          <div class="ctt-sim-label">Simulación · 1 año trabajado</div>
          <div class="ctt-sim-bar-wrap">
            <div class="ctt-sim-bar">
              <div class="ctt-sim-fill" :style="{ width: simPct + '%' }"></div>
            </div>
            <div class="ctt-sim-days">{{ fmtN(vm.vacation.accrual.perYearDays || 0) }} días</div>
          </div>
          <div class="ctt-sim-ref">
            <span>0</span>
            <span>Legal mín. (15 d)</span>
            <span>30 d</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
const props = defineProps({ modelValue: { type: Object, required: true } })
const emit  = defineEmits(['update:modelValue', 'apply-preset', 'validity'])

const vm = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })

const accrualModes = [{ label: 'Diario', value: 'DAILY' }, { label: 'Mensual', value: 'MONTHLY' }]
const mesesOpts = [
  {label:'Enero',value:1},{label:'Febrero',value:2},{label:'Marzo',value:3},{label:'Abril',value:4},
  {label:'Mayo',value:5},{label:'Junio',value:6},{label:'Julio',value:7},{label:'Agosto',value:8},
  {label:'Septiembre',value:9},{label:'Octubre',value:10},{label:'Noviembre',value:11},{label:'Diciembre',value:12},
]

const fmtN = v => { const n = isFinite(Number(v)) ? Number(v) : 0; return n.toLocaleString('es-CL', { maximumFractionDigits: 2 }) }
const lbl  = (opts, v) => opts.find(o => o.value === v)?.label ?? null

const pY = computed(() => { const n = Number(vm.value?.vacation?.accrual?.perYearDays); return isFinite(n) ? n : 0 })
const pMraw = computed(() => vm.value?.vacation?.accrual?.perMonthDays)
const pMef  = computed(() => { const r = pMraw.value; return (r===null||r===undefined||r==='')?Math.round((pY.value/12)*100)/100:Number(r) })
const tasaMensualCalc = computed(() => `${fmtN(pMef.value)} días`)
const tieneTasa = computed(() => pY.value > 0 || (pMraw.value !== null && pMraw.value !== undefined && pMraw.value !== ''))

const hintModo = computed(() => vm.value?.vacation?.accrual?.mode === 'DAILY' ? 'Se distribuye cada día laboral' : 'Se acredita en bloque mensual')

const maxDia = computed(() => { const m = vm.value?.vacation?.carryOver?.resetMonth; if (!m) return 31; return new Date(Date.UTC(new Date().getUTCFullYear(), m, 0)).getUTCDate() })

const proximoLabel = computed(() => {
  try {
    const co = vm.value?.vacation?.carryOver || {}
    if (!co.enabled || !co.resetMonth || !co.resetDay) return '–'
    const y = new Date().getUTCFullYear(), d = Math.min(Number(co.resetDay), maxDia.value)
    const dt = new Date(Date.UTC(y, co.resetMonth - 1, d))
    if (dt < new Date()) dt.setUTCFullYear(dt.getUTCFullYear() + 1)
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(dt)
  } catch { return '–' }
})

const simPct = computed(() => Math.min((pY.value / 30) * 100, 100))

const emitValid = () => emit('validity', tieneTasa.value && !!vm.value?.vacation?.accrual?.mode)
onMounted(emitValid)
watch(() => vm.value, emitValid, { deep: true })
</script>

<style scoped>
.ctt-root { font-family: inherit; display: flex; flex-direction: column; gap: 12px; }

/* Preset strip */
.ctt-preset-strip {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 8px 12px; background: #f8faff; border: 1px solid #e0e7ff;
  border-radius: 10px;
}
.ctt-preset-label { font-size: .72rem; font-weight: 700; color: #6366f1; display: flex; align-items: center; gap: 5px; margin-right: 4px; }
.ctt-preset-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 11px; border: 1.5px solid #c7d2fe; border-radius: 7px;
  background: #fff; color: #4f46e5; font-family: inherit; font-size: .76rem; font-weight: 700;
  cursor: pointer; transition: all .13s;
}
.ctt-preset-btn:hover { background: #eef2ff; border-color: #a5b4fc; box-shadow: 0 2px 8px rgba(99,102,241,.15); }
.body--dark .ctt-preset-strip { background: rgba(99,102,241,.07); border-color: rgba(99,102,241,.2); }
.body--dark .ctt-preset-btn { background: rgba(99,102,241,.1); border-color: rgba(99,102,241,.25); color: #a5b4fc; }
.body--dark .ctt-preset-btn:hover { background: rgba(99,102,241,.18); }

.ctt-grid { display: grid; grid-template-columns: 1fr 200px; gap: 14px; align-items: start; }

/* Cards */
.ctt-config { display: flex; flex-direction: column; gap: 10px; }
.ctt-card {
  background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.body--dark .ctt-card { background: #1e293b; border-color: #1e2d3d; }

.ctt-card-head {
  display: flex; align-items: center; gap: 9px; margin-bottom: 14px;
}
.ctt-card-icon {
  width: 28px; height: 28px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ctt-ci--indigo { background: #eef2ff; color: #6366f1; border: 1px solid #c7d2fe; }
.ctt-ci--teal   { background: #f0fdfa; color: #0d9488; border: 1px solid #99f6e4; }
.ctt-ci--orange { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
.body--dark .ctt-ci--indigo { background: rgba(99,102,241,.12); border-color: rgba(99,102,241,.25); color: #a5b4fc; }
.body--dark .ctt-ci--teal   { background: rgba(13,148,136,.12); border-color: rgba(153,246,228,.2); color: #2dd4bf; }
.body--dark .ctt-ci--orange { background: rgba(234,88,12,.12); border-color: rgba(253,186,116,.2); color: #fb923c; }

.ctt-card-title { font-size: .84rem; font-weight: 700; color: #111827; flex: 1; }
.body--dark .ctt-card-title { color: #f1f5f9; }

.ctt-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 20px; font-size: .67rem; font-weight: 700;
}
.ctt-badge--ok   { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
.ctt-badge--warn { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.body--dark .ctt-badge--ok   { background: rgba(21,128,61,.15); color: #86efac; border-color: rgba(134,239,172,.25); }
.body--dark .ctt-badge--warn { background: rgba(245,158,11,.1); color: #fcd34d; border-color: rgba(253,230,138,.2); }

.ctt-toggle-badge {
  display: flex; align-items: center; gap: 5px;
  font-size: .73rem; font-weight: 600; color: #6b7280;
}
.body--dark .ctt-toggle-badge { color: #64748b; }

/* Fields */
.ctt-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.ctt-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.ctt-field { display: flex; flex-direction: column; gap: 4px; }
.ctt-label { font-size: .73rem; font-weight: 700; color: #6b7280; }
.body--dark .ctt-label { color: #94a3b8; }
.ctt-req { color: #ef4444; }
.ctt-opt { font-weight: 400; color: #9ca3af; font-size: .68rem; }
.ctt-input :deep(.q-field__control) { border-radius: 8px; }
.ctt-unit { font-size: .71rem; font-weight: 600; color: #9ca3af; }
.ctt-hint-text { font-size: .71rem; color: #6366f1; margin-top: 1px; }

/* Toggles */
.ctt-toggles { display: flex; flex-direction: column; gap: 6px; margin-top: 2px; }
.ctt-toggle-row { display: flex; align-items: flex-start; gap: 8px; cursor: pointer; }
.ctt-toggle-info { display: flex; flex-direction: column; padding-top: 2px; }
.ctt-toggle-name { font-size: .8rem; font-weight: 600; color: #374151; }
.body--dark .ctt-toggle-name { color: #d1d5db; }
.ctt-toggle-sub { font-size: .69rem; color: #9ca3af; margin-top: 1px; }

/* Next transfer pill */
.ctt-next-transfer {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 20px; margin-top: 8px;
  background: #f0fdfa; border: 1px solid #99f6e4;
  font-size: .76rem; color: #0f766e; font-weight: 600;
}
.body--dark .ctt-next-transfer { background: rgba(13,148,136,.08); border-color: rgba(13,148,136,.25); color: #2dd4bf; }

/* Cap note */
.ctt-cap-field { margin-top: 10px; }
.ctt-cap-note {
  display: flex; align-items: center; gap: 5px; margin-top: 8px;
  font-size: .74rem; color: #9ca3af;
}

/* Transitions */
.ctt-slide-enter-active, .ctt-slide-leave-active { transition: opacity .2s, max-height .25s; max-height: 200px; overflow: hidden; }
.ctt-slide-enter-from, .ctt-slide-leave-to { opacity: 0; max-height: 0; }

/* Summary */
.ctt-summary-col { display: flex; flex-direction: column; gap: 10px; }
.ctt-sum-label { font-size: .68rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #9ca3af; }

.ctt-summary-card {
  background: linear-gradient(160deg, #0d1117 0%, #141c2f 100%);
  border: 1px solid rgba(99,102,241,.2); border-radius: 12px; padding: 14px;
  color: #f1f5f9;
}
.ctt-sum-section { margin-bottom: 4px; }
.ctt-sum-title { font-size: .67rem; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; color: #475569; margin-bottom: 6px; }
.ctt-sum-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; font-size: .76rem; }
.ctt-sum-row span { color: #64748b; }
.ctt-sum-row strong { color: #e2e8f0; font-weight: 700; }
.ctt-yes { color: #4ade80 !important; }
.ctt-no  { color: #f87171 !important; }
.ctt-sum-divider { height: 1px; background: rgba(255,255,255,.06); margin: 10px 0; }

/* Simulation bar */
.ctt-sim { }
.ctt-sim-label { font-size: .68rem; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; color: #9ca3af; margin-bottom: 7px; }
.ctt-sim-bar-wrap { display: flex; align-items: center; gap: 8px; }
.ctt-sim-bar { flex: 1; height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
.body--dark .ctt-sim-bar { background: #1e293b; }
.ctt-sim-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #818cf8); border-radius: 99px; transition: width .4s ease; }
.ctt-sim-days { font-size: .76rem; font-weight: 800; color: #6366f1; white-space: nowrap; }
.ctt-sim-ref { display: flex; justify-content: space-between; font-size: .63rem; color: #94a3b8; margin-top: 4px; }

@media (max-width: 820px) { .ctt-grid { grid-template-columns: 1fr; } .ctt-summary-col { display: none; } }
@media (max-width: 540px) { .ctt-row2, .ctt-row3 { grid-template-columns: 1fr; } }
</style>