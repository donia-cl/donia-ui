import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Silenciador de AbortError: El SDK de Supabase lanza este error internamente 
// durante el handshake de PKCE y la inicialización de sesión. No es un error real 
// de la aplicación y puede ignorarse de forma segura.
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError' || event.reason?.message?.includes('signal is aborted')) {
    event.preventDefault();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);