import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App';
import { iniciarDatos } from '@/lib/servicio';

import './index.css';

iniciarDatos(); // la primera vez, carga las reservas de ejemplo

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
