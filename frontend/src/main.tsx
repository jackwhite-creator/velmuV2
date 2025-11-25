import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

// --- DEBUT FIX WEBRTC ---
import { Buffer } from 'buffer';
// On injecte Buffer dans l'objet global window pour que simple-peer le trouve
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = { env: { DEBUG: undefined } };
  (window as any).Buffer = Buffer;
}
// --- FIN FIX WEBRTC ---

ReactDOM.createRoot(document.getElementById('root')!).render(
  // On retire le StrictMode temporairement si les doubles connexions persistent,
  // mais avec mon correctif précédent ça devrait aller.
  // Je le laisse ici pour l'instant.
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)