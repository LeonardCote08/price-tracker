// frontend/src/components/ProduitCard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './ProduitCard.css';

function ProduitCard({ produit }) {
    const price = typeof produit.price === 'number' ? produit.price : 0;
    const buyItNow = typeof produit.buy_it_now_price === 'number' ? produit.buy_it_now_price : null;
    const [trend, setTrend] = useState('N/A');

    const conditionText = produit.normalized_condition?.trim() || 'Not specified';

    // Déterminer l'étiquette du type d'annonce
    let listingLabel = '';
    switch (produit.listing_type) {
        case 'auction':
            listingLabel = 'Auction';
            break;
        case 'auction_with_bin':
            listingLabel = 'Auction + BIN';
            break;
        default:
            listingLabel = 'Fixed Price';
            break;
    }

    // Charger la tendance via l'API
    useEffect(() => {
        fetch(`/api/produits/${produit.product_id}/price-trend`)
            .then(response => response.json())
            .then(data => {
                if (data.trend === 'up') setTrend('↑ Price Rising');
                else if (data.trend === 'down') setTrend('↓ Price Falling');
                else setTrend('Price Stable');
            })
            .catch(err => console.error('Erreur lors de la récupération de la tendance', err));
    }, [produit.product_id]);

    // Classes CSS pour la tendance
    let trendClass = '';
    if (trend.includes('Rising')) trendClass = 'trend-up';
    else if (trend.includes('Falling')) trendClass = 'trend-down';

    return (
        <Link to={`/produits/${produit.product_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="produit-card">

                {/* Image et badges (Signed, In Box, etc.) */}
                <img className="product-image" src={produit.image_url} alt={produit.title || 'No title'} />
                <div className="badges-container">
                    {produit.signed && <span className="badge badge-signed">Signed</span>}
                    {produit.in_box === true && <span className="badge badge-inbox">In Box</span>}
                    {produit.in_box === false && <span className="badge badge-nobox">No Box</span>}
                    {produit.ended && <span className="badge badge-ended">Ended</span>}
                </div>

                {/* Bloc principal d'informations */}
                <div className="product-info">
                    {/* Condition + type d'annonce sur une seule ligne */}
                    <div className="condition-listing-line">
                        <span className="condition-text">{conditionText}</span>
                        <span className="separator"> • </span>
                        <span className="listing-text">{listingLabel}</span>
                    </div>

                    {/* Bloc des prix & stats */}
                    <div className="price-info">
                        {/* Current Bid (auction) ou Price (fixed) */}
                        {produit.listing_type === 'auction' || produit.listing_type === 'auction_with_bin' ? (
                            <div className="price-line">
                                <span className="price-label">Current Bid:</span>
                                <span className="price-value">${price.toFixed(2)}</span>
                            </div>
                        ) : (
                            <div className="price-line">
                                <span className="price-label">Price:</span>
                                <span className="price-value">${price.toFixed(2)}</span>
                            </div>
                        )}

                        {/* Buy It Now si auction_with_bin */}
                        {produit.listing_type === 'auction_with_bin' && (
                            <div className="price-line">
                                <span className="price-label">Buy It Now:</span>
                                <span className="price-value">
                                    {buyItNow ? `$${buyItNow.toFixed(2)}` : 'N/A'}
                                </span>
                            </div>
                        )}

                        {/* Bids + Time left si enchère */}
                        {(produit.listing_type === 'auction' || produit.listing_type === 'auction_with_bin') && (
                            <div className="auction-info-line">
                                <span>Bids: {produit.bids_count ?? 0}</span>
                                <span className="separator"> • </span>
                                <span>Time left: {produit.time_remaining || 'N/A'}</span>
                            </div>
                        )}

                        {/* Tendance de prix */}
                        <div className={`price-trend ${trendClass}`}>
                            {trend}
                        </div>

                        {/* Date de mise à jour */}
                        <p className="updated-date">
                            Updated: {produit.last_scraped_date || 'N/A'}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default ProduitCard;
