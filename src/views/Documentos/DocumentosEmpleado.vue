<template>
  <q-page class="q-pa-md" :class="pageBgClass">
    <q-card flat bordered class="rk-docs-card q-mt-md">
      <!-- Header mejorado con breadcrumbs y acciones -->
      <q-card-section class="row items-center justify-between q-pb-sm">
        <div class="row items-center col-12 col-md-auto">
          <q-avatar
            :color="isDark ? 'primary-7' : 'primary'"
            text-color="white"
            size="48px"
            class="q-mr-md"
            font-size="20px"
          >
            {{ initials(userName) }}
          </q-avatar>
          <div>
            <div class="row items-center q-gutter-xs q-mb-xs">
              <div
                class="text-h6 text-weight-medium"
                :class="isDark ? 'text-white' : 'text-primary'"
              >
                Hola, {{ firstName(userName) }}
              </div>
              <q-chip
                v-if="rowsFiltradas.length > 0"
                dense
                :color="isDark ? 'grey-8' : 'grey-3'"
                :text-color="isDark ? 'grey-3' : 'grey-8'"
                size="sm"
              >
                {{ rowsFiltradas.length }} doc{{ rowsFiltradas.length !== 1 ? 's' : '' }}
              </q-chip>
            </div>
            <div
              class="text-caption"
              :class="isDark ? 'text-grey-4' : 'text-grey-7'"
            >
              Gestiona tus documentos personales: liquidaciones, contratos y más
            </div>
          </div>
        </div>

        <div class="row q-gutter-sm items-center q-mt-sm q-mt-md-none">
          <q-btn
            v-if="latestPayslip"
            :color="isDark ? 'primary-7' : 'primary'"
            unelevated
            icon="receipt_long"
            @click="verDocumento(latestPayslip)"
            no-caps
            class="q-px-md"
          >
            <div class="column items-start">
              <div class="text-caption">Última liquidación</div>
              <div class="text-weight-bold">{{ latestPayslip.period }}</div>
            </div>
          </q-btn>
          <q-btn
            outline
            :color="isDark ? 'grey-4' : 'primary'"
            icon="folder_open"
            label="Ver todos"
            @click="scrollToList"
            no-caps
          />
        </div>
      </q-card-section>

      <q-separator />

      <!-- Tabs y controles mejorados -->
      <q-card-section class="q-pt-md q-pb-sm">
        <div class="row items-center justify-between q-mb-md">
          <q-tabs
            v-model="tabType"
            dense
            class="col-12 col-md-auto"
            :active-color="isDark ? 'primary-4' : 'primary'"
            :indicator-color="isDark ? 'primary-4' : 'primary'"
            align="left"
            narrow-indicator
            inline-label
            outside-arrows
            mobile-arrows
          >
            <q-tab name="all" icon="folder_open" no-caps>
              <div class="column items-start q-ml-xs">
                <div>Todos</div>
                <div class="text-caption text-grey">{{ rows.length }}</div>
              </div>
            </q-tab>
            <q-tab name="payroll" icon="payments" no-caps>
              <div class="column items-start q-ml-xs">
                <div>Liquidaciones</div>
                <div class="text-caption text-grey">{{ countByType("payroll") }}</div>
              </div>
            </q-tab>
            <q-tab name="contract" icon="feed" no-caps>
              <div class="column items-start q-ml-xs">
                <div>Contratos</div>
                <div class="text-caption text-grey">{{ countByType("contract") }}</div>
              </div>
            </q-tab>
            <q-tab name="certificate" icon="workspace_premium" no-caps>
              <div class="column items-start q-ml-xs">
                <div>Certificados</div>
                <div class="text-caption text-grey">{{ countByType("certificate") }}</div>
              </div>
            </q-tab>
            <q-tab name="other" icon="description" no-caps>
              <div class="column items-start q-ml-xs">
                <div>Otros</div>
                <div class="text-caption text-grey">{{ countByType("other") }}</div>
              </div>
            </q-tab>
          </q-tabs>

          <div class="row q-gutter-sm q-mt-sm q-mt-md-none">
            <q-btn-toggle
              v-model="viewMode"
              dense
              rounded
              unelevated
              :toggle-color="isDark ? 'primary-7' : 'primary'"
              :class="isDark ? 'bg-grey-9' : 'bg-grey-3'"
              :options="[
                { label: 'Tarjetas', icon: 'view_module', value: 'cards' },
                { label: 'Lista', icon: 'view_list', value: 'list' },
              ]"
            />
            <q-btn
              flat
              round
              dense
              icon="more_vert"
              :color="isDark ? 'grey-4' : 'grey-7'"
            >
              <q-menu>
                <q-list dense>
                  <q-item clickable v-close-popup @click="exportarCSV">
                    <q-item-section avatar>
                      <q-icon name="download" />
                    </q-item-section>
                    <q-item-section>Exportar lista (CSV)</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="imprimirLista">
                    <q-item-section avatar>
                      <q-icon name="print" />
                    </q-item-section>
                    <q-item-section>Imprimir lista</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable v-close-popup @click="showHelp = true">
                    <q-item-section avatar>
                      <q-icon name="help_outline" />
                    </q-item-section>
                    <q-item-section>Ayuda</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>

        <!-- Filtros mejorados con más opciones -->
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-4">
            <q-input
              dense
              filled
              v-model.trim="q"
              debounce="300"
              placeholder="Buscar por nombre o comentario…"
              :color="isDark ? 'grey-3' : 'primary'"
              clearable
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-6 col-md-2">
            <q-select
              dense
              filled
              v-model="year"
              :options="yearsOptions"
              label="Año"
              clearable
              :color="isDark ? 'grey-3' : 'primary'"
              emit-value
              map-options
            >
              <template #prepend>
                <q-icon name="calendar_today" size="xs" />
              </template>
            </q-select>
          </div>
          <div class="col-6 col-md-2">
            <q-input
              dense
              filled
              v-model="period"
              label="Período (YYYY-MM)"
              mask="####-##"
              clearable
              :color="isDark ? 'grey-3' : 'primary'"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date v-model="period" mask="YYYY-MM" minimal>
                      <div class="row items-center justify-end">
                        <q-btn
                          v-close-popup
                          label="Cerrar"
                          color="primary"
                          flat
                        />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-6 col-md-2">
            <q-select
              dense
              filled
              v-model="sortBy"
              :options="sortOptions"
              label="Ordenar por"
              :color="isDark ? 'grey-3' : 'primary'"
              emit-value
              map-options
            >
              <template #prepend>
                <q-icon name="sort" size="xs" />
              </template>
            </q-select>
          </div>
          <div class="col-6 col-md-2 flex items-center">
            <q-btn
              class="full-width"
              :color="isDark ? 'primary-7' : 'primary'"
              outline
              icon="refresh"
              label="Actualizar"
              @click="reload"
              :loading="store.loading"
              no-caps
            />
          </div>
        </div>

        <!-- Chips de filtros activos mejorados -->
        <transition name="slide-down">
          <div class="q-mt-md" v-if="hasActiveFilters">
            <div class="row items-center q-gutter-xs">
              <div
                class="text-caption text-weight-medium"
                :class="isDark ? 'text-grey-4' : 'text-grey-7'"
              >
                Filtros activos:
              </div>
              <q-chip
                v-if="period"
                dense
                :color="isDark ? 'primary-8' : 'primary'"
                text-color="white"
                removable
                @remove="period = ''"
                icon="event"
                size="sm"
              >
                {{ period }}
              </q-chip>
              <q-chip
                v-if="year"
                dense
                :color="isDark ? 'secondary-8' : 'secondary'"
                text-color="white"
                removable
                @remove="year = null"
                icon="calendar_today"
                size="sm"
              >
                {{ year }}
              </q-chip>
              <q-chip
                v-if="q"
                dense
                :color="isDark ? 'grey-8' : 'grey-6'"
                text-color="white"
                removable
                @remove="q = ''"
                icon="search"
                size="sm"
              >
                "{{ q }}"
              </q-chip>
              <q-chip
                v-if="tabType !== 'all'"
                dense
                :color="getTypeColor(tabType)"
                text-color="white"
                removable
                @remove="tabType = 'all'"
                :icon="iconoTipo(tabType)"
                size="sm"
              >
                {{ labelDeTipo(tabType) }}
              </q-chip>
              <q-btn
                flat
                dense
                size="sm"
                :color="isDark ? 'grey-4' : 'grey-7'"
                icon="clear_all"
                label="Limpiar"
                @click="limpiarFiltros"
                no-caps
              />
            </div>
          </div>
        </transition>
      </q-card-section>

      <!-- KPI Cards mejorados con animaciones -->
      <q-card-section class="q-pt-none q-pb-md">
        <div class="row q-col-gutter-sm">
          <div
            v-for="kpi in kpiData"
            :key="kpi.name"
            class="col-6 col-sm-3"
          >
            <q-card
              flat
              bordered
              class="rk-kpi cursor-pointer"
              :class="[
                isDark ? 'bg-grey-9' : 'bg-grey-1',
                tabType === kpi.name ? 'rk-kpi-active' : ''
              ]"
              @click="tabType = kpi.name"
            >
              <q-card-section class="row items-center q-pa-md">
                <q-icon
                  :name="kpi.icon"
                  size="28px"
                  :color="tabType === kpi.name ? kpi.color : (isDark ? 'grey-5' : 'grey-6')"
                  class="q-mr-sm"
                />
                <div class="col">
                  <div
                    class="text-caption text-weight-medium"
                    :class="isDark ? 'text-grey-4' : 'text-grey-7'"
                  >
                    {{ kpi.label }}
                  </div>
                  <div class="text-h6 text-weight-bold">
                    {{ kpi.count }}
                  </div>
                </div>
              </q-card-section>
              <q-linear-progress
                v-if="tabType === kpi.name"
                :color="kpi.color"
                size="3px"
                :value="1"
                class="rk-kpi-indicator"
              />
            </q-card>
          </div>
        </div>
      </q-card-section>

      <!-- Lista / Tarjetas con skeleton loader -->
      <q-card-section class="q-pt-none" ref="listSection">
        <!-- Skeleton loader -->
        <div v-if="store.loading" class="row q-col-gutter-md">
          <div
            v-for="i in 8"
            :key="i"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card
              bordered
              class="rk-doc-card"
              :class="isDark ? 'bg-grey-9' : ''"
            >
              <q-card-section class="row items-start no-wrap q-pb-sm">
                <q-skeleton type="QAvatar" size="48px" class="q-mr-sm" />

                <div class="col q-pt-xs">
                  <q-skeleton type="text" width="88%" class="q-mb-xs" />
                  <q-skeleton type="text" width="62%" class="q-mb-sm" />

                  <div class="row items-center q-gutter-xs q-mb-sm">
                    <q-skeleton type="QChip" width="92px" />
                    <q-skeleton type="QChip" width="74px" />
                  </div>

                  <q-skeleton type="text" width="100%" class="q-mb-xs" />
                  <q-skeleton type="text" width="78%" class="q-mb-sm" />
                  <q-skeleton type="text" width="46%" />
                </div>
              </q-card-section>

              <q-separator />

              <q-card-actions align="between" class="q-px-md q-py-sm">
                <q-skeleton type="QBtn" width="78px" />
                <q-skeleton type="QBtn" width="96px" />
              </q-card-actions>
            </q-card>
          </div>
        </div>

        <!-- Empty state mejorado -->
        <div
          v-else-if="rowsFiltradas.length === 0"
          class="q-pa-xl text-center"
        >
          <q-icon
            :name="hasActiveFilters ? 'search_off' : 'folder_off'"
            :color="isDark ? 'grey-7' : 'grey-5'"
            size="80px"
            class="q-mb-md"
          />
          <div
            class="text-h6 text-weight-medium q-mb-sm"
            :class="isDark ? 'text-grey-4' : 'text-grey-8'"
          >
            {{ hasActiveFilters ? 'No encontramos documentos' : 'Sin documentos' }}
          </div>
          <div
            class="text-body2 q-mb-lg"
            :class="isDark ? 'text-grey-5' : 'text-grey-6'"
          >
            {{
              hasActiveFilters
                ? 'Prueba ajustando los filtros o buscando con otros términos'
                : 'Aún no tienes documentos cargados en el sistema'
            }}
          </div>
          <q-btn
            v-if="hasActiveFilters"
            :color="isDark ? 'primary-7' : 'primary'"
            unelevated
            icon="clear_all"
            label="Limpiar filtros"
            @click="limpiarFiltros"
            no-caps
            class="q-px-lg"
          />
        </div>

        <!-- Vista en tarjetas mejorada -->
        <transition-group
          v-else-if="viewMode === 'cards'"
          name="card-list"
          tag="div"
          class="row q-col-gutter-md"
        >
          <div
            v-for="doc in rowsFiltradas"
            :key="doc.id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card
              class="rk-doc-card hoverable"
              bordered
              :class="isDark ? 'bg-grey-9' : ''"
            >
              <q-card-section class="row items-start no-wrap q-pb-sm">
                <q-avatar
                  :icon="iconoTipo(doc.type)"
                  :color="getTypeColor(doc.type)"
                  text-color="white"
                  size="48px"
                  font-size="22px"
                  class="q-mr-sm"
                >
                  <q-badge
                    v-if="isRecent(doc.createdAt)"
                    color="red"
                    floating
                    rounded
                    label="Nuevo"
                  />
                </q-avatar>
                <div class="col q-pt-xs">
                  <div
                    class="text-weight-medium ellipsis-2-lines q-mb-xs"
                    style="min-height: 2.8em"
                    :title="doc.name"
                  >
                    {{ doc.name }}
                  </div>
                  <div class="row items-center q-gutter-xs">
                    <q-chip
                      dense
                      :color="getTypeColor(doc.type)"
                      text-color="white"
                      size="sm"
                      :icon="iconoTipo(doc.type)"
                    >
                      {{ labelDeTipo(doc.type) }}
                    </q-chip>
                    <q-chip
                      v-if="doc.period"
                      dense
                      :color="isDark ? 'grey-8' : 'grey-4'"
                      :text-color="isDark ? 'grey-3' : 'grey-8'"
                      size="sm"
                      icon="event"
                    >
                      {{ doc.period }}
                    </q-chip>
                  </div>
                  <div
                    v-if="doc.comment"
                    class="text-caption text-italic q-mt-sm ellipsis-2-lines"
                    :class="isDark ? 'text-grey-5' : 'text-grey-7'"
                    :title="doc.comment"
                  >
                    💬 {{ doc.comment }}
                  </div>
                  <div
                    class="text-caption q-mt-xs"
                    :class="isDark ? 'text-grey-6' : 'text-grey-6'"
                  >
                    <q-icon name="schedule" size="14px" /> {{ fmtDate(doc.createdAt) }}
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <q-card-actions align="between" class="q-px-md q-py-sm">
                <q-btn
                  flat
                  dense
                  icon="visibility"
                  label="Ver"
                  @click="verDocumento(doc)"
                  :color="isDark ? 'primary-4' : 'primary'"
                  class="text-weight-medium"
                  no-caps
                />
                <q-btn-dropdown
                  flat
                  dense
                  icon="more_vert"
                  :color="isDark ? 'grey-4' : 'grey-7'"
                  dropdown-icon="none"
                  size="sm"
                >
                  <q-list dense>
                    <q-item clickable v-close-popup @click="descargarDocumento(doc)">
                      <q-item-section avatar>
                        <q-icon name="download" />
                      </q-item-section>
                      <q-item-section>Descargar</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="compartirDocumento(doc)">
                      <q-item-section avatar>
                        <q-icon name="share" />
                      </q-item-section>
                      <q-item-section>Compartir</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="copiarEnlace(doc)">
                      <q-item-section avatar>
                        <q-icon name="link" />
                      </q-item-section>
                      <q-item-section>Copiar enlace</q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </q-card-actions>
            </q-card>
          </div>
        </transition-group>

        <!-- Vista en lista mejorada -->
        <q-table
          v-else
          :rows="rowsFiltradas"
          :columns="columns"
          row-key="id"
          flat
          dense
          bordered
          :loading="store.loading"
          no-data-label="Sin documentos"
          :rows-per-page-options="[10, 20, 50, 100]"
          :pagination.sync="pagination"
          :class="isDark ? 'bg-grey-9' : ''"
          :card-class="isDark ? 'bg-grey-9' : ''"
          table-header-class="text-weight-bold"
          :grid="$q.screen.xs"
          selection="multiple"
          v-model:selected="selected"
        >
          <template #top-left v-if="selected.length > 0">
            <div class="row items-center q-gutter-sm">
              <div class="text-subtitle2">
                {{ selected.length }} seleccionado{{ selected.length !== 1 ? 's' : '' }}
              </div>
              <q-btn
                flat
                dense
                icon="download"
                label="Descargar"
                @click="descargarMultiples"
                :color="isDark ? 'primary-4' : 'primary'"
                no-caps
              />
              <q-btn
                flat
                dense
                icon="close"
                @click="selected = []"
                :color="isDark ? 'grey-4' : 'grey-7'"
              />
            </div>
          </template>

          <template #body-cell-name="p">
            <q-td :props="p">
              <div class="row items-center no-wrap">
                <q-avatar
                  :icon="iconoTipo(p.row.type)"
                  :color="getTypeColor(p.row.type)"
                  text-color="white"
                  size="36px"
                  font-size="18px"
                  class="q-mr-sm"
                >
                  <q-badge
                    v-if="isRecent(p.row.createdAt)"
                    color="red"
                    floating
                    rounded
                  />
                </q-avatar>
                <div class="col">
                  <div class="text-weight-medium">{{ p.row.name }}</div>
                  <div
                    v-if="p.row.comment"
                    class="text-caption text-italic ellipsis"
                    :class="isDark ? 'text-grey-5' : 'text-grey-7'"
                  >
                    💬 {{ p.row.comment }}
                  </div>
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-type="p">
            <q-td :props="p">
              <q-chip
                dense
                :color="getTypeColor(p.row.type)"
                text-color="white"
                size="sm"
                :icon="iconoTipo(p.row.type)"
              >
                {{ labelDeTipo(p.row.type) }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-period="p">
            <q-td :props="p">
              <div>
                <div class="text-weight-medium">
                  {{ p.row.period || "—" }}
                </div>
                <div
                  class="text-caption"
                  :class="isDark ? 'text-grey-5' : 'text-grey-7'"
                >
                  {{ fmtDate(p.row.createdAt) }}
                </div>
              </div>
            </q-td>
          </template>

          <template #body-cell-actions="p">
            <q-td :props="p" class="text-right">
              <q-btn
                size="sm"
                flat
                round
                icon="visibility"
                @click="verDocumento(p.row)"
                :color="isDark ? 'primary-4' : 'primary'"
              >
                <q-tooltip>Ver documento</q-tooltip>
              </q-btn>
              <q-btn
                size="sm"
                flat
                round
                icon="download"
                @click="descargarDocumento(p.row)"
                :color="isDark ? 'grey-4' : 'grey-7'"
              >
                <q-tooltip>Descargar</q-tooltip>
              </q-btn>
              <q-btn
                size="sm"
                flat
                round
                icon="share"
                @click="compartirDocumento(p.row)"
                :color="isDark ? 'grey-4' : 'grey-7'"
              >
                <q-tooltip>Compartir</q-tooltip>
              </q-btn>
            </q-td>
          </template>

          <!-- Vista grid para móviles mejorada -->
          <template #item="props">
            <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4">
              <q-card class="rk-doc-card hoverable" bordered>
                <q-card-section class="row items-center no-wrap">
                  <q-avatar
                    :icon="iconoTipo(props.row.type)"
                    :color="getTypeColor(props.row.type)"
                    text-color="white"
                    size="40px"
                  >
                    <q-badge
                      v-if="isRecent(props.row.createdAt)"
                      color="red"
                      floating
                      rounded
                    />
                  </q-avatar>
                  <div class="q-ml-sm col">
                    <div class="text-weight-medium ellipsis">
                      {{ props.row.name }}
                    </div>
                    <div
                      class="text-caption"
                      :class="isDark ? 'text-grey-5' : 'text-grey-7'"
                    >
                      {{ labelDeTipo(props.row.type) }} ·
                      {{ props.row.period || "—" }}
                    </div>
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-actions align="between">
                  <q-btn
                    flat
                    dense
                    icon="visibility"
                    @click="verDocumento(props.row)"
                    :color="isDark ? 'primary-4' : 'primary'"
                    no-caps
                  />
                  <q-btn
                    flat
                    dense
                    icon="download"
                    @click="descargarDocumento(props.row)"
                    no-caps
                  />
                </q-card-actions>
              </q-card>
            </div>
          </template>

          <template #loading>
            <q-inner-loading showing>
              <q-spinner-gears size="40px" :color="isDark ? 'primary-4' : 'primary'" />
            </q-inner-loading>
          </template>
        </q-table>
      </q-card-section>

      <!-- Visor de documentos mejorado -->
      <q-dialog v-model="dialogViewer" maximized persistent transition-show="slide-up" transition-hide="slide-down">
        <q-card class="rk-docs-viewer">
          <q-bar :class="isDark ? 'bg-grey-10 text-white' : 'bg-grey-2'">
            <q-icon
              :name="currentDoc ? iconoTipo(currentDoc.type) : 'description'"
              class="q-mr-sm"
            />
            <div class="text-subtitle2 ellipsis col">
              {{ currentDoc?.name || "Documento" }}
            </div>
            <q-space />
            <q-btn
              dense
              flat
              icon="print"
              @click="imprimirDocumento"
              :disable="!currentDoc || loadingViewer"
            >
              <q-tooltip>Imprimir</q-tooltip>
            </q-btn>
            <q-btn
              dense
              flat
              icon="download"
              @click="currentDoc && descargarDocumento(currentDoc)"
              :disable="!currentDoc || loadingViewer"
            >
              <q-tooltip>Descargar</q-tooltip>
            </q-btn>
            <q-btn
              dense
              flat
              icon="share"
              @click="currentDoc && compartirDocumento(currentDoc)"
              :disable="!currentDoc || loadingViewer"
            >
              <q-tooltip>Compartir</q-tooltip>
            </q-btn>
            <q-separator vertical inset class="q-mx-sm" />
            <q-btn dense flat icon="close" v-close-popup>
              <q-tooltip>Cerrar (Esc)</q-tooltip>
            </q-btn>
          </q-bar>

          <q-card-section class="rk-viewer-body">
            <q-inner-loading :showing="loadingViewer">
              <q-spinner-gears size="48px" :color="isDark ? 'primary-4' : 'primary'" />
              <div class="q-mt-md text-caption">Cargando documento...</div>
            </q-inner-loading>

            <iframe
              v-if="safeUrl && !loadingViewer"
              :src="safeUrl"
              class="rk-viewer-frame"
              @load="onIframeLoaded"
              @error="onIframeError"
            ></iframe>

            <div v-else-if="!loadingViewer" class="q-pa-xl text-center">
              <q-icon
                name="error_outline"
                size="64px"
                :color="isDark ? 'orange-6' : 'orange'"
                class="q-mb-md"
              />
              <div class="text-h6 q-mb-sm">No se pudo cargar el documento</div>
              <div class="text-body2 q-mb-lg" :class="isDark ? 'text-grey-5' : 'text-grey-7'">
                El documento no está disponible o no se puede mostrar en el
                visor.
              </div>
              <q-btn
                :color="isDark ? 'primary-7' : 'primary'"
                unelevated
                icon="download"
                label="Descargar documento"
                @click="currentDoc && descargarDocumento(currentDoc)"
                :disable="!currentDoc"
                no-caps
                class="q-px-lg"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Dialog de ayuda -->
      <q-dialog v-model="showHelp">
        <q-card style="min-width: 400px" :class="isDark ? 'bg-grey-9' : ''">
          <q-card-section class="row items-center">
            <q-icon name="help_outline" size="32px" :color="isDark ? 'primary-4' : 'primary'" class="q-mr-md" />
            <div class="text-h6">Ayuda - Gestión de Documentos</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pt-md">
            <div class="text-subtitle2 q-mb-sm">📋 Funcionalidades</div>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="search" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Búsqueda</q-item-label>
                  <q-item-label caption>Busca por nombre o comentario</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="filter_list" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Filtros</q-item-label>
                  <q-item-label caption>Filtra por tipo, año o período</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="view_module" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Vistas</q-item-label>
                  <q-item-label caption>Cambia entre tarjetas y lista</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="download" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Exportar</q-item-label>
                  <q-item-label caption>Descarga múltiples documentos o exporta a CSV</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <div class="text-subtitle2 q-mt-md q-mb-sm">⌨️ Atajos de teclado</div>
            <q-list dense>
              <q-item>
                <q-item-section>
                  <q-item-label><kbd>Ctrl + F</kbd> - Buscar</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label><kbd>Esc</kbd> - Cerrar visor</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn label="Entendido" :color="isDark ? 'primary-7' : 'primary'" unelevated v-close-popup no-caps />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useQuasar } from "quasar";
