<template>
  <div class="rk-wrap">

    <!-- ─────────────────────────────── HEADER ── -->
    <div class="rk-top">
      <div class="rk-title">
        <div class="rk-title-icon">
          <q-icon name="receipt_long" size="20px" />
        </div>
        <div>
          <div class="rk-h1">Conceptos de liquidación</div>
          <div class="rk-h2">Haberes y descuentos · <b>por empresa</b></div>
        </div>
      </div>
      <div class="rk-state" :class="store.validation?.ok ? 'ok' : 'warn'">
        <q-icon :name="store.validation?.ok ? 'check_circle' : 'error_outline'" size="14px" />
        <span>{{ store.validation?.ok ? 'Listo para liquidar' : `${missingListPretty.length} obligatorio${missingListPretty.length !== 1 ? 's' : ''} faltante${missingListPretty.length !== 1 ? 's' : ''}` }}</span>
      </div>
    </div>

    <!-- ─────────────────────────────── ERROR ── -->
    <q-banner v-if="store.error" class="rk-banner rk-banner--error" rounded>
      <template #avatar><q-icon name="error_outline" /></template>
      <b>Ocurrió un problema</b>
      <div class="rk-muted rk-small q-mt-xs">{{ store.error }}</div>
    </q-banner>

    <!-- ──────────────────── ALERTA MÍNIMOS LEGALES ── -->
    <div v-if="missingListPretty.length" class="rk-alert-legal">
      <div class="rk-alert-legal-header">
        <q-icon name="gavel" size="18px" class="rk-alert-legal-icon" />
        <div class="rk-alert-legal-body">
          <div class="rk-alert-legal-title">Faltan descuentos obligatorios por ley</div>
          <div class="rk-alert-legal-sub">Sin estos conceptos no puedes emitir liquidaciones.</div>
        </div>
        <q-btn v-if="missingLegalesIds.length > 1" dense unelevated class="rk-btn-warn"
          icon="bolt" label="Agregar todos" @click="addAllLegales" :loading="store.loading" />
      </div>
      <div class="rk-alert-items">
        <div v-for="m in missingListPretty" :key="m.raw" class="rk-alert-item">
          <span class="rk-alert-emoji">{{ m.emoji }}</span>
          <div class="rk-alert-item-text">
            <b>{{ m.nombre }}</b>
            <span class="rk-muted"> — {{ m.descripcion }}</span>
          </div>
          <q-btn dense unelevated class="rk-btn-warn-sm" icon="add" label="Agregar"
            @click="quickAddLegal(m.presetId)" :loading="store.loading" />
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════
         VISTA A: CON CONCEPTOS
    ═══════════════════════════════════════════════════ -->
    <template v-if="hasItems">

      <!-- STATS ROW -->
      <div class="rk-stats">
        <div class="rk-stat">
          <div class="rk-stat-num">{{ store.activeCount ?? 0 }}</div>
          <div class="rk-stat-label">Total activos</div>
        </div>
        <div class="rk-stat rk-stat--earn">
          <div class="rk-stat-num">{{ store.earningsCount ?? 0 }}</div>
          <div class="rk-stat-label">Haberes</div>
        </div>
        <div class="rk-stat rk-stat--deduct">
          <div class="rk-stat-num">{{ store.deductionsCount ?? 0 }}</div>
          <div class="rk-stat-label">Descuentos</div>
        </div>
        <div class="rk-stat" :class="store.validation?.ok ? 'rk-stat--ok' : 'rk-stat--warn'">
          <q-icon :name="store.validation?.ok ? 'check_circle' : 'warning'" size="20px" class="rk-stat-icon" />
          <div class="rk-stat-label">{{ store.validation?.ok ? 'Configurado' : 'Incompleto' }}</div>
        </div>
      </div>

      <!-- TOOLBAR -->
      <div class="rk-toolbar">
        <q-input v-model="q" dense outlined placeholder="Buscar por código o nombre…"
          class="rk-search" clearable>
          <template #prepend><q-icon name="search" size="17px" /></template>
        </q-input>
        <div class="rk-toolbar-actions">
          <q-btn flat dense icon="fact_check" label="Revisar mínimos"
            :disable="store.loading" @click="validate" class="rk-btn-ghost" />
          <q-btn flat dense icon="layers" label="Plantilla"
            @click="showTemplatePanel = !showTemplatePanel" class="rk-btn-ghost"
            :class="{ 'rk-btn-ghost--active': showTemplatePanel }" />
          <q-btn unelevated color="primary" icon="add" label="Nuevo concepto" @click="openCreate" />
        </div>
      </div>

      <!-- PANEL PLANTILLA (collapsible) -->
      <transition name="rk-slide">
        <div v-if="showTemplatePanel" class="rk-template-panel">
          <div class="rk-template-panel-header">
            <div class="rk-card-title">
              <q-icon name="layers" size="16px" />
              <span>Aplicar plantilla</span>
              <span class="rk-muted rk-small q-ml-xs">— carga conceptos base de una sola vez</span>
            </div>
            <q-btn flat dense round icon="close" size="sm" @click="showTemplatePanel = false" />
          </div>
          <div class="rk-template-body">
            <q-select v-model="templateId" :options="templateOptions" outlined dense
              :loading="store.loading" label="Plantilla" emit-value map-options no-error-icon class="rk-tpl-field" />
            <q-select v-model="applyMode" :options="applyModeOptsEs" outlined dense
              label="Cómo aplicar" emit-value map-options no-error-icon class="rk-tpl-field" />
            <q-btn unelevated color="primary" icon="download" label="Aplicar"
              :disable="!templateId || store.loading" :loading="store.loading"
              @click="applyTemplate" style="align-self:flex-start;margin-top:2px" />
          </div>
        </div>
      </transition>

      <!-- TABLA DE CONCEPTOS -->
      <div class="rk-table-wrap">
        <table class="rk-table">
          <thead>
            <tr>
              <th class="col-toggle"></th>
              <th class="col-code">Código</th>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Origen</th>
              <th class="col-flag">Imponible</th>
              <th class="col-flag">Prorratea</th>
              <th class="col-order">Orden</th>
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRows.length === 0">
              <td colspan="9" class="rk-empty">
                <q-icon name="search_off" size="28px" class="q-mb-xs" /><br>
                Sin resultados para "<b>{{ q }}</b>"
              </td>
            </tr>
            <tr v-for="row in filteredRows" :key="row._id"
              :class="['rk-row', { 'rk-row--inactive': !row.active, 'rk-row--patched': isPendingPatch(row._id) }]">
              <td class="col-toggle">
                <q-toggle v-model="row.active" dense color="primary" size="sm"
                  @update:model-value="queuePatch(row, { active: row.active })" />
              </td>
              <td><span class="rk-code">{{ row.code }}</span></td>
              <td>
                <div class="rk-row-name">{{ row.name }}</div>
                <div v-if="!row.active" class="rk-row-inactive-label">Desactivado</div>
              </td>
              <td>
                <span class="rk-badge" :class="row.kind === 'EARNING' ? 'rk-badge--earn' : 'rk-badge--deduct'">
                  {{ row.kind === 'EARNING' ? '+ Haber' : '− Descuento' }}
                </span>
              </td>
              <td>
                <span class="rk-badge rk-badge--neutral">{{ origenLabel(row.valueType) }}</span>
                <div v-if="origenHint(row)" class="rk-hint-sub">{{ origenHint(row) }}</div>
              </td>
              <td class="col-flag">
                <span class="rk-bool" :class="row.taxable ? 'yes' : 'no'">
                  <q-icon :name="row.taxable ? 'check' : 'remove'" size="13px" />
                  {{ row.taxable ? 'Sí' : 'No' }}
                </span>
              </td>
              <td class="col-flag">
                <span class="rk-bool" :class="row.prorate ? 'yes' : 'no'">
                  <q-icon :name="row.prorate ? 'check' : 'remove'" size="13px" />
                  {{ row.prorate ? 'Sí' : 'No' }}
                </span>
              </td>
              <td class="col-order">
                <q-input v-model.number="row.order" type="number" dense outlined style="width:62px"
                  @update:model-value="queuePatch(row, { order: Number(row.order || 100) })" />
              </td>
              <td class="col-actions">
                <div class="rk-row-actions">
                  <q-btn dense flat round icon="edit" size="sm" @click="openEdit(row)">
                    <q-tooltip anchor="top middle" self="bottom middle" :offset="[0,4]">Editar</q-tooltip>
                  </q-btn>
                  <q-btn dense flat round icon="delete_outline" size="sm"
                    class="rk-btn-delete" @click="confirmDelete(row)">
                    <q-tooltip anchor="top middle" self="bottom middle" :offset="[0,4]">Eliminar</q-tooltip>
                  </q-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </template>

    <!-- ═══════════════════════════════════════════════════
         VISTA B: SIN CONCEPTOS (onboarding)
    ═══════════════════════════════════════════════════ -->
    <template v-else>
      <div class="rk-onboarding">
        <div class="rk-onboarding-head">
          <div class="rk-onboarding-icon-wrap">
            <q-icon name="receipt_long" size="32px" />
          </div>
          <div class="rk-onboarding-title">Sin conceptos configurados</div>
          <div class="rk-onboarding-sub">
            Los conceptos definen qué se paga y qué se descuenta en cada liquidación.
            La forma más rápida es aplicar una <b>plantilla con los mínimos legales</b>.
          </div>
        </div>

        <div class="rk-onboarding-grid">
          <!-- OPCIÓN A: PLANTILLA -->
          <div class="rk-onboarding-card rk-onboarding-card--featured">
            <div class="rk-onboarding-card-badge">Recomendado</div>
            <div class="rk-onboarding-card-header">
              <q-icon name="layers" size="20px" class="rk-onboarding-card-icon" />
              <div>
                <div class="rk-onboarding-card-title">Aplicar plantilla</div>
                <div class="rk-onboarding-card-desc">Carga AFP, salud, cesantía, sueldo base y más de un solo clic.</div>
              </div>
            </div>
            <div class="rk-onboarding-form">
              <q-select v-model="templateId" :options="templateOptions" outlined dense
                :loading="store.loading" label="Selecciona una plantilla" emit-value map-options no-error-icon />
              <q-select v-model="applyMode" :options="applyModeOptsEs" outlined dense
                label="Cómo aplicar" emit-value map-options no-error-icon />
              <q-btn unelevated color="primary" icon="download" label="Aplicar plantilla"
                :disable="!companyId || !templateId || store.loading"
                :loading="store.loading" @click="applyTemplate" style="width:100%" />
            </div>
          </div>

          <!-- OPCIÓN B: MANUAL -->
          <div class="rk-onboarding-card">
            <div class="rk-onboarding-card-header">
              <q-icon name="edit_note" size="20px" class="rk-onboarding-card-icon" />
              <div>
                <div class="rk-onboarding-card-title">Crear manualmente</div>
                <div class="rk-onboarding-card-desc">Agrega cada concepto desde el catálogo o en modo avanzado.</div>
              </div>
            </div>
            <q-btn outline color="primary" icon="add" label="Crear primer concepto"
              @click="openCreate" style="width:100%;margin-top:auto" />
          </div>
        </div>

        <!-- GUÍA DE REFERENCIA -->
        <div class="rk-onboarding-legend">
          <div class="rk-legend-item">
            <span class="rk-badge rk-badge--earn">+ Haber</span>
            <span>Suma al pago — sueldo, gratificación, bonos…</span>
          </div>
          <div class="rk-legend-sep">·</div>
          <div class="rk-legend-item">
            <span class="rk-badge rk-badge--deduct">− Descuento</span>
            <span>Resta al pago — AFP, salud, cesantía…</span>
          </div>
          <div class="rk-legend-sep">·</div>
          <div class="rk-legend-item">
            <span class="rk-badge rk-badge--neutral">Origen</span>
            <span>Contrato / cálculo automático / parámetros</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ─────────────────────────────── SAVE BAR ── -->
    <transition name="rk-savebar-anim">
      <div class="rk-savebar" v-if="patches.length">
        <div class="rk-savebar-left">
          <div class="rk-savebar-dot"></div>
          <div>
            <div class="rk-savebar-title">{{ patches.length }} cambio{{ patches.length !== 1 ? 's' : '' }} sin guardar</div>
            <div class="rk-muted rk-small">Activa/desactiva o reordena conceptos</div>
          </div>
        </div>
        <div class="rk-savebar-right">
          <q-btn flat dense label="Descartar" @click="discardPatches" />
          <q-btn unelevated color="primary" icon="save"
            :label="`Guardar (${patches.length})`" :loading="store.loading" @click="saveBulk" />
        </div>
      </div>
    </transition>

    <!-- ═══════════════════════════════════════════════════
         DIALOG: CREAR / EDITAR CONCEPTO
    ═══════════════════════════════════════════════════ -->
    <q-dialog v-model="dlg" persistent transition-show="jump-up" transition-hide="jump-down">
      <q-card class="rk-dlg">

        <!-- Header del dialog -->
        <div class="rk-dlg-header">
          <div class="rk-dlg-header-left">
            <div class="rk-dlg-icon" :class="editingId ? 'rk-dlg-icon--edit' : 'rk-dlg-icon--create'">
              <q-icon :name="editingId ? 'edit' : 'add'" size="18px" />
            </div>
            <div>
              <div class="rk-dlg-title">{{ editingId ? 'Editar concepto' : 'Nuevo concepto' }}</div>
              <div class="rk-muted rk-small">{{ editingId ? `Modificando: ${edit.code} — ${edit.name}` : 'Elige del catálogo o configura manualmente.' }}</div>
            </div>
          </div>
          <q-btn icon="close" flat round dense size="sm" v-close-popup />
        </div>

        <q-card-section class="q-pt-sm q-pb-none">

          <!-- MODO CREAR: tabs catálogo / manual -->
          <template v-if="!editingId">
            <q-tabs v-model="dlgTab" dense align="left" class="rk-tabs"
              indicator-color="primary" active-color="primary">
              <q-tab name="catalogo" icon="grid_view" label="Desde catálogo" />
              <q-tab name="manual" icon="tune" label="Avanzado" />
            </q-tabs>

            <q-tab-panels v-model="dlgTab" animated class="q-pa-none">
              <!-- TAB: CATÁLOGO -->
              <q-tab-panel name="catalogo" class="q-pa-none q-pt-sm">
                <div v-for="cat in catalogoCats" :key="cat.id" class="q-mb-sm">
                  <div class="rk-cat-title">{{ cat.label }}</div>
                  <div class="rk-preset-grid">
                    <div v-for="p in presetsByCat(cat.id)" :key="p.id"
                      class="rk-preset-card"
                      :class="{ 'rk-preset-card--active': selectedPreset === p.id, 'rk-preset-card--added': isPresetAlreadyAdded(p) }"
                      @click="!isPresetAlreadyAdded(p) && pickPreset(p)">
                      <span class="rk-preset-emoji">{{ p.emoji }}</span>
                      <div class="rk-preset-info">
                        <div class="rk-preset-name">
                          {{ p.nombre }}
                          <span v-if="p.legal" class="rk-tag rk-tag--warn">Obligatorio</span>
                          <span v-else-if="p.recomendado" class="rk-tag rk-tag--muted">Recomendado</span>
                        </div>
                        <div class="rk-muted rk-small">{{ p.descripcion }}</div>
                      </div>
                      <q-icon v-if="isPresetAlreadyAdded(p)" name="check_circle" size="18px" style="color:var(--c-earn);flex-shrink:0" />
                      <q-icon v-else-if="selectedPreset === p.id" name="radio_button_checked" size="18px" style="color:var(--c-accent);flex-shrink:0" />
                      <q-icon v-else name="radio_button_unchecked" size="18px" style="color:var(--c-border-strong);flex-shrink:0" />
                    </div>
                  </div>
                </div>

                <!-- PREVIEW AL SELECCIONAR -->
                <transition name="rk-slide">
                  <div v-if="selectedPreset" class="rk-preview-box q-mt-sm">
                    <div class="rk-preview-title">
                      <q-icon name="edit" size="13px" /> Ajusta código y nombre si lo necesitas
                    </div>
                    <div class="row q-col-gutter-sm">
                      <div class="col-12 col-sm-4">
                        <q-input v-model="edit.code" outlined dense label="Código *"
                          hint="Único por empresa" :rules="[v => !!v || 'Requerido']" />
                      </div>
                      <div class="col-12 col-sm-8">
                        <q-input v-model="edit.name" outlined dense label="Nombre visible *"
                          :rules="[v => !!v || 'Requerido']" />
                      </div>
                    </div>
                  </div>
                </transition>
              </q-tab-panel>

              <!-- TAB: MANUAL AVANZADO -->
              <q-tab-panel name="manual" class="q-pa-none q-pt-sm">
                <div class="rk-manual-form">
                  <div class="row q-col-gutter-sm">
                    <div class="col-12 col-sm-4">
                      <q-input v-model="edit.code" outlined dense label="Código *" hint="Ej: SUELDO_BASE" />
                    </div>
                    <div class="col-12 col-sm-8">
                      <q-input v-model="edit.name" outlined dense label="Nombre visible *" hint="Ej: Sueldo base" />
                    </div>
                    <div class="col-12 col-sm-4">
                      <q-select v-model="edit.kind" :options="kindOptsEs" outlined dense
                        emit-value map-options label="Tipo" hint="¿Suma o resta al total?" />
                    </div>
                    <div class="col-12 col-sm-4">
                      <q-select v-model="edit.valueType" :options="valueTypeOptsEs" outlined dense
                        emit-value map-options label="Origen del valor" />
                    </div>
                    <div class="col-12 col-sm-4">
                      <q-input v-model.number="edit.order" type="number" outlined dense
                        label="Orden" hint="Menor = aparece primero" />
                    </div>
                  </div>
                  <div v-if="edit.valueType === 'PATH'" class="rk-source-box">
                    <div class="rk-source-title">Campo del contrato</div>
                    <q-select v-model="pathChoice" :options="contractFieldOptions" outlined dense
                      emit-value map-options label="¿Qué campo?" hint="Valor tomado del contrato" />
                    <q-slide-transition>
                      <q-input v-if="pathChoice === '__CUSTOM__'" v-model="edit.valuePath"
                        outlined dense label="Ruta avanzada (valuePath)" />
                    </q-slide-transition>
                  </div>
                  <div v-else-if="edit.valueType === 'CALC'" class="rk-source-box">
                    <div class="rk-source-title">Cálculo automático</div>
                    <q-select v-model="calcChoice" :options="calcPresetOptions" outlined dense
                      emit-value map-options label="¿Qué cálculo?" hint="El sistema calcula según tasas legales" />
                    <q-slide-transition>
                      <q-input v-if="calcChoice === '__CUSTOM__'" v-model="edit.calcKey"
                        outlined dense label="Clave avanzada (calcKey)" />
                    </q-slide-transition>
                  </div>
                  <div v-else-if="edit.valueType === 'PARAM'" class="rk-source-box">
                    <div class="rk-source-title">Parámetro del sistema</div>
                    <q-select v-model="paramChoice" :options="paramPresetOptions" outlined dense
                      emit-value map-options label="¿Qué parámetro?" />
                    <q-slide-transition>
                      <div v-if="paramChoice === '__CUSTOM__'" class="row q-col-gutter-sm q-mt-xs">
                        <div class="col-12 col-sm-4">
                          <q-input v-model="edit.param.type" outlined dense label="Tipo" placeholder="MONEY" />
                        </div>
                        <div class="col-12 col-sm-4">
                          <q-input v-model="edit.param.scope" outlined dense label="Alcance" placeholder="COMPANY" />
                        </div>
                        <div class="col-12 col-sm-4">
                          <q-input v-model="edit.param.key" outlined dense label="Clave" placeholder="UF" />
                        </div>
                      </div>
                    </q-slide-transition>
                  </div>
                  <q-separator />
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-4">
                      <q-toggle v-model="edit.active" label="Habilitado" color="primary" />
                    </div>
                    <div class="col-12 col-sm-4">
                      <q-toggle v-model="edit.taxable" label="Imponible" />
                    </div>
                    <div class="col-12 col-sm-4">
                      <q-toggle v-model="edit.prorate" label="Prorratea" />
                    </div>
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>
          </template>

          <!-- MODO EDITAR: form directo sin tabs -->
          <template v-else>
            <div class="rk-edit-form">
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-4">
                  <q-input v-model="edit.code" outlined dense label="Código *" />
                </div>
                <div class="col-12 col-sm-8">
                  <q-input v-model="edit.name" outlined dense label="Nombre visible *" />
                </div>
                <div class="col-12 col-sm-4">
                  <q-select v-model="edit.kind" :options="kindOptsEs" outlined dense
                    emit-value map-options label="Tipo" />
                </div>
                <div class="col-12 col-sm-4">
                  <q-select v-model="edit.valueType" :options="valueTypeOptsEs" outlined dense
                    emit-value map-options label="Origen del valor" />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model.number="edit.order" type="number" outlined dense label="Orden" />
                </div>
              </div>

              <div v-if="edit.valueType === 'PATH'" class="rk-source-box">
                <div class="rk-source-title">Campo del contrato</div>
                <q-select v-model="pathChoice" :options="contractFieldOptions" outlined dense
                  emit-value map-options label="¿Qué campo?" />
                <q-slide-transition>
                  <q-input v-if="pathChoice === '__CUSTOM__'" v-model="edit.valuePath"
                    outlined dense label="Ruta avanzada" class="q-mt-xs" />
                </q-slide-transition>
              </div>
              <div v-else-if="edit.valueType === 'CALC'" class="rk-source-box">
                <div class="rk-source-title">Cálculo automático</div>
                <q-select v-model="calcChoice" :options="calcPresetOptions" outlined dense
                  emit-value map-options label="¿Qué cálculo?" />
                <q-slide-transition>
                  <q-input v-if="calcChoice === '__CUSTOM__'" v-model="edit.calcKey"
                    outlined dense label="Clave avanzada" class="q-mt-xs" />
                </q-slide-transition>
              </div>
              <div v-else-if="edit.valueType === 'PARAM'" class="rk-source-box">
                <div class="rk-source-title">Parámetro del sistema</div>
                <q-select v-model="paramChoice" :options="paramPresetOptions" outlined dense
                  emit-value map-options label="¿Qué parámetro?" />
                <q-slide-transition>
                  <div v-if="paramChoice === '__CUSTOM__'" class="row q-col-gutter-sm q-mt-xs">
                    <div class="col-12 col-sm-4">
                      <q-input v-model="edit.param.type" outlined dense label="Tipo" />
                    </div>
                    <div class="col-12 col-sm-4">
                      <q-input v-model="edit.param.scope" outlined dense label="Alcance" />
                    </div>
                    <div class="col-12 col-sm-4">
                      <q-input v-model="edit.param.key" outlined dense label="Clave" />
                    </div>
                  </div>
                </q-slide-transition>
              </div>

              <q-separator />
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-4">
                  <q-toggle v-model="edit.active" label="Habilitado" color="primary" />
                </div>
                <div class="col-12 col-sm-4">
                  <q-toggle v-model="edit.taxable" label="Imponible" />
                </div>
                <div class="col-12 col-sm-4">
                  <q-toggle v-model="edit.prorate" label="Prorratea" />
                </div>
              </div>
            </div>
          </template>

        </q-card-section>

        <q-card-actions align="right" class="q-px-lg q-pb-md q-pt-sm rk-dlg-footer">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn unelevated color="primary" icon="save"
            :label="editingId ? 'Guardar cambios' : 'Crear concepto'"
            :disable="store.loading || !canSaveDialog"
            :loading="store.loading" @click="saveOne" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ═══════════════════════════════════════════════════
         DIALOG: CONFIRMAR ELIMINACIÓN
    ═══════════════════════════════════════════════════ -->
    <q-dialog v-model="deleteDlg" transition-show="jump-up" transition-hide="jump-down">
      <q-card class="rk-dlg-sm">
        <div class="rk-dlg-header">
          <div class="rk-dlg-header-left">
            <div class="rk-dlg-icon rk-dlg-icon--delete">
              <q-icon name="delete_outline" size="18px" />
            </div>
            <div>
              <div class="rk-dlg-title">Eliminar concepto</div>
              <div class="rk-muted rk-small">Esta acción no se puede deshacer.</div>
            </div>
          </div>
          <q-btn icon="close" flat round dense size="sm" v-close-popup />
        </div>
        <q-card-section class="q-pt-sm">
          <!-- TARJETA DEL CONCEPTO A ELIMINAR -->
          <div class="rk-delete-card">
            <div>
              <div class="rk-delete-name">{{ deleteTarget?.name }}</div>
              <div class="rk-delete-meta q-mt-xs">
                <span class="rk-code">{{ deleteTarget?.code }}</span>
                <span class="rk-badge q-ml-xs"
                  :class="deleteTarget?.kind === 'EARNING' ? 'rk-badge--earn' : 'rk-badge--deduct'">
                  {{ deleteTarget?.kind === 'EARNING' ? '+ Haber' : '− Descuento' }}
                </span>
              </div>
            </div>
          </div>

          <!-- ADVERTENCIA SI ES LEGAL -->
          <div v-if="deleteTargetIsLegal" class="rk-delete-warning q-mt-sm">
            <q-icon name="gavel" size="14px" style="flex-shrink:0;margin-top:1px" />
            <span>Este es un descuento <b>obligatorio por ley</b>. Eliminarlo bloqueará la emisión de liquidaciones hasta que lo vuelvas a agregar.</span>
          </div>
          <div v-else class="rk-delete-warning rk-delete-warning--neutral q-mt-sm">
            <q-icon name="info" size="14px" style="flex-shrink:0;margin-top:1px" />
            <span>El concepto se eliminará de todas las liquidaciones futuras de esta empresa.</span>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn unelevated color="negative" icon="delete" label="Eliminar definitivamente"
            :loading="store.loading" @click="doDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { usePayrollConceptsStore } from "@/stores/payrollConceptsStore";

