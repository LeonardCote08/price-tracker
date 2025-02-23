// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ListeProduitsPage from './pages/ListeProduitsPage';
import DetailProduitPage from './pages/DetailProduitPage';
import PriceTracker from './PriceTracker';
import './styles/variables.css';
import './App.css';
import './styles/header.css';

function App() {
    return (
        <Router>
            {/* Ici, on ne rend plus de header, le composant PriceTracker l'inclut déjà */}
            <PriceTracker>
                <Routes>
                    <Route path="/" element={<ListeProduitsPage />} />
                    <Route path="/produits/:id" element={<DetailProduitPage />} />
                </Routes>
            </PriceTracker>
        </Router>
    );
}

export default App;