import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom' // <--- 1. IMPORT ICI

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 2. AJOUTE CE WRAPPER AUTOUR DE APP */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)