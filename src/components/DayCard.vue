<template>
  <div class="day-container">
    <div class="day-header" @click="toggleExpand">
      <div class="day-header-left">
        <button class="expand-button">
          <q-icon :name="isExpanded ? 'expand_more' : 'chevron_right'" size="24px" />
        </button>
        
        <div class="day-info">
          <div class="day-name">{{ dayName }}</div>
          <div class="day-date">{{ formattedDate }}</div>
        </div>
      </div>

      <div class="day-header-right">
        <div class="day-meta">
          <div class="meta-chip meta-chip--time">
            <q-icon name="schedule" size="16px" />
            <span>{{ totalTime }}</span>
          </div>
          <div class="meta-chip meta-chip--count">
            <q-icon name="receipt" size="16px" />
            <span>{{ recordCount }}</span>
          </div>
          <div
            v-if="photoCount > 0"
            class="meta-chip meta-chip--photos"
            @click.stop="$emit('view-photos')"
          >
            <q-icon name="photo_library" size="16px" />
            <span>{{ photoCount }}</span>
          </div>
        </div>

        <div class="day-actions" @click.stop>
          <q-btn
            flat
            round
            dense
            icon="content_copy"
            @click="$emit('copy')"
            class="action-btn"
          >
            <q-tooltip>Copiar</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="download"
            @click="$emit('download')"
            class="action-btn"
          >
            <q-tooltip>Descargar CSV</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <q-slide-transition>
      <div v-show="isExpanded" class="day-body">
        <slot />
      </div>
    </q-slide-transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  dayName: { type: String, required: true },
  formattedDate: { type: String, required: true },
  totalTime: { type: String, required: true },
  recordCount: { type: Number, required: true },
  photoCount: { type: Number, default: 0 }
});

defineEmits(['copy', 'download', 'view-photos']);

const isExpanded = ref(true);

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}
</script>

<style scoped>
.day-container {
  margin-bottom: 16px;
  border-radius: 20px;
  overflow: hidden;
  background: white;
  border: 2px solid #f1f5f9;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.day-container:hover {
  border-color: #e0e7ff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

body.body--dark .day-container {
  background: rgba(30, 41, 59, 0.4);
  border-color: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
}

body.body--dark .day-container:hover {
  border-color: rgba(99, 102, 241, 0.3);
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  cursor: pointer;
  gap: 20px;
  user-select: none;
  transition: all 0.3s;
}

.day-header:hover {
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.03) 0%, 
    rgba(139, 92, 246, 0.02) 100%);
}

body.body--dark .day-header:hover {
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.08) 0%, 
    rgba(139, 92, 246, 0.04) 100%);
}

.day-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.expand-button {
  width: 40px;
  height: 40px;
  border: none;
  background: #f8fafc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.expand-button:hover {
  background: #f1f5f9;
  color: #334155;
  transform: scale(1.05);
}

body.body--dark .expand-button {
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
}

body.body--dark .expand-button:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
}

.day-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
}

body.body--dark .day-name {
  color: #f1f5f9;
}

.day-date {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.01em;
}

body.body--dark .day-date {
  color: #94a3b8;
}

.day-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.day-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  transition: all 0.3s;
}

.meta-chip--time {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
}

body.body--dark .meta-chip--time {
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.2) 0%, rgba(30, 64, 175, 0.15) 100%);
  color: #93c5fd;
}

.meta-chip--count {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4338ca;
}

body.body--dark .meta-chip--count {
  background: linear-gradient(135deg, rgba(67, 56, 202, 0.2) 0%, rgba(67, 56, 202, 0.15) 100%);
  color: #a5b4fc;
}

.meta-chip--photos {
  background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
  color: #be185d;
  cursor: pointer;
}

body.body--dark .meta-chip--photos {
  background: linear-gradient(135deg, rgba(190, 24, 93, 0.2) 0%, rgba(190, 24, 93, 0.15) 100%);
  color: #f9a8d4;
}

.meta-chip--photos:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(190, 24, 93, 0.3);
}

.day-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 36px;
  height: 36px;
  color: #64748b;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

body.body--dark .action-btn {
  color: #94a3b8;
}

body.body--dark .action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
}

.day-body {
  padding: 0 24px 24px;
}

@media (max-width: 768px) {
  .day-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .day-header-right {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .day-meta {
    width: 100%;
    justify-content: space-between;
  }

  .day-actions {
    justify-content: flex-end;
  }
}
</style>