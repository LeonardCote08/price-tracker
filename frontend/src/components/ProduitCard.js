// frontend/src/components/ProduitCard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './ProduitCard.css';

function ProduitCard({ produit }) {
    const price = typeof produit.price === 'number' ? produit.price : 0;
    const buyItNow = typeof produit.buy_it_now_price === 'number' ? produit.buy_it_now_price : null;
    const [trend, setTrend] = useState('N/A');

    // Auparavant, on affichait {conditionText} et {listingLabel} dans le composant.
    // Maintenant, on ne s’en sert plus pour l’affichage dans la vignette :
    const conditionText = produit.normalized_condition?.trim() || 'Not specified';
    // const listingLabel = (produit.listing_type === 'fixed_price') ? 'Fixed Price' : '';

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

                {/* Image et badges (Signed, In Box, Condition, etc.) */}
                <img className="product-image" src={produit.image_url} alt={produit.title || 'No title'} />
                <div className="badges-container">
                    {/* Badge condition */}
                    {produit.normalized_condition === 'New' && (
                        <span className="badge badge-condition-new">New</span>
                    )}
                    {produit.normalized_condition === 'Used' && (
                        <span className="badge badge-condition-used">Used</span>
                    )}

                    {/* Badge Signed */}
                    {produit.signed && <span className="badge badge-signed">Signed</span>}

                    {/* Badge In Box / No Box */}
                    {produit.in_box === true && <span className="badge badge-inbox">In Box</span>}
                    {produit.in_box === false && <span className="badge badge-nobox">No Box</span>}

                    {/* Badge Ended */}
                    {produit.ended && <span className="badge badge-ended">Ended</span>}
                </div>

                {/* Bloc principal d'informations */}
                <div className="product-info">
                    {/* On retire complètement la ligne "condition + listing type" */}
                    {/* (ancien code supprimé) */}

                    {/* Bloc des prix & stats */}
                    <div className="price-info">
                        {/* Comme on n’a que du fixed_price, on affiche juste Price */}
                        <div className="price-line">
                            <span className="price-value">${price.toFixed(2)}</span>
                        </div>

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
