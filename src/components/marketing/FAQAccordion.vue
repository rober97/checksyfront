<template>
  <section class="rk-section q-px-xl q-py-xl" style="background:var(--rk-soft);" id="faq">
    <div class="container">
      <div class="text-center q-mb-xl">
        <div class="rk-kicker">¿Tienes dudas?</div>
        <h2 class="rk-display" style="font-size: clamp(28px,4vw,40px);">Preguntas frecuentes</h2>
      </div>

      <div class="row justify-center">
        <div class="col-12 col-md-8">
          <q-list class="rk-card">
            <q-expansion-item
              v-for="(q,i) in faqs"
              :key="i"
              :label="q.q"
              header-class="text-weight-medium"
              expand-icon="add"
              expanded-icon="remove"
            >
              <q-card flat class="rk-soft"><q-card-section class="rk-muted">{{ q.a }}</q-card-section></q-card>
            </q-expansion-item>
          </q-list>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const faqs = [
  { q:'¿Cómo migrar mis datos?', a:'Te acompañamos con herramientas y soporte dedicado durante el proceso.' },
  { q:'¿Qué métodos de pago aceptan?', a:'Tarjetas principales, transferencias y facturación para empresas.' },
  { q:'¿Es seguro almacenar datos aquí?', a:'Sí. Encriptación, MFA y backups diarios con cumplimiento local.' },
  { q:'¿Puedo cancelar cuando quiera?', a:'Claro. Planes sin amarras ni penalizaciones.' },
]
</script>