import { useDocumentStore } from "@/stores/documentStore";
import { useUserStore } from "@/stores/userStore";

const pageBgClass = computed(() => isDark.value ? 'bg-grey-10 text-white' : 'bg-grey-1')

/* Props */
const props = defineProps({
  employeeId: { type: [String, Number], required: false },
});

const $q = useQuasar();
const store = useDocumentStore();
const userStore = useUserStore();

/* ====== Estado UI ====== */
const tabType = ref("all");
const viewMode = ref("cards");
const q = ref("");
const year = ref(null);
const period = ref("");
const sortBy = ref("date-desc");
const loadingUi = ref(false);
const showHelp = ref(false);
const selected = ref([]);

const dialogViewer = ref(false);
const loadingViewer = ref(false);
const currentDoc = ref(null);
const safeUrl = ref("");

const listSection = ref(null);

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  sortBy: 'createdAt',
  descending: true
});

/* ====== Ordenamiento ====== */
const sortOptions = [
  { label: 'Más recientes', value: 'date-desc' },
  { label: 'Más antiguos', value: 'date-asc' },
  { label: 'Nombre (A-Z)', value: 'name-asc' },
  { label: 'Nombre (Z-A)', value: 'name-desc' },
  { label: 'Período (nuevo)', value: 'period-desc' },
  { label: 'Período (viejo)', value: 'period-asc' },
];

