// frontend/src/components/ProduitCard.js
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowTrendUp,
    faArrowTrendDown,
    faChartLine,
    faClock,
    faTag
} from '@fortawesome/free-solid-svg-icons';
import './ProduitCard.css';

function ProduitCard({ produit }) {
    const price = typeof produit.price === 'number' ? produit.price : 0;
    const buyItNow = typeof produit.buy_it_now_price === 'number' ? produit.buy_it_now_price : null;
    const [trend, setTrend] = useState('stable');
    const [trendText, setTrendText] = useState('Price Stable');
    const [priceHistory, setPriceHistory] = useState(null);
    const sparklineRef = useRef(null);

    // Charger la tendance via l'API
    useEffect(() => {
        fetch(`/api/produits/${produit.product_id}/price-trend`)
            .then(response => response.json())
            .then(data => {
                setTrend(data.trend);
                if (data.trend === 'up') setTrendText('Price Rising');
                else if (data.trend === 'down') setTrendText('Price Falling');
                else setTrendText('Price Stable');
            })
            .catch(err => console.error('Erreur lors de la récupération de la tendance', err));

        // Récupérer un minihistorique pour la sparkline
        fetch(`/api/produits/${produit.product_id}/historique-prix`)
            .then(response => response.json())
            .then(data => {
                if (data.prices && data.prices.length > 0) {
                    setPriceHistory(data.prices.slice(-5)); // Juste les 5 derniers points
                }
            })
            .catch(err => console.error('Erreur lors de la récupération de l\'historique', err));
    }, [produit.product_id]);

    // Déterminer l'icône et la classe CSS de tendance
    const getTrendIcon = () => {
        if (trend === 'up') return faArrowTrendUp;
        if (trend === 'down') return faArrowTrendDown;
        return faChartLine;
    };

    const getTrendClass = () => {
        if (trend === 'up') return 'trend-up';
        if (trend === 'down') return 'trend-down';
        return 'trend-stable';
    };

    // Fonction pour tronquer le titre
    const truncateTitle = (title, length = 35) => {
        if (title && title.length > length) {
            return title.substring(0, length) + '...';
        }
        return title;
    };

    // Dessiner la sparkline avec SVG au lieu des points absolus
    const renderSparkline = () => {
        if (!priceHistory || priceHistory.length < 2) return null;

        const min = Math.min(...priceHistory);
        const max = Math.max(...priceHistory);
        const range = max - min || 1; // Éviter division par zéro

        // Calculer les coordonnées pour le polyline SVG
        const width = 100; // Pourcentage de la largeur
        const height = 25; // Hauteur en pixels

        // Créer un tableau de points pour le polyline
        const points = priceHistory.map((price, index) => {
            const x = (index / (priceHistory.length - 1)) * width;
            // Inverser Y car SVG commence en haut
            const y = height - ((price - min) / range) * height;
            return `${x},${y}`;
        }).join(' ');

        return (
            <div className={`sparkline ${getTrendClass()}`}>
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                    {/* Ligne reliant les points */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke={trend === 'up' ? '#3FCCA4' : trend === 'down' ? '#D84C4A' : '#aab8c2'}
                        strokeWidth="1.5"
                    />

                    {/* Points sur la ligne */}
                    {priceHistory.map((price, index) => {
                        const x = (index / (priceHistory.length - 1)) * width;
                        const y = height - ((price - min) / range) * height;
                        return (
                            <circle
                                key={index}
                                cx={x}
                                cy={y}
                                r="2"
                                fill={trend === 'up' ? '#3FCCA4' : trend === 'down' ? '#D84C4A' : '#aab8c2'}
                            />
                        );
                    })}
                </svg>
            </div>
        );
    };

    return (
        <Link to={`/produits/${produit.product_id}`} className="produit-card-link">
            <div className="produit-card">
                {/* Image du produit et overlay */}
                <div className="product-image-container">
                    <img
                        className="product-image"
                        src={produit.image_url}
                        alt={produit.title || 'Product image'}
                        loading="lazy"
                    />
                    <div className="image-overlay"></div>
                </div>

                {/* Badges */}
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

                {/* Contenu principal */}
                <div className="product-info">
                    {/* Titre du produit */}
                    <h3 className="product-title">{truncateTitle(produit.title)}</h3>

                    {/* Sparkline (mini graphique de tendance) */}
                    {renderSparkline()}

                    {/* Prix et tendance */}
                    <div className="price-section">
                        <div className="price-tag">
                            <FontAwesomeIcon icon={faTag} className="price-icon" />
                            <span className="price-value">${price.toFixed(2)}</span>
                        </div>

                        <div className={`price-trend ${getTrendClass()}`}>
                            <FontAwesomeIcon icon={getTrendIcon()} className="trend-icon" />
                            <span className="trend-text">{trendText}</span>
                        </div>
                    </div>

                    {/* Infos supplémentaires */}
                    <div className="card-footer">
                        <div className="seller-info">
                            {produit.seller_username && (
                                <span className="seller">{produit.seller_username}</span>
                            )}
                        </div>
                        <div className="update-info">
                            <FontAwesomeIcon icon={faClock} className="update-icon" />
                            <span className="update-date">{produit.last_scraped_date || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default ProduitCard;