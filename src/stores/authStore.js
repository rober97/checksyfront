import axios from 'axios';
import { API_URL } from '@/utils/api';

const state = () => ({
  user: null,
  token: null,
  error: null,
});

const getters = {
  isAuthenticated: (state) => !!state.token,
  getUser: (state) => state.user,
};

const actions = {
  async login({ commit }, { email, password }) {
    try {
      const res = await axios.post('/auth/login', { email, password });

      if (res.data.success) {
        commit('setUser', res.data.user);
        commit('setToken', res.data.token);
        localStorage.setItem('token', res.data.token);
      } else {
        commit('setError', res.data.message || 'Login fallido');
      }
    } catch (err) {
      console.error('Login error:', err);
      commit('setError', 'Error de servidor');
    }
  },

  logout({ commit }) {
    commit('clearAuth');
    localStorage.removeItem('token');
  },

  async newUser({ commit }, userData) {
    try {
      debugger
      console.log("API: ", API_URL)
      const res = await axios.post(`${API_URL}/users/new`, userData);

      if (!res.data.success) {
        commit('setError', res.data.message || 'Error al crear usuario');
        throw new Error(res.data.message);
      }
    } catch (err) {
      console.error('newUser error:', err);
      commit('setError', 'No se pudo crear el usuario');
      throw err;
    }
  },

  loadUserFromStorage({ commit }) {
    const token = localStorage.getItem('token');
    if (token) {
      // Aquí podrías decodificar el token si quieres
      commit('setToken', token);
    }
  }
};

const mutations = {
  setUser(state, user) {
    state.user = user;
  },
  setToken(state, token) {
    state.token = token;
  },
  setError(state, error) {
    state.error = error;
  },
  clearAuth(state) {
    state.user = null;
    state.token = null;
    state.error = null;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