const $q = useQuasar();
const store = usePayrollConceptsStore();
const props = defineProps({ companyId: { type: String, required: true } });

// ── ESTADO UI ──
const q             = ref("");
const templateId    = ref(null);
const applyMode     = ref("merge");
const patches       = ref([]);
const showTemplatePanel = ref(false);
const dlgTab        = ref("catalogo");
const selectedPreset = ref(null);
const deleteDlg     = ref(false);
const deleteTarget  = ref(null);
const dlg           = ref(false);
const editingId     = ref(null);
const calcChoice    = ref(null);
const pathChoice    = ref(null);
const paramChoice   = ref(null);

const edit = ref({
  code: "", name: "", kind: "EARNING", valueType: "PATH",
  valuePath: "", param: { type: "", scope: "", key: "" },
  calcKey: "", taxable: false, prorate: false, active: true, order: 100,
});

// ── PRESETS ──
const PRESETS = [
  { id: "sueldo_base",  emoji: "💼", nombre: "Sueldo base",        descripcion: "Salario fijo pactado en el contrato",      tipo: "EARNING",   origen: "PATH", valuePath: "baseSalary",        taxable: true,  prorate: true,  order: 10,  categoria: "haberes",            recomendado: true },
  { id: "gratificacion",emoji: "🎁", nombre: "Gratificación",      descripcion: "Beneficio legal proporcional al sueldo",    tipo: "EARNING",   origen: "PATH", valuePath: "gratification",     taxable: true,  prorate: false, order: 20,  categoria: "haberes",            recomendado: true },
  { id: "colacion",     emoji: "🍽️", nombre: "Colación",           descripcion: "Asignación de alimentación (no imponible)", tipo: "EARNING",   origen: "PATH", valuePath: "mealAllowance",     taxable: false, prorate: false, order: 30,  categoria: "haberes" },
  { id: "movilizacion", emoji: "🚌", nombre: "Movilización",       descripcion: "Asignación de transporte (no imponible)",   tipo: "EARNING",   origen: "PATH", valuePath: "transportAllowance",taxable: false, prorate: false, order: 40,  categoria: "haberes" },
  { id: "bono",         emoji: "⭐", nombre: "Bono",               descripcion: "Bono variable del contrato",                tipo: "EARNING",   origen: "PATH", valuePath: "bonus",             taxable: true,  prorate: false, order: 50,  categoria: "haberes" },
  { id: "afp",          emoji: "🏦", nombre: "AFP",                descripcion: "Cotización previsional obligatoria (~10–12%)",tipo: "DEDUCTION",origen: "CALC", calcKey: "AFP_WORKER",          taxable: false, prorate: false, order: 100, categoria: "descuentos_legales", recomendado: true, legal: true },
  { id: "salud",        emoji: "🏥", nombre: "Salud",              descripcion: "Descuento de salud obligatorio (7%)",        tipo: "DEDUCTION",origen: "CALC", calcKey: "HEALTH_WORKER",       taxable: false, prorate: false, order: 110, categoria: "descuentos_legales", recomendado: true, legal: true },
  { id: "cesantia",     emoji: "🛡️", nombre: "Seguro de cesantía", descripcion: "Seguro de desempleo obligatorio (0.6%)",     tipo: "DEDUCTION",origen: "CALC", calcKey: "CESANTIA_WORKER",     taxable: false, prorate: false, order: 120, categoria: "descuentos_legales", recomendado: true, legal: true },
];
const LEGAL_IDS = ["afp", "salud", "cesantia"];
const catalogoCats = [
  { id: "haberes",           label: "Haberes" },
  { id: "descuentos_legales",label: "Descuentos legales" },
];
function presetsByCat(cat) { return PRESETS.filter((p) => p.categoria === cat); }
function isPresetAlreadyAdded(preset) {
  const items = store.items || [];
  if (preset.origen === "PATH") return items.some((i) => i.active && i.valueType === "PATH" && i.valuePath === preset.valuePath);
  if (preset.origen === "CALC") return items.some((i) => i.active && i.valueType === "CALC" && i.calcKey === preset.calcKey);
  return false;
}

