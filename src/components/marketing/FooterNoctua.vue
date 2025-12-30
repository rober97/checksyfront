<template>
  <footer class="rk-footer q-px-xl q-py-xl">
    <div class="container">
      <div class="row q-col-gutter-xl">

        <div class="col-12 col-md-4">
          <div class="row items-center q-mb-sm">
            <div class="rk-logo q-mr-sm flex flex-center" style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#221608,var(--rk-primary));">
              <q-icon name="bolt" color="white" size="16px"/>
            </div>
            <div class="text-weight-bold">Recksy</div>
          </div>
          <div class="rk-muted q-mb-lg">Plataforma integral para gestión de equipos.</div>
          <div class="row q-gutter-xs">
            <q-btn round flat icon="mdi-instagram" color="grey-5"/>
            <q-btn round flat icon="mdi-linkedin" color="grey-5"/>
            <q-btn round flat icon="mdi-twitter" color="grey-5"/>
          </div>
        </div>

        <div class="col-6 col-md-2" v-for="(g,i) in groups" :key="i">
          <div class="text-weight-bold q-mb-sm">{{ g.title }}</div>
          <q-list dense>
            <q-item v-for="(l,ix) in g.links" :key="ix" clickable v-ripple :to="l.to" class="q-px-none">
              <q-item-section class="rk-muted">{{ l.label }}</q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>

      <q-separator class="q-my-lg" color="grey-9"/>
      <div class="row items-center justify-between rk-muted">
        <div>© 2025 Recksy. Todos los derechos reservados.</div>
        <div class="rk-chip">Hecho con ♥ en LATAM</div>
      </div>
    </div>
  </footer>
</template>

<script setup>
const groups = [
  { title:'Producto', links:[{label:'Características',to:'#funciones'},{label:'Planes',to:'#planes'},{label:'Demo',to:'/demo'},{label:'Actualizaciones',to:'/updates'}]},
  { title:'Recursos', links:[{label:'Blog',to:'/blog'},{label:'Guías',to:'/guides'},{label:'Webinars',to:'/webinars'},{label:'Ayuda',to:'/help'}]},
  { title:'Empresa',  links:[{label:'Nosotros',to:'/about'},{label:'Carreras',to:'/careers'},{label:'Socios',to:'/partners'},{label:'Contacto',to:'/contact'}]},
  { title:'Legal',    links:[{label:'Privacidad',to:'/privacy'},{label:'Términos',to:'/terms'},{label:'Seguridad',to:'/security'},{label:'Cookies',to:'/cookies'}]},
]
</script>
