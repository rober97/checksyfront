// src/utils/api.js

const LOCAL_API = 'http://localhost:3000/api';
const PROD_API = 'https://recksyback.onrender.com/api';

const URL = process.env.NODE_ENV === 'production' ? PROD_API : LOCAL_API;
console.log("URL: ", URL)

// Usa automáticamente local o producción según el entorno
export const API_URL = process.env.NODE_ENV === 'production' ? PROD_API : LOCAL_API;
