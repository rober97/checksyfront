<template>
  <q-page class="q-pa-md" :class="pageBgClass">
    <!-- HEADER MEJORADO CON SELECTOR DE EMPRESA -->
    <div class="payroll-header q-mb-lg">
      <div class="row items-center justify-between q-mb-md">
        <div class="col-12 col-md-auto">
          <h1 class="text-h4 q-mb-xs q-mt-none" :class="isDark ? 'text-white' : 'text-grey-9'">
            <q-icon name="account_balance_wallet" size="32px" class="q-mr-sm" />
            Gestión de Liquidaciones
          </h1>
          <p class="text-body2 q-mb-none" :class="isDark ? 'text-grey-4' : 'text-grey-7'">
            Administra el proceso completo de liquidación de sueldos de forma eficiente
          </p>
        </div>

        <div class="col-12 col-md-auto q-mt-md q-mt-md-none">
          <div class="row q-gutter-sm items-center">
            <q-btn-toggle
              v-model="mode"
              dense
              rounded
              unelevated
              size="md"
              :toggle-color="isDark ? 'primary' : 'primary'"
              :text-color="isDark ? 'grey-4' : 'grey-7'"
              :class="isDark ? 'bg-grey-9' : 'bg-grey-3'"
              :options="[
                { label: 'Períodos', icon: 'calendar_month', value: 'periods', slot: 'periods' },
                { label: 'Empleados', icon: 'people', value: 'detail', slot: 'detail' }
              ]"
            >
              <template #periods>
                <div class="row items-center no-wrap q-px-sm">
                  <q-icon name="calendar_month" size="20px" class="q-mr-xs" />
                  <span>Períodos</span>
                </div>
              </template>
              <template #detail>
                <div class="row items-center no-wrap q-px-sm">
                  <q-icon name="people" size="20px" class="q-mr-xs" />
                  <span>Empleados</span>
                </div>
              </template>
            </q-btn-toggle>

            <q-btn
              outline
              :color="isDark ? 'grey-4' : 'primary'"
              icon="refresh"
              label="Actualizar"
              no-caps
              size="md"
              :loading="store.loading"
              @click="reload"
            >
              <q-tooltip>Recargar información</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- SELECTOR DE EMPRESA CON INFORMACIÓN -->
      <q-card 
        flat 
        bordered 
        class="company-selector-card"
        :class="isDark ? 'bg-grey-9' : 'bg-white'"
      >
        <q-card-section class="q-pa-md">
          <div class="row items-center q-col-gutter-md">
            <div class="col-12 col-md-5">
              <label class="text-caption text-weight-medium q-mb-xs block" :class="isDark ? 'text-grey-4' : 'text-grey-7'">
                <q-icon name="business" size="16px" class="q-mr-xs" />
                Seleccionar empresa
              </label>
              <q-select
                v-model="selectedCompany"
                :options="companyOptions"
                option-value="_id"
                option-label="name"
                emit-value
                map-options
                outlined
                dense
                :color="isDark ? 'primary' : 'primary'"
                :bg-color="isDark ? 'grey-10' : 'white'"
                :loading="companiesStore.loading"
                :disable="companiesStore.loading"
                @update:model-value="onCompanyChange"
              >
                <template #prepend>
                  <q-avatar size="32px" square>
                    <img v-if="currentCompanyData?.logo" :src="currentCompanyData.logo" alt="logo" />
                    <q-icon v-else name="apartment" :color="isDark ? 'grey-5' : 'grey-7'" />
                  </q-avatar>
                </template>

                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-avatar size="32px" square>
                        <img v-if="scope.opt.logo" :src="scope.opt.logo" alt="logo" />
                        <q-icon v-else name="apartment" color="grey-7" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.name }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.rut || 'Sin RUT' }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge 
                        :color="companyStatusColor(scope.opt.status)" 
                        :label="companyStatusLabel(scope.opt.status)"
                        outline
                      />
                    </q-item-section>
                  </q-item>
                </template>

                <template #no-option>
                  <q-item>
                    <q-item-section class="text-center">
                      <q-item-label>No hay empresas disponibles</q-item-label>
                      <q-item-label caption>Crea una empresa primero</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div v-if="currentCompanyData" class="col-12 col-md-7">
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-4">
                  <q-card flat :class="isDark ? 'bg-grey-10' : 'bg-blue-1'">
                    <q-card-section class="q-pa-sm text-center">
                      <q-icon name="group" size="24px" :color="isDark ? 'blue-4' : 'blue-7'" />
                      <div class="text-caption q-mt-xs" :class="isDark ? 'text-grey-5' : 'text-grey-7'">
                        Empleados
                      </div>
                      <div class="text-h6 text-weight-bold">{{ currentCompanyData.employeeCount || 0 }}</div>
                    </q-card-section>
                  </q-card>
                </div>
                <div class="col-12 col-sm-4">
                  <q-card flat :class="isDark ? 'bg-grey-10' : 'bg-green-1'">
                    <q-card-section class="q-pa-sm text-center">
                      <q-icon name="event" size="24px" :color="isDark ? 'green-4' : 'green-7'" />
                      <div class="text-caption q-mt-xs" :class="isDark ? 'text-grey-5' : 'text-grey-7'">
                        Períodos
                      </div>
                      <div class="text-h6 text-weight-bold">{{ periodRows.length }}</div>
                    </q-card-section>
                  </q-card>
                </div>
                <div class="col-12 col-sm-4">
                  <q-card flat :class="isDark ? 'bg-grey-10' : 'bg-orange-1'">
                    <q-card-section class="q-pa-sm text-center">
                      <q-icon name="pending_actions" size="24px" :color="isDark ? 'orange-4' : 'orange-7'" />
                      <div class="text-caption q-mt-xs" :class="isDark ? 'text-grey-5' : 'text-grey-7'">
                        Pendientes
                      </div>
                      <div class="text-h6 text-weight-bold">{{ countBy('DRAFT') }}</div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- =========================
         VISTA 1: PERIODOS
         ========================= -->
    <transition
      appear
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
      mode="out-in"
    >
      <div v-if="mode === 'periods'" key="periods">
        <q-card flat bordered class="payroll-card">
          <q-card-section>
            <!-- Controles de período -->
            <div class="row q-col-gutter-md items-end q-mb-lg">
              <div class="col-12 col-md-4">
                <label class="text-caption text-weight-medium q-mb-xs block" :class="isDark ? 'text-grey-4' : 'text-grey-7'">
                  Seleccionar período
                </label>
                <q-input
                  dense
                  outlined
                  v-model="periodInput"
                  placeholder="YYYY-MM"
                  mask="####-##"
                  :color="isDark ? 'primary' : 'primary'"
                  :bg-color="isDark ? 'grey-9' : 'white'"
                  class="period-input"
                >
                  <template #prepend>
                    <q-icon name="event" :color="isDark ? 'grey-5' : 'grey-7'" />
                  </template>
                  <template #append>
                    <q-btn
                      flat
                      dense
                      round
                      icon="calendar_today"
                      size="sm"
                      :color="isDark ? 'primary' : 'primary'"
                    >
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date 
                          v-model="periodInput" 
                          mask="YYYY-MM" 
                          minimal
                          :color="isDark ? 'primary' : 'primary'"
                        >
                          <div class="row items-center justify-end q-pa-sm">
                            <q-btn v-close-popup label="Seleccionar" color="primary" unelevated no-caps size="sm" />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-btn>
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-5">
                <q-banner
                  rounded
                  dense
                  class="info-banner"
                  :class="isDark ? 'bg-blue-9 text-blue-2' : 'bg-blue-1 text-blue-9'"
                >
                  <template #avatar>
                    <q-icon name="lightbulb" color="blue" size="24px" />
                  </template>
                  <div class="text-caption">
                    <strong>Tip:</strong> Genera borradores al finalizar el mes. La emisión debe ser revisada y confirmada manualmente.
                  </div>
                </q-banner>
              </div>

              <div class="col-12 col-md-3">
                <q-btn
                  unelevated
                  :color="isDark ? 'primary' : 'primary'"
                  icon="bolt"
                  label="Generar borradores"
                  no-caps
                  size="md"
                  class="full-width"
                  :loading="store.loading"
                  :disable="!isValidPeriod(periodInput)"
                  @click="generatePeriod"
                >
                  <q-tooltip v-if="!isValidPeriod(periodInput)">
                    Ingresa un período válido (YYYY-MM)
                  </q-tooltip>
                </q-btn>
              </div>
            </div>

            <!-- Stats Cards -->
            <div class="row q-col-gutter-md q-mb-lg">
              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="stat-card" :class="isDark ? 'bg-grey-9' : 'bg-grey-1'">
                  <q-card-section class="q-pa-md">
                    <div class="row items-center">
                      <q-icon name="folder" size="32px" :color="isDark ? 'blue-4' : 'blue-6'" class="q-mr-md" />
                      <div>
                        <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-6'">
                          Total períodos
                        </div>
                        <div class="text-h5 text-weight-bold">{{ periodRows.length }}</div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="stat-card" :class="isDark ? 'bg-grey-9' : 'bg-grey-1'">
                  <q-card-section class="q-pa-md">
                    <div class="row items-center">
                      <q-icon name="edit_note" size="32px" :color="isDark ? 'orange-4' : 'orange-6'" class="q-mr-md" />
                      <div>
                        <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-6'">
                          En borrador
                        </div>
                        <div class="text-h5 text-weight-bold">{{ countPeriodStatus('DRAFT') }}</div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="stat-card" :class="isDark ? 'bg-grey-9' : 'bg-grey-1'">
                  <q-card-section class="q-pa-md">
                    <div class="row items-center">
                      <q-icon name="check_circle" size="32px" :color="isDark ? 'green-4' : 'green-6'" class="q-mr-md" />
                      <div>
                        <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-6'">
                          Publicados
                        </div>
                        <div class="text-h5 text-weight-bold">{{ countPeriodStatus('PUBLISHED') }}</div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="stat-card" :class="isDark ? 'bg-grey-9' : 'bg-grey-1'">
                  <q-card-section class="q-pa-md">
                    <div class="row items-center">
                      <q-icon name="lock" size="32px" :color="isDark ? 'grey-5' : 'grey-6'" class="q-mr-md" />
                      <div>
                        <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-6'">
                          Cerrados
                        </div>
                        <div class="text-h5 text-weight-bold">{{ countPeriodStatus('CLOSED') }}</div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <!-- Tabla de períodos -->
            <q-table
              flat
              bordered
              :rows="periodRows"
              :columns="periodColumns"
              row-key="period"
              :loading="store.loading"
              :rows-per-page-options="[10, 25, 50]"
              :pagination="{ rowsPerPage: 10 }"
              :class="['modern-table', isDark ? 'dark-table' : 'light-table']"
              no-data-label="No hay períodos generados"
              loading-label="Cargando períodos..."
            >
              <template #body-cell-period="props">
                <q-td :props="props">
                  <div class="row items-center">
                    <q-icon name="calendar_today" size="20px" class="q-mr-sm" :color="isDark ? 'primary' : 'primary'" />
                    <span class="text-weight-medium">{{ formatPeriodLabel(props.row.period) }}</span>
                  </div>
                </q-td>
              </template>

              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-badge
                    :color="periodStatusColor(props.row.status)"
                    :label="periodStatusLabel(props.row.status)"
                    class="status-badge"
                  />
                </q-td>
              </template>

              <template #body-cell-counts="props">
                <q-td :props="props">
                  <div class="row q-gutter-xs">
                    <q-chip
                      dense
                      square
                      :color="isDark ? 'grey-8' : 'grey-3'"
                      :text-color="isDark ? 'white' : 'grey-9'"
                      size="sm"
                      icon="description"
                    >
                      Total: {{ props.row.total || 0 }}
                    </q-chip>
                    <q-chip
                      v-if="(props.row.draft || 0) > 0"
                      dense
                      square
                      color="orange-2"
                      text-color="orange-9"
                      size="sm"
                      icon="edit_note"
                    >
                      Borrador: {{ props.row.draft }}
                    </q-chip>
                    <q-chip
                      v-if="(props.row.issued || 0) > 0"
                      dense
                      square
                      color="green-2"
                      text-color="green-9"
                      size="sm"
                      icon="check_circle"
                    >
                      Emitidas: {{ props.row.issued }}
                    </q-chip>
                  </div>
                </q-td>
              </template>

              <template #body-cell-actions="props">
                <q-td :props="props" class="text-right">
                  <q-btn
                    flat
                    dense
                    round
                    icon="open_in_new"
                    :color="isDark ? 'primary' : 'primary'"
                    size="sm"
                    @click="openPeriod(props.row.period)"
                  >
                    <q-tooltip>Ver liquidaciones del período</q-tooltip>
                  </q-btn>
                </q-td>
              </template>

              <template #loading>
                <q-inner-loading showing>
                  <div class="column items-center">
                    <q-spinner-gears size="50px" :color="isDark ? 'primary' : 'primary'" />
                    <div class="q-mt-md text-caption">Cargando períodos...</div>
                  </div>
                </q-inner-loading>
              </template>

              <template #no-data>
                <div class="full-width column items-center q-py-xl">
                  <q-icon name="event_busy" size="64px" :color="isDark ? 'grey-6' : 'grey-5'" />
                  <div class="text-h6 q-mt-md" :class="isDark ? 'text-grey-5' : 'text-grey-6'">
                    No hay períodos generados
                  </div>
                  <div class="text-caption q-mt-xs" :class="isDark ? 'text-grey-6' : 'text-grey-7'">
                    Genera tu primer período usando el botón superior
                  </div>
                </div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>

      <!-- =========================
           VISTA 2: DETALLE EMPLEADOS
           ========================= -->
      <div v-else key="detail">
        <q-card flat bordered class="payroll-card">
          <q-card-section>
            <!-- Controles y filtros -->
            <div class="row q-col-gutter-md items-end q-mb-lg">
              <div class="col-12 col-md-3">
                <label class="text-caption text-weight-medium q-mb-xs block" :class="isDark ? 'text-grey-4' : 'text-grey-7'">
                  Período
                </label>
                <q-input
                  dense
                  outlined
                  v-model="periodSelected"
                  placeholder="YYYY-MM"
                  mask="####-##"
                  :color="isDark ? 'primary' : 'primary'"
                  :bg-color="isDark ? 'grey-9' : 'white'"
                >
                  <template #prepend>
                    <q-icon name="event" :color="isDark ? 'grey-5' : 'grey-7'" />
                  </template>
                  <template #append>
                    <q-btn
                      flat
                      dense
                      round
                      icon="calendar_today"
                      size="sm"
                      :color="isDark ? 'primary' : 'primary'"
                    >
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date 
                          v-model="periodSelected" 
                          mask="YYYY-MM" 
                          minimal
                          :color="isDark ? 'primary' : 'primary'"
                        >
                          <div class="row items-center justify-end q-pa-sm">
                            <q-btn v-close-popup label="Seleccionar" color="primary" unelevated no-caps size="sm" />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-btn>
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-3">
                <label class="text-caption text-weight-medium q-mb-xs block" :class="isDark ? 'text-grey-4' : 'text-grey-7'">
                  Buscar empleado
                </label>
                <q-input
                  dense
                  outlined
                  v-model.trim="q"
                  debounce="300"
                  placeholder="Nombre o RUT..."
                  :color="isDark ? 'primary' : 'primary'"
                  :bg-color="isDark ? 'grey-9' : 'white'"
                  clearable
                >
                  <template #prepend>
                    <q-icon name="search" :color="isDark ? 'grey-5' : 'grey-7'" />
                  </template>
                </q-input>
              </div>

              <div class="col-12 col-md-2">
                <label class="text-caption text-weight-medium q-mb-xs block" :class="isDark ? 'text-grey-4' : 'text-grey-7'">
                  Estado
                </label>
                <q-select
                  dense
                  outlined
                  v-model="status"
                  :options="statusOptions"
                  emit-value
                  map-options
                  clearable
                  :color="isDark ? 'primary' : 'primary'"
                  :bg-color="isDark ? 'grey-9' : 'white'"
                  placeholder="Todos"
                >
                  <template #prepend>
                    <q-icon name="filter_list" :color="isDark ? 'grey-5' : 'grey-7'" />
                  </template>
                </q-select>
              </div>

              <div class="col-12 col-md-4">
                <div class="row q-gutter-sm justify-end">
                  <q-btn
                    outline
                    :color="isDark ? 'grey-4' : 'primary'"
                    icon="refresh"
                    label="Cargar"
                    no-caps
                    size="md"
                    :loading="store.loading"
                    @click="loadPayslips"
                  />
                  <q-btn
                    unelevated
                    color="positive"
                    icon="receipt_long"
                    label="Emitir seleccionados"
                    no-caps
                    size="md"
                    :disable="selected.length === 0"
                    :loading="issuingMany"
                    @click="issueSelected"
                  >
                    <q-badge v-if="selected.length > 0" color="red" floating>{{ selected.length }}</q-badge>
                  </q-btn>
                </div>
              </div>
            </div>

            <!-- KPIs mejorados -->
            <div class="row q-col-gutter-md q-mb-lg">
              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="stat-card stat-card-hover" :class="isDark ? 'bg-grey-9' : 'bg-grey-1'">
                  <q-card-section class="q-pa-md">
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-caption text-weight-medium q-mb-xs" :class="isDark ? 'text-grey-5' : 'text-grey-6'">
                          Total liquidaciones
                        </div>
                        <div class="text-h4 text-weight-bold" :class="isDark ? 'text-blue-4' : 'text-blue-7'">
                          {{ payslips.length }}
                        </div>
                      </div>
                      <q-icon name="description" size="48px" :color="isDark ? 'blue-4' : 'blue-3'" class="stat-icon" />
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="stat-card stat-card-hover" :class="isDark ? 'bg-grey-9' : 'bg-grey-1'">
                  <q-card-section class="q-pa-md">
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-caption text-weight-medium q-mb-xs" :class="isDark ? 'text-grey-5' : 'text-grey-6'">
                          Borradores
                        </div>
                        <div class="text-h4 text-weight-bold" :class="isDark ? 'text-orange-4' : 'text-orange-7'">
                          {{ countBy('DRAFT') }}
                        </div>
                        <div class="text-caption" :class="isDark ? 'text-grey-6' : 'text-grey-7'">
                          {{ ((countBy('DRAFT') / payslips.length) * 100 || 0).toFixed(0) }}% del total
                        </div>
                      </div>
                      <q-icon name="edit_note" size="48px" :color="isDark ? 'orange-4' : 'orange-3'" class="stat-icon" />
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="stat-card stat-card-hover" :class="isDark ? 'bg-grey-9' : 'bg-grey-1'">
                  <q-card-section class="q-pa-md">
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-caption text-weight-medium q-mb-xs" :class="isDark ? 'text-grey-5' : 'text-grey-6'">
                          Emitidas
                        </div>
                        <div class="text-h4 text-weight-bold" :class="isDark ? 'text-green-4' : 'text-green-7'">
                          {{ countBy('ISSUED') }}
                        </div>
                        <div class="text-caption" :class="isDark ? 'text-grey-6' : 'text-grey-7'">
                          {{ ((countBy('ISSUED') / payslips.length) * 100 || 0).toFixed(0) }}% del total
                        </div>
                      </div>
                      <q-icon name="check_circle" size="48px" :color="isDark ? 'green-4' : 'green-3'" class="stat-icon" />
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-sm-6 col-md-3">
                <q-card flat bordered class="stat-card stat-card-hover" :class="isDark ? 'bg-grey-9' : 'bg-grey-1'">
                  <q-card-section class="q-pa-md">
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-caption text-weight-medium q-mb-xs" :class="isDark ? 'text-grey-5' : 'text-grey-6'">
                          Total líquido
                        </div>
                        <div class="text-h5 text-weight-bold" :class="isDark ? 'text-white' : 'text-grey-9'">
                          {{ money(totalLiquido) }}
                        </div>
                        <div class="text-caption" :class="isDark ? 'text-grey-6' : 'text-grey-7'">
                          Suma de emitidas
                        </div>
                      </div>
                      <q-icon name="paid" size="48px" :color="isDark ? 'grey-6' : 'grey-4'" class="stat-icon" />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <!-- Tabla mejorada -->
            <q-table
              flat
              bordered
              :rows="payslips"
              :columns="payslipColumns"
              row-key="id"
              selection="multiple"
              v-model:selected="selected"
              :loading="store.loading"
              :rows-per-page-options="[10, 25, 50, 100]"
              :pagination="{ rowsPerPage: 25 }"
              :class="['modern-table', isDark ? 'dark-table' : 'light-table']"
              no-data-label="No hay liquidaciones para este período"
              loading-label="Cargando liquidaciones..."
            >
              <template #body-cell-employee="props">
                <q-td :props="props">
                  <div class="employee-cell">
                    <q-avatar size="32px" :color="isDark ? 'primary' : 'primary'" text-color="white" class="q-mr-sm">
                      {{ getInitials(props.row.employeeName) }}
                    </q-avatar>
                    <div>
                      <div class="text-weight-medium">{{ props.row.employeeName || '—' }}</div>
                      <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-6'">
                        {{ props.row.employeeRut || 'Sin RUT' }}
                      </div>
                    </div>
                  </div>
                </q-td>
              </template>

              <template #body-cell-days="props">
                <q-td :props="props">
                  <div class="column q-gutter-xs">
                    <div class="row items-center q-gutter-xs">
                      <q-icon name="event_available" size="16px" :color="isDark ? 'grey-5' : 'grey-6'" />
                      <span class="text-caption">Esperados: <strong>{{ props.row.daysExpected ?? 0 }}</strong></span>
                    </div>
                    <div class="row items-center q-gutter-xs">
                      <q-icon name="check_circle" size="16px" color="positive" />
                      <span class="text-caption">Pagados: <strong>{{ props.row.daysPaid ?? 0 }}</strong></span>
                    </div>
                    <div v-if="(props.row.daysAbsent ?? 0) > 0" class="row items-center q-gutter-xs">
                      <q-icon name="event_busy" size="16px" color="negative" />
                      <span class="text-caption">Ausencias: <strong>{{ props.row.daysAbsent }}</strong></span>
                    </div>
                  </div>
                </q-td>
              </template>

              <template #body-cell-totals="props">
                <q-td :props="props">
                  <div class="totals-cell">
                    <div class="text-weight-bold text-h6" :class="isDark ? 'text-green-4' : 'text-green-7'">
                      {{ money(props.row.totalNet) }}
                    </div>
                    <div class="text-caption q-mt-xs" :class="isDark ? 'text-grey-5' : 'text-grey-6'">
                      <span class="q-mr-sm">
                        <q-icon name="add_circle" size="14px" color="positive" />
                        {{ money(props.row.totalEarn) }}
                      </span>
                      <span>
                        <q-icon name="remove_circle" size="14px" color="negative" />
                        {{ money(props.row.totalDeduct) }}
                      </span>
                    </div>
                  </div>
                </q-td>
              </template>

              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-badge
                    :color="payslipStatusColor(props.row.status)"
                    :label="props.row.status"
                    class="status-badge"
                  >
                    <q-icon
                      :name="payslipStatusIcon(props.row.status)"
                      size="14px"
                      class="q-mr-xs"
                    />
                  </q-badge>
                </q-td>
              </template>

              <template #body-cell-actions="props">
                <q-td :props="props" class="text-right">
                  <q-btn-group flat>
                    <q-btn
                      flat
                      dense
                      round
                      icon="visibility"
                      :color="isDark ? 'primary' : 'primary'"
                      size="sm"
                      @click="openDetail(props.row)"
                    >
                      <q-tooltip>Ver detalle completo</q-tooltip>
                    </q-btn>

                    <q-btn
                      v-if="props.row.status === 'DRAFT'"
                      flat
                      dense
                      round
                      icon="receipt_long"
                      color="positive"
                      size="sm"
                      @click="issueOne(props.row)"
                    >
                      <q-tooltip>Emitir liquidación</q-tooltip>
                    </q-btn>

                    <q-btn
                      v-if="props.row.status === 'ISSUED'"
                      flat
                      dense
                      round
                      icon="picture_as_pdf"
                      color="red"
                      size="sm"
                      @click="openPdf(props.row)"
                    >
                      <q-tooltip>Descargar PDF</q-tooltip>
                    </q-btn>

                    <q-btn
                      v-if="props.row.status === 'ISSUED'"
                      flat
                      dense
                      round
                      icon="block"
                      color="negative"
                      size="sm"
                      @click="voidOne(props.row)"
                    >
                      <q-tooltip>Anular liquidación</q-tooltip>
                    </q-btn>
                  </q-btn-group>
                </q-td>
              </template>

              <template #loading>
                <q-inner-loading showing>
                  <div class="column items-center">
                    <q-spinner-gears size="50px" :color="isDark ? 'primary' : 'primary'" />
                    <div class="q-mt-md text-caption">Cargando liquidaciones...</div>
                  </div>
                </q-inner-loading>
              </template>

              <template #no-data>
                <div class="full-width column items-center q-py-xl">
                  <q-icon name="receipt_long" size="64px" :color="isDark ? 'grey-6' : 'grey-5'" />
                  <div class="text-h6 q-mt-md" :class="isDark ? 'text-grey-5' : 'text-grey-6'">
                    No hay liquidaciones
                  </div>
                  <div class="text-caption q-mt-xs" :class="isDark ? 'text-grey-6' : 'text-grey-7'">
                    Verifica el período seleccionado o genera nuevos borradores
                  </div>
                </div>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </transition>

    <!-- ====================================
         DIALOG DETALLE MEJORADO
         ==================================== -->
    <q-dialog v-model="dialogDetail" transition-show="slide-up" transition-hide="slide-down">
      <q-card style="min-width: 600px; max-width: 800px" :class="isDark ? 'bg-grey-9 text-white' : ''">
        <q-card-section class="row items-center q-pb-none">
          <div class="row items-center">
            <q-avatar size="48px" :color="isDark ? 'primary' : 'primary'" text-color="white" class="q-mr-md">
              {{ getInitials(current?.employeeName) }}
            </q-avatar>
            <div>
              <div class="text-h6">{{ current?.employeeName || 'Sin nombre' }}</div>
              <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-7'">
                {{ current?.employeeRut || 'Sin RUT' }}
              </div>
            </div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-separator class="q-my-md" />

        <q-card-section v-if="current">
          <!-- Info período y estado -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <q-card flat bordered :class="isDark ? 'bg-grey-10' : 'bg-grey-1'">
                <q-card-section class="q-pa-md">
                  <div class="row items-center">
                    <q-icon name="calendar_month" size="24px" :color="isDark ? 'primary' : 'primary'" class="q-mr-sm" />
                    <div>
                      <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-6'">Período</div>
                      <div class="text-weight-medium">{{ formatPeriodLabel(periodSelected) }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-6">
              <q-card flat bordered :class="isDark ? 'bg-grey-10' : 'bg-grey-1'">
                <q-card-section class="q-pa-md">
                  <div class="row items-center">
                    <q-icon 
                      :name="payslipStatusIcon(current.status)" 
                      size="24px" 
                      :color="payslipStatusColor(current.status)" 
                      class="q-mr-sm" 
                    />
                    <div>
                      <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-6'">Estado</div>
                      <div class="text-weight-medium">{{ current.status }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <!-- Días -->
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-sm">Asistencia y días</div>
            <div class="row q-col-gutter-sm">
              <div class="col-4">
                <q-card flat bordered :class="isDark ? 'bg-grey-10' : 'bg-blue-1'">
                  <q-card-section class="text-center q-pa-md">
                    <q-icon name="event_available" size="32px" :color="isDark ? 'blue-4' : 'blue-7'" />
                    <div class="text-h5 text-weight-bold q-mt-sm">{{ current.daysExpected ?? 0 }}</div>
                    <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-7'">Días esperados</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-4">
                <q-card flat bordered :class="isDark ? 'bg-grey-10' : 'bg-green-1'">
                  <q-card-section class="text-center q-pa-md">
                    <q-icon name="check_circle" size="32px" :color="isDark ? 'green-4' : 'green-7'" />
                    <div class="text-h5 text-weight-bold q-mt-sm">{{ current.daysPaid ?? 0 }}</div>
                    <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-7'">Días pagados</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-4">
                <q-card flat bordered :class="isDark ? 'bg-grey-10' : 'bg-red-1'">
                  <q-card-section class="text-center q-pa-md">
                    <q-icon name="event_busy" size="32px" :color="isDark ? 'red-4' : 'red-7'" />
                    <div class="text-h5 text-weight-bold q-mt-sm">{{ current.daysAbsent ?? 0 }}</div>
                    <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-7'">Ausencias</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <!-- Totales financieros -->
          <div>
            <div class="text-subtitle2 q-mb-sm">Resumen financiero</div>
            <q-card flat bordered :class="isDark ? 'bg-grey-10' : 'bg-grey-1'">
              <q-list separator>
                <q-item>
                  <q-item-section avatar>
                    <q-icon name="add_circle" color="positive" size="24px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Total haberes</q-item-label>
                    <q-item-label caption>Remuneraciones y bonos</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-weight-bold text-positive">
                      {{ money(current.totalEarn) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-icon name="remove_circle" color="negative" size="24px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Total descuentos</q-item-label>
                    <q-item-label caption>Impuestos y otros descuentos</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-weight-bold text-negative">
                      {{ money(current.totalDeduct) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item :class="isDark ? 'bg-grey-9' : 'bg-green-1'">
                  <q-item-section avatar>
                    <q-icon name="paid" :color="isDark ? 'green-4' : 'green-7'" size="28px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-h6">Líquido a pagar</q-item-label>
                    <q-item-label caption>Monto final</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-h5 text-weight-bold" :class="isDark ? 'text-green-4' : 'text-green-7'">
                      {{ money(current.totalNet) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            v-if="current?.status === 'DRAFT'"
            unelevated
            color="positive"
            icon="receipt_long"
            label="Emitir liquidación"
            no-caps
            @click="issueOne(current)"
          />
          <q-btn
            v-if="current?.status === 'ISSUED'"
            unelevated
            color="red"
            icon="picture_as_pdf"
            label="Descargar PDF"
            no-caps
            @click="openPdf(current)"
          />
          <q-btn
            v-if="current?.status === 'ISSUED'"
            outline
            color="negative"
            icon="block"
            label="Anular"
            no-caps
            @click="voidOne(current)"
          />
          <q-btn flat label="Cerrar" v-close-popup no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ====================================
         VISOR PDF MEJORADO
         ==================================== -->
    <q-dialog 
      v-model="dialogPdf" 
      maximized 
      persistent 
      transition-show="slide-up" 
      transition-hide="slide-down"
    >
      <q-card class="pdf-viewer-card">
        <q-bar :class="['pdf-toolbar', isDark ? 'bg-grey-10 text-white' : 'bg-white text-grey-9']">
          <q-icon name="picture_as_pdf" color="red" size="24px" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-medium ellipsis col">{{ pdfTitle }}</div>
          
          <q-space />
          
          <q-btn
            flat
            dense
            round
            icon="download"
            :color="isDark ? 'primary' : 'primary'"
            @click="downloadPdf"
            :disable="!pdfUrl || loadingPdf"
          >
            <q-tooltip>Descargar PDF</q-tooltip>
          </q-btn>
          
          <q-separator vertical inset class="q-mx-sm" />
          
          <q-btn
            flat
            dense
            round
            icon="close"
            :color="isDark ? 'grey-5' : 'grey-7'"
            v-close-popup
          >
            <q-tooltip>Cerrar visor</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section class="pdf-viewer-body">
          <q-inner-loading :showing="loadingPdf">
            <div class="column items-center">
              <q-spinner-cube size="80px" :color="isDark ? 'primary' : 'primary'" />
              <div class="q-mt-lg text-h6">Cargando PDF...</div>
              <div class="text-caption" :class="isDark ? 'text-grey-5' : 'text-grey-7'">
                Por favor espera un momento
              </div>
            </div>
          </q-inner-loading>

          <iframe 
            v-if="pdfUrl && !loadingPdf" 
            :src="pdfUrl" 
            class="pdf-iframe"
            @load="loadingPdf = false"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { usePayrollStore } from "@/stores/payrollStore.js";
import { lastMonthPeriod, isValidPeriod } from "@/utils/payrollPeriod.js";
import { useUserStore } from "@/stores/userStore";
import { useCompaniesStore } from "@/stores/companies";

const $q = useQuasar();
const store = usePayrollStore();
const userStore = useUserStore();
const companiesStore = useCompaniesStore();

const isDark = computed(() => $q.dark.isActive);
const pageBgClass = computed(() => (isDark.value ? "bg-grey-10" : "bg-grey-2"));

const mode = ref("periods");

// ============================================
// GESTIÓN MULTI-EMPRESA
// ============================================
const selectedCompany = ref(null);

const companyOptions = computed(() => {
  const companies = companiesStore.items || companiesStore.empresas || companiesStore.list || [];
  // Filtrar solo empresas activas
  return companies.filter(c => c.status === 'active' || c.status === 'Active' || !c.status);
});

const currentCompanyData = computed(() => {
  if (!selectedCompany.value) return null;
  return companyOptions.value.find(c => c._id === selectedCompany.value) || null;
});

function companyStatusLabel(status) {
  const labels = {
    active: "Activa",
    inactive: "Inactiva",
    suspended: "Suspendida"
  };
  return labels[(status || "").toLowerCase()] || status || "—";
}

function companyStatusColor(status) {
  const colors = {
    active: "positive",
    inactive: "warning",
    suspended: "negative"
  };
  return colors[(status || "").toLowerCase()] || "grey";
}

async function onCompanyChange() {
  if (!selectedCompany.value) return;
  
  // Guardar la selección en localStorage para persistencia
  localStorage.setItem('lastSelectedCompany', selectedCompany.value);
  
  // Limpiar datos anteriores
  selected.value = [];
  
  // Recargar datos de la nueva empresa
  await reload();
  
  $q.notify({
    type: "info",
    message: `Empresa cambiada: ${currentCompanyData.value?.name || 'Sin nombre'}`,
    position: "top",
    timeout: 1500,
    icon: "business"
  });
}

// Función helper para obtener el ID de empresa actualizada
function companyId() {
  // Priorizar empresa seleccionada
  if (selectedCompany.value) return selectedCompany.value;
  
  // Fallback a empresa del usuario
  return userStore?.user?.companyId || userStore?.user?.company?._id || userStore?.user?.company || null;
}

// ============================================
// PERIODOS
// ============================================
const periodInput = ref(lastMonthPeriod());

const periodColumns = [
  { 
    name: "period", 
    label: "Período", 
    field: "period", 
    sortable: true, 
    align: "left",
    style: "width: 150px"
  },
  { 
    name: "status", 
    label: "Estado", 
    field: "status", 
    sortable: true, 
    align: "center",
    style: "width: 120px"
  },
  { 
    name: "counts", 
    label: "Resumen", 
    field: "counts", 
    align: "left"
  },
  { 
    name: "actions", 
    label: "Acciones", 
    field: "actions", 
    align: "right",
    style: "width: 100px"
  },
];

const periodRows = computed(() => store.periods || []);

function periodStatusColor(status) {
  const colors = {
    CLOSED: "grey-8",
    PUBLISHED: "positive",
    DRAFT: "orange",
  };
  return colors[status] || (isDark.value ? "grey-7" : "grey");
}

function periodStatusLabel(status) {
  const labels = {
    CLOSED: "Cerrado",
    PUBLISHED: "Publicado",
    DRAFT: "Borrador",
  };
  return labels[status] || status || "—";
}

function countPeriodStatus(status) {
  return periodRows.value.filter(p => p.status === status).length;
}

function formatPeriodLabel(period) {
  if (!period || !period.match(/^\d{4}-\d{2}$/)) return period;
  const [year, month] = period.split("-");
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

// ============================================
// DETALLE EMPLEADOS
// ============================================
const periodSelected = ref(lastMonthPeriod());
const q = ref("");
const status = ref(null);
const selected = ref([]);
const issuingMany = ref(false);

const statusOptions = [
  { label: "Borrador", value: "DRAFT" },
  { label: "Emitida", value: "ISSUED" },
  { label: "Anulada", value: "VOID" },
];

const payslipColumns = [
  { 
    name: "employee", 
    label: "Empleado", 
    field: "employeeName", 
    sortable: true, 
    align: "left",
    style: "min-width: 200px"
  },
  { 
    name: "days", 
    label: "Asistencia", 
    field: "daysPaid", 
    sortable: false, 
    align: "left",
    style: "width: 180px"
  },
  { 
    name: "totals", 
    label: "Montos", 
    field: "totalNet", 
    sortable: true, 
    align: "left",
    style: "width: 200px"
  },
  { 
    name: "status", 
    label: "Estado", 
    field: "status", 
    sortable: true, 
    align: "center",
    style: "width: 120px"
  },
  { 
    name: "actions", 
    label: "Acciones", 
    field: "actions", 
    align: "right",
    style: "width: 150px"
  },
];

const payslips = computed(() => store.payslips || []);

const totalLiquido = computed(() => {
  return payslips.value
    .filter(p => p.status === 'ISSUED')
    .reduce((sum, p) => sum + (Number(p.totalNet) || 0), 0);
});

// Dialogs
const dialogDetail = ref(false);
const current = ref(null);

const dialogPdf = ref(false);
const loadingPdf = ref(false);
const pdfUrl = ref("");
const pdfTitle = ref("Liquidación");

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function money(v) {
  const n = Number(v || 0);
  return new Intl.NumberFormat("es-CL", { 
    style: "currency", 
    currency: "CLP", 
    maximumFractionDigits: 0 
  }).format(n);
}

function countBy(s) {
  return payslips.value.filter(x => x.status === s).length;
}

function payslipStatusColor(s) {
  const colors = {
    ISSUED: "positive",
    DRAFT: "orange",
    VOID: "negative",
  };
  return colors[s] || "grey";
}

function payslipStatusIcon(s) {
  const icons = {
    ISSUED: "check_circle",
    DRAFT: "edit_note",
    VOID: "block",
  };
  return icons[s] || "help";
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ============================================
// INICIALIZACIÓN
// ============================================
async function initializeComponent() {
  // Cargar empresas primero
  try {
    await companiesStore.fetchCompanies();
  } catch (error) {
    console.error("[initializeComponent] Error cargando empresas:", error);
  }

  // Determinar empresa inicial
  const lastCompanyId = localStorage.getItem('lastSelectedCompany');
  const userCompanyId = userStore?.user?.companyId || userStore?.user?.company?._id || userStore?.user?.company;
  
  // Si hay empresa guardada y está en la lista, usarla
  if (lastCompanyId && companyOptions.value.some(c => c._id === lastCompanyId)) {
    selectedCompany.value = lastCompanyId;
  } 
  // Si no, usar empresa del usuario
  else if (userCompanyId && companyOptions.value.some(c => c._id === userCompanyId)) {
    selectedCompany.value = userCompanyId;
  }
  // Si no, usar primera empresa disponible
  else if (companyOptions.value.length > 0) {
    selectedCompany.value = companyOptions.value[0]._id;
  }

  // Si no hay empresa seleccionada, mostrar advertencia
  if (!selectedCompany.value) {
    $q.notify({
      type: "warning",
      message: "No hay empresas activas disponibles",
      caption: "Por favor, crea o activa una empresa primero",
      position: "top",
      timeout: 3000,
      icon: "warning"
    });
    return;
  }

  // Cargar datos de la empresa seleccionada
  await reload();
}

onMounted(initializeComponent);
// ============================================
// ACCIONES PRINCIPALES
// ============================================
async function reload() {
  const cid = companyId();
  if (!cid) {
    $q.notify({ 
      type: "warning", 
      message: "Selecciona una empresa primero", 
      position: "top",
      icon: "business"
    });
    return;
  }
  
  await store.fetchPeriods({ companyId: cid });

  if (mode.value === "detail") {
    await loadPayslips();
  }
}

async function generatePeriod() {
  const cid = companyId();
  if (!cid) {
    return $q.notify({ 
      type: "negative", 
      message: "No se encontró empresa activa", 
      position: "top",
      icon: "error"
    });
  }

  if (!isValidPeriod(periodInput.value)) {
    return $q.notify({ 
      type: "warning", 
      message: "Período inválido. Use formato YYYY-MM", 
      position: "top",
      icon: "warning"
    });
  }

  try {
    const res = await store.generatePeriod({ 
      companyId: cid, 
      period: periodInput.value 
    });
    
    $q.notify({
      type: "positive",
      message: `Período ${formatPeriodLabel(periodInput.value)} generado exitosamente`,
      caption: `Creados: ${res?.created ?? 0} • Actualizados: ${res?.updated ?? 0}`,
      position: "top",
      timeout: 3000,
      icon: "check_circle"
    });

    await store.fetchPeriods({ companyId: cid });
    openPeriod(periodInput.value);
  } catch (e) {
    $q.notify({ 
      type: "negative", 
      message: store.error || "Error al generar el período", 
      position: "top",
      icon: "error"
    });
  }
}

function openPeriod(p) {
  periodSelected.value = p;
  mode.value = "detail";
  loadPayslips();
}

async function loadPayslips() {
  const cid = companyId();
  if (!cid) return;

  if (!isValidPeriod(periodSelected.value)) {
    return $q.notify({ 
      type: "warning", 
      message: "Período inválido. Use formato YYYY-MM", 
      position: "top",
      icon: "warning"
    });
  }

  try {
    await store.fetchPayslips({
      companyId: cid,
      period: periodSelected.value,
      q: q.value || undefined,
      status: status.value || undefined
    });
  } catch (e) {
    $q.notify({ 
      type: "negative", 
      message: store.error || "Error al cargar liquidaciones", 
      position: "top",
      icon: "error"
    });
  }
}

watch([q, status], () => {
  if (mode.value === "detail") loadPayslips();
});

function openDetail(row) {
  current.value = row;
  dialogDetail.value = true;
}

async function issueOne(row) {
  try {
    await store.issuePayslip({ payslipId: row.id || row._id });
    
    $q.notify({ 
      type: "positive", 
      message: "Liquidación emitida correctamente", 
      position: "top",
      icon: "check_circle"
    });
    
    dialogDetail.value = false;
    await loadPayslips();
  } catch {
    $q.notify({ 
      type: "negative", 
      message: store.error || "Error al emitir liquidación", 
      position: "top",
      icon: "error"
    });
  }
}

async function voidOne(row) {
  try {
    const reason = await promptReason();
    if (!reason) return;

    await store.voidPayslip({ payslipId: row.id || row._id, reason });
    
    $q.notify({ 
      type: "warning", 
      message: "Liquidación anulada", 
      caption: `Motivo: ${reason}`,
      position: "top",
      icon: "block"
    });
    
    await loadPayslips();
  } catch {
    $q.notify({ 
      type: "negative", 
      message: store.error || "Error al anular liquidación", 
      position: "top",
      icon: "error"
    });
  }
}

async function issueSelected() {
  if (selected.value.length === 0) return;

  const draftCount = selected.value.filter(r => r.status === "DRAFT").length;
  
  if (draftCount === 0) {
    return $q.notify({ 
      type: "warning", 
      message: "No hay borradores seleccionados para emitir", 
      position: "top",
      icon: "warning"
    });
  }

  $q.dialog({
    title: "Confirmar emisión masiva",
    message: `Se emitirán ${draftCount} liquidación(es). ¿Deseas continuar?`,
    cancel: { label: "Cancelar", flat: true, noCaps: true },
    ok: { label: "Emitir", color: "positive", unelevated: true, noCaps: true },
    persistent: true
  }).onOk(async () => {
    issuingMany.value = true;
    
    try {
      let emitted = 0;
      for (const row of selected.value) {
        if (row.status !== "DRAFT") continue;
        await store.issuePayslip({ payslipId: row.id || row._id });
        emitted++;
      }
      
      $q.notify({ 
        type: "positive", 
        message: `Emisión masiva finalizada exitosamente`, 
        caption: `${emitted} liquidación(es) emitida(s)`,
        position: "top",
        icon: "check_circle",
        timeout: 3000
      });
      
      selected.value = [];
      await loadPayslips();
    } catch {
      $q.notify({ 
        type: "negative", 
        message: store.error || "Error en emisión masiva", 
        position: "top",
        icon: "error"
      });
    } finally {
      issuingMany.value = false;
    }
  });
}

async function openPdf(row) {
  loadingPdf.value = true;
  pdfUrl.value = "";
  pdfTitle.value = `Liquidación - ${row.employeeName || "Sin nombre"} - ${formatPeriodLabel(periodSelected.value)}`;
  dialogPdf.value = true;

  try {
    const url = await store.getPdfUrl({ payslipId: row.id || row._id });
    pdfUrl.value = url;
  } catch {
    $q.notify({ 
      type: "negative", 
      message: store.error || "No se pudo cargar el PDF", 
      position: "top",
      icon: "error"
    });
    dialogPdf.value = false;
  } finally {
    loadingPdf.value = false;
  }
}

function downloadPdf() {
  if (!pdfUrl.value) return;
  const a = document.createElement("a");
  a.href = pdfUrl.value;
  a.download = pdfTitle.value.replace(/\s+/g, "_") + ".pdf";
  a.target = "_blank";
  a.click();
}

function promptReason() {
  return new Promise((resolve) => {
    $q.dialog({
      title: "Anular liquidación",
      message: "Por favor, indica el motivo de anulación:",
      prompt: { 
        model: "", 
        type: "text",
        placeholder: "Motivo de anulación..."
      },
      cancel: { label: "Cancelar", flat: true, noCaps: true },
      ok: { label: "Anular", color: "negative", unelevated: true, noCaps: true },
      persistent: true,
    }).onOk(resolve).onCancel(() => resolve(""));
  });
}
</script>

<style scoped>
/* ============================================
   ESTILOS GENERALES
   ============================================ */
.payroll-header {
  animation: fadeInDown 0.4s ease-out;
}

.payroll-card {
  animation: fadeIn 0.5s ease-out;
  border-radius: 12px;
  overflow: hidden;
}

/* ============================================
   SELECTOR DE EMPRESA
   ============================================ */
.company-selector-card {
  border-radius: 12px;
  border: 2px solid;
  border-color: var(--q-primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(var(--q-primary-rgb), 0.15);
}

.company-selector-card:hover {
  box-shadow: 0 6px 20px rgba(var(--q-primary-rgb), 0.25);
}

.body--dark .company-selector-card {
  border-color: rgba(var(--q-primary-rgb), 0.5);
}

/* ============================================
   CARDS Y ESTADÍSTICAS
   ============================================ */
.stat-card {
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.body--dark .stat-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  opacity: 0.3;
}

.info-banner {
  border-left: 4px solid currentColor;
}

/* ============================================
   INPUTS Y CONTROLES
   ============================================ */
.period-input :deep(.q-field__control) {
  border-radius: 8px;
}

label.block {
  display: block;
}

/* ============================================
   TABLAS
   ============================================ */
.modern-table {
  border-radius: 8px;
  overflow: hidden;
}

.modern-table :deep(thead tr) {
  background: linear-gradient(135deg, var(--q-primary) 0%, var(--q-secondary) 100%);
  color: white;
}

.modern-table :deep(thead th) {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.modern-table :deep(tbody tr) {
  transition: background-color 0.2s ease;
}

.modern-table :deep(tbody tr:hover) {
  background-color: rgba(var(--q-primary-rgb), 0.05);
}

.dark-table :deep(thead tr) {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

.dark-table :deep(tbody tr:hover) {
  background-color: rgba(255, 255, 255, 0.05);
}

.light-table :deep(thead tr) {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

/* ============================================
   CELDAS ESPECIALES
   ============================================ */
.employee-cell {
  display: flex;
  align-items: center;
}

.totals-cell {
  display: flex;
  flex-direction: column;
}

/* ============================================
   BADGES Y CHIPS
   ============================================ */
.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ============================================
   VISOR PDF
   ============================================ */
.pdf-viewer-card {
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.pdf-toolbar {
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.pdf-viewer-body {
  flex: 1;
  padding: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  overflow: hidden;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
}

/* ============================================
   ANIMACIONES
   ============================================ */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animated {
  animation-duration: 0.4s;
  animation-fill-mode: both;
}

.fadeIn {
  animation-name: fadeIn;
}

.fadeOut {
  animation-name: fadeOut;
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 1023px) {
  .payroll-header h1 {
    font-size: 1.5rem;
  }
  
  .stat-card {
    margin-bottom: 0;
  }
  
  .company-selector-card {
    margin-bottom: 1rem;
  }
}

@media (max-width: 599px) {
  .payroll-header {
    padding: 8px 0;
  }
  
  .payroll-header h1 {
    font-size: 1.25rem;
  }
  
  .modern-table :deep(thead th) {
    font-size: 0.7rem;
  }
  
  .company-selector-card :deep(.q-card__section) {
    padding: 12px;
  }
}
</style>