/* ====== Columns ====== */
const columns = [
  {
    name: "name",
    label: "Documento",
    field: "name",
    sortable: true,
    align: "left",
  },
  {
    name: "type",
    label: "Tipo",
    field: "type",
    sortable: true,
    align: "left",
  },
  {
    name: "period",
    label: "Período",
    field: "period",
    sortable: true,
    align: "left",
  },
  {
    name: "createdAt",
    label: "Fecha de carga",
    field: "createdAt",
    sortable: true,
    align: "left",
  },
  { 
    name: "actions", 
    label: "Acciones", 
    field: "id", 
    align: "right" 
  },
];

/* ====== Helpers ====== */
const isDark = computed(() => $q.dark.isActive);
const userName = computed(() =>
  userStore?.user?.firstName
    ? `${userStore.user.firstName} ${userStore.user.lastName || ""}`.trim()
    : "Usuario"
);

function initials(name = "") {
  const [a = "", b = ""] = name.split(" ");
  return ((a[0] || "") + (b[0] || "")).toUpperCase() || "U";
}
function firstName(name = "") {
  return (name || "Usuario").split(" ")[0];
}

const typeOptions = [
  { label: "Liquidación", value: "payroll" },
  { label: "Contrato", value: "contract" },
  { label: "Certificado", value: "certificate" },
  { label: "Otro", value: "other" },
];

