// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/variables.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Désactiver la restauration automatique du défilement par le navigateur
if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);

reportWebVitals();