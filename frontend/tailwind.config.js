/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Couleurs de Marque (Old Discord) ---
        blurple: {
          DEFAULT: '#7189d9', // Le fameux "Old Blurple" demandé
          hover: '#5b70c0',   // Une version légèrement plus sombre pour les surbols
        },
        success: {
          DEFAULT: '#43b581', // Le vert "Old Discord" demandé
        },
        danger: '#f04747', // Rouge classique Discord pour les erreurs/suppressions

        // --- Palette de Gris UI (Hiérarchie de profondeur) ---
        // Inspiré de ta palette et du standard Discord classique
        discord: {
          darkest: '#202225', // Arrière-plan global et Rail de serveurs (le plus sombre)
          dark: '#2f3136',    // Sidebar des canaux et liste des membres (milieu)
          main: '#36393f',    // Zone de chat principale et tableaux de bord (le plus clair des fonds)
          hover: '#40444b',   // Couleur de survol sur les éléments de liste
          floating: '#18191c', // Pour les modales, popovers, context menus (très sombre pour le contraste)
        },

        // --- Couleurs de Texte ---
        text: {
          primary: '#dcddde',   // Texte principal (presque blanc, mais pas agressif)
          muted: '#72767d',     // Texte secondaire (noms de canaux inactifs, timestamps)
          white: '#ffffff',     // Pour les titres ou éléments très importants
        }
      },
    },
  },
  plugins: [],
}