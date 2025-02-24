import React, { useEffect, useState, useCallback } from 'react';
import { fetchProduits } from '../services/api';
import ProduitCard from '../components/ProduitCard';
import './ListeProduitsPage.css';
import useScrollRestoration from '../hooks/useScrollRestoration';

function ListeProduitsPage() {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filtres existants (statusFilter) et nouveaux (filterSigned, filterInBox)
    const [statusFilter, setStatusFilter] = useState("active");
    const [filterSigned, setFilterSigned] = useState(false);
    const [filterInBox, setFilterInBox] = useState(false);

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

    // Ici, on applique les filtres (signed, in_box)
    const filteredProduits = produits.filter(p => {
        if (filterSigned && !p.signed) return false;
        if (filterInBox && p.in_box !== true) return false;
        return true;
    });

    return (
        <div>
            <div className="subheader">
                <p className="banner-text">
                    Currently tracking Funko Pop Doctor Doom #561 on eBay. More items to come soon!
                </p>
            </div>

            <div className="button-group-centered">
                {/* Boutons de filtre pour "active" / "ended" */}
                <button
                    className={`filter-button ${statusFilter === 'active' ? 'selected' : ''}`}
                    onClick={() => setStatusFilter("active")}
                >
                    Active Listings
                </button>
                <button
                    className={`filter-button ${statusFilter === 'ended' ? 'selected' : ''}`}
                    onClick={() => setStatusFilter("ended")}
                >
                    Ended Listings
                </button>

                {/* Nouveaux boutons de filtre Signed et InBox */}
                <button
                    className={`filter-button ${filterSigned ? 'selected' : ''}`}
                    onClick={() => setFilterSigned(!filterSigned)}
                >
                    Signed Only
                </button>
                <button
                    className={`filter-button ${filterInBox ? 'selected' : ''}`}
                    onClick={() => setFilterInBox(!filterInBox)}
                >
                    In Box Only
                </button>
            </div>

            <div className="produits-grid">
                {filteredProduits.map((p) => (
                    <ProduitCard key={p.product_id} produit={p} />
                ))}
            </div>
        </div>
    );
}

export default ListeProduitsPage;