// ── OPTIONS ──
const applyModeOptsEs = [
  { label: "Agregar sin borrar (recomendado)", value: "merge" },
  { label: "Reemplazar todo", value: "replace" },
];
const kindOptsEs = [
  { label: "+ Haber (suma al pago)", value: "EARNING" },
  { label: "− Descuento (resta al pago)", value: "DEDUCTION" },
];
const valueTypeOptsEs = [
  { label: "Desde contrato", value: "PATH" },
  { label: "Cálculo automático", value: "CALC" },
  { label: "Desde parámetros", value: "PARAM" },
];
const contractFieldOptions = [
  { label: "Sueldo base", value: "baseSalary" },
  { label: "Gratificación", value: "gratification" },
  { label: "Colación", value: "mealAllowance" },
  { label: "Movilización", value: "transportAllowance" },
  { label: "Bono", value: "bonus" },
  { label: "Otro (avanzado)", value: "__CUSTOM__" },
];
const calcPresetOptions = [
  { label: "AFP (trabajador)", value: "AFP_WORKER" },
  { label: "Salud (trabajador)", value: "HEALTH_WORKER" },
  { label: "Seguro de cesantía (trabajador)", value: "CESANTIA_WORKER" },
  { label: "Otro (avanzado)", value: "__CUSTOM__" },
];
const paramPresetOptions = [
  { label: "UF (empresa)", value: "UF__COMPANY" },
  { label: "Sueldo mínimo (empresa)", value: "MIN_WAGE__COMPANY" },
  { label: "Otro (avanzado)", value: "__CUSTOM__" },
];

