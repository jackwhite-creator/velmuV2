import axios from 'axios';

// ✅ CORRECTION ICI : On récupère la variable d'environnement définie sur Vercel
// Si on est en local (dev), ça prendra 'http://localhost:4000' par défaut.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`, // On ajoute /api à la fin de l'URL de base
});

// 1. INTERCEPTEUR DE REQUÊTE (Ajoute le token)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. INTERCEPTEUR DE RÉPONSE (Gère les erreurs 401)
api.interceptors.response.use(
  (response) => response, // Si tout va bien, on laisse passer
  (error) => {
    // Si le backend renvoie 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      console.warn("⚠️ Session expirée ou invalide. Déconnexion forcée.");
      
      // On nettoie le stockage local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // On redirige vers la page de login (si on n'y est pas déjà)
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;