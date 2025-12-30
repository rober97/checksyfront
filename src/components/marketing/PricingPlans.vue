<template>
  <section id="planes" class="q-px-xl q-py-xl">
    <div class="container">
      <div class="text-center q-mb-xl">
        <div class="rk-kicker">Elige el mejor para ti</div>
        <h2 class="rk-display" style="font-size: clamp(28px,4vw,40px);">Planes</h2>
        <div class="row justify-center items-center q-gutter-sm q-mt-sm">
          <span :class="{'text-weight-bold': !yearly}" class="cursor-pointer" @click="yearly=false">Mensual</span>
          <q-toggle v-model="yearly" color="primary"/>
          <span :class="{'text-weight-bold': yearly}" class="cursor-pointer">Anual <span class="rk-badge">-20%</span></span>
        </div>
      </div>

      <div class="row q-col-gutter-xl">
        <div v-for="(p,i) in viewPlans" :key="i" class="col-12 col-md-4">
          <div class="rk-card rk-plan q-pa-lg" :class="p.popular ? 'popular' : ''">
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-h6 text-weight-bold">{{ p.name }}</div>
              <div v-if="p.popular" class="rk-badge">MÁS POPULAR</div>
            </div>
            <div class="rk-muted q-mb-md">{{ p.desc }}</div>
            <div class="q-mt-sm q-mb-lg">
              <span class="text-h4 text-weight-bold" style="color:#ffe0a3">{{ p.price }}</span>
              <span class="rk-muted">/usuario/mes</span>
            </div>
            <q-list dense>
              <q-item v-for="(it,ix) in p.features" :key="ix">
                <q-item-section avatar><q-icon name="check" color="positive"/></q-item-section>
                <q-item-section>{{ it }}</q-item-section>
              </q-item>
            </q-list>
            <q-btn class="full-width q-mt-lg" :class="p.popular?'rk-cta':'rk-ghost'" :label="p.popular?'Comenzar':'Seleccionar'"/>
          </div>
        </div>
      </div>

      <div class="text-center rk-muted q-mt-xl">
        ¿Necesitas algo a medida? <q-btn flat color="primary" label="Habla con ventas" :to="{path:'/contact'}"/>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
const yearly = ref(false)
const plans = [
  { name:'Básico', desc:'Para equipos pequeños', priceM:29, popular:false,
    features:['Hasta 20 usuarios','Asistencia básica','Reportes mensuales','Soporte por correo'] },
  { name:'Pro', desc:'Empresas en crecimiento', priceM:59, popular:true,
    features:['Hasta 100 usuarios','Asistencia avanzada','Evaluación de desempeño','Integraciones básicas','Soporte prioritario'] },
  { name:'Enterprise', desc:'Organizaciones grandes', priceM:99, popular:false,
    features:['Usuarios ilimitados','Funciones avanzadas','Analítica','Integraciones premium','Soporte 24/7'] },
]
const viewPlans = computed(()=> plans.map(p => ({
  ...p, price: yearly.value ? `$${Math.round(p.priceM*0.8)}` : `$${p.priceM}`
})))
</script>