const labelDeTipo = (v) =>
  typeOptions.find((t) => t.value === v)?.label || v || "—";

const iconoTipo = (v) =>
  v === "payroll"
    ? "payments"
    : v === "contract"
    ? "feed"
    : v === "certificate"
    ? "workspace_premium"
    : "description";

const getTypeColor = (type) => {
  const colors = {
    payroll: isDark.value ? "primary-7" : "primary",
    contract: isDark.value ? "secondary-7" : "secondary",
    certificate: isDark.value ? "positive-7" : "positive",
    other: isDark.value ? "grey-7" : "grey",
  };
  return colors[type] || "grey";
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  const date = new Date(iso);
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

const isRecent = (date) => {
  if (!date) return false;
  const daysDiff = (new Date() - new Date(date)) / (1000 * 60 * 60 * 24);
  return daysDiff <= 7;
};

function resolveEmployeeId() {
  return props.employeeId ?? userStore?.user?._id ?? userStore?.user?.id;
}

/* ====== Computed ====== */
const rows = computed(() => store.byEmployee(resolveEmployeeId()));

const yearsOptions = computed(() => {
  const allPeriods = (store.items || []).map((d) => d.period).filter(Boolean);
  const years = Array.from(
    new Set(allPeriods.map((p) => (p || "").slice(0, 4)))
  )
    .filter(Boolean)
    .sort((a, b) => b - a)
    .map((year) => ({ label: year, value: year }));
  return years;
});

const rowsFiltradas = computed(() => {
  const t = tabType.value;
  const qq = (q.value || "").trim().toLowerCase();
  
  let filtered = rows.value
    .filter((r) => (t === "all" ? true : r.type === t))
    .filter(
      (r) => !year.value || (r.period || "").startsWith(String(year.value))
    )
    .filter((r) => !period.value || r.period === period.value)
    .filter(
      (r) =>
        !qq ||
        r.name?.toLowerCase().includes(qq) ||
        r.comment?.toLowerCase().includes(qq)
    );

  // Aplicar ordenamiento
  const [field, order] = sortBy.value.split('-');
  
  filtered.sort((a, b) => {
    let comparison = 0;
    
    switch(field) {
      case 'date':
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
        break;
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '');
        break;
      case 'period':
        comparison = (a.period || '').localeCompare(b.period || '');
        break;
    }
    
    return order === 'desc' ? -comparison : comparison;
  });

  return filtered;
});

