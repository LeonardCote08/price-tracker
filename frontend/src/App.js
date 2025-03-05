// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ListeProduitsPage from './pages/ListeProduitsPage';
import DetailProduitPage from './pages/DetailProduitPage';
import AboutPage from './pages/AboutPage';
import PriceTracker from './PriceTracker';
import './styles/variables.css';
import './App.css';
import './styles/header.css';

// Composant pour capturer les changements de location et réinitialiser le scroll si nécessaire
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Vérifier si c'est une navigation directe (pas un retour)
        // Le but est de scroller en haut seulement pour les nouvelles routes,
        // pas lors d'un retour à une page précédente où le scroll devrait être restauré
        const isDirectNavigation = !window.navigation?.currentEntry?.navigationType ||
            window.navigation?.currentEntry?.navigationType === 'navigate';

        // Désactiver temporairement le comportement par défaut de scrollToTop
        // pour les cas où le hook useScrollRestoration doit fonctionner
        if (isDirectNavigation && !sessionStorage.getItem(`scrollPosition_${pathname}`)) {
            window.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
}

function App() {
    // Configurer l'historique de navigation pour ne pas restaurer automatiquement
    // la position de défilement (nous gérons cela nous-mêmes)
    useEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }, []);

    return (
        <Router>
            <ScrollToTop />
            <PriceTracker>
                <Routes>
                    <Route path="/" element={<ListeProduitsPage />} />
                    <Route path="/produits/:id" element={<DetailProduitPage />} />
                    <Route path="/about" element={<AboutPage />} />
                </Routes>
            </PriceTracker>
        </Router>
    );
}

export default App;