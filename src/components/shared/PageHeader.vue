<!-- src/components/shared/PageHeader.vue -->
<template>
  <header class="rk-head" :class="headTone">
    <div class="row items-center justify-between">
      <!-- Izquierda: icono + títulos -->
      <div class="row items-center q-gutter-sm">
        <div v-if="icon" class="rk-logo row items-center justify-center" aria-hidden="true">
          <q-icon :name="icon" size="20px" />
        </div>

        <div class="column">
          <div class="text-h6 text-weight-bold" :class="titleClass">
            {{ title }}
          </div>

          <div v-if="$slots.subtitle || subtitle" class="rk-sub">
            <slot name="subtitle">
              {{ subtitle }}
            </slot>
          </div>
        </div>
      </div>

      <!-- Derecha: acciones + ayuda -->
      <div class="row items-center q-gutter-xs">
        <slot name="actions" />
        <q-btn
          v-if="showHelp"
          dense flat
          :icon="helpIconComputed"
          :label="helpTextComputed"
          class="rk-ghost"
          :to="helpTo || undefined"
          :href="helpHref || undefined"
          target="_blank"
          rel="noopener"
          @click="onOpenHelp"
        />
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  icon: { type: String, default: '' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },

  // Ayuda
  helpText: { type: String, default: '' },      // permite kebab-case: help-text
  helpIcon: { type: String, default: 'help_outline' },
  helpTo:   { type: [String, Object], default: null },  // router-link
  helpHref: { type: String, default: '' },               // link externo
})

const emit = defineEmits(['help'])

const $q = useQuasar()
const headTone   = computed(() => ($q.dark.isActive ? 'text-white' : ''))
const titleClass = computed(() => ($q.dark.isActive ? 'text-white' : 'text-primary'))

const showHelp          = computed(() => !!(props.helpText || props.helpTo || props.helpHref))
const helpTextComputed  = computed(() => props.helpText || 'Ayuda')
const helpIconComputed  = computed(() => props.helpIcon || 'help_outline')

function onOpenHelp () { emit('help') }
</script>

<style scoped>
/* ===== Tokens base ===== */
:root{
  --rk-border: rgba(0,0,0,.08);
  --rk-card: #ffffff;
}
.body--dark{
  --rk-border: rgba(255,255,255,.08);
  --rk-card: #101318;
}

/* ===== Header ===== */
.rk-head{
  flex: 0 0 auto;
  padding: 12px 10px;
  border-radius: 16px;
  margin: 12px;
  margin-bottom: 8px;
  background: linear-gradient(180deg, rgba(120, 120, 120, 0.10), rgba(120, 120, 120, 0.03));
  backdrop-filter: blur(10px) saturate(1.15);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.body--light .rk-head{
  background: linear-gradient(180deg, rgba(33,150,243,0.08), rgba(33,150,243,0.02));
}
.body--dark .rk-head{
  background: linear-gradient(180deg, rgba(33,150,243,0.12), rgba(33,150,243,0.04));
}

/* Icon badge */
.rk-logo{
  width: 36px; height: 36px;
  border-radius: 12px;
  background:
    radial-gradient(circle at 30% 20%, rgba(33,150,243,0.38), rgba(33,150,243,0) 68%);
  border: 1px solid rgba(33,150,243,0.28);
  color: var(--q-primary);
  box-shadow: inset 0 0 16px rgba(33,150,243,0.15);
}

/* Subtítulo */
.rk-sub{
  font-size: .8rem;
  opacity: .82;
  margin-top: -1px;
}
.rk-sub :deep(a){
  color: var(--q-primary);
  text-decoration: none;
  border-bottom: 1px dotted currentColor;
}
.rk-sub :deep(a:hover){ opacity: .9; }

/* Botón fantasma */
.rk-ghost{
  border-radius: 10px;
  transition: transform .08s ease, background .15s ease;
}
.rk-ghost:hover{
  transform: translateY(-1px);
  background: rgba(127,127,127,.06);
}
</style>
