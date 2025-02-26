// frontend/src/pages/ListeProduitsPage.js
import React, { useEffect, useState } from 'react';
import { fetchProduits } from '../services/api';
import ProduitCard from '../components/ProduitCard';
import './ListeProduitsPage.css';
import useScrollRestoration from '../hooks/useScrollRestoration';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

function ListeProduitsPage() {
    // Liste de produits récupérés depuis l'API
    const [produits, setProduits] = useState([]);
    // Dictionnaire qui associe product_id -> "up"/"down"/"stable"
    const [trendById, setTrendById] = useState({});
    // Filtre courant : "all", "up", "down", "stable"
    const [trendFilter, setTrendFilter] = useState('all');

    // États de chargement / erreur
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useScrollRestoration("ListeProduits");


    // 1) Charger tous les produits (sans filtre "active"/"ended")
    useEffect(() => {
        setLoading(true);
        fetchProduits()
            .then(data => {
                setProduits(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // 2) Pour chaque produit, récupérer la tendance via /api/produits/:id/price-trend
    useEffect(() => {
        produits.forEach(prod => {
            fetch(`/api/produits/${prod.product_id}/price-trend`)
                .then(r => r.json())
                .then(data => {
                    // data.trend = "up"/"down"/"stable"
                    setTrendById(prev => ({
                        ...prev,
                        [prod.product_id]: data.trend
                    }));
                })
                .catch(err => console.error('Erreur trend', err));
        });
    }, [produits]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    // 3) Appliquer le filtre localement en fonction de la tendance
    const filteredProduits = produits.filter(prod => {
        const productTrend = trendById[prod.product_id];
        if (!productTrend) {
            // Pas encore chargée => on l'affiche seulement si on est en "all"
            return trendFilter === 'all';
        }
        if (trendFilter === 'all') return true;
        return productTrend === trendFilter;
    });

    return (
        <div>
            <div style={{ textAlign: 'center', marginTop: '0rem' }}>
                <div className="subheader">
                    <p className="banner-text">
                        <span style={{ marginRight: '0.5rem' }}>
                            <FontAwesomeIcon icon={faInfoCircle} />
                        </span>
                        Currently tracking Funko Pop Doctor Doom #561 on eBay. More items to come soon!
                    </p>
                </div>
            </div>

            {/* Boutons de filtre : All, Price Rising, Price Falling, Price Stable */}
            <div className="button-group-centered">
                <button
                    className={`filter-button ${trendFilter === 'all' ? 'selected' : ''}`}
                    onClick={() => setTrendFilter('all')}
                >
                    All
                </button>
                <button
                    className={`filter-button ${trendFilter === 'up' ? 'selected' : ''}`}
                    onClick={() => setTrendFilter('up')}
                >
                    Price Rising
                </button>
                <button
                    className={`filter-button ${trendFilter === 'down' ? 'selected' : ''}`}
                    onClick={() => setTrendFilter('down')}
                >
                    Price Falling
                </button>
                <button
                    className={`filter-button ${trendFilter === 'stable' ? 'selected' : ''}`}
                    onClick={() => setTrendFilter('stable')}
                >
                    Price Stable
                </button>
            </div>

            <div className="produits-grid">
                {filteredProduits.map(p => (
                    <ProduitCard key={p.product_id} produit={p} />
                ))}
            </div>
        </div>
    );
}

export default ListeProduitsPage;
