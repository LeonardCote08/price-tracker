// frontend/src/components/ProduitCard.js
import React, { useEffect, useState } from 'react'; // Ajoute useEffect et useState
import { Link } from 'react-router-dom';
import './ProduitCard.css';

function ProduitCard({ produit }) {
    const price = typeof produit.price === 'number' ? produit.price : 0;
    const buyItNow = typeof produit.buy_it_now_price === 'number' ? produit.buy_it_now_price : null;
    const [trend, setTrend] = useState('N/A'); // État pour la tendance

    const conditionText = produit.normalized_condition?.trim() || 'Not specified';
    let listingLabel = '';
    if (produit.listing_type === 'fixed_price') listingLabel = 'Fixed Price';
    else if (produit.listing_type === 'auction') listingLabel = 'Auction';
    else if (produit.listing_type === 'auction_with_bin') listingLabel = 'Auction + BIN';
    const isAuction = (produit.listing_type === 'auction' || produit.listing_type === 'auction_with_bin');

    // Récupérer la tendance via une nouvelle API
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

    return (
        <Link to={`/produits/${produit.product_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="produit-card">
                <img className="product-image" src={produit.image_url} alt={produit.title || 'No title'} />
                <div className="badges-container">
                    {produit.signed && <span className="badge badge-signed">Signed</span>}
                    {produit.in_box === true && <span className="badge badge-inbox">In Box</span>}
                    {produit.in_box === false && <span className="badge badge-nobox">No Box</span>}
                    {produit.ended && <span className="badge badge-ended">Ended</span>}
                </div>
                <div className="product-info">
                    <div className="condition-listing-line">
                        <span className="condition-text">{conditionText}</span>
                        <span className="separator"> • </span>
                        <span className="listing-text">{listingLabel}</span>
                    </div>
                    {isAuction && (
                        <div className="auction-info-line">
                            <span>Bids: {produit.bids_count ?? 0}</span>
                            <span className="separator"> • </span>
                            <span>Time left: {produit.time_remaining || 'N/A'}</span>
                        </div>
                    )}
                    <div className="price-section" style={{ marginTop: '0.5rem' }}>
                        {isAuction && (
                            <div className="price-line">
                                <span className="price-label">Current Bid:</span>
                                <span className="price-value">${price.toFixed(2)}</span>
                            </div>
                        )}
                        {produit.listing_type === 'auction_with_bin' && (
                            <div className="price-line">
                                <span className="price-label">Buy It Now:</span>
                                <span className="price-value">{buyItNow ? `$${buyItNow.toFixed(2)}` : 'N/A'}</span>
                            </div>
                        )}
                        {produit.listing_type === 'fixed_price' && (
                            <div className="price-line">
                                <span className="price-label">Price:</span>
                                <span className="price-value">${price.toFixed(2)}</span>
                            </div>
                        )}
                        <span className={`price-trend ${trend.includes('Rising') ? 'trend-up' : trend.includes('Falling') ? 'trend-down' : ''}`}>
                            {trend}
                        </span>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: '#777', marginTop: '0.5rem' }}>
                        Updated: {produit.last_scraped_date || 'N/A'}
                    </p>
                </div>
            </div>
        </Link>
    );
}

export default ProduitCard;