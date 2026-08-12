<!-- src/components/overtime/OvertimeWorkedPanel.vue
     Horas extraordinarias EJECUTADAS: jornada pactada vs trabajada, HE marcada,
     sobretiempo detectado y qué parte está autorizada (y por tanto se paga).
     El pacto previo se gestiona en la pestaña "Autorizaciones".

     La lectura va de lo general a lo accionable: KPIs → qué falta regularizar →
     trabajador → día. Autorizar es la acción principal y se puede hacer sobre
     varios días a la vez, porque regularizar de a uno con 17 días pendientes
     era el verdadero cuello de botella. -->
<template>
  <div class="ot-panel">
    <!-- ===== Toolbar ===== -->
    <div class="rk-toolbar ot-toolbar">
      <!-- Rango con presets -->
      <button class="ot-range-pill">
        <q-icon name="calendar_month" size="16px" />
        <span>{{ rangeLabel }}</span>
        <q-icon name="expand_more" size="16px" class="ot-range-caret" />
        <q-menu anchor="bottom left" self="top left" class="ot-range-menu">
          <div class="ot-range-body">
            <div class="ot-range-presets">
              <button
                v-for="p in RANGE_PRESETS"
                :key="p.key"
                class="ot-preset"
                :class="{ active: activePreset === p.key }"
                @click="applyPreset(p.key)"
              >
                {{ p.label }}
              </button>
            </div>
            <q-separator vertical />
            <q-date
              v-model="pickerRange"
              range
              minimal
              mask="YYYY-MM-DD"
              today-btn
              class="ot-range-cal"
              @update:model-value="onPickRange"
            />
          </div>
        </q-menu>
      </button>

      <!-- Búsqueda -->
      <div class="rk-search-wrap ot-search">
        <q-icon name="search" size="16px" class="rk-search-icon" />
        <input
          v-model="search"
          class="rk-search-input"
          placeholder="Buscar trabajador o RUT…"
          autocomplete="off"
        />
        <transition name="fade">
          <q-icon v-if="search" name="close" size="14px" class="rk-search-clear" @click="search = ''" />
        </transition>
      </div>

      <!-- Sólo días con novedad -->
      <button
        class="ot-chip-toggle"
        :class="{ active: filters.onlyWithOvertime }"
        @click="toggleOnlyWithOvertime"
      >
        <q-icon :name="filters.onlyWithOvertime ? 'filter_alt' : 'filter_alt_off'" size="15px" />
        Sólo con novedades
        <q-tooltip max-width="280px">
          Deja fuera los días trabajados dentro de la jornada pactada. Apágalo para
          ver el detalle completo del período.
        </q-tooltip>
      </button>

      <div class="ot-toolbar-spacer" />

      <span v-if="!loading" class="rk-results-chip">
        <q-icon name="badge" size="13px" />
        {{ visibleRows.length }} {{ visibleRows.length === 1 ? 'trabajador' : 'trabajadores' }}
      </span>

      <button class="rk-btn-icon" :disabled="loading" @click="reload">
        <q-icon name="refresh" size="16px" :class="{ 'ot-spin': loading }" />
        <q-tooltip>Actualizar</q-tooltip>
      </button>
      <button class="rk-btn-icon ot-btn-export" :disabled="!rows.length" @click="exportXlsx">
        <q-icon name="download" size="16px" />
        <q-tooltip>Exportar a Excel</q-tooltip>
      </button>
    </div>

    <!-- ===== KPIs ===== -->
    <div v-if="totals" class="rk-kpi-grid ot-kpis">
      <div class="rk-kpi ot-kpi ot-kpi--exec">
        <div class="ot-kpi-head">
          <div class="kpi-icon-wrap"><q-icon name="timelapse" size="20px" /></div>
          <div class="kpi-label">Horas extra ejecutadas</div>
        </div>
        <div class="kpi-count">{{ hhmm(totals.executedMinutes) }}</div>
        <div class="ot-kpi-sub">
          <span><i class="ot-dot ot-dot--marked" /> {{ hhmm(totals.markedMinutes) }} marcadas</span>
          <span><i class="ot-dot ot-dot--detected" /> {{ hhmm(totals.detectedMinutes) }} detectadas</span>
        </div>
        <div class="kpi-bar"><div class="kpi-bar-fill" style="width: 100%" /></div>
      </div>

      <div class="rk-kpi ot-kpi ot-kpi--payable">
        <div class="ot-kpi-head">
          <div class="kpi-icon-wrap"><q-icon name="paid" size="20px" /></div>
          <div class="kpi-label">Con pacto — se pagan</div>
        </div>
        <div class="kpi-count">{{ hhmm(totals.payableMinutes) }}</div>
        <div class="ot-kpi-sub">
          <span>{{ payablePct }}% de lo ejecutado · recargo legal en la liquidación</span>
        </div>
        <div class="kpi-bar"><div class="kpi-bar-fill" :style="{ width: payablePct + '%' }" /></div>
      </div>

      <div class="rk-kpi ot-kpi ot-kpi--pending" :class="{ 'is-actionable': pendingMinutes > 0 }">
        <div class="ot-kpi-head">
          <div class="kpi-icon-wrap"><q-icon name="gavel" size="20px" /></div>
          <div class="kpi-label">Sin pacto — no se pagan</div>
        </div>
        <div class="kpi-count">{{ hhmm(pendingMinutes) }}</div>
        <div class="ot-kpi-sub">
          <span>{{ totals.daysWithoutPact }} día(s) por regularizar</span>
        </div>
        <div class="kpi-bar"><div class="kpi-bar-fill" :style="{ width: (100 - payablePct) + '%' }" /></div>
      </div>

      <div class="rk-kpi ot-kpi ot-kpi--unscheduled">
        <div class="ot-kpi-head">
          <div class="kpi-icon-wrap"><q-icon name="event_busy" size="20px" /></div>
          <div class="kpi-label">Trabajo en día no pactado</div>
        </div>
        <div class="kpi-count">{{ hhmm(totals.unscheduledMinutes) }}</div>
        <div class="ot-kpi-sub">
          <span>{{ totals.daysUnscheduled }} día(s) de descanso o festivo</span>
        </div>
        <div class="kpi-bar"><div class="kpi-bar-fill" style="width: 100%" /></div>
      </div>
    </div>

    <!-- ===== Incumplimiento del tope diario ===== -->
    <transition name="fade">
      <div v-if="totals && totals.daysOverLegalCap" class="ot-callout ot-callout--danger">
        <div class="ot-callout-icon"><q-icon name="report" size="22px" /></div>
        <div class="ot-callout-text">
          <div class="ot-callout-title">
            {{ totals.daysOverLegalCap }} día(s) por sobre el tope legal de {{ hhmm(heCapMinutes) }} diarias
          </div>
          <div class="ot-callout-msg">
            El Art. 31 CT no permite pactar más de {{ hhmm(heCapMinutes) }} extraordinarias al día.
            Autorizar sólo hasta el tope regulariza el pago, no el exceso de jornada:
            eso se corrige con dotación o turnos.
          </div>
        </div>
        <button class="ot-callout-btn ot-callout-btn--danger" @click="statusFilter = 'overcap'">
          Ver los días
        </button>
      </div>
    </transition>

    <!-- ===== Llamado a la acción ===== -->
    <transition name="fade">
      <div v-if="pendingDays.length" class="ot-callout">
        <div class="ot-callout-icon"><q-icon name="pending_actions" size="22px" /></div>
        <div class="ot-callout-text">
          <div class="ot-callout-title">
            {{ pendingDays.length }} día(s) trabajados sobre la jornada sin autorización previa
          </div>
          <div class="ot-callout-msg">
            La ley exige pacto (Art. 32 CT): esas {{ hhmm(pendingMinutes) }} no entran a la
            liquidación hasta que las autorices.
          </div>
        </div>
        <button class="ot-callout-btn" @click="selectAllPending">
          <q-icon name="task_alt" size="16px" />
          Revisar y autorizar
        </button>
      </div>
    </transition>

    <!-- ===== Filtro por estado ===== -->
    <div class="ot-statusbar">
      <div class="rk-status-tabs">
        <button
          v-for="f in statusFilters"
          :key="f.key"
          class="rk-tab"
          :class="{ active: statusFilter === f.key }"
          @click="statusFilter = f.key"
        >
          {{ f.label }}
          <span v-if="f.count != null" class="ot-tab-count" :class="f.tone">{{ f.count }}</span>
        </button>
      </div>
    </div>

    <!-- ===== Tabla por trabajador ===== -->
    <div class="rk-table-wrap ot-table-wrap">
      <!-- Skeleton -->
      <div v-if="loading" class="rk-skeleton-list">
        <div v-for="n in 5" :key="n" class="rk-skeleton-row">
          <div class="skel skel-avatar" />
          <div class="skel skel-text" style="flex: 1.4" />
          <div class="skel skel-text" style="flex: 2" />
          <div class="skel skel-text skel-short" />
          <div class="skel skel-badge" />
        </div>
      </div>

      <!-- Vacío -->
      <div v-else-if="!visibleRows.length" class="rk-empty">
        <div class="rk-empty-icon"><q-icon name="schedule" size="52px" /></div>
        <div class="rk-empty-title">
          {{ rows.length ? 'Nada que mostrar con este filtro' : 'Sin horas extraordinarias' }}
        </div>
        <div class="rk-empty-msg">
          {{
            rows.length
              ? 'Ajusta la búsqueda o el filtro de estado para ver el resto del período.'
              : 'En el rango elegido nadie trabajó sobre su jornada pactada ni en días de descanso.'
          }}
        </div>
      </div>

      <table v-else class="rk-table ot-table">
        <thead>
          <tr>
            <th class="rk-th ot-th-expand" />
            <th class="rk-th sortable" @click="toggleSort('name')">
              <span class="th-content">Trabajador <q-icon :name="sortIcon('name')" size="13px" :class="{ active: sortBy === 'name' }" /></span>
            </th>
            <th class="rk-th ot-th-dist">Reparto del período</th>
            <th class="rk-th rk-th--right sortable" @click="toggleSort('executed')">
              <span class="th-content">Ejecutadas <q-icon :name="sortIcon('executed')" size="13px" :class="{ active: sortBy === 'executed' }" /></span>
            </th>
            <th class="rk-th rk-th--right sortable" @click="toggleSort('payable')">
              <span class="th-content">Se pagan <q-icon :name="sortIcon('payable')" size="13px" :class="{ active: sortBy === 'payable' }" /></span>
            </th>
            <th class="rk-th rk-th--right sortable" @click="toggleSort('unscheduled')">
              <span class="th-content">Día no pactado <q-icon :name="sortIcon('unscheduled')" size="13px" :class="{ active: sortBy === 'unscheduled' }" /></span>
            </th>
            <th class="rk-th rk-th--right">Estado</th>
          </tr>
        </thead>

        <tbody>
          <template v-for="(row, idx) in visibleRows" :key="row.userId">
            <tr
              class="rk-tr ot-tr"
              :class="{ 'is-open': isExpanded(row.userId) }"
              :style="{ animationDelay: Math.min(idx, 12) * 22 + 'ms' }"
              @click="toggleExpand(row.userId)"
            >
              <td class="rk-td ot-td-expand">
                <q-icon
                  name="chevron_right"
                  size="18px"
                  class="ot-chevron"
                  :class="{ 'is-open': isExpanded(row.userId) }"
                />
              </td>

              <td class="rk-td">
                <div class="ot-user">
                  <div class="ot-avatar" :style="{ background: avatarColor(row.fullName) }">
                    {{ initials(row.fullName) }}
                  </div>
                  <div>
                    <div class="ot-user-name">{{ row.fullName }}</div>
                    <div class="ot-user-rut rk-mono">{{ row.rut || '—' }}</div>
                  </div>
                </div>
              </td>

              <!-- Reparto: dónde están las horas de este trabajador -->
              <td class="rk-td">
                <div v-if="row._dist.total > 0" class="ot-dist">
                  <div class="ot-dist-bar">
                    <div
                      v-for="seg in row._dist.segments"
                      :key="seg.key"
                      class="ot-dist-seg"
                      :class="`ot-dist-seg--${seg.key}`"
                      :style="{ width: seg.pct + '%' }"
                    >
                      <q-tooltip>{{ seg.label }}: {{ hhmm(seg.minutes) }}</q-tooltip>
                    </div>
                  </div>
                  <div class="ot-dist-legend">
                    <span v-for="seg in row._dist.segments" :key="seg.key" :class="`ot-legend ot-legend--${seg.key}`">
                      <i class="ot-dot" /> {{ hhmm(seg.minutes) }}
                    </span>
                  </div>
                </div>
                <span v-else class="rk-muted">Sin horas fuera de la jornada</span>
              </td>

              <td class="rk-td rk-td--right">
                <div class="ot-num">{{ hhmm(row.totals.executedMinutes) }}</div>
                <div class="ot-num-sub">
                  {{ hhmm(row.totals.markedMinutes) }} marc. · {{ hhmm(row.totals.detectedMinutes) }} det.
                </div>
              </td>

              <td class="rk-td rk-td--right">
                <div class="ot-num" :class="row.totals.payableMinutes > 0 ? 'is-ok' : 'is-muted'">
                  {{ hhmm(row.totals.payableMinutes) }}
                </div>
              </td>

              <td class="rk-td rk-td--right">
                <div class="ot-num" :class="row.totals.unscheduledMinutes > 0 ? 'is-extra' : 'is-muted'">
                  {{ hhmm(row.totals.unscheduledMinutes) }}
                </div>
                <div v-if="row.totals.daysUnscheduled" class="ot-num-sub">
                  {{ row.totals.daysUnscheduled }} día(s)
                  <q-tooltip max-width="320px">{{ unscheduledCauseHint(row) }}</q-tooltip>
                </div>
              </td>

              <td class="rk-td rk-td--right">
                <div class="ot-row-actions">
                  <span v-if="row.art22" class="rk-badge ot-badge--neutral">
                    Art. 22
                    <q-tooltip>Trabajador sin fiscalización de jornada: no genera horas extraordinarias.</q-tooltip>
                  </span>
                  <template v-else-if="row._pendingDays.length">
                    <span class="rk-badge ot-badge--warn">
                      <i class="badge-dot" />{{ row._pendingDays.length }} sin pacto
                    </span>
                    <button class="ot-btn-authorize" @click.stop="openGrant(row._pendingDays)">
                      <q-icon name="task_alt" size="15px" />
                      Autorizar
                    </button>
                  </template>
                  <span v-else-if="row.totals.executedMinutes" class="rk-badge ot-badge--ok">
                    <i class="badge-dot" />Todo autorizado
                  </span>
                  <span v-else class="rk-muted">—</span>
                </div>
              </td>
            </tr>

            <!-- Detalle diario -->
            <tr v-if="isExpanded(row.userId)" :key="`${row.userId}-detail`" class="ot-detail-tr">
              <td class="rk-td ot-detail-td" colspan="7">
                <div class="ot-days">
                  <div class="ot-days-head">
                    <div class="ot-days-title">
                      Detalle diario
                      <span class="ot-days-count">{{ row._visibleDays.length }} día(s)</span>
                    </div>
                    <button
                      v-if="row._pendingDays.length"
                      class="ot-linkbtn"
                      @click.stop="toggleWorkerSelection(row)"
                    >
                      <q-icon :name="allPendingSelected(row) ? 'check_box' : 'check_box_outline_blank'" size="16px" />
                      Seleccionar los {{ row._pendingDays.length }} días sin pacto
                    </button>
                  </div>

                  <div
                    v-for="d in row._visibleDays"
                    :key="d.dayKey"
                    class="ot-day"
                    :class="[`ot-day--${d.status.toLowerCase()}`, { 'is-selected': isSelected(row.userId, d.dayKey) }]"
                  >
                    <div class="ot-day-check">
                      <q-checkbox
                        v-if="canRegularize(d)"
                        :model-value="isSelected(row.userId, d.dayKey)"
                        dense
                        size="xs"
                        @update:model-value="toggleDay(row, d)"
                        @click.stop
                      />
                    </div>

                    <div class="ot-day-date">
                      <div class="ot-day-weekday">{{ weekdayOf(d.dayKey) }}</div>
                      <div class="ot-day-num">{{ dayNumOf(d.dayKey) }}</div>
                    </div>

                    <!-- Jornada pactada vs trabajada -->
                    <div class="ot-day-bar-wrap">
                      <div class="ot-day-bar">
                        <div
                          v-for="seg in d._bar.segments"
                          :key="seg.key"
                          class="ot-daybar-seg"
                          :class="`ot-daybar-seg--${seg.key}`"
                          :style="{ width: seg.pct + '%' }"
                        >
                          <q-tooltip>{{ seg.label }}: {{ hhmm(seg.minutes) }}</q-tooltip>
                        </div>
                        <div
                          v-if="d._bar.markerPct != null"
                          class="ot-daybar-marker"
                          :style="{ left: d._bar.markerPct + '%' }"
                        >
                          <q-tooltip>Jornada pactada: {{ hhmm(d.expectedMinutes) }}</q-tooltip>
                        </div>
                      </div>
                      <div class="ot-day-meta">
                        <span v-if="d.expectedMinutes === null" class="rk-muted">Sin jornada asignada</span>
                        <span v-else>Pactada {{ hhmm(d.expectedMinutes) }}</span>
                        <span class="ot-sep">·</span>
                        <span>Trabajada {{ hhmm(d.workedMinutes) }}</span>
                        <!-- HE marcada: el trabajador la declaró como tal al marcar,
                             y no es lo mismo que el sobretiempo detectado por el sistema. -->
                        <template v-if="d.markedMinutes > 0">
                          <span class="ot-sep">·</span>
                          <span class="ot-meta-marked">
                            HE marcada {{ hhmm(d.markedMinutes) }}
                            <q-icon v-if="!d.markedAuthorized" name="info" size="13px">
                              <q-tooltip>Marcada como HE pero sin autorización previa al momento de marcar.</q-tooltip>
                            </q-icon>
                          </span>
                        </template>
                        <span v-if="d.scheduleName" class="ot-sep">·</span>
                        <span v-if="d.scheduleName" class="rk-muted">
                          {{ d.scheduleName }} ({{ sourceLabel(d.expectedSource) }})
                        </span>
                      </div>
                    </div>

                    <div class="ot-day-figures">
                      <div v-if="d.executedMinutes > 0" class="ot-figure">
                        <span class="ot-figure-val">+{{ hhmm(d.executedMinutes) }}</span>
                        <span class="ot-figure-lbl">sobre jornada</span>
                      </div>
                      <div v-else-if="d.unscheduledMinutes > 0" class="ot-figure is-extra">
                        <span class="ot-figure-val">{{ hhmm(d.unscheduledMinutes) }}</span>
                        <span class="ot-figure-lbl">día no pactado</span>
                      </div>
                      <div v-if="d.authorizedMinutes > 0" class="ot-figure is-ok">
                        <span class="ot-figure-val">{{ hhmm(d.authorizedMinutes) }}</span>
                        <span class="ot-figure-lbl">autorizadas</span>
                      </div>
                    </div>

                    <div class="ot-day-status">
                      <span class="rk-badge" :class="`ot-badge--${statusMeta(d.status).tone}`">
                        <i class="badge-dot" />{{ dayStatusLabel(d) }}
                        <q-tooltip max-width="320px">
                          {{ statusMeta(d.status).hint }}
                          <template v-if="d.status === 'SIN_JORNADA' && UNSCHEDULED_CAUSE[d.expectedSource]">
                            <br />{{ UNSCHEDULED_CAUSE[d.expectedSource] }}
                          </template>
                        </q-tooltip>
                      </span>
                      <span v-if="d.overLegalCap" class="rk-badge ot-badge--danger ot-cap-badge">
                        <q-icon name="report" size="14px" />
                        Sobre el tope
                        <q-tooltip max-width="340px">
                          Trabajó <b>{{ hhmm(d.excessMinutes) }}</b> sobre su jornada pactada y el
                          Art. 31 CT no permite más de {{ hhmm(heCapMinutes) }} extraordinarias al día.
                          <template v-if="toleranceMinutes && d.excessMinutes !== d.executedMinutes">
                            <br /><br />
                            Se registran {{ hhmm(d.executedMinutes) }} como horas extra porque la empresa
                            aplica {{ toleranceMinutes }} min de tolerancia, que es un criterio interno:
                            no corre para el tope legal.
                          </template>
                        </q-tooltip>
                      </span>
                    </div>

                    <div class="ot-day-action">
                      <button
                        v-if="canRegularize(d)"
                        class="ot-btn-ghost"
                        @click.stop="openGrant([{ row, day: d }])"
                      >
                        <q-icon :name="d.authorizationId ? 'tune' : 'add_task'" size="15px" />
                        {{ d.authorizationId ? 'Ajustar' : 'Autorizar' }}
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- ===== Barra de selección múltiple ===== -->
    <transition name="ot-slide-up">
      <div v-if="selectedList.length" class="ot-bulkbar">
        <div class="ot-bulk-info">
          <span class="ot-bulk-count">{{ selectedList.length }}</span>
          <div>
            <div class="ot-bulk-title">
              {{ selectedList.length === 1 ? 'día seleccionado' : 'días seleccionados' }}
            </div>
            <div class="ot-bulk-sub">{{ hhmm(selectedMinutes) }} por autorizar</div>
          </div>
        </div>
        <button class="ot-linkbtn" @click="clearSelection">Limpiar</button>
        <button class="ot-btn-primary" @click="openGrant(selectedList)">
          <q-icon name="task_alt" size="17px" />
          Autorizar seleccionados
        </button>
      </div>
    </transition>

    <!-- ===== Diálogo de autorización ===== -->
    <q-dialog v-model="grantDialog.open" persistent>
      <div class="ot-modal">
        <div class="ot-modal-head">
          <div class="ot-modal-icon"><q-icon name="gavel" size="20px" /></div>
          <div>
            <div class="ot-modal-title">
              {{ grantItems.length === 1 ? 'Autorizar horas extra' : `Autorizar ${grantItems.length} días` }}
            </div>
            <div class="ot-modal-sub">
              Es un acto del empleador: queda en la bitácora y se notifica al trabajador.
            </div>
          </div>
          <q-btn flat round dense icon="close" class="ot-modal-close" v-close-popup />
        </div>

        <div class="ot-modal-body">
          <div class="ot-modal-list">
            <div v-for="it in grantItems" :key="it.key" class="ot-modal-item">
              <div class="ot-modal-item-main">
                <div class="ot-modal-item-name">{{ it.fullName }}</div>
                <div class="ot-modal-item-day">
                  {{ prettyDay(it.dayKey) }} · ejecutadas {{ hhmm(it.executedMinutes) }}
                  <span v-if="it.replaceId" class="ot-modal-item-tag">reemplaza la autorización vigente</span>
                </div>
              </div>
              <div class="ot-modal-item-input">
                <input
                  v-model.number="it.maxMinutes"
                  type="number"
                  class="ot-minutes-input"
                  :min="1"
                  :max="heCapMinutes"
                />
                <span class="ot-minutes-unit">min</span>
              </div>
              <button class="ot-modal-item-drop" @click="dropItem(it.key)">
                <q-icon name="close" size="15px" />
                <q-tooltip>Quitar de esta autorización</q-tooltip>
              </button>
            </div>
          </div>

          <div v-if="cappedCount" class="ot-modal-note ot-modal-note--warn">
            <q-icon name="report" size="17px" />
            <span>
              {{ cappedCount }} día(s) superan el tope legal de {{ heCapMinutes }} min (Art. 31 CT):
              se propone autorizar hasta el tope. El exceso no se paga como hora extra.
            </span>
          </div>

          <label class="ot-field">
            <span class="ot-field-label">Motivo</span>
            <input
              v-model="grantDialog.reason"
              class="ot-field-input"
              maxlength="300"
              placeholder="Ej: cierre de inventario / regularización a posteriori"
            />
          </label>

          <div class="ot-modal-total">
            <span>Total a autorizar</span>
            <strong>{{ hhmm(grantTotalMinutes) }}</strong>
          </div>
        </div>

        <div class="ot-modal-foot">
          <button class="ot-btn-ghost" v-close-popup>Cancelar</button>
          <button class="ot-btn-primary" :disabled="granting || !grantItems.length" @click="submitGrant">
            <q-spinner v-if="granting" size="16px" />
            <q-icon v-else name="task_alt" size="17px" />
            {{ granting ? grantProgressLabel : 'Confirmar autorización' }}
          </button>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useOvertimeReportStore } from '@/stores/overtimeReport'
