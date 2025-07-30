<template>
  <q-page class="home-page flex flex-column">
    <!-- Header moderno -->
    <q-header elevated class="bg-white text-primary">
      <q-toolbar class="q-px-lg">
        <q-toolbar-title class="row items-center">
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg" />
          </q-avatar>
          <span class="q-ml-sm text-weight-bold">Recksy</span>
        </q-toolbar-title>

        <!-- Menú desktop -->
        <div class="gt-sm">
          <q-btn flat label="Inicio" to="/" />
          <q-btn flat label="Cómo Funciona" to="/#como-funciona" />
          <q-btn flat label="Características" to="/#funciones" />
          <q-btn flat label="Planes" to="/#planes" />
          <q-btn flat label="Contacto" to="/#contacto" />
        </div>

        <!-- Acciones desktop -->
        <div class="gt-sm row q-gutter-sm">
          <q-btn color="primary" unelevated label="Ingresar" to="/login" />
          <q-btn
            color="secondary"
            unelevated
            label="Registrarse"
            to="/register"
          />
        </div>

        <!-- Menú móvil -->
        <q-btn
          flat
          @click="drawer = !drawer"
          round
          dense
          icon="menu"
          class="lt-md"
        />
      </q-toolbar>
    </q-header>

    <!-- Menú móvil -->
    <q-drawer v-model="drawer" side="right" overlay bordered>
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item clickable v-ripple to="/">
            <q-item-section>Inicio</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/#como-funciona">
            <q-item-section>Cómo Funciona</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/#funciones">
            <q-item-section>Características</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/#planes">
            <q-item-section>Planes</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/#contacto">
            <q-item-section>Contacto</q-item-section>
          </q-item>

          <q-separator class="q-my-md" />

          <q-item clickable v-ripple to="/login">
            <q-item-section>
              <q-btn
                color="primary"
                unelevated
                label="Ingresar"
                class="full-width"
              />
            </q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/register">
            <q-item-section>
              <q-btn
                color="secondary"
                unelevated
                label="Registrarse"
                class="full-width"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- Contenido principal -->
    <div class="main-content flex-grow">
      <!-- Hero section -->
      <section class="hero-section bg-primary text-white">
        <div class="container q-px-xl q-py-xl row items-center justify-between">
          <div class="col-md-6 col-sm-12 q-pr-lg">
            <h1 class="text-h2 text-weight-bold q-mb-md">
              Transforma la gestión
              <span class="text-secondary">de tu equipo</span>
            </h1>
            <p class="text-h6 q-mb-xl">
              La plataforma todo-en-uno que combina asistencia, desempeño y
              bienestar laboral en una solución intuitiva.
            </p>
            <div class="row q-gutter-md">
              <q-btn
                color="white"
                text-color="primary"
                unelevated
                label="Comenzar Gratis"
                to="/register"
                size="lg"
              />
              <q-btn
                outline
                color="white"
                label="Ver Demo"
                to="/demo"
                size="lg"
              />
            </div>
          </div>
          <div class="col-md-6 col-sm-12 gt-sm">
            <q-img
              src="https://cdn.quasar.dev/img/parallax2.jpg"
              class="rounded-borders shadow-10"
              style="
                transform: perspective(1000px) rotateY(-10deg);
                transition: transform 0.5s ease;
              "
              @mouseover="
                $event.target.style.transform =
                  'perspective(1000px) rotateY(0deg)'
              "
              @mouseout="
                $event.target.style.transform =
                  'perspective(1000px) rotateY(-10deg)'
              "
            />
          </div>
        </div>
      </section>

      <!-- Sección de pasos -->
      <section id="como-funciona" class="q-px-xl q-py-xl">
        <div class="container">
          <div class="text-center q-mb-xl">
            <p class="text-uppercase text-weight-bold text-grey-7">
              Proceso simple
            </p>
            <h2 class="text-h3 text-weight-bold q-mt-sm q-mb-md">
              Cómo funciona Recksy
            </h2>
            <p class="text-h6 text-grey-8">
              En solo 3 pasos podrás tener todo tu equipo gestionado
              eficientemente
            </p>
          </div>

          <div class="row q-col-gutter-xl">
            <div class="col-md-4 col-sm-12">
              <q-card class="text-center q-pa-lg" flat bordered>
                <div class="text-primary text-h4 q-mb-md">1</div>
                <q-icon
                  name="person_add"
                  size="xl"
                  color="primary"
                  class="q-mb-md"
                />
                <h3 class="text-h5 text-weight-bold q-mb-sm">
                  Registra tu equipo
                </h3>
                <p class="text-grey-7">
                  Agrega a todos tus colaboradores de manera sencilla con
                  nuestro asistente de configuración.
                </p>
              </q-card>
            </div>

            <div class="col-md-4 col-sm-12">
              <q-card class="text-center q-pa-lg" flat bordered>
                <div class="text-primary text-h4 q-mb-md">2</div>
                <q-icon
                  name="settings"
                  size="xl"
                  color="primary"
                  class="q-mb-md"
                />
                <h3 class="text-h5 text-weight-bold q-mb-sm">
                  Configura tus reglas
                </h3>
                <p class="text-grey-7">
                  Personaliza horarios, políticas de asistencia y parámetros de
                  evaluación según tus necesidades.
                </p>
              </q-card>
            </div>

            <div class="col-md-4 col-sm-12">
              <q-card class="text-center q-pa-lg" flat bordered>
                <div class="text-primary text-h4 q-mb-md">3</div>
                <q-icon
                  name="insights"
                  size="xl"
                  color="primary"
                  class="q-mb-md"
                />
                <h3 class="text-h5 text-weight-bold q-mb-sm">
                  Monitorea y mejora
                </h3>
                <p class="text-grey-7">
                  Accede a dashboards en tiempo real y recibe alertas para tomar
                  acciones proactivas.
                </p>
              </q-card>
            </div>
          </div>
        </div>
      </section>

      <!-- Sección de características -->
      <section id="funciones" class="bg-grey-2 q-px-xl q-py-xl">
        <div class="container">
          <div class="text-center q-mb-xl">
            <p class="text-uppercase text-weight-bold text-grey-7">
              Potencia tu gestión
            </p>
            <h2 class="text-h3 text-weight-bold q-mt-sm q-mb-md">
              Características destacadas
            </h2>
          </div>

          <div class="row q-col-gutter-xl">
            <div
              class="col-md-4 col-sm-6 col-xs-12"
              v-for="(feature, index) in features"
              :key="index"
            >
              <q-card class="q-pa-lg" flat bordered>
                <q-icon
                  :name="feature.icon"
                  size="xl"
                  color="primary"
                  class="q-mb-md"
                />
                <h3 class="text-h5 text-weight-bold q-mb-sm">
                  {{ feature.title }}
                </h3>
                <p class="text-grey-7">{{ feature.description }}</p>
              </q-card>
            </div>
          </div>
        </div>
      </section>

      <!-- Sección de demo -->
      <section class="q-px-xl q-py-xl">
        <div class="container row items-center q-col-gutter-xl">
          <div class="col-md-6 col-sm-12">
            <h2 class="text-h3 text-weight-bold q-mb-md">
              Experimenta Recksy en acción
            </h2>
            <p class="text-h6 text-grey-8 q-mb-xl">
              Prueba nuestra demo interactiva y descubre cómo puede transformar
              la gestión de tu equipo.
            </p>
            <q-btn
              color="primary"
              unelevated
              label="Probar Demo"
              to="/demo"
              size="lg"
            />
          </div>
          <div class="col-md-6 col-sm-12">
            <q-card class="cursor-pointer" flat bordered>
              <q-img
                src="https://cdn.quasar.dev/img/mountains.jpg"
                ratio="16/9"
              >
                <div
                  class="absolute-full flex flex-center bg-black bg-opacity-20"
                >
                  <q-icon name="play_circle" size="xl" color="white" />
                </div>
              </q-img>
            </q-card>
          </div>
        </div>
      </section>

      <!-- Sección de precios -->
      <section id="planes" class="bg-white q-px-xl q-py-xl">
        <div class="container">
          <div class="text-center q-mb-xl">
            <p class="text-uppercase text-weight-bold text-grey-7">
              Elige el mejor para ti
            </p>
            <h2 class="text-h3 text-weight-bold q-mt-sm q-mb-md">
              Nuestros planes
            </h2>
            <div class="row justify-center items-center q-gutter-md">
              <span
                :class="{ 'text-weight-bold': !yearlyBilling }"
                class="cursor-pointer"
                >Mensual</span
              >
              <q-toggle v-model="yearlyBilling" color="primary" />
              <span
                :class="{ 'text-weight-bold': yearlyBilling }"
                class="cursor-pointer"
              >
                Anual <q-badge rounded color="secondary">-20%</q-badge>
              </span>
            </div>
          </div>

          <div class="row q-col-gutter-xl">
            <div
              class="col-md-4 col-sm-12"
              v-for="(plan, index) in pricingPlans"
              :key="index"
            >
              <q-card
                class="q-pa-none"
                flat
                bordered
                :class="{ 'popular-plan': plan.popular }"
              >
                <q-card-section class="q-pa-lg">
                  <div v-if="plan.popular" class="popular-badge text-center">
                    MÁS POPULAR
                  </div>
                  <h3 class="text-h5 text-weight-bold">{{ plan.name }}</h3>
                  <p class="text-grey-7">{{ plan.description }}</p>

                  <div class="q-mt-lg q-mb-xl">
                    <span class="text-h3 text-weight-bold">{{
                      plan.price
                    }}</span>
                    <span class="text-grey-7">/mes por usuario</span>
                  </div>

                  <q-list dense>
                    <q-item v-for="(item, i) in plan.features" :key="i">
                      <q-item-section avatar>
                        <q-icon name="check" color="primary" />
                      </q-item-section>
                      <q-item-section>{{ item }}</q-item-section>
                    </q-item>
                  </q-list>

                  <q-btn
                    :color="plan.popular ? 'primary' : 'white'"
                    :text-color="plan.popular ? 'white' : 'primary'"
                    :outline="!plan.popular"
                    unelevated
                    label="Seleccionar"
                    class="full-width q-mt-lg"
                    size="lg"
                  />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <div class="text-center q-mt-xl">
            <p class="text-grey-7 q-mb-md">
              ¿Necesitas una solución personalizada para tu empresa?
            </p>
            <q-btn
              flat
              color="primary"
              label="Contacta a nuestro equipo"
              to="/contact"
            />
          </div>
        </div>
      </section>

      <!-- Sección FAQ -->
      <section class="bg-grey-2 q-px-xl q-py-xl">
        <div class="container">
          <div class="text-center q-mb-xl">
            <p class="text-uppercase text-weight-bold text-grey-7">
              ¿Tienes dudas?
            </p>
            <h2 class="text-h3 text-weight-bold q-mt-sm q-mb-md">
              Preguntas frecuentes
            </h2>
          </div>

          <div class="row justify-center">
            <div class="col-md-8 col-sm-12">
              <q-list bordered>
                <q-expansion-item
                  v-for="(item, index) in faqs"
                  :key="index"
                  :label="item.question"
                  header-class="text-weight-medium"
                >
                  <q-card>
                    <q-card-section class="text-grey-8">
                      {{ item.answer }}
                    </q-card-section>
                  </q-card>
                </q-expansion-item>
              </q-list>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA final -->
      <section class="bg-primary text-white text-center q-px-xl q-py-xl">
        <div class="container">
          <h2 class="text-h3 text-weight-bold q-mb-md">
            ¿Listo para optimizar tu gestión de equipo?
          </h2>
          <p class="text-h6 q-mb-xl">
            Prueba Recksy gratis durante 14 días. Sin tarjeta de crédito
            requerida.
          </p>
          <div class="row justify-center q-gutter-md">
            <q-btn
              color="white"
              text-color="primary"
              unelevated
              label="Iniciar prueba gratuita"
              to="/register"
              size="lg"
            />
            <q-btn
              outline
              color="white"
              label="Hablar con ventas"
              to="/contact"
              size="lg"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <div class="footer bg-dark text-white">
      <div class="container q-px-xl q-py-xl">
        <div class="row q-col-gutter-xl">
          <!-- Columna logo y descripción -->
          <div class="col-md-4 col-sm-12">
            <div class="row items-center q-mb-md">
              <q-avatar>
                <img
                  src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg"
                />
              </q-avatar>
              <span class="text-h6 q-ml-sm text-weight-bold">Recksy</span>
            </div>
            <p class="text-grey-4 q-mb-lg">
              La plataforma todo-en-uno para gestión de equipos.
            </p>
            <div class="row q-gutter-sm">
              <q-btn round flat icon="mdi-facebook" color="grey-4" />
              <q-btn round flat icon="mdi-twitter" color="grey-4" />
              <q-btn round flat icon="mdi-linkedin" color="grey-4" />
              <q-btn round flat icon="mdi-instagram" color="grey-4" />
            </div>
          </div>

          <!-- Columnas de enlaces -->
          <div
            class="col-md-2 col-sm-4 col-xs-6"
            v-for="(linkGroup, index) in footerLinks"
            :key="index"
          >
            <h4 class="text-weight-bold q-mb-md">{{ linkGroup.title }}</h4>
            <q-list dense>
              <q-item
                v-for="(link, i) in linkGroup.links"
                :key="i"
                clickable
                v-ripple
                :to="link.to"
                class="q-px-none"
              >
                <q-item-section class="text-grey-4">{{
                  link.label
                }}</q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>

        <q-separator color="grey-8" class="q-my-lg" />

        <div class="row items-center justify-between">
          <div class="text-grey-5">
            © 2025 Recksy. Todos los derechos reservados.
          </div>
          <div>
            <q-select
              v-model="language"
              :options="languageOptions"
              dense
              borderless
              options-dense
              emit-value
              map-options
              color="grey-4"
              style="min-width: 120px"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: "HomePage",
  data() {
    return {
      drawer: false,
      yearlyBilling: false,
      language: "es",
      languageOptions: [
        { label: "Español", value: "es" },
        { label: "English", value: "en" },
        { label: "Português", value: "pt" },
      ],
      features: [
        {
          icon: "fingerprint",
          title: "Control de asistencia",
          description:
            "Registro biométrico, geolocalización y marcaje móvil con validación inteligente.",
        },
        {
          icon: "bar_chart",
          title: "Evaluación de desempeño",
          description:
            "Métricas objetivas con feedback 360° y planes de desarrollo personalizado.",
        },
        {
          icon: "mood",
          title: "Bienestar laboral",
          description:
            "Encuestas de clima, reconocimientos y herramientas para el balance vida-trabajo.",
        },
        {
          icon: "integration_instructions",
          title: "Integraciones",
          description:
            "Conecta con tus herramientas favoritas como Slack, Google Workspace y Microsoft Teams.",
        },
        {
          icon: "security",
          title: "Seguridad avanzada",
          description:
            "Datos encriptados, autenticación multifactor y cumplimiento de normativas locales.",
        },
        {
          icon: "support_agent",
          title: "Soporte premium",
          description:
            "Asesoría personalizada y capacitaciones para sacar el máximo provecho a la plataforma.",
        },
      ],
      pricingPlans: [
        {
          name: "Básico",
          description: "Perfecto para pequeñas empresas",
          price: "$29",
          popular: false,
          features: [
            "Hasta 20 usuarios",
            "Control de asistencia básico",
            "Reportes mensuales",
            "Soporte por correo",
          ],
        },
        {
          name: "Profesional",
          description: "Para empresas en crecimiento",
          price: "$59",
          popular: true,
          features: [
            "Hasta 100 usuarios",
            "Asistencia avanzada",
            "Evaluación de desempeño",
            "Soporte prioritario",
            "Integraciones básicas",
          ],
        },
        {
          name: "Empresarial",
          description: "Para organizaciones grandes",
          price: "$99",
          popular: false,
          features: [
            "Usuarios ilimitados",
            "Todas las funciones avanzadas",
            "Analítica predictiva",
            "Soporte 24/7",
            "Integraciones premium",
            "Entrenamiento personalizado",
          ],
        },
      ],
      faqs: [
        {
          question: "¿Cómo puedo migrar mis datos actuales a Recksy?",
          answer:
            "Ofrecemos herramientas de migración y asistencia personalizada para transferir tus datos desde otros sistemas. Nuestro equipo te guiará en todo el proceso para garantizar una transición sin problemas.",
        },
        {
          question: "¿Qué métodos de pago aceptan?",
          answer:
            "Aceptamos todas las tarjetas de crédito principales (Visa, MasterCard, American Express), transferencias bancarias y PayPal. También ofrecemos facturación para clientes empresariales.",
        },
        {
          question: "¿Es seguro almacenar nuestros datos en Recksy?",
          answer:
            "Absolutamente. Utilizamos encriptación de grado bancario, realizamos copias de seguridad diarias y cumplimos con las normativas de protección de datos más estrictas. La seguridad de tu información es nuestra máxima prioridad.",
        },
        {
          question: "¿Puedo cancelar en cualquier momento?",
          answer:
            "Sí, puedes cancelar tu suscripción en cualquier momento sin penalizaciones. Si cancelas durante el periodo de prueba, no se te cobrará nada.",
        },
        {
          question:
            "¿Ofrecen descuentos para organizaciones sin fines de lucro?",
          answer:
            "Sí, ofrecemos un 30% de descuento para organizaciones sin fines de lucro registradas. Contáctanos con la documentación de tu organización para aplicar a este descuento.",
        },
      ],
      footerLinks: [
        {
          title: "Producto",
          links: [
            { label: "Características", to: "/#funciones" },
            { label: "Planes", to: "/#planes" },
            { label: "Demo", to: "/demo" },
            { label: "Actualizaciones", to: "/updates" },
          ],
        },
        {
          title: "Recursos",
          links: [
            { label: "Blog", to: "/blog" },
            { label: "Guías", to: "/guides" },
            { label: "Webinars", to: "/webinars" },
            { label: "Centro de ayuda", to: "/help" },
          ],
        },
        {
          title: "Empresa",
          links: [
            { label: "Nosotros", to: "/about" },
            { label: "Carreras", to: "/careers" },
            { label: "Socios", to: "/partners" },
            { label: "Contacto", to: "/contact" },
          ],
        },
        {
          title: "Legal",
          links: [
            { label: "Privacidad", to: "/privacy" },
            { label: "Términos", to: "/terms" },
            { label: "Seguridad", to: "/security" },
            { label: "Cookies", to: "/cookies" },
          ],
        },
      ],
    };
  },
};
</script>

<style scoped>
/* Evita desbordamiento horizontal global */
html,
body,
.q-page,
.home-page {
  overflow-x: hidden;
  max-width: 100vw;
}

/* Ajustes para evitar padding excesivo en móviles */
@media (max-width: 599px) {
  .q-px-xl {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

.home-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* <- aseguramos altura mínima */
}


.main-content {
  flex: 1;
}

.hero-section {
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-secondary)
  );
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNwYXR0ZXJuKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==");
}

.popular-plan {
  border: 2px solid var(--color-primary);
  position: relative;
  margin-top: -1rem;
  margin-bottom: -1rem;
}

.popular-plan .popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color-primary);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.25rem 1rem;
  border-radius: 20px;
  white-space: nowrap;
}

/* Media query con valor fijo (equivalente a $breakpoint-sm-max ~ 600px) */
@media (max-width: 599px) {
  .popular-plan {
    margin-top: 0;
    margin-bottom: 0;
  }
}



</style>
