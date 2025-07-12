import { createStore } from 'vuex';
import authStore from './authStore';
import asistenciaStore from './asistenciaStore';
// puedes agregar más stores como employeeStore, attendanceStore, etc.

export default createStore({
  modules: {
    auth: authStore,
    asistencia: asistenciaStore
  }
});