import { useLegalParamsStore } from '@/stores/legalParams'
import { useOvertimeAuthStore } from '@/stores/overtimeAuth'

// Autorizar desde aquí también cambia el historial de la otra pestaña: quien
// nos monta decide si lo refresca.
const emit = defineEmits(['granted'])

const $q = useQuasar()
const store = useOvertimeReportStore()
const authStore = useOvertimeAuthStore()
const legalParams = useLegalParamsStore()

// Tope diario de HE: parámetro legal con vigencia servido por el backend.
const heCapMinutes = computed(() => legalParams.value('HE_TOPE_DIARIO', 120))

const loading = computed(() => store.loading)
const rows = computed(() => store.rows)
const totals = computed(() => store.totals)

// Tolerancia efectivamente aplicada por el backend en este reporte. Se muestra
// donde explica una diferencia, no como parámetro suelto.
const toleranceMinutes = computed(() => Number(store.meta?.toleranceMinutes || 0))

/* ── Formato ── */
function hhmm(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0))
  if (!m) return '0h'
  const h = Math.floor(m / 60)
  const rest = m % 60
  if (!h) return `${rest}m`
  return rest ? `${h}h ${rest}m` : `${h}h`
}

function isoDay(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function dateOf(dayKey) {
  const [y, m, d] = String(dayKey).split('-').map(Number)
  return new Date(y, m - 1, d)
}

function prettyDay(dayKey) {
  if (!dayKey) return '—'
  return dateOf(dayKey).toLocaleDateString('es-CL', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function weekdayOf(dayKey) {
  return dateOf(dayKey).toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '')
}

function dayNumOf(dayKey) {
  const d = dateOf(dayKey)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

const AVATAR_COLORS = ['#0893AA', '#6366f1', '#8b5cf6', '#059669', '#d97706', '#0ea5e9', '#e11d48']
function avatarColor(name = '') {
  let h = 0
  for (const ch of String(name)) h = (h + ch.charCodeAt(0)) % 997
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

/* ── Rango de fechas ── */
const today = new Date()
const filters = reactive({
  from: isoDay(new Date(today.getFullYear(), today.getMonth(), 1)),
  to: isoDay(today),
  onlyWithOvertime: true,
})

const RANGE_PRESETS = [
  { key: 'thisMonth', label: 'Este mes' },
  { key: 'lastMonth', label: 'Mes pasado' },
  { key: 'last30', label: 'Últimos 30 días' },
  { key: 'thisWeek', label: 'Esta semana' },
]
const activePreset = ref('thisMonth')
const pickerRange = ref({ from: filters.from, to: filters.to })

function presetRange(key) {
  const now = new Date()
  switch (key) {
    case 'lastMonth': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: isoDay(first), to: isoDay(last) }
    }
    case 'last30': {
      const first = new Date(now)
      first.setDate(first.getDate() - 29)
      return { from: isoDay(first), to: isoDay(now) }
    }
    case 'thisWeek': {
      // Semana laboral chilena: parte el lunes.
      const first = new Date(now)
      first.setDate(first.getDate() - ((first.getDay() + 6) % 7))
      return { from: isoDay(first), to: isoDay(now) }
    }
    default:
      return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: isoDay(now) }
  }
}

function applyPreset(key) {
  const r = presetRange(key)
  activePreset.value = key
  filters.from = r.from
  filters.to = r.to
  pickerRange.value = { from: r.from, to: r.to }
  reload()
}

// q-date en modo rango devuelve string cuando se hace un solo click y objeto
// cuando se cierra el rango: sólo recargamos con el rango completo.
function onPickRange(val) {
  if (!val) return
  if (typeof val === 'string') {
    pickerRange.value = { from: val, to: val }
    return
  }
  activePreset.value = 'custom'
  filters.from = val.from
  filters.to = val.to
  reload()
}

const rangeLabel = computed(() => {
  const fmt = (k) => dateOf(k).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
  const preset = RANGE_PRESETS.find((p) => p.key === activePreset.value)
  const range = `${fmt(filters.from)} – ${fmt(filters.to)}`
  return preset ? `${preset.label} · ${range}` : range
})

function toggleOnlyWithOvertime() {
  filters.onlyWithOvertime = !filters.onlyWithOvertime
  reload()
}

/* ── Estados de un día ── */
function statusMeta(status) {
  return (
    {
      OK: { tone: 'ok', label: 'Autorizada', hint: 'Lo ejecutado está dentro del tope autorizado: se paga con recargo del 50%.' },
      PARCIAL: { tone: 'warn', label: 'Excede lo autorizado', hint: 'Se trabajó más de lo autorizado. Sólo se paga hasta el tope; ajusta la autorización para cubrir el resto.' },
      SIN_PACTO: { tone: 'danger', label: 'Sin pacto', hint: 'Se trabajó sobre la jornada sin autorización previa. No se paga hasta que RR.HH. lo autorice.' },
      SIN_JORNADA: { tone: 'extra', label: 'Día no pactado', hint: 'Trabajó en un día sin jornada pactada (descanso, festivo o turno no programado). No es hora extra automáticamente: revisa el descanso compensatorio (Art. 38 CT).' },
      ART22: { tone: 'neutral', label: 'Art. 22', hint: 'Trabajador excluido de la limitación de jornada: no genera horas extraordinarias.' },
      SIN_HE: { tone: 'neutral', label: 'Sin HE', hint: 'Jornada dentro de lo pactado.' },
    }[status] || { tone: 'neutral', label: status, hint: '' }
  )
}

/** Etiqueta del día. "Día no pactado" a secas no dice qué hacer; el motivo sí. */
const UNSCHEDULED_SHORT = {
  none: 'Sin horario asignado',
  oncall_unscheduled: 'Turno no programado',
  rest_day: 'Día de descanso',
  holiday: 'Feriado trabajado',
}

function dayStatusLabel(d) {
  if (d.status !== 'SIN_JORNADA') return statusMeta(d.status).label
  return UNSCHEDULED_SHORT[d.expectedSource] || statusMeta(d.status).label
}

function sourceLabel(source) {
  return (
    {
      scheduled_shift: 'turno programado',
      schedule_weekly: 'plantilla semanal',
      holiday: 'feriado',
      rest_day: 'día de descanso',
      oncall_unscheduled: 'turnos por demanda, sin turno ese día',
      none: 'sin horario asignado',
    }[source] || source
  )
}

/**
 * Por qué el trabajador tiene días sin jornada pactada. No es lo mismo un
 * domingo trabajado de verdad (que exige descanso compensatorio) que un
 * trabajador al que nadie le programó la malla: el primero es un hecho laboral,
 * el segundo es un dato faltante que además impide detectar sobretiempo.
 */
const UNSCHEDULED_CAUSE = {
  none: 'No tiene horario asignado: mientras no lo tenga, no hay jornada contra la cual medir sobretiempo.',
  oncall_unscheduled: 'Trabaja por turnos programados y esos días no estaban en la malla mensual.',
  rest_day: 'Su plantilla no cubre esos días. Si su contrato es por turnos rotativos, la jornada debe venir de la programación mensual.',
  holiday: 'Trabajó en día feriado: corresponde descanso compensatorio (Art. 38 CT).',
}

function unscheduledCauseHint(row) {
  const sources = new Set((row.days || []).filter((d) => d.status === 'SIN_JORNADA').map((d) => d.expectedSource))
  const causes = [...sources].map((s) => UNSCHEDULED_CAUSE[s]).filter(Boolean)
  // Varias causas distintas en el mismo rango: mejor no elegir una y que el
  // detalle diario lo aclare, que afirmar la equivocada.
  if (causes.length !== 1) return 'Revisa el detalle diario para ver el motivo de cada día.'
  return causes[0]
}

function canRegularize(d) {
  return d.status === 'SIN_PACTO' || d.status === 'PARCIAL'
}

/* ── Reparto por trabajador y barra diaria ── */
function distributionOf(row) {
  const t = row.totals
  const pending = Math.max(0, t.executedMinutes - t.payableMinutes)
  const raw = [
    { key: 'payable', label: 'Con pacto — se pagan', minutes: t.payableMinutes },
    { key: 'pending', label: 'Sin pacto — no se pagan', minutes: pending },
    { key: 'unscheduled', label: 'Día no pactado', minutes: t.unscheduledMinutes },
  ].filter((s) => s.minutes > 0)
  const total = raw.reduce((a, s) => a + s.minutes, 0)
  return { total, segments: raw.map((s) => ({ ...s, pct: total ? (s.minutes / total) * 100 : 0 })) }
}

/**
 * Barra de un día: jornada ordinaria, lo que se paga y lo que espera pacto,
 * con una marca en la jornada pactada para que el exceso se vea, no se calcule.
 */
function dayBar(d) {
  const expected = d.expectedMinutes === null ? 0 : d.expectedMinutes
  if (d.status === 'SIN_JORNADA') {
    return {
      markerPct: null,
      segments: [{ key: 'unscheduled', label: 'Trabajo en día no pactado', minutes: d.unscheduledMinutes, pct: 100 }],
    }
  }
  const ordinary = Math.min(d.workedMinutes, expected || d.workedMinutes)
  const payable = d.payableMinutes
  const pending = Math.max(0, d.executedMinutes - payable)
  const scale = Math.max(expected, ordinary + payable + pending) || 1
  const raw = [
    { key: 'ordinary', label: 'Jornada ordinaria', minutes: ordinary },
    { key: 'payable', label: 'Autorizadas — se pagan', minutes: payable },
    { key: 'pending', label: 'Sin pacto — no se pagan', minutes: pending },
  ].filter((s) => s.minutes > 0)
  return {
    markerPct: expected > 0 ? Math.min(100, (expected / scale) * 100) : null,
    segments: raw.map((s) => ({ ...s, pct: (s.minutes / scale) * 100 })),
  }
}

/* ── Filtro, búsqueda y orden ── */
const search = ref('')
const statusFilter = ref('all')
const sortBy = ref('executed')
const sortDir = ref('desc')

function toggleSort(key) {
  if (sortBy.value === key) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortBy.value = key
    sortDir.value = 'desc'
  }
}

