<template>
  <div class="attendance-row">
    <div class="row-timeline">
      <div :class="['timeline-dot', `timeline-dot--${record.tipo}`]"></div>
      <div class="timeline-line"></div>
    </div>

    <div class="row-content">
      <div class="row-header">
        <div class="row-time">
          <span class="time-value">{{ formatTime(record.timestamp) }}</span>
          <span class="time-period">{{ getTimePeriod(record.timestamp) }}</span>
        </div>

        <div :class="['type-badge', `type-badge--${record.tipo}`]">
          <q-icon :name="record.tipo === 'entrada' ? 'login' : 'logout'" size="16px" />
          <span>{{ capitalize(record.tipo) }}</span>
        </div>
      </div>

      <div class="row-details">
        <div v-if="record.mood" :class="['mood-badge', `mood-badge--${record.mood}`]">
          <q-icon :name="getMoodIcon(record.mood)" size="16px" />
          <span>{{ getMoodLabel(record.mood) }}</span>
        </div>

        <div v-if="record.note" class="note-content">
          <q-icon name="sticky_note_2" size="14px" class="note-icon" />
          <span>{{ record.note }}</span>
        </div>

        <a
          v-if="record.ubicacion?.lat && record.ubicacion?.lng"
          :href="getMapLink(record.ubicacion)"
          target="_blank"
          class="location-link"
          @click.stop
        >
          <q-icon name="place" size="14px" />
          <span>{{ formatLocation(record.ubicacion) }}</span>
        </a>

        <button
          v-if="record.photo"
          class="photo-button"
          @click="$emit('view-photo', record)"
        >
          <q-img
            :src="photoThumb"
            ratio="1"
            fit="cover"
            class="photo-thumb"
            no-spinner
          />
          <div class="photo-overlay">
            <q-icon name="visibility" size="18px" />
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  record: { type: Object, required: true },
  photoThumb: { type: String, default: '' }
});

defineEmits(['view-photo']);

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getTimePeriod(ts) {
  const hour = new Date(ts).getHours();
  return hour < 12 ? 'AM' : 'PM';
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function getMoodIcon(mood) {
  const icons = {
    great: 'sentiment_very_satisfied',
    good: 'sentiment_satisfied',
    ok: 'sentiment_neutral',
    tired: 'sentiment_dissatisfied',
    bad: 'sentiment_very_dissatisfied'
  };
  return icons[mood] || 'sentiment_neutral';
}

function getMoodLabel(mood) {
  const labels = {
    great: 'Excelente',
    good: 'Bien',
    ok: 'Normal',
    tired: 'Cansado',
    bad: 'Mal'
  };
  return labels[mood] || mood;
}

function getMapLink(ubicacion) {
  return `https://maps.google.com/?q=${ubicacion.lat},${ubicacion.lng}`;
}

function formatLocation(ubicacion) {
  const lat = Number(ubicacion.lat).toFixed(4);
  const lng = Number(ubicacion.lng).toFixed(4);
  return `${lat}, ${lng}`;
}
</script>

<style scoped>
.attendance-row {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  transition: all 0.3s;
}

.attendance-row:not(:last-child) {
  border-bottom: 1px solid #f1f5f9;
}

body.body--dark .attendance-row:not(:last-child) {
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

.attendance-row:hover {
  transform: translateX(4px);
}

.row-timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 24px;
  flex-shrink: 0;
}

.timeline-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 2px currentColor;
  flex-shrink: 0;
  z-index: 1;
  transition: all 0.3s;
}

.attendance-row:hover .timeline-dot {
  transform: scale(1.3);
}

.timeline-dot--entrada {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #10b981;
}

.timeline-dot--salida {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ef4444;
}

.timeline-line {
  flex: 1;
  width: 2px;
  background: linear-gradient(to bottom,
    currentColor 0%,
    transparent 100%);
  margin-top: 4px;
  opacity: 0.2;
}

.attendance-row:last-child .timeline-line {
  display: none;
}

.row-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.row-header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.row-time {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.time-value {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
}

body.body--dark .time-value {
  color: #f1f5f9;
}

.time-period {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.type-badge--entrada {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border: 1px solid #6ee7b7;
}

body.body--dark .type-badge--entrada {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%);
  color: #6ee7b7;
  border-color: rgba(110, 231, 183, 0.3);
}

.type-badge--salida {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
  border: 1px solid #fca5a5;
}

body.body--dark .type-badge--salida {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%);
  color: #fca5a5;
  border-color: rgba(252, 165, 165, 0.3);
}

.row-details {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.mood-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.mood-badge--great {
  background: rgba(99, 102, 241, 0.1);
  color: #4338ca;
}

.mood-badge--good {
  background: rgba(16, 185, 129, 0.1);
  color: #065f46;
}

.mood-badge--ok {
  background: rgba(59, 130, 246, 0.1);
  color: #1e40af;
}

.mood-badge--tired {
  background: rgba(245, 158, 11, 0.1);
  color: #92400e;
}

.mood-badge--bad {
  background: rgba(239, 68, 68, 0.1);
  color: #991b1b;
}

.note-content {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
  background: #f8fafc;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

body.body--dark .note-content {
  background: rgba(255, 255, 255, 0.04);
  color: #cbd5e1;
}

.note-icon {
  color: #94a3b8;
  flex-shrink: 0;
}

.location-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  text-decoration: none;
  transition: all 0.3s;
}

.location-link:hover {
  background: rgba(37, 99, 235, 0.15);
  transform: translateY(-1px);
}

body.body--dark .location-link {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.15);
}

.photo-button {
  position: relative;
  width: 48px;
  height: 48px;
  border: 2px solid #e0e7ff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  padding: 0;
  background: transparent;
}

.photo-button:hover {
  border-color: #6366f1;
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
}

body.body--dark .photo-button {
  border-color: rgba(99, 102, 241, 0.3);
}

.photo-thumb {
  width: 100%;
  height: 100%;
}

.photo-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
}

.photo-button:hover .photo-overlay {
  opacity: 1;
}

@media (max-width: 768px) {
  .row-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .row-details {
    flex-direction: column;
    align-items: flex-start;
  }

  .note-content {
    max-width: 100%;
  }
}
</style>