// ── COMPUTED ──
const hasItems = computed(() => (store.items || []).length > 0);

const templateOptions = computed(() =>
  (store.templates || []).map((t) => ({ label: t.name || t.code || t._id, value: t._id }))
);

const filteredRows = computed(() => {
  const rows = store.items || [];
  const term = (q.value || "").trim().toLowerCase();
  if (!term) return rows;
  return rows.filter((r) =>
    String(r.code || "").toLowerCase().includes(term) ||
    String(r.name || "").toLowerCase().includes(term)
  );
});

const canSaveDialog = computed(() => {
  if (!edit.value.code?.trim() || !edit.value.name?.trim()) return false;
  if (!editingId.value && dlgTab.value === "catalogo" && !selectedPreset.value) return false;
  return true;
});

const missingLegalesIds = computed(() => {
  const items = store.items || [];
  return LEGAL_IDS.filter((id) => {
    const preset = PRESETS.find((p) => p.id === id);
    return !items.some((i) => i.active && i.valueType === "CALC" && i.calcKey === preset?.calcKey);
  });
});

const missingListPretty = computed(() => {
  const raw = [];
  const m = store.validation?.missing || {};
  if (Array.isArray(m)) raw.push(...m);
  else for (const [k, v] of Object.entries(m)) {
    if (Array.isArray(v)) v.forEach((x) => raw.push(`${k}: ${x}`));
    else if (v) raw.push(String(v));
  }
  if (raw.length === 0) {
    return missingLegalesIds.value.map((id) => {
      const p = PRESETS.find((x) => x.id === id);
      return { raw: id, presetId: id, emoji: p?.emoji || "⚠️", nombre: p?.nombre || id, descripcion: p?.descripcion || "" };
    });
  }
  return raw.map((x) => {
    const line = String(x).replace(/^concepts:\s*/i, "");
    const calcKeyMatch = line.match(/calcKey=([A-Za-z0-9_.-]+)/);
    const valuePathMatch = line.match(/valuePath=([A-Za-z0-9_.-]+)/);
    const nameMatch = line.match(/Falta concepto activo:\s*([^(]+)\s*\(/i);
    let presetId = calcKeyMatch?.[1] ? PRESETS.find((p) => p.calcKey === calcKeyMatch[1])?.id || null : null;
    if (!presetId && valuePathMatch?.[1]) presetId = PRESETS.find((p) => p.valuePath === valuePathMatch[1])?.id || null;
    const preset = presetId ? PRESETS.find((p) => p.id === presetId) : null;
    return { raw: line, presetId, emoji: preset?.emoji || "⚠️", nombre: preset?.nombre || nameMatch?.[1]?.trim() || line.slice(0, 40), descripcion: preset?.descripcion || "" };
  });
});

const deleteTargetIsLegal = computed(() => {
  if (!deleteTarget.value) return false;
  const row = deleteTarget.value;
  return LEGAL_IDS.some((id) => {
    const p = PRESETS.find((x) => x.id === id);
    return p && row.valueType === "CALC" && row.calcKey === p.calcKey;
  });
});

function isPendingPatch(id) {
  return patches.value.some((p) => p._id === id);
}

// ── HELPERS VISUALES ──
function origenLabel(vt) {
  if (vt === "PATH")  return "Contrato";
  if (vt === "PARAM") return "Parámetros";
  if (vt === "CALC")  return "Automático";
  return "—";
}
function origenHint(row) {
  if (row.valueType === "PATH" && row.valuePath)
    return contractFieldOptions.find((x) => x.value === row.valuePath)?.label || row.valuePath;
  if (row.valueType === "CALC" && row.calcKey)
    return calcPresetOptions.find((x) => x.value === row.calcKey)?.label || row.calcKey;
  return null;
}

// ── QUICK ADD LEGAL ──
async function quickAddLegal(presetId) {
  const p = PRESETS.find((x) => x.id === presetId);
  if (!p) return;
  try {
    await store.upsertConcept({
      companyId: props.companyId,
      concept: {
        code: p.id.toUpperCase(), name: p.nombre, kind: p.tipo, valueType: p.origen,
        valuePath: p.valuePath || "", calcKey: p.calcKey || "",
        param: { type: "", scope: "", key: "" },
        taxable: p.taxable, prorate: p.prorate, active: true, order: p.order,
      },
    });
    await store.validateCompanyPayroll(props.companyId);
    $q.notify({ type: "positive", message: `${p.emoji} ${p.nombre} agregado`, position: "top" });
  } catch (e) {
    $q.notify({ type: "negative", message: e?.message || "Error al agregar", position: "top" });
  }
}
async function addAllLegales() {
  for (const id of missingLegalesIds.value) await quickAddLegal(id);
}

// ── CRUD ──
function confirmDelete(row) { deleteTarget.value = row; deleteDlg.value = true; }
async function doDelete() {
  if (!deleteTarget.value) return;
  try {
    await store.deleteConcept({ companyId: props.companyId, conceptId: deleteTarget.value._id });
    deleteDlg.value = false; deleteTarget.value = null;
    await store.validateCompanyPayroll(props.companyId);
    $q.notify({ type: "positive", message: "Concepto eliminado", position: "top" });
  } catch (e) {
    $q.notify({ type: "negative", message: e?.message || "Error al eliminar", position: "top" });
  }
}

function pickPreset(p) {
  selectedPreset.value = p.id;
  edit.value = {
    code: p.id.toUpperCase().slice(0, 10), name: p.nombre, kind: p.tipo,
    valueType: p.origen, valuePath: p.valuePath || "", calcKey: p.calcKey || "",
    param: { type: "", scope: "", key: "" }, taxable: p.taxable,
    prorate: p.prorate, active: true, order: p.order,
  };
  syncSelectorsFromEdit();
}

function syncSelectorsFromEdit() {
  if (edit.value.valueType === "PATH") {
    const known = contractFieldOptions.some((o) => o.value === edit.value.valuePath);
    pathChoice.value = known ? edit.value.valuePath : "__CUSTOM__";
  } else pathChoice.value = null;
  if (edit.value.valueType === "CALC") {
    const known = calcPresetOptions.some((o) => o.value === edit.value.calcKey);
    calcChoice.value = known ? edit.value.calcKey : "__CUSTOM__";
  } else calcChoice.value = null;
  if (edit.value.valueType === "PARAM") {
    const key = (edit.value.param?.key || "").toUpperCase();
    paramChoice.value = key === "UF" ? "UF__COMPANY" : key === "MIN_WAGE" ? "MIN_WAGE__COMPANY" : "__CUSTOM__";
  } else paramChoice.value = null;
}

watch(() => edit.value.valueType, () => {
  if (edit.value.valueType !== "PATH")  edit.value.valuePath = "";
  if (edit.value.valueType !== "CALC")  edit.value.calcKey = "";
  if (edit.value.valueType !== "PARAM") edit.value.param = { type: "", scope: "", key: "" };
  syncSelectorsFromEdit();
});
watch(pathChoice,  (v) => { if (edit.value.valueType === "PATH"  && v && v !== "__CUSTOM__") edit.value.valuePath = v; });
watch(calcChoice,  (v) => { if (edit.value.valueType === "CALC"  && v && v !== "__CUSTOM__") edit.value.calcKey   = v; });
watch(paramChoice, (v) => {
  if (edit.value.valueType !== "PARAM") return;
  if (v === "UF__COMPANY")       edit.value.param = { type: "MONEY", scope: "COMPANY", key: "UF" };
  else if (v === "MIN_WAGE__COMPANY") edit.value.param = { type: "MONEY", scope: "COMPANY", key: "MIN_WAGE" };
});

// ── LOAD ──
async function reload() {
  await Promise.allSettled([
    store.fetchConcepts(props.companyId),
    store.fetchTemplates(),
    store.validateCompanyPayroll(props.companyId),
  ]);
}
onMounted(reload);

// ── TEMPLATE ──
async function applyTemplate() {
  try {
    await store.applyTemplate({ companyId: props.companyId, templateId: templateId.value, mode: applyMode.value });
    await store.validateCompanyPayroll(props.companyId);
    showTemplatePanel.value = false;
    $q.notify({ type: "positive", message: "Plantilla aplicada correctamente", position: "top" });
  } catch (e) {
    $q.notify({ type: "negative", message: e?.message || "Error aplicando plantilla", position: "top" });
  }
}

async function validate() {
  try {
    await store.validateCompanyPayroll(props.companyId);
    $q.notify({
      type: store.validation?.ok ? "positive" : "warning",
      message: store.validation?.ok ? "Configuración lista para liquidar" : "Aún faltan conceptos obligatorios",
      position: "top",
    });
  } catch (e) {
    $q.notify({ type: "negative", message: e?.message || "Error revisando mínimos", position: "top" });
  }
}

// ── PATCHES ──
function queuePatch(row, patch) {
  const id  = row._id;
  const idx = patches.value.findIndex((p) => p._id === id);
  if (idx === -1) patches.value.push({ _id: id, ...patch });
  else patches.value[idx] = { ...patches.value[idx], ...patch };
}
function discardPatches() { patches.value = []; store.fetchConcepts(props.companyId); }
async function saveBulk() {
  try {
    await store.bulkUpdate({ companyId: props.companyId, patches: patches.value });
    patches.value = [];
    await store.validateCompanyPayroll(props.companyId);
    $q.notify({ type: "positive", message: "Cambios guardados", position: "top" });
  } catch (e) {
    $q.notify({ type: "negative", message: e?.message || "Error guardando", position: "top" });
  }
}

// ── DIALOG CRUD ──
function openCreate() {
  editingId.value = null; selectedPreset.value = null; dlgTab.value = "catalogo";
  edit.value = {
    code: "", name: "", kind: "EARNING", valueType: "PATH",
    valuePath: "baseSalary", param: { type: "", scope: "", key: "" },
    calcKey: "", taxable: true, prorate: false, active: true, order: 100,
  };
  syncSelectorsFromEdit();
  dlg.value = true;
}
function openEdit(row) {
  editingId.value = row._id;
  edit.value = JSON.parse(JSON.stringify(row));
  edit.value.param = edit.value.param || { type: "", scope: "", key: "" };
  syncSelectorsFromEdit();
  dlg.value = true;
}
async function saveOne() {
  if (!edit.value.code?.trim() || !edit.value.name?.trim())
    return $q.notify({ type: "warning", message: "Código y nombre son requeridos", position: "top" });
  if (edit.value.valueType === "PATH" && !edit.value.valuePath)
    return $q.notify({ type: "warning", message: "Selecciona un campo del contrato", position: "top" });
  if (edit.value.valueType === "CALC" && !edit.value.calcKey)
    return $q.notify({ type: "warning", message: "Selecciona un cálculo automático", position: "top" });
  if (edit.value.valueType === "PARAM" && (!edit.value.param?.type || !edit.value.param?.scope || !edit.value.param?.key))
    return $q.notify({ type: "warning", message: "Completa todos los campos del parámetro", position: "top" });
  try {
    await store.upsertConcept({ companyId: props.companyId, concept: edit.value });
    dlg.value = false;
    await store.validateCompanyPayroll(props.companyId);
    $q.notify({ type: "positive", message: editingId.value ? "Concepto actualizado" : "Concepto creado", position: "top" });
  } catch (e) {
    $q.notify({ type: "negative", message: e?.message || "Error guardando concepto", position: "top" });
  }
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

/* ──────────────────────────── TOKENS ── */
.rk-wrap {
  --c-ink:            #0f172a;
  --c-ink-2:          #334155;
  --c-ink-3:          #64748b;
  --c-ink-4:          #94a3b8;
  --c-surface:        #ffffff;
  --c-surface-2:      #f8fafc;
  --c-surface-3:      #f1f5f9;
  --c-border:         #e2e8f0;
  --c-border-strong:  #cbd5e1;
  --c-accent:         #1e40af;
  --c-accent-hover:   #1d3a9e;
  --c-accent-soft:    #eff6ff;
  --c-accent-mid:     #bfdbfe;
  --c-earn:           #166534;
  --c-earn-bg:        #f0fdf4;
  --c-earn-border:    #bbf7d0;
  --c-deduct:         #991b1b;
  --c-deduct-bg:      #fff1f2;
  --c-deduct-border:  #fecdd3;
  --c-warn:           #92400e;
  --c-warn-bg:        #fffbeb;
  --c-warn-border:    #fde68a;
  --c-ok:             #14532d;
  --c-ok-bg:          #f0fdf4;
  --c-ok-border:      #bbf7d0;

  font-family: "Inter", -apple-system, sans-serif;
  padding: 20px;
  padding-bottom: 100px;
  background: var(--c-surface-2);
  min-height: 100vh;
  color: var(--c-ink);
}

/* ──────────────────────────── HEADER ── */
.rk-top {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
}
.rk-title       { display: flex; gap: 11px; align-items: center; }
.rk-title-icon  {
  width: 40px; height: 40px; border-radius: 10px;
  background: var(--c-surface); border: 1px solid var(--c-border);
  display: flex; align-items: center; justify-content: center;
  color: var(--c-ink-2); flex-shrink: 0;
}
.rk-h1          { font-size: 1.1rem; font-weight: 700; color: var(--c-ink); line-height: 1.25; letter-spacing: -0.01em; }
.rk-h2          { margin-top: 2px; color: var(--c-ink-3); font-size: 0.8rem; }
.rk-state {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 11px; border-radius: 999px; font-weight: 600;
  font-size: 0.79rem; border: 1px solid; white-space: nowrap;
}
.rk-state.ok   { background: var(--c-ok-bg);   color: var(--c-ok);   border-color: var(--c-ok-border); }
.rk-state.warn { background: var(--c-warn-bg); color: var(--c-warn); border-color: var(--c-warn-border); }

/* ──────────────────────────── ERROR BANNER ── */
.rk-banner { margin-bottom: 14px; }
.rk-banner--error { background: var(--c-deduct-bg); }

/* ──────────────────────────── ALERTA LEGAL ── */
.rk-alert-legal {
  background: var(--c-warn-bg); border: 1px solid var(--c-warn-border);
  border-radius: 10px; padding: 13px 15px; margin-bottom: 16px;
}
.rk-alert-legal-header {
  display: flex; gap: 9px; align-items: flex-start;
  margin-bottom: 10px; flex-wrap: wrap;
}
.rk-alert-legal-icon  { color: var(--c-warn); flex-shrink: 0; margin-top: 1px; }
.rk-alert-legal-body  { flex: 1; min-width: 140px; }
.rk-alert-legal-title { font-weight: 700; color: var(--c-warn); font-size: 0.86rem; }
.rk-alert-legal-sub   { color: var(--c-warn); opacity: 0.8; font-size: 0.8rem; margin-top: 1px; }
.rk-alert-items       { display: flex; flex-direction: column; gap: 5px; }
.rk-alert-item {
  display: flex; align-items: center; gap: 9px;
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 7px; padding: 8px 11px; flex-wrap: wrap;
}
.rk-alert-emoji     { font-size: 16px; flex-shrink: 0; }
.rk-alert-item-text { flex: 1; font-size: 0.82rem; color: var(--c-ink-2); min-width: 120px; }
.rk-btn-warn    { background: rgba(146,64,14,0.08) !important; color: var(--c-warn) !important; border: 1px solid var(--c-warn-border) !important; font-size: 0.79rem !important; font-weight: 600 !important; }
.rk-btn-warn-sm { background: transparent !important; color: var(--c-warn) !important; border: 1px solid var(--c-warn-border) !important; font-size: 0.77rem !important; font-weight: 600 !important; }

/* ──────────────────────────── STATS ── */
.rk-stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 8px; margin-bottom: 16px;
}
.rk-stat {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 10px; padding: 12px; text-align: center;
}
.rk-stat-num   { font-size: 1.45rem; font-weight: 800; color: var(--c-ink); line-height: 1; }
.rk-stat-icon  { color: var(--c-ink-3); }
.rk-stat-label { font-size: 0.68rem; color: var(--c-ink-3); margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.rk-stat--earn   .rk-stat-num  { color: var(--c-earn); }
.rk-stat--deduct .rk-stat-num  { color: var(--c-deduct); }
.rk-stat--ok   { background: var(--c-ok-bg);   border-color: var(--c-ok-border); }
.rk-stat--ok   .rk-stat-icon  { color: var(--c-ok); }
.rk-stat--warn { background: var(--c-warn-bg); border-color: var(--c-warn-border); }
.rk-stat--warn .rk-stat-icon  { color: var(--c-warn); }

/* ──────────────────────────── TOOLBAR ── */
.rk-toolbar {
  display: flex; gap: 8px; align-items: center;
  margin-bottom: 12px; flex-wrap: wrap;
}
.rk-search { flex: 1; min-width: 180px; }
.rk-toolbar-actions { display: flex; gap: 7px; flex-wrap: wrap; margin-left: auto; align-items: center; }
.rk-btn-ghost { color: var(--c-ink-2) !important; border: 1px solid var(--c-border) !important; border-radius: 7px !important; font-weight: 500 !important; font-size: 0.82rem !important; }
.rk-btn-ghost--active { background: var(--c-accent-soft) !important; border-color: var(--c-accent-mid) !important; color: var(--c-accent) !important; }

/* ──────────────────────────── PANEL PLANTILLA ── */
.rk-template-panel {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 10px; padding: 14px 16px; margin-bottom: 14px;
}
.rk-template-panel-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
}
.rk-card-title { display: flex; align-items: center; gap: 7px; font-weight: 600; font-size: 0.86rem; color: var(--c-ink-2); }
.rk-template-body { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; }
.rk-tpl-field  { flex: 1; min-width: 150px; }

/* ──────────────────────────── TABLA ── */
.rk-table-wrap {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 12px; overflow: hidden;
}
.rk-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
.rk-table thead tr { background: var(--c-surface-2); border-bottom: 1px solid var(--c-border); }
.rk-table th {
  padding: 9px 11px; text-align: left;
  font-size: 0.67rem; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase; color: var(--c-ink-3);
}
.col-toggle  { width: 48px; }
.col-code    { width: 110px; }
.col-flag    { width: 76px; }
.col-order   { width: 72px; }
.col-actions { width: 72px; }

.rk-table tbody tr { border-bottom: 1px solid var(--c-border); transition: background 0.1s; }
.rk-table tbody tr:last-child { border-bottom: none; }
.rk-table tbody tr:hover { background: var(--c-surface-2); }
.rk-table td { padding: 8px 11px; vertical-align: middle; }

.rk-row--inactive { opacity: 0.45; }
.rk-row--patched  { background: rgba(30, 64, 175, 0.03) !important; }

.rk-empty {
  padding: 52px; text-align: center; color: var(--c-ink-4);
  font-size: 0.85rem; line-height: 1.8;
}
.rk-code {
  font-family: "SFMono-Regular", Consolas, monospace; font-size: 0.73rem;
  font-weight: 600; background: var(--c-surface-3); border-radius: 4px;
  padding: 2px 6px; color: var(--c-ink-2); border: 1px solid var(--c-border);
  white-space: nowrap;
}
.rk-row-name          { font-weight: 600; color: var(--c-ink); line-height: 1.3; }
.rk-row-inactive-label { font-size: 0.68rem; color: var(--c-ink-4); margin-top: 2px; }
.rk-hint-sub          { font-size: 0.69rem; color: var(--c-ink-4); margin-top: 2px; }

.rk-badge {
  display: inline-flex; align-items: center; font-size: 0.7rem;
  font-weight: 700; padding: 2px 7px; border-radius: 4px; white-space: nowrap; letter-spacing: 0.01em;
}
.rk-badge--earn    { background: var(--c-earn-bg);   color: var(--c-earn);   border: 1px solid var(--c-earn-border); }
.rk-badge--deduct  { background: var(--c-deduct-bg); color: var(--c-deduct); border: 1px solid var(--c-deduct-border); }
.rk-badge--neutral { background: var(--c-surface-3); color: var(--c-ink-2);  border: 1px solid var(--c-border); }

.rk-bool { display: inline-flex; align-items: center; gap: 3px; font-weight: 600; font-size: 0.78rem; }
.rk-bool.yes { color: var(--c-earn); }
.rk-bool.no  { color: var(--c-ink-4); }

.rk-row-actions { display: flex; align-items: center; gap: 1px; justify-content: flex-end; }
.rk-btn-delete { color: var(--c-ink-4) !important; transition: color 0.12s, background 0.12s !important; }
.rk-btn-delete:hover { color: var(--c-deduct) !important; background: var(--c-deduct-bg) !important; }

/* ──────────────────────────── ONBOARDING ── */
.rk-onboarding {
  background: var(--c-surface); border: 1px solid var(--c-border);
  border-radius: 16px; padding: 40px 28px;
  display: flex; flex-direction: column; align-items: center;
  gap: 24px; max-width: 800px; margin: 0 auto;
}
.rk-onboarding-head   { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
.rk-onboarding-icon-wrap {
  width: 56px; height: 56px; border-radius: 14px;
  background: var(--c-surface-3); border: 1px solid var(--c-border);
  display: flex; align-items: center; justify-content: center; color: var(--c-ink-2);
}
.rk-onboarding-title  { font-size: 1.15rem; font-weight: 700; color: var(--c-ink); letter-spacing: -0.01em; }
.rk-onboarding-sub    { color: var(--c-ink-3); font-size: 0.87rem; line-height: 1.65; max-width: 500px; }
.rk-onboarding-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; width: 100%; }
.rk-onboarding-card {
  border: 1px solid var(--c-border); border-radius: 12px; padding: 20px;
  display: flex; flex-direction: column; gap: 14px; background: var(--c-surface-2);
  position: relative; min-height: 200px;
}
.rk-onboarding-card--featured { border-color: var(--c-accent-mid); background: var(--c-accent-soft); }
.rk-onboarding-card-badge {
  position: absolute; top: -1px; right: 14px;
  background: var(--c-accent); color: #fff; font-size: 0.63rem;
  font-weight: 700; padding: 3px 9px; border-radius: 0 0 6px 6px;
  letter-spacing: 0.07em; text-transform: uppercase;
}
.rk-onboarding-card-header { display: flex; gap: 10px; align-items: flex-start; }
.rk-onboarding-card-icon   { color: var(--c-ink-2); flex-shrink: 0; margin-top: 1px; }
.rk-onboarding-card-title  { font-weight: 700; font-size: 0.92rem; color: var(--c-ink); line-height: 1.3; }
.rk-onboarding-card-desc   { color: var(--c-ink-3); font-size: 0.82rem; line-height: 1.55; margin-top: 3px; }
.rk-onboarding-form        { display: flex; flex-direction: column; gap: 10px; }
.rk-onboarding-legend {
  display: flex; gap: 16px; flex-wrap: wrap; align-items: center;
  justify-content: center; font-size: 0.79rem; color: var(--c-ink-3);
  border-top: 1px solid var(--c-border); padding-top: 16px; width: 100%;
}
.rk-legend-item { display: flex; gap: 7px; align-items: center; }
.rk-legend-sep  { color: var(--c-border-strong); font-size: 1.1rem; }

/* ──────────────────────────── SAVE BAR ── */
.rk-savebar {
  position: fixed; left: 16px; right: 16px; bottom: 16px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 11px 16px; border-radius: 12px;
  background: var(--c-surface); border: 1px solid var(--c-border-strong);
  box-shadow: 0 4px 24px rgba(15,23,42,0.10); z-index: 9999;
  backdrop-filter: blur(10px); flex-wrap: wrap;
}
.rk-savebar-left  { display: flex; align-items: center; gap: 10px; }
.rk-savebar-right { display: flex; align-items: center; gap: 8px; }
.rk-savebar-dot   { width: 8px; height: 8px; border-radius: 50%; background: var(--c-accent); flex-shrink: 0; animation: rk-pulse 1.6s ease-in-out infinite; }
@keyframes rk-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.rk-savebar-title { font-weight: 700; font-size: 0.86rem; color: var(--c-ink); }
.rk-savebar-anim-enter-active, .rk-savebar-anim-leave-active { transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1); }
.rk-savebar-anim-enter-from, .rk-savebar-anim-leave-to { transform: translateY(80px); opacity: 0; }

/* ──────────────────────────── DIALOGS ── */
.rk-dlg    { width: 760px; max-width: 94vw; border-radius: 16px !important; overflow: hidden; }
.rk-dlg-sm { width: 440px; max-width: 92vw; border-radius: 14px !important; overflow: hidden; }
.rk-dlg-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 18px 20px 14px; border-bottom: 1px solid var(--c-border);
}
.rk-dlg-header-left { display: flex; gap: 11px; align-items: center; }
.rk-dlg-icon {
  width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.rk-dlg-icon--create { background: var(--c-accent-soft); color: var(--c-accent); border: 1px solid var(--c-accent-mid); }
.rk-dlg-icon--edit   { background: var(--c-surface-3);   color: var(--c-ink-2);  border: 1px solid var(--c-border); }
.rk-dlg-icon--delete { background: var(--c-deduct-bg);   color: var(--c-deduct); border: 1px solid var(--c-deduct-border); }
.rk-dlg-title        { font-weight: 700; font-size: 0.98rem; color: var(--c-ink); }
.rk-dlg-footer       { border-top: 1px solid var(--c-border); }
.rk-tabs             { border-bottom: 1px solid var(--c-border); margin-bottom: 2px; }

/* ──────────────────────────── CATÁLOGO ── */
.rk-cat-title {
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--c-ink-3); margin-bottom: 6px;
}
.rk-preset-grid { display: flex; flex-direction: column; gap: 4px; }
.rk-preset-card {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border: 1px solid var(--c-border); border-radius: 9px; cursor: pointer;
  transition: border-color 0.12s, background 0.12s; background: var(--c-surface-2);
}
.rk-preset-card:hover:not(.rk-preset-card--added) { border-color: var(--c-accent-mid); background: var(--c-accent-soft); }
.rk-preset-card--active { border-color: var(--c-accent) !important; background: var(--c-accent-soft) !important; box-shadow: 0 0 0 2px var(--c-accent-mid); }
.rk-preset-card--added  { opacity: 0.5; cursor: default; }
.rk-preset-emoji  { font-size: 19px; flex-shrink: 0; }
.rk-preset-info   { flex: 1; min-width: 0; }
.rk-preset-name   { font-weight: 600; font-size: 0.84rem; display: flex; align-items: center; flex-wrap: wrap; gap: 5px; }
.rk-tag           { font-size: 0.65rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; border: 1px solid; }
.rk-tag--warn     { background: var(--c-warn-bg); color: var(--c-warn); border-color: var(--c-warn-border); }
.rk-tag--muted    { background: var(--c-surface-3); color: var(--c-ink-3); border-color: var(--c-border); }