function sortIcon(key) {
  if (sortBy.value !== key) return 'unfold_more'
  return sortDir.value === 'desc' ? 'arrow_downward' : 'arrow_upward'
}

// Filas enriquecidas: reparto, días pendientes y días visibles según el filtro.
const enrichedRows = computed(() =>
  rows.value.map((row) => {
    const pendingDays = (row.days || []).filter(canRegularize).map((day) => ({ row, day }))
    const dayFilter = {
      pending: canRegularize,
      unscheduled: (d) => d.status === 'SIN_JORNADA',
      overcap: (d) => d.overLegalCap,
    }[statusFilter.value]
    const visibleDays = (dayFilter ? (row.days || []).filter(dayFilter) : row.days || []).map((d) => ({
      ...d,
      _bar: dayBar(d),
    }))
    return { ...row, _dist: distributionOf(row), _pendingDays: pendingDays, _visibleDays: visibleDays }
  })
)

const visibleRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  let out = enrichedRows.value.filter((r) => {
    if (q && !`${r.fullName} ${r.rut || ''}`.toLowerCase().includes(q)) return false
    if (statusFilter.value === 'pending') return r._pendingDays.length > 0
    if (statusFilter.value === 'unscheduled') return r.totals.daysUnscheduled > 0
    if (statusFilter.value === 'overcap') return r.totals.daysOverLegalCap > 0
    if (statusFilter.value === 'ok') return r.totals.executedMinutes > 0 && !r._pendingDays.length
    return true
  })
  const dir = sortDir.value === 'desc' ? -1 : 1
  const val = (r) =>
    ({
      name: r.fullName,
      executed: r.totals.executedMinutes,
      payable: r.totals.payableMinutes,
      unscheduled: r.totals.unscheduledMinutes,
    })[sortBy.value]
  out = [...out].sort((a, b) => {
    const va = val(a)
    const vb = val(b)
    if (typeof va === 'string') return dir * va.localeCompare(vb)
    return dir * (va - vb)
  })
  return out
})

