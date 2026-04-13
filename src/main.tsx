import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Error catcher for debugging
window.addEventListener('error', e => {
  document.body.innerHTML += `<div style="color:red; background:white; position:fixed; top:0; left:0; z-index:9999; padding: 20px;">Error: ${e.message}<br/>${e.error?.stack}</div>`;
});

window.addEventListener('unhandledrejection', e => {
  document.body.innerHTML += `<div style="color:red; background:white; position:fixed; top:0; left:0; z-index:9999; padding: 20px;">Promise Rejection: ${e.reason}</div>`;
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
