import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProduit, fetchHistoriquePrix } from '../services/api';
import HistoriquePrixChart from '../components/HistoriquePrixChart';
import useScrollRestoration from '../hooks/useScrollRestoration';
import './DetailProduitPage.css';

function DetailProduitPage() {
    useScrollRestoration();
    const { id } = useParams();
    const [produit, setProduit] = useState(null);
    const [historique, setHistorique] = useState({ dates: [], prices: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        Promise.all([fetchProduit(id), fetchHistoriquePrix(id)])
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

    // Prix principal (peut représenter "Current Bid" ou "Fixed Price")
    const price = typeof produit.price === 'number' ? produit.price : 0;

    return (
        <div className="detail-container">
            {/* Retour & Titre */}
            <div className="detail-product-header">
                <Link to="/" className="back-button">← Back to list</Link>
                <h2 className="detail-title">{produit.title}</h2>
            </div>

            {/* Contenu principal : image & infos */}
            <div className="detail-content">
                <div className="detail-image">
                    <img src={produit.image_url} alt={produit.title} />
                </div>

                {/* 1) Bloc General Info */}
                <div className="detail-info">

                    {/* --- General Info --- */}
                    <div className="general-info-block">
                        <p>
                            <strong>Price:</strong> ${price.toFixed(2)}
                        </p>
                        <p>
                            <strong>Condition:</strong>{' '}
                            {produit.normalized_condition === 'New' ? (
                                <span style={{ color: 'limegreen', fontWeight: 'bold' }}>New</span>
                            ) : (
                                <span style={{ color: 'tomato', fontWeight: 'bold' }}>Used</span>
                            )}
                        </p>
                        <p>
                            <strong>Seller:</strong> {produit.seller_username || 'Unknown'}
                        </p>

                        {/* Si c’est important, vous pouvez afficher la catégorie ici aussi */}
                        {/* <p><strong>Category:</strong> {produit.category || 'N/A'}</p> */}

                        {/* In Box */}
                        <p>
                            <strong>In Box:</strong>{' '}
                            {produit.in_box === true
                                ? 'Yes'
                                : produit.in_box === false
                                    ? 'No'
                                    : 'Unknown'
                            }
                        </p>

                        {/* Signed : n’affichez que si signed = true, pour éviter la redondance */}
                        {produit.signed && (
                            <p>
                                <strong>Signed:</strong> Yes
                            </p>
                        )}

                        <p>
                            <strong>Last update:</strong>{' '}
                            {produit.last_scraped_date || 'N/A'}
                        </p>
                    </div>

                    {/* 2) Bloc Listing Details */}
                    <div className="listing-info-block">
                        <h4>Listing Details</h4>
                        <p>
                            <strong>Type:</strong> {produit.listing_type || 'N/A'}
                        </p>

                        {/* Auction-specific fields */}
                        {(produit.listing_type === 'auction' || produit.listing_type === 'auction_with_bin') && (
                            <>
                                <p><strong>Bids:</strong> {produit.bids_count ?? 0}</p>
                                <p><strong>Time left:</strong> {produit.time_remaining || 'N/A'}</p>
                            </>
                        )}

                        {/* Buy It Now seulement si auction_with_bin */}
                        {produit.listing_type === 'auction_with_bin' && (
                            <p>
                                <strong>Buy It Now:</strong>{' '}
                                {produit.buy_it_now_price ? `$${produit.buy_it_now_price}` : 'N/A'}
                            </p>
                        )}

                        {/* Lien eBay */}
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
                <h3 style={{ textAlign: 'center', margin: '0 0 1rem' }}>Price History</h3>
                <HistoriquePrixChart
                    dates={historique.dates}
                    prices={historique.prices}
                />
            </div>
        </div>
    );
}

export default DetailProduitPage;