const latestPayslip = computed(() => {
  return rows.value
    .filter((r) => r.type === "payroll" && r.period)
    .sort((a, b) => b.period.localeCompare(a.period))[0];
});

const hasActiveFilters = computed(() => {
  return !!q.value || !!year.value || !!period.value || tabType.value !== "all";
});

const kpiData = computed(() => [
  {
    name: 'all',
    label: 'Todos',
    icon: 'folder_open',
    color: isDark.value ? 'primary-6' : 'primary',
    count: rows.value.length
  },
  {
    name: 'payroll',
    label: 'Liquidaciones',
    icon: 'payments',
    color: isDark.value ? 'primary-6' : 'primary',
    count: countByType("payroll")
  },
  {
    name: 'contract',
    label: 'Contratos',
    icon: 'feed',
    color: isDark.value ? 'secondary-6' : 'secondary',
    count: countByType("contract")
  },
  {
    name: 'certificate',
    label: 'Certificados',
    icon: 'workspace_premium',
    color: isDark.value ? 'positive-6' : 'positive',
    count: countByType("certificate")
  },
]);

/* ====== Lifecycle ====== */
onMounted(() => {
  reload();
  setupKeyboardShortcuts();
});

onUnmounted(() => {
  removeKeyboardShortcuts();
});

// Auto-scroll al cambiar filtros
watch([tabType, year, period], () => {
  if (rowsFiltradas.value.length > 0) {
    nextTick(scrollToList);
  }
});

/* ====== Keyboard shortcuts ====== */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', handleKeyboardShortcut);
}

function removeKeyboardShortcuts() {
  document.removeEventListener('keydown', handleKeyboardShortcut);
}

