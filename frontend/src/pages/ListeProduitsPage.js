import React, { useEffect, useState, useCallback } from 'react';
import { fetchProduits } from '../services/api';
import ProduitCard from '../components/ProduitCard';
import './ListeProduitsPage.css';
import useScrollRestoration from '../hooks/useScrollRestoration';

function ListeProduitsPage() {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("active"); // "active" ou "ended"

    const loadProducts = useCallback(() => {
        setLoading(true);
        fetchProduits(statusFilter)
            .then(data => {
                setProduits(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [statusFilter]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    useScrollRestoration(!loading);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            {/* Bannière centrée avec le message informatif */}
            <div className="subheader">
                <p className="banner-text">
                    Currently tracking Funko Pop Doctor Doom #561 on eBay. More items to come soon!
                </p>
            </div>

            {/* Conteneur séparé pour les boutons, également centré */}
            <div className="button-group-centered">
                <button
                    className="filter-button"
                    onClick={() => setStatusFilter("active")}
                >
                    Active Listings
                </button>
                <button
                    className="filter-button"
                    onClick={() => setStatusFilter("ended")}
                >
                    Ended Listings
                </button>
            </div>

            {/* Grille de produits */}
            <div className="produits-grid">
                {produits.map((p) => (
                    <ProduitCard key={p.product_id} produit={p} />
                ))}
            </div>
        </div>
    );
}

export default ListeProduitsPage;