const pendingDays = computed(() => enrichedRows.value.flatMap((r) => r._pendingDays))
const pendingMinutes = computed(() =>
  totals.value ? Math.max(0, totals.value.executedMinutes - totals.value.payableMinutes) : 0
)
const payablePct = computed(() => {
  const t = totals.value
  if (!t || !t.executedMinutes) return 0
  return Math.round((t.payableMinutes / t.executedMinutes) * 100)
})

const statusFilters = computed(() => {
  const overCap = enrichedRows.value.filter((r) => r.totals.daysOverLegalCap).length
  return [
    { key: 'all', label: 'Todos', count: enrichedRows.value.length, tone: 'neutral' },
    { key: 'pending', label: 'Por autorizar', count: enrichedRows.value.filter((r) => r._pendingDays.length).length, tone: 'warn' },
    { key: 'unscheduled', label: 'Día no pactado', count: enrichedRows.value.filter((r) => r.totals.daysUnscheduled).length, tone: 'extra' },
    // La pestaña del tope legal sólo aparece cuando hay algo que mirar: es una
    // infracción, no una categoría permanente del reporte.
    ...(overCap ? [{ key: 'overcap', label: 'Sobre el tope legal', count: overCap, tone: 'danger' }] : []),
    { key: 'ok', label: 'Al día', count: enrichedRows.value.filter((r) => r.totals.executedMinutes > 0 && !r._pendingDays.length).length, tone: 'ok' },
  ]
})

