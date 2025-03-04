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
    const [percentChange, setPercentChange] = useState(null);
    const sparklineRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

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
                    setPriceHistory(data.prices.slice(-10)); // On prend les 10 derniers points pour plus de détail

                    // Calculer le pourcentage de variation
                    if (data.prices.length >= 2) {
                        const firstPrice = data.prices[0];
                        const lastPrice = data.prices[data.prices.length - 1];
                        const change = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(1);
                        setPercentChange(change);
                    }
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
    const truncateTitle = (title, length = 40) => {
        if (title && title.length > length) {
            return title.substring(0, length) + '...';
        }
        return title;
    };

    // Fonction entièrement repensée pour les graphiques
    const renderSparkline = () => {
        if (!priceHistory || priceHistory.length < 2) return null;

        // Simplifions les données pour un graphique plus clair
        let displayPoints = [];

        // Toujours inclure le premier et le dernier point
        if (priceHistory.length <= 5) {
            displayPoints = [...priceHistory];
        } else {
            // Prendre quelques points clés seulement
            displayPoints = [
                priceHistory[0],
                priceHistory[Math.floor(priceHistory.length / 2)],
                priceHistory[priceHistory.length - 1]
            ];
        }

        // Couleurs selon tendance
        const trendColors = {
            up: '#3FCCA4',
            down: '#D84C4A',
            stable: '#1595EB'
        };

        const strokeColor = trendColors[trend] || trendColors.stable;

        // Dimensions et configuration du graphique
        const width = 100;  // Largeur totale plus petite
        const height = 30;  // Hauteur réduite
        const padding = 5;  // Marge intérieure

        // Calcul des valeurs min/max pour l'échelle
        const min = Math.min(...displayPoints) * 0.95;
        const max = Math.max(...displayPoints) * 1.05;
        const range = max - min || 1;

        // Calculer les coordonnées des points
        const pointCoordinates = displayPoints.map((value, index) => {
            const x = padding + ((index / (displayPoints.length - 1)) * (width - 2 * padding));
            const normalizedValue = (value - min) / range;
            const y = height - padding - (normalizedValue * (height - 2 * padding));
            return { x, y, value };
        });

        // Format du pourcentage avec signe
        const changeValue = percentChange !== null ? percentChange :
            ((displayPoints[displayPoints.length - 1] - displayPoints[0]) / displayPoints[0] * 100).toFixed(1);

        const formattedChange = (changeValue > 0 ? '+' : '') + changeValue;
        const changeClass = changeValue > 0 ? 'positive' : changeValue < 0 ? 'negative' : 'neutral';

        return (
            <div className="sparkline-container">
                <div className="sparkline">
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                        {/* Ligne de base */}
                        <line
                            x1={padding}
                            y1={height - padding}
                            x2={width - padding}
                            y2={height - padding}
                            stroke="#2a3f55"
                            strokeWidth="1"
                        />

                        {/* Tracer la ligne entre les points */}
                        <polyline
                            points={pointCoordinates.map(pt => `${pt.x},${pt.y}`).join(' ')}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Points */}
                        {pointCoordinates.map((pt, i) => (
                            <circle
                                key={i}
                                cx={pt.x}
                                cy={pt.y}
                                r={i === 0 || i === pointCoordinates.length - 1 ? 3 : 2}
                                fill={strokeColor}
                            />
                        ))}
                    </svg>
                </div>

                {/* Pourcentage de variation déplacé à côté du graphique */}
                <div className={`change-indicator ${changeClass}`}>
                    {formattedChange}%
                </div>
            </div>
        );
    };

    return (
        <Link to={`/produits/${produit.product_id}`} className="produit-card-link">
            <div
                className="produit-card"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
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