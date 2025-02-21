// src/pages/DetailProduitPage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // <-- import Link ici
import { fetchProduit, fetchHistoriquePrix } from '../services/api';
import HistoriquePrixChart from '../components/HistoriquePrixChart';
import './DetailProduitPage.css';
import useScrollRestoration from '../hooks/useScrollRestoration';

function DetailProduitPage() {
    useScrollRestoration();
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

    // Calcul du prix principal
    const price = typeof produit.price === 'number' ? produit.price : 0;

    return (
        <div className="detail-container">
            {/* En-tête avec bouton Back */}
            <div className="detail-product-header">
                <Link to="/" className="back-button">← Back to list</Link>
                <h2 className="detail-title">{produit.title}</h2>
            </div>

            {/* Contenu principal : image et infos */}
            <div className="detail-content">
                {/* Image du produit */}
                <div className="detail-image">
                    <img
                        src={produit.image_url}
                        alt={produit.title}
                    />
                </div>

                {/* Infos principales */}
                <div className="detail-info">
                    <p><strong>Price:</strong> ${price.toFixed(2)}</p>
                    <p>
                        <strong>Condition:</strong>{' '}
                        {produit.normalized_condition === 'New' ? (
                            <span style={{ color: 'limegreen', fontWeight: 'bold' }}>
                                New
                            </span>
                        ) : (
                            <span style={{ color: 'tomato', fontWeight: 'bold' }}>
                                Used
                            </span>
                        )}
                    </p>

                    <p><strong>Seller:</strong> {produit.seller_username || 'Unknown'}</p>
                    <p><strong>Category:</strong> {produit.category || 'N/A'}</p>

                    {/* Bloc Listing Info */}
                    <div className="listing-info-block">
                        <p><strong>Listing Type:</strong> {produit.listing_type || 'N/A'}</p>

                        {/* Auction-specific fields */}
                        {(produit.listing_type === 'auction' || produit.listing_type === 'auction_with_bin') && (
                            <>
                                <p><strong>Bids:</strong> {produit.bids_count ?? 0}</p>
                                <p><strong>Time left:</strong> {produit.time_remaining || 'N/A'}</p>
                            </>
                        )}

                        {/* Buy It Now (pour auction_with_bin ou fixed_price) */}
                        {(produit.listing_type === 'auction_with_bin' || produit.listing_type === 'fixed_price') && (
                            <p>
                                <strong>Buy It Now:</strong>{' '}
                                {produit.buy_it_now_price
                                    ? `$${produit.buy_it_now_price}`
                                    : 'N/A'
                                }
                            </p>
                        )}
                    </div>

                    {/* Bloc Extra Info */}
                    <div className="extra-info-block">
                        <p>
                            <strong>Signed:</strong>{' '}
                            {produit.signed ? 'Yes' : 'No'}
                        </p>
                        <p>
                            <strong>In Box:</strong>{' '}
                            {produit.in_box === true
                                ? 'Yes'
                                : produit.in_box === false
                                    ? 'No'
                                    : 'Unknown'
                            }
                        </p>
                        <p>
                            <strong>Last update:</strong>{' '}
                            {produit.last_scraped_date || 'N/A'}
                        </p>
                        <p>
                            <strong>Original eBay listing:</strong>{' '}
                            {produit.url ? (
                                <a
                                    className="ebay-link"   
                                    href={produit.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View on eBay
                                </a>
                            ) : 'N/A'}
                        </p>

                    </div>
                </div>
            </div>

            {/* Graphique d'historique de prix */}
            <div className="detail-chart">
                <h3 style={{ textAlign: 'center', margin: '0 0 1rem' }}>
                    Price History
                </h3>
                <HistoriquePrixChart
                    dates={historique.dates}
                    prices={historique.prices}
                />
            </div>
        </div>
    );
}

export default DetailProduitPage;