/* ── Expansión de filas ── */
const expanded = ref(new Set())
function isExpanded(userId) {
  return expanded.value.has(String(userId))
}
function toggleExpand(userId) {
  const next = new Set(expanded.value)
  const k = String(userId)
  if (next.has(k)) next.delete(k)
  else next.add(k)
  expanded.value = next
}

/* ── Selección múltiple de días ── */
const selected = ref({}) // key `userId|dayKey` → { row, day }

function keyOf(userId, dayKey) {
  return `${userId}|${dayKey}`
}
function isSelected(userId, dayKey) {
  return !!selected.value[keyOf(userId, dayKey)]
}
function toggleDay(row, day) {
  const k = keyOf(row.userId, day.dayKey)
  const next = { ...selected.value }
  if (next[k]) delete next[k]
  else next[k] = { row, day }
  selected.value = next
}
function allPendingSelected(row) {
  return row._pendingDays.length > 0 && row._pendingDays.every((p) => isSelected(row.userId, p.day.dayKey))
}
function toggleWorkerSelection(row) {
  const next = { ...selected.value }
  const all = allPendingSelected(row)
  for (const p of row._pendingDays) {
    const k = keyOf(row.userId, p.day.dayKey)
    if (all) delete next[k]
    else next[k] = p
  }
  selected.value = next
}
function selectAllPending() {
  const next = {}
  for (const p of pendingDays.value) next[keyOf(p.row.userId, p.day.dayKey)] = p
  selected.value = next
  // Abrir el detalle de los afectados: seleccionar sin mostrar qué se seleccionó
  // deja al usuario firmando a ciegas.
  expanded.value = new Set(pendingDays.value.map((p) => String(p.row.userId)))
  statusFilter.value = 'pending'
}
function clearSelection() {
  selected.value = {}
}

