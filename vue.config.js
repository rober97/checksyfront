const path = require('path');
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: ['quasar'],

  // 👇 clave: base pública para chunks, toma del .env
  publicPath: process.env.VUE_APP_PUBLIC_PATH || '/',

  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  },

  pluginOptions: {
    quasar: { importStrategy: 'kebab', rtlSupport: false },
  },

  productionSourceMap: false,

  devServer: {
    port: 8080,
    open: true,
    historyApiFallback: true, // SPA
  },
});
