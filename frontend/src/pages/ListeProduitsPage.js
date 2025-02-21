// frontend/src/pages/ListeProduitsPage.js
import React, { useEffect, useState } from 'react';
import { fetchProduits } from '../services/api';
import ProduitCard from '../components/ProduitCard';
import './ListeProduitsPage.css';
import useScrollRestoration from '../hooks/useScrollRestoration';

function ListeProduitsPage() {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log("[ListeProduitsPage] Starting fetch of products");
        fetchProduits()
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
    }, []);

    // Appel du hook avec shouldRestore défini en fonction du chargement
    useScrollRestoration(!loading);

    useEffect(() => {
        if (!loading) {
            console.log("[ListeProduitsPage] Finished loading. Current scroll position:", window.pageYOffset);
        }
    }, [loading]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <div className="subheader">
                Currently tracking Funko Pop Doctor Doom #561 on eBay. More items to come soon!
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
