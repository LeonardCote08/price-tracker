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
    const [priceHistory, setPriceHistory] = useState(null);
    const [percentChange, setPercentChange] = useState(null);
    const [trend, setTrend] = useState('stable');
    const [trendText, setTrendText] = useState('Price Stable');
    const [isHovered, setIsHovered] = useState(false);

    // Charger l'historique de prix et déterminer la tendance
    useEffect(() => {
        fetch(`/api/produits/${produit.product_id}/historique-prix`)
            .then(response => response.json())
            .then(data => {
                if (data.prices && data.prices.length > 0) {
                    // Utiliser tous les points d'historique, pas juste les 10 derniers
                    setPriceHistory(data.prices);

                    // Calculer le pourcentage de variation entre le premier et dernier point
                    // de l'historique complet (ce qui correspond aux données de la page détail)
                    if (data.prices.length >= 2) {
                        const firstPrice = data.prices[0];
                        const lastPrice = data.prices[data.prices.length - 1];
                        const change = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(1);
                        setPercentChange(change);

                        // Déterminer la tendance basée sur le pourcentage de variation
                        const changeValue = parseFloat(change);

                        // Utiliser un seuil de ±3% pour considérer une variation comme significative
                        if (changeValue > 3) {
                            setTrend('up');
                            setTrendText('Price Rising');
                        } else if (changeValue < -3) {
                            setTrend('down');
                            setTrendText('Price Falling');
                        } else {
                            setTrend('stable');
                            setTrendText('Price Stable');
                        }
                    }
                }
            })
            .catch(err => {
                console.error('Erreur lors de la récupération de l\'historique', err);
                // En cas d'erreur, on utilise l'API de tendance comme fallback
                fetch(`/api/produits/${produit.product_id}/price-trend`)
                    .then(response => response.json())
                    .then(data => {
                        setTrend(data.trend);
                        if (data.trend === 'up') setTrendText('Price Rising');
                        else if (data.trend === 'down') setTrendText('Price Falling');
                        else setTrendText('Price Stable');
                    })
                    .catch(errFallback => console.error('Erreur lors de la récupération de la tendance (fallback)', errFallback));
            });
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

    // Rendu du graphique de tendance simplifié
    const renderSparkline = () => {
        if (!priceHistory || priceHistory.length < 2) return null;

        // Utiliser seulement le premier et le dernier point pour une tendance claire
        // Cela montre simplement si le prix a augmenté ou diminué sur la période
        const firstPrice = priceHistory[0];
        const lastPrice = priceHistory[priceHistory.length - 1];

        // Points à afficher : juste le début et la fin
        const displayPoints = [firstPrice, lastPrice];

        // Couleurs selon tendance
        const trendColors = {
            up: '#3FCCA4',
            down: '#D84C4A',
            stable: '#1595EB'
        };

        const strokeColor = trendColors[trend] || trendColors.stable;

        // Dimensions et configuration du graphique
        const width = 130;    // Largeur totale du SVG augmentée
        const height = 30;    // Hauteur du SVG
        const graphWidth = 110; // Largeur effective du graphique augmentée
        const padding = 8;    // Marge intérieure augmentée

        // Valeurs minimale et maximale pour l'échelle
        // Utiliser une marge plus grande pour éviter que les points ne touchent les bords
        const valuesSpread = Math.abs(displayPoints[1] - displayPoints[0]) * 0.1;
        const min = Math.min(...displayPoints) - valuesSpread;
        const max = Math.max(...displayPoints) + valuesSpread;
        const range = max - min || 1;

        // Calculer les coordonnées de seulement deux points : le premier et le dernier
        const pointCoordinates = [
            // Premier point (à gauche)
            {
                x: padding,
                y: height - padding - ((displayPoints[0] - min) / range * (height - 2 * padding)),
                value: displayPoints[0]
            },
            // Dernier point (à droite)
            {
                x: graphWidth - padding,
                y: height - padding - ((displayPoints[1] - min) / range * (height - 2 * padding)),
                value: displayPoints[1]
            }
        ];

        // Format du pourcentage avec signe
        const changeValue = percentChange !== null ? percentChange :
            ((displayPoints[displayPoints.length - 1] - displayPoints[0]) / displayPoints[0] * 100).toFixed(1);

        const formattedChange = (parseFloat(changeValue) > 0 ? '+' : '') + changeValue;
        const changeClass = parseFloat(changeValue) > 0 ? 'positive' : parseFloat(changeValue) < 0 ? 'negative' : 'neutral';

        return (
            <div className="sparkline-container">
                <div className="sparkline">
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
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
                                r={3}
                                fill={strokeColor}
                            />
                        ))}
                    </svg>
                </div>

                {/* Pourcentage de variation */}
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