function handleKeyboardShortcut(e) {
  // Ctrl/Cmd + F para buscar
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    const searchInput = document.querySelector('input[placeholder*="Buscar"]');
    searchInput?.focus();
  }
  
  // Esc para cerrar visor
  if (e.key === 'Escape' && dialogViewer.value) {
    dialogViewer.value = false;
  }
}

/* ====== Actions ====== */
async function reload() {
  try {
    loadingOn();
    await store.fetchByEmployee({
      employeeId: resolveEmployeeId(),
      period: period.value || undefined,
      type: tabType.value === "all" ? undefined : tabType.value,
      q: q.value || undefined,
    });
    
    $q.notify({
      type: "positive",
      message: "Documentos actualizados",
      timeout: 1500,
      position: "top",
    });
  } catch (e) {
    notifyErr(e);
  } finally {
    loadingOff();
  }
}

function limpiarFiltros() {
  q.value = "";
  year.value = null;
  period.value = "";
  tabType.value = "all";
  sortBy.value = "date-desc";
  selected.value = [];
}

function scrollToList() {
  const el = listSection.value?.$el || listSection.value;
  if (el?.scrollIntoView) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function verDocumento(row) {
  try {
    loadingViewer.value = true;
    safeUrl.value = "";
    currentDoc.value = row;
    const url = await store.getSignedUrl(row.id);
    safeUrl.value = url;
    dialogViewer.value = true;
  } catch (e) {
    loadingViewer.value = false;
    notifyErr(e);
    dialogViewer.value = false;
  }
}

function onIframeLoaded() {
  loadingViewer.value = false;
}

function onIframeError() {
  loadingViewer.value = false;
  $q.notify({
    type: "warning",
    message: "No se pudo cargar el documento en el visor",
    timeout: 3000,
    position: "top",
  });
}

async function descargarDocumento(row) {
  try {
    loadingOn();
    const url = await store.getSignedUrl(row.id);

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = row.name || "documento";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    $q.notify({
      type: "positive",
      message: `Descargando "${row.name}"`,
      timeout: 2000,
      position: "top",
      icon: "download",
    });
  } catch (e) {
    notifyErr(e);
  } finally {
    loadingOff();
  }
}

async function descargarMultiples() {
  if (selected.value.length === 0) return;

  try {
    loadingOn();
    
    for (const doc of selected.value) {
      await descargarDocumento(doc);
      await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa entre descargas
    }
    
    $q.notify({
      type: "positive",
      message: `${selected.value.length} documento${selected.value.length !== 1 ? 's' : ''} descargado${selected.value.length !== 1 ? 's' : ''}`,
      timeout: 3000,
      position: "top",
      icon: "download_done",
    });
    
    selected.value = [];
  } catch (e) {
    notifyErr(e);
  } finally {
    loadingOff();
  }
}

async function compartirDocumento(row) {
  try {
    const url = await store.getSignedUrl(row.id);
    
    if (navigator.share) {
      await navigator.share({
        title: row.name,
        text: `Compartir documento: ${row.name}`,
        url: url,
      });
    } else {
      await copiarEnlace(row);
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      notifyErr(e);
    }
  }
}

async function copiarEnlace(row) {
  try {
    const url = await store.getSignedUrl(row.id);
    await navigator.clipboard.writeText(url);
    
    $q.notify({
      type: "positive",
      message: "Enlace copiado al portapapeles",
      timeout: 2000,
      position: "top",
      icon: "link",
    });
  } catch (e) {
    notifyErr(e);
  }
}

function imprimirDocumento() {
  if (!safeUrl.value) return;
  
  const iframe = document.querySelector('.rk-viewer-frame');
  if (iframe?.contentWindow) {
    iframe.contentWindow.print();
  }
}

function imprimirLista() {
  window.print();
}

function exportarCSV() {
  try {
    const headers = ['Nombre', 'Tipo', 'Período', 'Comentario', 'Fecha de carga'];
    const data = rowsFiltradas.value.map(doc => [
      doc.name,
      labelDeTipo(doc.type),
      doc.period || '',
      doc.comment || '',
      fmtDate(doc.createdAt)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `documentos_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    $q.notify({
      type: "positive",
      message: "Lista exportada correctamente",
      timeout: 2000,
      position: "top",
      icon: "download",
    });
  } catch (e) {
    notifyErr(e);
  }
}

/* ====== KPI ====== */
function countByType(t) {
  return rows.value.filter((r) => r.type === t).length;
}

/* ====== UX helpers ====== */
function notifyErr(e) {
  const msg = e?.message || store.error || "Ocurrió un error";
  console.error("[EmployeeSelfDocuments]", e);
  $q.notify({
    type: "negative",
    message: msg,
    position: "top",
    timeout: 5000,
    actions: [{ icon: "close", color: "white" }],
  });
}

function loadingOn() {
  loadingUi.value = true;
}

function loadingOff() {
  loadingUi.value = false;
}
</script>

<style scoped lang="scss">
// ===========================
// Variables y mixins
// ===========================
$transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
$transition-spring: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
$shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
$shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
$shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

@mixin glass-effect($opacity: 0.7) {
  background: rgba(255, 255, 255, $opacity);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
}

@mixin glass-effect-dark($opacity: 0.3) {
  background: rgba(30, 30, 30, $opacity);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
}

// ===========================
// Animaciones
// ===========================
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideInLeft {
  from {
    transform: scaleX(0);
    transform-origin: left;
  }
  to {
    transform: scaleX(1);
    transform-origin: left;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.slide-down-enter-active {
  animation: slideDown 0.3s ease;
}

.slide-down-leave-active {
  animation: slideDown 0.3s ease reverse;
}

.card-list-enter-active {
  animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-list-leave-active {
  animation: scaleIn 0.3s ease reverse;
}

.card-list-move {
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

// ===========================
// Page background
// ===========================
.q-page {
  min-height: 100vh;
  position: relative;
  
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 320px;
    background: linear-gradient(135deg, 
      rgba(25, 118, 210, 0.08) 0%, 
      rgba(156, 39, 176, 0.05) 50%,
      rgba(244, 143, 177, 0.03) 100%
    );
    z-index: 0;
    pointer-events: none;
  }
}

.body--dark .q-page::before {
  background: linear-gradient(135deg, 
    rgba(25, 118, 210, 0.15) 0%, 
    rgba(156, 39, 176, 0.1) 50%,
    rgba(244, 143, 177, 0.05) 100%
  );
}

// ===========================
// Card principal con efecto glass
// ===========================
.rk-docs-card {
  border-radius: 20px;
  position: relative;
  transition: $transition-smooth;
  box-shadow: $shadow-md;
  overflow: hidden;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, 
      #1976d2 0%, 
      #9c27b0 50%, 
      #f48fb1 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  // Header con gradiente sutil
  > .q-card__section:first-child {
    background: linear-gradient(135deg, 
      rgba(25, 118, 210, 0.02) 0%, 
      transparent 100%
    );
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    padding: 24px;
  }
}

.body--dark .rk-docs-card {
  background: rgba(30, 30, 30, 0.85);
  @include glass-effect-dark(0.85);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: $shadow-lg, 0 0 0 1px rgba(255, 255, 255, 0.05);
  
  > .q-card__section:first-child {
    background: linear-gradient(135deg, 
      rgba(25, 118, 210, 0.08) 0%, 
      transparent 100%
    );
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
}

// ===========================
// Avatar mejorado
// ===========================
.q-avatar {
  box-shadow: $shadow-md;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    padding: 2px;
    background: linear-gradient(135deg, #1976d2, #9c27b0);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::after {
    opacity: 1;
  }
}

// ===========================
// Tabs modernos con efecto glassmorphism
// ===========================
.q-tabs {
  background: transparent !important;
}

.q-tabs :deep(.q-tab) {
  padding: 12px 20px;
  border-radius: 12px;
  transition: $transition-smooth;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, 
      rgba(25, 118, 210, 0.05) 0%, 
      rgba(156, 39, 176, 0.03) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  .q-icon {
    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  &:hover .q-icon {
    transform: scale(1.1) rotate(5deg);
  }
}

.q-tabs :deep(.q-tab--active) {
  @include glass-effect(0.8);
  box-shadow: $shadow-sm;
  font-weight: 600;
  
  &::before {
    opacity: 1;
  }
}

.q-tabs :deep(.q-tabs__arrow) {
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0.9), 
    rgba(255, 255, 255, 0)
  );
}

.body--dark .q-tabs :deep(.q-tab) {
  &::before {
    background: linear-gradient(135deg, 
      rgba(25, 118, 210, 0.12) 0%, 
      rgba(156, 39, 176, 0.08) 100%
    );
  }
}

.body--dark .q-tabs :deep(.q-tab--active) {
  @include glass-effect-dark(0.5);
  box-shadow: $shadow-md, inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

// ===========================
// Inputs y controles mejorados
// ===========================
.q-input :deep(.q-field__control),
.q-select :deep(.q-field__control) {
  border-radius: 12px;
  transition: $transition-smooth;
  border: 1px solid transparent;
  
  &::before {
    border: none;
  }
  
  &:hover {
    border-color: rgba(25, 118, 210, 0.3);
    box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.05);
  }
}

.q-input :deep(.q-field__control--focused),
.q-select :deep(.q-field__control--focused) {
  border-color: rgba(25, 118, 210, 0.5) !important;
  box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.1) !important;
}

.body--dark .q-input :deep(.q-field__control),
.body--dark .q-select :deep(.q-field__control) {
  &:hover {
    border-color: rgba(66, 165, 245, 0.4);
    box-shadow: 0 0 0 4px rgba(66, 165, 245, 0.1);
  }
}

.body--dark .q-input :deep(.q-field__control--focused),
.body--dark .q-select :deep(.q-field__control--focused) {
  border-color: rgba(66, 165, 245, 0.6) !important;
  box-shadow: 0 0 0 4px rgba(66, 165, 245, 0.15) !important;
}

// ===========================
// Chips mejorados
// ===========================
.q-chip {
  border-radius: 8px;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: $transition-smooth;
  box-shadow: $shadow-sm;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: $shadow-md;
  }
  
  .q-icon {
    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  &:hover .q-icon {
    transform: scale(1.15) rotate(10deg);
  }
}

// ===========================
// KPI Cards con diseño premium
// ===========================
.rk-kpi {
  border-radius: 16px;
  transition: $transition-spring;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: $shadow-sm;
  
  // Gradiente de fondo sutil
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, 
      rgba(25, 118, 210, 0.02) 0%, 
      rgba(156, 39, 176, 0.01) 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  // Efecto de brillo en hover
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 70%
    );
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
    transition: transform 0.6s ease;
  }
  
  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: $shadow-xl;
    border-color: rgba(25, 118, 210, 0.2);
    
    &::before {
      opacity: 1;
    }
    
    &::after {
      transform: translateX(100%) translateY(100%) rotate(45deg);
    }
    
    .q-icon {
      transform: scale(1.15) rotate(5deg);
      filter: drop-shadow(0 4px 8px rgba(25, 118, 210, 0.3));
    }
  }
  
  &.rk-kpi-active {
    border: 2px solid currentColor;
    box-shadow: $shadow-lg, 0 0 0 4px rgba(25, 118, 210, 0.1);
    transform: scale(1.02);
    
    &::before {
      opacity: 1;
      background: linear-gradient(135deg, 
        rgba(25, 118, 210, 0.08) 0%, 
        rgba(156, 39, 176, 0.05) 100%
      );
    }
    
    .q-icon {
      animation: float 2s ease-in-out infinite;
    }
  }
  
  .q-card__section {
    position: relative;
    z-index: 1;
  }
  
  .q-icon {
    transition: $transition-spring;
  }
  
  .text-h6 {
    font-weight: 700;
    font-size: 1.8rem;
    background: linear-gradient(135deg, #1976d2, #9c27b0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.rk-kpi-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  animation: slideInLeft 0.5s ease;
  box-shadow: 0 -2px 8px rgba(25, 118, 210, 0.3);
}

.body--dark .rk-kpi {
  background: rgba(45, 45, 45, 0.6);
  @include glass-effect-dark(0.6);
  border-color: rgba(255, 255, 255, 0.08);
  
  &::before {
    background: linear-gradient(135deg, 
      rgba(25, 118, 210, 0.08) 0%, 
      rgba(156, 39, 176, 0.05) 100%
    );
  }
  
  &:hover {
    box-shadow: $shadow-2xl, 0 0 0 1px rgba(255, 255, 255, 0.1);
    border-color: rgba(66, 165, 245, 0.4);
  }
  
  &.rk-kpi-active {
    box-shadow: $shadow-xl, 0 0 0 4px rgba(66, 165, 245, 0.15);
  }
  
  .text-h6 {
    background: linear-gradient(135deg, #42a5f5, #ba68c8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

// ===========================
// Document cards premium
// ===========================
.rk-doc-card {
  border-radius: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: $transition-spring;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: $shadow-sm;
  background: white;
  
  // Gradiente decorativo
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      #1976d2 50%, 
      transparent 100%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: $shadow-2xl;
    border-color: rgba(25, 118, 210, 0.2);
    
    &::before {
      opacity: 1;
    }
    
    .q-avatar {
      transform: scale(1.1) rotate(5deg);
      box-shadow: $shadow-lg;
    }
    
    .q-chip {
      transform: scale(1.05);
    }
  }
  
  .q-card__section:first-child {
    flex-grow: 1;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(0, 0, 0, 0.05) 50%, 
        transparent 100%
      );
    }
  }
  
  .q-avatar {
    transition: $transition-spring;
    box-shadow: $shadow-md;
  }
  
  .q-chip {
    transition: $transition-smooth;
  }
}

.body--dark .rk-doc-card {
  background: rgba(45, 45, 45, 0.7);
  @include glass-effect-dark(0.7);
  border-color: rgba(255, 255, 255, 0.08);
  
  &::before {
    background: linear-gradient(90deg, 
      transparent 0%, 
      #42a5f5 50%, 
      transparent 100%
    );
  }
  
  &:hover {
    box-shadow: $shadow-2xl, 0 0 0 1px rgba(255, 255, 255, 0.1);
    border-color: rgba(66, 165, 245, 0.3);
  }
}

// ===========================
// Botones mejorados
// ===========================
.q-btn {
  border-radius: 10px;
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: $transition-smooth;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }
  
  &:active::before {
    width: 300px;
    height: 300px;
  }
  
  &:not(.q-btn--flat):not(.q-btn--outline) {
    box-shadow: $shadow-md;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-lg;
    }
    
    &:active {
      transform: translateY(0);
    }
  }
}

.q-btn-toggle {
  border-radius: 12px;
  padding: 4px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.q-btn-toggle :deep(.q-btn) {
  border-radius: 8px;
}

.q-btn-toggle :deep(.q-btn--active) {
  box-shadow: $shadow-sm;
}

// ===========================
// Table mejorada
// ===========================
.q-table {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: $shadow-md;
}

.q-table :deep(thead tr) {
  background: linear-gradient(135deg, 
    rgba(25, 118, 210, 0.04) 0%, 
    rgba(156, 39, 176, 0.02) 100%
  );
}

.q-table :deep(tbody tr) {
  transition: $transition-smooth;
  
  &:hover {
    background: rgba(25, 118, 210, 0.03);
    transform: scale(1.005);
  }
}

.q-table :deep(td) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.body--dark .q-table :deep(thead tr) {
  background: linear-gradient(135deg, 
    rgba(25, 118, 210, 0.1) 0%, 
    rgba(156, 39, 176, 0.06) 100%
  );
}

.body--dark .q-table :deep(tbody tr:hover) {
  background: rgba(66, 165, 245, 0.08);
}

.body--dark .q-table :deep(td) {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

// ===========================
// Skeleton loader mejorado
// ===========================
.q-skeleton {
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.04) 0%,
    rgba(0, 0, 0, 0.08) 50%,
    rgba(0, 0, 0, 0.04) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
}

.body--dark .q-skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 200% 100%;
}

// ===========================
// Visor de documentos
// ===========================
.rk-docs-viewer {
  background: #0b0b0b;
  color: #fff;
  
  .q-bar {
    @include glass-effect-dark(0.9);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

.rk-viewer-body {
  height: calc(100vh - 50px);
  padding: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
}

.rk-viewer-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: $shadow-2xl;
}

// ===========================
// Loading states
// ===========================
.q-inner-loading {
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
  background: rgba(255, 255, 255, 0.5);
}

.body--dark .q-inner-loading {
  background: rgba(0, 0, 0, 0.6);
}

.q-spinner-gears {
  filter: drop-shadow(0 4px 12px rgba(25, 118, 210, 0.3));
}

// ===========================
// Utilidades de texto
// ===========================
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

// ===========================
// Badge "Nuevo"
// ===========================
.q-badge {
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 0 0 4px rgba(244, 67, 54, 0.2);
}

// ===========================
// Kbd styling
// ===========================
kbd {
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-bottom: 2px solid rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 4px 8px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  font-size: 0.85em;
  box-shadow: $shadow-sm;
}

.body--dark kbd {
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
  border-color: rgba(255, 255, 255, 0.2);
  border-bottom-color: rgba(255, 255, 255, 0.3);
}

// ===========================
// Scrollbar personalizado
// ===========================
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #1976d2, #9c27b0);
  border-radius: 10px;
  
  &:hover {
    background: linear-gradient(135deg, #1565c0, #8e24aa);
  }
}

.body--dark {
  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #42a5f5, #ba68c8);
    
    &:hover {
      background: linear-gradient(135deg, #1e88e5, #ab47bc);
    }
  }
}

// ===========================
// Responsive
// ===========================
@media (max-width: 1024px) {
  .rk-docs-card > .q-card__section:first-child {
    padding: 20px;
  }
}

@media (max-width: 600px) {
  .rk-docs-card {
    border-radius: 16px;
    
    > .q-card__section:first-child {
      padding: 16px;
    }
  }

  .rk-kpi {
    .q-card__section {
      padding: 12px;
    }
    
    .text-h6 {
      font-size: 1.5rem;
    }
  }
  
  .rk-doc-card {
    border-radius: 12px;
  }
}

// ===========================
// Print styles
// ===========================
@media print {
  .q-btn,
  .q-tabs,
  .q-input,
  .q-select,
  .q-chip[removable] {
    display: none !important;
  }

  .rk-docs-card {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }
  
  .rk-doc-card,
  .rk-kpi {
    break-inside: avoid;
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }
}

// ===========================
// Accesibilidad
// ===========================
.rk-doc-card:focus-within,
.rk-kpi:focus-within {
  outline: 3px solid rgba(25, 118, 210, 0.5);
  outline-offset: 2px;
}

// Reduce motion para usuarios sensibles
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// ===========================
// Empty state mejorado
// ===========================
.q-banner {
  border-radius: 16px;
  @include glass-effect(0.6);
  border: 1px dashed rgba(0, 0, 0, 0.1);
  
  .q-icon {
    animation: float 3s ease-in-out infinite;
  }
}

.body--dark .q-banner {
  @include glass-effect-dark(0.4);
  border-color: rgba(255, 255, 255, 0.1);
}
</style>
