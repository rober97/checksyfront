const path = require('path');
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: ['quasar'],

  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  },

  pluginOptions: {
    quasar: {
      importStrategy: 'kebab',
      rtlSupport: false,
    },
  },

  // Opcional: genera mapas de código en producción
  productionSourceMap: false,

  // Opcional: configuración para dev server
  devServer: {
    port: 8080,
    open: true,
  },
});
