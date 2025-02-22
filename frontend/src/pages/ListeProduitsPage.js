import React, { useEffect, useState, useCallback } from 'react';
import { fetchProduits } from '../services/api';
import ProduitCard from '../components/ProduitCard';
import './ListeProduitsPage.css';
import useScrollRestoration from '../hooks/useScrollRestoration';

function ListeProduitsPage() {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("active"); // active ou ended

    const loadProducts = useCallback(() => {
        console.log("[ListeProduitsPage] Starting fetch of products");
        fetchProduits(statusFilter)
            .then(data => {
                console.log("[ListeProduitsPage] Products loaded:", data);
                setProduits(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("[ListeProduitsPage] Error fetching products:", err);
                setError(err.message);
                setLoading(false);
            });
    }, [statusFilter]);

    useEffect(() => {
        setLoading(true);
        loadProducts();
    }, [loadProducts]);

    useScrollRestoration(!loading);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <div className="subheader">
                <button onClick={() => setStatusFilter("active")}>Produits en vente</button>
                <button onClick={() => setStatusFilter("ended")}>Produits terminés</button>
            </div>
            <div className="produits-grid">
                {produits.map((p) => (
                    <ProduitCard key={p.product_id} produit={p} />
                ))}
            </div>
        </div>
    );
}

export default ListeProduitsPage;