const selectedList = computed(() => Object.values(selected.value))
const selectedMinutes = computed(() => selectedList.value.reduce((a, p) => a + p.day.executedMinutes, 0))

/* ── Autorización (individual o masiva) ── */
const granting = ref(false)
const grantProgress = ref('')
const grantItems = ref([])
const grantDialog = reactive({ open: false, reason: '' })

function openGrant(pairs) {
  grantItems.value = pairs.map(({ row, day }) => ({
    key: keyOf(row.userId, day.dayKey),
    userId: row.userId,
    fullName: row.fullName,
    dayKey: day.dayKey,
    executedMinutes: day.executedMinutes,
    // Propuesta: cubrir lo ejecutado, topeado al máximo legal vigente.
    maxMinutes: Math.min(heCapMinutes.value, Math.max(1, Math.round(day.executedMinutes))),
    replaceId: day.authorizationId || null,
  }))
  grantDialog.reason = 'Regularización a posteriori'
  grantDialog.open = true
}

function dropItem(key) {
  grantItems.value = grantItems.value.filter((it) => it.key !== key)
  if (!grantItems.value.length) grantDialog.open = false
}

const cappedCount = computed(
  () => grantItems.value.filter((it) => it.executedMinutes > heCapMinutes.value).length
)
const grantTotalMinutes = computed(() =>
  grantItems.value.reduce((a, it) => a + (Number(it.maxMinutes) || 0), 0)
)
const grantProgressLabel = computed(() => grantProgress.value || 'Autorizando…')

async function submitGrant() {
  const invalid = grantItems.value.find(
    (it) => !Number.isFinite(Number(it.maxMinutes)) || it.maxMinutes < 1 || it.maxMinutes > heCapMinutes.value
  )
  if (invalid) {
    $q.notify({
      type: 'warning',
      message: `Los minutos de cada día deben estar entre 1 y ${heCapMinutes.value}`,
      position: 'top-right',
    })
    return
  }

  granting.value = true
  grantProgress.value = ''
  try {
    const payload = grantItems.value.map((it) => ({
      userId: it.userId,
      dayKey: it.dayKey,
      maxMinutes: Number(it.maxMinutes),
      reason: grantDialog.reason || '',
      replaceId: it.replaceId,
    }))
    const { ok, failed } = await authStore.grantMany(payload, (done, total) => {
      if (total > 1) grantProgress.value = `Autorizando ${done}/${total}…`
    })

    grantDialog.open = false
    clearSelection()

    if (ok && !failed.length) {
      $q.notify({
        type: 'positive',
        message:
          ok === 1
            ? 'Horas extra autorizadas. Se notificó al trabajador.'
            : `${ok} días autorizados. Se notificó a los trabajadores.`,
        position: 'top-right',
      })
    } else if (ok && failed.length) {
      $q.notify({
        type: 'warning',
        message: `${ok} autorizadas, ${failed.length} con error: ${failed[0].message}`,
        position: 'top-right',
        timeout: 7000,
      })
    } else {
      $q.notify({
        type: 'negative',
        message: failed[0]?.message || 'No se pudo autorizar',
        position: 'top-right',
      })
    }
    if (ok) emit('granted')
    await reload()
  } finally {
    granting.value = false
    grantProgress.value = ''
  }
}

/* ── Carga ── */
async function reload() {
  clearSelection()
  try {
    await store.fetchSummary({
      from: filters.from,
      to: filters.to,
      onlyWithOvertime: filters.onlyWithOvertime ? 'true' : '',
    })
  } catch {
    $q.notify({ type: 'negative', message: store.error || 'No se pudo cargar el reporte', position: 'top-right' })
  }
}

async function exportXlsx() {
  try {
    await store.exportSummary({ from: filters.from, to: filters.to })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo exportar', position: 'top-right' })
  }
}

onMounted(async () => {
  legalParams.fetch()
  await reload()
})

defineExpose({ reload })
</script>

