// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ListeProduitsPage from './pages/ListeProduitsPage';
import DetailProduitPage from './pages/DetailProduitPage';
import AboutPage from './pages/AboutPage';
import PriceTracker from './PriceTracker';
import './styles/variables.css';
import './App.css';
import './styles/header.css';

function App() {
    return (
        <Router>
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