.rk-preview-box {
  background: var(--c-ok-bg); border: 1px solid var(--c-ok-border);
  border-radius: 9px; padding: 12px;
}
.rk-preview-title { font-weight: 600; color: var(--c-ok); font-size: 0.8rem; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; }

/* ──────────────────────────── FORM MANUAL / EDIT ── */
.rk-manual-form, .rk-edit-form { display: flex; flex-direction: column; gap: 14px; }
.rk-source-box {
  background: var(--c-surface-2); border: 1px solid var(--c-border);
  border-radius: 9px; padding: 12px; display: flex; flex-direction: column; gap: 10px;
}
.rk-source-title { font-weight: 600; font-size: 0.8rem; color: var(--c-ink-2); }

/* ──────────────────────────── ELIMINAR DIALOG ── */
.rk-delete-card {
  display: flex; gap: 12px; align-items: center;
  background: var(--c-surface-2); border: 1px solid var(--c-border);
  border-radius: 9px; padding: 12px 14px;
}
.rk-delete-name { font-weight: 700; font-size: 0.92rem; color: var(--c-ink); }
.rk-delete-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; }
.rk-delete-warning {
  display: flex; gap: 7px; align-items: flex-start; font-size: 0.79rem;
  border: 1px solid; border-radius: 8px; padding: 8px 11px; line-height: 1.55;
  color: var(--c-warn); background: var(--c-warn-bg); border-color: var(--c-warn-border);
}
.rk-delete-warning--neutral {
  color: var(--c-ink-3);
  background: var(--c-surface-2);
  border-color: var(--c-border);
}