<style scoped>
/* Las primitivas compartidas con el panel de Autorizaciones (.ot-panel,
   .ot-range-pill, .ot-user, .ot-badge--*, .ot-modal…) viven en
   src/css/overtime.css. Aquí sólo lo propio del reporte de ejecutadas. */

/* ── Toolbar ── */
.ot-toolbar {
  flex-wrap: wrap;
}

.ot-toolbar-spacer {
  flex: 1;
}

.ot-search {
  min-width: 230px;
}

.ot-chip-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--rk-c-border);
  border-radius: 10px;
  background: var(--rk-c-surface-2);
  color: var(--rk-c-text-2);
  cursor: pointer;
  white-space: nowrap;
  font-family: var(--app-font-sans);
  font-size: 12.5px;
  font-weight: 600;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.ot-chip-toggle.active {
  border-color: transparent;
  background: var(--rk-c-primary-soft);
  color: var(--rk-c-primary);
}

.ot-btn-export {
  border-color: color-mix(in srgb, var(--rk-c-ok) 25%, transparent);
  background: var(--rk-c-ok-soft);
  color: var(--rk-c-ok);
}

/* ── KPIs ── */
.ot-kpi {
  gap: 8px;
}

.ot-kpi-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ot-kpi .kpi-label {
  margin-top: 0;
  letter-spacing: 0.4px;
  text-transform: none;
  font-size: 12.5px;
  font-weight: 600;
}

.ot-kpi .kpi-count {
  font-size: 26px;
}

.ot-kpi-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  color: var(--rk-c-text-2);
  font-size: 11.5px;
}

.ot-kpi-sub .ot-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  background: var(--rk-c-text-3);
}

.ot-dot--marked {
  background: var(--rk-c-primary) !important;
}

.ot-dot--detected {
  background: var(--rk-c-alt) !important;
}

.ot-kpi--exec {
  --kpi-c: var(--rk-c-primary);
  --kpi-cl: var(--rk-c-primary-soft);
}

.ot-kpi--payable {
  --kpi-c: var(--rk-c-ok);
  --kpi-cl: var(--rk-c-ok-soft);
}

.ot-kpi--payable .kpi-count {
  color: var(--rk-c-ok);
}

.ot-kpi--pending {
  --kpi-c: var(--rk-c-warn);
  --kpi-cl: var(--rk-c-warn-soft);
}

.ot-kpi--pending.is-actionable {
  border-color: color-mix(in srgb, var(--rk-c-warn) 35%, transparent);
}

.ot-kpi--pending .kpi-count {
  color: var(--rk-c-warn);
}

.ot-kpi--unscheduled {
  --kpi-c: var(--rk-c-extra);
  --kpi-cl: var(--rk-c-extra-soft);
}

.ot-kpi--unscheduled .kpi-count {
  color: var(--rk-c-extra);
}

/* ── Llamado a la acción ── */
.ot-callout {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--rk-c-warn) 30%, transparent);
  border-radius: var(--app-radius-md);
  background: var(--rk-c-warn-soft);
}

.ot-callout-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--rk-c-warn) 18%, transparent);
  color: var(--rk-c-warn);
}

.ot-callout-text {
  flex: 1;
  min-width: 0;
}

.ot-callout-title {
  color: var(--rk-c-text);
  font-size: 14px;
  font-weight: 700;
}

.ot-callout-msg {
  margin-top: 2px;
  color: var(--rk-c-text-2);
  font-size: 12.5px;
}

.ot-callout-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  padding: 9px 16px;
  border: none;
  border-radius: 10px;
  background: var(--rk-c-warn);
  color: #fff;
  cursor: pointer;
  font-family: var(--app-font-sans);
  font-size: 13px;
  font-weight: 600;
  transition: transform 0.15s, box-shadow 0.15s;
}

.ot-callout-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--rk-c-warn) 40%, transparent);
}

/* El tope legal no es un pendiente de gestión: es un incumplimiento. */
.ot-callout--danger {
  border-color: color-mix(in srgb, var(--rk-c-danger) 30%, transparent);
  background: var(--rk-c-danger-soft);
}

.ot-callout--danger .ot-callout-icon {
  background: color-mix(in srgb, var(--rk-c-danger) 18%, transparent);
  color: var(--rk-c-danger);
}

.ot-callout-btn--danger {
  background: var(--rk-c-danger);
}

.ot-callout-btn--danger:hover {
  box-shadow: 0 6px 18px color-mix(in srgb, var(--rk-c-danger) 40%, transparent);
}

/* ── Filtro por estado ── */
.ot-statusbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ot-tab-count {
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--rk-c-border);
  color: inherit;
  font-size: 11px;
  font-weight: 700;
}

.ot-tab-count.warn {
  background: var(--rk-c-warn-soft);
  color: var(--rk-c-warn);
}

.ot-tab-count.extra {
  background: var(--rk-c-extra-soft);
  color: var(--rk-c-extra);
}

.ot-tab-count.ok {
  background: var(--rk-c-ok-soft);
  color: var(--rk-c-ok);
}

.ot-tab-count.danger {
  background: var(--rk-c-danger-soft);
  color: var(--rk-c-danger);
}

/* ── Tabla ── */
.ot-table-wrap {
  overflow-x: auto;
}

.ot-table {
  min-width: 980px;
}

.ot-th-expand {
  width: 40px;
}

.ot-th-dist {
  width: 26%;
}

.ot-tr {
  cursor: pointer;
}

.ot-tr.is-open {
  background: var(--rk-c-surface-2);
}

.ot-td-expand {
  padding-right: 0;
}

.ot-chevron {
  color: var(--rk-c-text-3);
  transition: transform 0.18s, color 0.18s;
}

.ot-chevron.is-open {
  transform: rotate(90deg);
  color: var(--rk-c-primary);
}

/* Reparto */
.ot-dist-bar {
  display: flex;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--rk-c-border);
}

.ot-dist-seg {
  height: 100%;
  transition: width 0.4s ease;
}

.ot-dist-seg--payable {
  background: var(--rk-c-ok);
}

.ot-dist-seg--pending {
  background: var(--rk-c-warn);
}

.ot-dist-seg--unscheduled {
  background: var(--rk-c-extra);
}

.ot-dist-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 12px;
  margin-top: 6px;
  font-size: 11.5px;
  font-weight: 600;
}

.ot-legend .ot-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  vertical-align: middle;
}

.ot-legend--payable {
  color: var(--rk-c-ok);
}

.ot-legend--payable .ot-dot {
  background: var(--rk-c-ok);
}

.ot-legend--pending {
  color: var(--rk-c-warn);
}

.ot-legend--pending .ot-dot {
  background: var(--rk-c-warn);
}

.ot-legend--unscheduled {
  color: var(--rk-c-extra);
}

.ot-legend--unscheduled .ot-dot {
  background: var(--rk-c-extra);
}

/* Cifras */
.ot-num {
  font-family: var(--app-font-display);
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
}

.ot-num.is-ok {
  color: var(--rk-c-ok);
}

.ot-num.is-extra {
  color: var(--rk-c-extra);
}

.ot-num.is-muted {
  color: var(--rk-c-text-3);
  font-weight: 600;
}

.ot-num-sub {
  margin-top: 2px;
  color: var(--rk-c-text-3);
  font-size: 11px;
  white-space: nowrap;
}

.ot-row-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.ot-btn-authorize {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 9px;
  background: var(--rk-c-primary);
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
  font-family: var(--app-font-sans);
  font-size: 12.5px;
  font-weight: 600;
  transition: transform 0.15s, box-shadow 0.15s;
}

