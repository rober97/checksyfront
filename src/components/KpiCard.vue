<template>
  <div class="kpi-card" :class="variant">
    <div class="kpi-header">
      <div class="kpi-icon" :style="iconStyle">
        <q-icon :name="icon" size="28px" color="white" />
      </div>
      <div v-if="trend" class="kpi-trend" :class="trend">
        <q-icon 
          :name="trend === 'positive' ? 'trending_up' : 'trending_down'" 
          size="16px" 
        />
        <span v-if="trendValue">{{ trendValue }}%</span>
      </div>
      <div v-if="badge" class="kpi-badge">{{ badge }}</div>
    </div>
    
    <div class="kpi-content">
      <div class="kpi-value" :class="valueClass">
        <span v-if="prefix" class="kpi-prefix">{{ prefix }}</span>
        <span class="kpi-number">{{ formattedValue }}</span>
        <span v-if="suffix" class="kpi-suffix">{{ suffix }}</span>
      </div>
      <div class="kpi-label">{{ title }}</div>
      <div v-if="subtitle" class="kpi-subtitle">{{ subtitle }}</div>
    </div>

    <div v-if="showProgress && progressValue !== undefined" class="kpi-progress">
      <q-linear-progress
        :value="progressValue / 100"
        :color="progressColor"
        size="4px"
        rounded
        class="q-mt-sm"
      />
      <div class="progress-label">
        {{ progressValue }}% completado
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    default: 0
  },
  icon: {
    type: String,
    required: true
  },
  iconGradient: {
    type: String,
    default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  variant: {
    type: String,
    default: '', // 'highlight', 'compact', 'large'
    validator: (value) => ['', 'highlight', 'compact', 'large'].includes(value)
  },
  trend: {
    type: String,
    validator: (value) => ['positive', 'negative', ''].includes(value)
  },
  trendValue: {
    type: Number
  },
  badge: {
    type: [Number, String]
  },
  prefix: {
    type: String,
    default: ''
  },
  suffix: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  formatType: {
    type: String,
    default: 'auto', // 'auto', 'decimal', 'currency', 'percentage', 'compact', 'time'
    validator: (value) => ['auto', 'decimal', 'currency', 'percentage', 'compact', 'time'].includes(value)
  },
  currency: {
    type: String,
    default: 'CLP'
  },
  decimals: {
    type: Number,
    default: 0
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  progressValue: {
    type: Number
  },
  progressColor: {
    type: String,
    default: 'primary'
  }
});

const iconStyle = computed(() => ({
  background: props.iconGradient
}));

const valueClass = computed(() => {
  const classes = [];
  if (props.formatType === 'time') classes.push('time');
  if (props.variant === 'large') classes.push('large');
  if (props.variant === 'compact') classes.push('compact');
  return classes.join(' ');
});

const formattedValue = computed(() => {
  const val = props.value;

  // Si es un string y no es un número, retornarlo tal cual
  if (typeof val === 'string' && isNaN(val)) {
    return val;
  }

  // Convertir a número si es posible
  const numVal = typeof val === 'number' ? val : parseFloat(val);

  if (isNaN(numVal)) {
    return val || '—';
  }

  switch (props.formatType) {
    case 'currency':
      return formatCurrency(numVal);
    
    case 'percentage':
      return `${numVal.toFixed(props.decimals)}`;
    
    case 'compact':
      return formatCompact(numVal);
    
    case 'decimal':
      return formatDecimal(numVal);
    
    case 'time':
      return val; // Los tiempos ya vienen formateados
    
    case 'auto':
    default:
      // Decisión automática basada en el tamaño del número
      if (numVal >= 1000000) {
        return formatCompact(numVal);
      } else if (numVal >= 1000) {
        return formatWithThousands(numVal);
      } else {
        return numVal.toFixed(props.decimals);
      }
  }
});

// Formatear con separador de miles
function formatWithThousands(num) {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals
  }).format(num);
}

// Formatear en formato compacto (1K, 1M, 1B)
function formatCompact(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(props.decimals);
}

// Formatear como moneda
function formatCurrency(num) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: props.currency,
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals
  }).format(num);
}

// Formatear con decimales
function formatDecimal(num) {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals
  }).format(num);
}
</script>

<style lang="scss" scoped>
.kpi-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  .body--dark & {
    background: #2a2a3e;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--q-primary), var(--q-secondary));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);

    &::before {
      transform: scaleX(1);
    }
  }

  &.highlight {
    border: 2px solid var(--q-primary);
    
    .kpi-value {
      color: var(--q-primary);
    }
  }

  &.compact {
    padding: 1rem;
    
    .kpi-icon {
      width: 40px;
      height: 40px;
    }

    .kpi-value {
      font-size: 1.5rem;
    }
  }

  &.large {
    .kpi-value {
      font-size: 2.5rem;
    }
  }
}

.kpi-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.kpi-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.kpi-trend {
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;

  &.positive {
    background: rgba(46, 213, 115, 0.1);
    color: #2ed573;
  }

  &.negative {
    background: rgba(255, 71, 87, 0.1);
    color: #ff4757;
  }
}

.kpi-badge {
  background: #ff4757;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(255, 71, 87, 0.3);
  flex-shrink: 0;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0; /* Importante para que el texto pueda truncarse */
}

.kpi-value {
  font-size: 2rem;
  font-weight: 800;
  color: #2c3e50;
  line-height: 1.2;
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  flex-wrap: wrap;
  word-break: break-word;
  
  .body--dark & {
    color: #ecf0f1;
  }

  &.time {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--q-primary);
  }

  &.large {
    font-size: 2.5rem;
  }

  &.compact {
    font-size: 1.5rem;
  }
}

.kpi-number {
  /* Evita que números muy largos se salgan */
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-prefix,
.kpi-suffix {
  font-size: 0.7em;
  font-weight: 600;
  opacity: 0.7;
}

.kpi-label {
  font-size: 0.875rem;
  color: #7f8c8d;
  font-weight: 500;
  line-height: 1.3;
}

.kpi-subtitle {
  font-size: 0.75rem;
  color: #95a5a6;
  font-weight: 400;
  line-height: 1.3;
}

.kpi-progress {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  
  .body--dark & {
    border-top-color: rgba(255, 255, 255, 0.1);
  }
}

.progress-label {
  font-size: 0.75rem;
  color: #7f8c8d;
  margin-top: 0.5rem;
  text-align: right;
}

/* Responsive */
@media (max-width: 768px) {
  .kpi-card {
    padding: 1rem;
  }

  .kpi-value {
    font-size: 1.75rem;
    
    &.large {
      font-size: 2rem;
    }
  }

  .kpi-icon {
    width: 48px;
    height: 48px;
  }
}
</style>