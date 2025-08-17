// src/utils/publicRequest.js
import axios from 'axios'
import { API_URL } from './api'

const publicAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
})

export default publicAxios