.ot-btn-authorize:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 14px color-mix(in srgb, var(--rk-c-primary) 40%, transparent);
}

/* ── Detalle diario ── */
.ot-detail-tr {
  background: var(--rk-c-surface-2);
}

.ot-detail-td {
  padding: 0 16px 16px 52px;
}

.ot-days {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ot-days-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 4px 0 8px;
}

.ot-days-title {
  color: var(--rk-c-text-3);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.ot-days-count {
  margin-left: 6px;
  color: var(--rk-c-text-2);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
}

.ot-linkbtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--rk-c-primary);
  cursor: pointer;
  font-family: var(--app-font-sans);
  font-size: 12.5px;
  font-weight: 600;
}

.ot-linkbtn:hover {
  background: var(--rk-c-primary-soft);
}

.ot-day {
  display: grid;
  grid-template-columns: 30px 62px minmax(160px, 1fr) 180px 170px 108px;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--rk-c-border);
  border-left: 3px solid var(--rk-c-border);
  border-radius: 12px;
  background: var(--rk-c-surface);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.ot-day--sin_pacto {
  border-left-color: var(--rk-c-danger);
}

.ot-day--parcial {
  border-left-color: var(--rk-c-warn);
}

.ot-day--ok {
  border-left-color: var(--rk-c-ok);
}

.ot-day--sin_jornada {
  border-left-color: var(--rk-c-extra);
}

.ot-day.is-selected {
  border-color: var(--rk-c-primary);
  box-shadow: 0 0 0 3px var(--rk-c-primary-soft);
}

.ot-day-date {
  text-align: center;
}

.ot-day-weekday {
  color: var(--rk-c-text-3);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.ot-day-num {
  font-family: var(--app-font-display);
  font-size: 14px;
  font-weight: 700;
}

.ot-day-bar {
  position: relative;
  display: flex;
  height: 10px;
  overflow: visible;
  border-radius: 999px;
  background: var(--rk-c-border);
}

.ot-daybar-seg {
  height: 100%;
}

.ot-daybar-seg:first-child {
  border-top-left-radius: 999px;
  border-bottom-left-radius: 999px;
}

.ot-daybar-seg:last-child {
  border-top-right-radius: 999px;
  border-bottom-right-radius: 999px;
}

.ot-daybar-seg--ordinary {
  background: color-mix(in srgb, var(--rk-c-primary) 45%, transparent);
}

.ot-daybar-seg--payable {
  background: var(--rk-c-ok);
}

.ot-daybar-seg--pending {
  background: var(--rk-c-warn);
}

.ot-daybar-seg--unscheduled {
  background: var(--rk-c-extra);
}

.ot-daybar-marker {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  border-radius: 2px;
  background: var(--rk-c-text);
  opacity: 0.55;
}

.ot-day-meta {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  color: var(--rk-c-text-2);
  font-size: 11.5px;
}

.ot-sep {
  color: var(--rk-c-text-3);
}

.ot-meta-marked {
  color: var(--rk-c-primary);
  font-weight: 600;
}

.ot-day-figures {
  display: flex;
  gap: 16px;
}

.ot-figure {
  display: flex;
  flex-direction: column;
}

.ot-figure-val {
  font-family: var(--app-font-display);
  font-size: 14px;
  font-weight: 700;
}

.ot-figure-lbl {
  color: var(--rk-c-text-3);
  font-size: 10.5px;
  white-space: nowrap;
}

.ot-figure.is-ok .ot-figure-val {
  color: var(--rk-c-ok);
}

.ot-figure.is-extra .ot-figure-val {
  color: var(--rk-c-extra);
}

.ot-day-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ot-cap-badge {
  gap: 4px;
  cursor: help;
}

.ot-day-action {
  text-align: right;
}

/* ── Barra de acción masiva ── */
.ot-bulkbar {
  position: fixed;
  left: 50%;
  bottom: 26px;
  z-index: 3000;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 12px 16px;
  transform: translateX(-50%);
  border: 1px solid var(--rk-c-border);
  border-radius: 16px;
  background: var(--rk-c-surface);
  box-shadow: var(--app-shadow-lg);
  backdrop-filter: blur(14px);
}

.ot-bulk-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ot-bulk-count {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: var(--rk-c-primary-soft);
  color: var(--rk-c-primary);
  font-family: var(--app-font-display);
  font-size: 15px;
  font-weight: 700;
}

.ot-bulk-title {
  font-size: 13px;
  font-weight: 700;
}

.ot-bulk-sub {
  color: var(--rk-c-text-2);
  font-size: 12px;
}

.ot-slide-up-enter-active,
.ot-slide-up-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.ot-slide-up-enter-from,
.ot-slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 14px);
}

/* ── Diálogo de autorización (la carcasa .ot-modal es compartida) ── */
.ot-modal-list {
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ot-modal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--surface-soft);
}

.ot-modal-item-main {
  flex: 1;
  min-width: 0;
}

.ot-modal-item-name {
  font-size: 13.5px;
  font-weight: 600;
}

.ot-modal-item-day {
  margin-top: 1px;
  color: var(--text-secondary);
  font-size: 12px;
}

.ot-modal-item-tag {
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--color-warning-soft);
  color: var(--color-warning);
  font-size: 10.5px;
  font-weight: 700;
}

.ot-modal-item-input {
  display: flex;
  align-items: center;
  gap: 5px;
}

.ot-minutes-input {
  width: 74px;
  padding: 6px 9px;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--card-background);
  color: var(--text-primary);
  outline: none;
  text-align: right;
  font-family: var(--app-font-mono);
  font-size: 13px;
}

.ot-minutes-input:focus {
  border-color: var(--color-primary);
}

.ot-minutes-unit {
  color: var(--text-muted);
  font-size: 12px;
}

.ot-modal-item-drop {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.ot-modal-item-drop:hover {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.ot-modal-note {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 11px 13px;
  border-radius: 12px;
  font-size: 12.5px;
  line-height: 1.45;
}

.ot-modal-note--warn {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.ot-field {
  display: block;
}

.ot-field-label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.ot-field-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--surface-soft);
  color: var(--text-primary);
  outline: none;
  font-family: var(--app-font-sans);
  font-size: 13.5px;
}

.ot-field-input:focus {
  border-color: var(--color-primary);
}

.ot-modal-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
}

.ot-modal-total strong {
  font-family: var(--app-font-display);
  font-size: 17px;
}

/* ── Responsive ── */
@media (max-width: 1100px) {
  .ot-day {
    grid-template-columns: 30px 56px minmax(140px, 1fr) 150px;
    row-gap: 8px;
  }

  .ot-day-status,
  .ot-day-action {
    grid-column: 3 / -1;
    text-align: left;
  }
}

@media (max-width: 700px) {
  .ot-detail-td {
    padding-left: 16px;
  }

  .ot-day {
    grid-template-columns: 30px 56px 1fr;
  }

  .ot-day-figures,
  .ot-day-status,
  .ot-day-action {
    grid-column: 2 / -1;
  }

  .ot-bulkbar {
    left: 12px;
    right: 12px;
    bottom: 12px;
    transform: none;
  }

  .ot-slide-up-enter-from,
  .ot-slide-up-leave-to {
    transform: translateY(14px);
  }

  .ot-callout {
    flex-wrap: wrap;
  }
}
</style>
