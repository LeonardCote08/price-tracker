// src/pages/DetailProduitPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProduit, fetchHistoriquePrix } from '../services/api';
import HistoriquePrixChart from '../components/HistoriquePrixChart';
import './DetailProduitPage.css';  // <-- AJOUTER l'import du CSS

function DetailProduitPage() {
    const { id } = useParams();
    const [produit, setProduit] = useState(null);
    const [historique, setHistorique] = useState({ dates: [], prices: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        Promise.all([
            fetchProduit(id),
            fetchHistoriquePrix(id),
        ])
            .then(([prodData, histData]) => {
                setProduit(prodData);
                setHistorique(histData);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!produit) return <p>Product not found</p>;

    // Exemples : on récupère plus d'infos
    const shippingCost = produit.shipping_cost;
    const price = typeof produit.price === 'number' ? produit.price : 0;
    const totalPrice = price + (shippingCost || 0);

    return (
        <div className="detail-container">
            {/* En-tête */}
            <div className="detail-product-header">
                <h2 className="detail-title">{produit.title}</h2>
            </div>

            {/* Contenu principal : image à gauche, infos à droite */}
            <div className="detail-content">
                <div className="detail-image">
                    <img
                        src={produit.image_url}
                        alt={produit.title}
                    />
                </div>

                <div className="detail-info">
                    {/* Par exemple : prix total + shipping */}
                    <p>
                        <strong>Price:</strong> ${totalPrice.toFixed(2)}
                        {shippingCost === 0 && ' (FREE shipping)'}
                    </p>

                    <p><strong>Condition:</strong> {produit.item_condition || 'N/A'}</p>
                    <p><strong>Seller:</strong> {produit.seller_username || 'Unknown'}</p>
                    <p><strong>Category:</strong> {produit.category || 'N/A'}</p>
                    {/* Ajoutez ici d’autres infos si vous voulez */}
                </div>
            </div>

            {/* Graphique d'historique de prix */}
            <div className="detail-chart">
                <h3 style={{ textAlign: 'center', margin: '0 0 1rem' }}>Price History</h3>
                <HistoriquePrixChart dates={historique.dates} prices={historique.prices} />
            </div>
        </div>
    );
}

export default DetailProduitPage;