/* ──────────────────────────── UTILS ── */
.rk-muted { color: var(--c-ink-3); }
.rk-small { font-size: 0.78rem; }

/* ──────────────────────────── TRANSITIONS ── */
.rk-slide-enter-active, .rk-slide-leave-active { transition: all 0.18s ease; max-height: 400px; overflow: hidden; }
.rk-slide-enter-from, .rk-slide-leave-to { opacity: 0; transform: translateY(-6px); max-height: 0; }

/* ──────────────────────────── DARK MODE ── */
.body--dark .rk-wrap {
  --c-ink:           #e2e8f0;
  --c-ink-2:         #cbd5e1;
  --c-ink-3:         #94a3b8;
  --c-ink-4:         #64748b;
  --c-surface:       #0f172a;
  --c-surface-2:     #1e293b;
  --c-surface-3:     #263247;
  --c-border:        rgba(255,255,255,0.09);
  --c-border-strong: rgba(255,255,255,0.16);
  --c-accent-soft:   rgba(30,64,175,0.18);
  --c-accent-mid:    rgba(96,165,250,0.35);
  --c-earn-bg:       rgba(22,101,52,0.15);
  --c-earn-border:   rgba(34,197,94,0.25);
  --c-deduct-bg:     rgba(153,27,27,0.15);
  --c-deduct-border: rgba(239,68,68,0.25);
  --c-warn-bg:       rgba(146,64,14,0.15);
  --c-warn-border:   rgba(245,158,11,0.3);
  --c-ok-bg:         rgba(20,83,45,0.15);
  --c-ok-border:     rgba(34,197,94,0.25);
  background: #060c18;
}

/* ──────────────────────────── RESPONSIVE ── */
@media (max-width: 720px) {
  .rk-stats           { grid-template-columns: repeat(2, 1fr); }
  .rk-onboarding-grid { grid-template-columns: 1fr; }
  .rk-toolbar-actions { width: 100%; justify-content: flex-end; }
  .rk-table th.col-flag, .rk-table td.col-flag { display: none; }
}
@media (max-width: 500px) {
  .rk-wrap            { padding: 12px; padding-bottom: 100px; }
  .rk-savebar         { flex-direction: column; align-items: stretch; }
  .rk-savebar-right   { justify-content: flex-end; }
  .rk-template-body   { flex-direction: column; }
  .rk-onboarding      { padding: 24px 16px; }
  .rk-legend-sep      { display: none; }
  .rk-onboarding-legend { flex-direction: column; align-items: flex-start; gap: 8px; }
}
</style>