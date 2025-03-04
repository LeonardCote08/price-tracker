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

    // Rendu du graphique de tendance amélioré avec courbe de Bézier
    const renderSparkline = () => {
        if (!priceHistory || priceHistory.length < 2) return null;

        // Nous utilisons le premier et le dernier point pour la tendance
        const firstPrice = priceHistory[0];
        const lastPrice = priceHistory[priceHistory.length - 1];

        // Couleurs selon tendance
        const trendColors = {
            up: '#3FCCA4',
            down: '#D84C4A',
            stable: '#1595EB'
        };

        const strokeColor = trendColors[trend] || trendColors.stable;

        // Dimensions et configuration du graphique
        const width = 190;   // Largeur totale du SVG augmentée
        const height = 40;   // Hauteur du SVG augmentée pour meilleure lisibilité
        const graphWidth = 190; // Largeur effective du graphique ajustée
        const percentageWidth = 55; // Largeur fixe pour le pourcentage
        const graphAreaWidth = graphWidth - percentageWidth; // Largeur disponible pour le graphique
        const padding = 4;    // Marge intérieure

        // Valeurs minimale et maximale pour l'échelle
        const valuesSpread = Math.abs(lastPrice - firstPrice) * 0.25; // Augmenter l'amplitude 
        const min = Math.min(firstPrice, lastPrice) - valuesSpread;
        const max = Math.max(firstPrice, lastPrice) + valuesSpread;
        const range = max - min || 1;

        // Coordonnées pour le début et la fin
        const startX = padding;
        const endX = graphAreaWidth - padding; // Ajusté pour l'indicateur de pourcentage

        // Calculer les coordonnées Y en fonction des prix
        const startY = height - padding - ((firstPrice - min) / range * (height - 2 * padding));
        const endY = height - padding - ((lastPrice - min) / range * (height - 2 * padding));

        // Amélioration de l'intensité de la courbe pour une meilleure visualisation
        const variationPercent = Math.abs((lastPrice - firstPrice) / firstPrice);
        const curveIntensity = Math.min(height * 0.5, Math.max(height * 0.15, height * variationPercent * 0.8));

        // Points de contrôle pour la courbe de Bézier
        let controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y;

        // Ajuster les points de contrôle selon la tendance pour des courbes plus marquées
        if (trend === 'up') {
            // Courbe montante avec meilleure forme
            controlPoint1X = startX + (endX - startX) * 0.3;
            controlPoint1Y = startY - curveIntensity * 0.3;
            controlPoint2X = startX + (endX - startX) * 0.7;
            controlPoint2Y = endY - curveIntensity;
        } else if (trend === 'down') {
            // Courbe descendante avec meilleure forme
            controlPoint1X = startX + (endX - startX) * 0.3;
            controlPoint1Y = startY + curveIntensity;
            controlPoint2X = startX + (endX - startX) * 0.7;
            controlPoint2Y = endY + curveIntensity * 0.3;
        } else {
            // Tendance stable: ondulation plus visible
            controlPoint1X = startX + (endX - startX) * 0.33;
            controlPoint1Y = Math.min(startY, endY) - height * 0.09;
            controlPoint2X = startX + (endX - startX) * 0.67;
            controlPoint2Y = Math.min(startY, endY) - height * 0.09;
        }

        // Format du pourcentage avec signe
        const changeValue = percentChange !== null ? percentChange :
            ((lastPrice - firstPrice) / firstPrice * 100).toFixed(1);

        const formattedChange = (parseFloat(changeValue) > 0 ? '+' : '') + changeValue;
        const changeClass = parseFloat(changeValue) > 0 ? 'positive' : parseFloat(changeValue) < 0 ? 'negative' : 'neutral';

        // Générer le chemin pour la zone ombrée sous la courbe (area fill)
        const areaPath = `
            M ${startX},${startY}
            C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${endX},${endY}
            L ${endX},${height - padding}
            L ${startX},${height - padding}
            Z
        `;

        // Générer le chemin pour la ligne de la courbe
        const linePath = `
            M ${startX},${startY}
            C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${endX},${endY}
        `;

        return (
            <div className="sparkline-container">
                <div className="sparkline">
                    <svg width="100%" height="100%" viewBox={`0 0 ${graphWidth} ${height}`} preserveAspectRatio="xMidYMid meet">
                        {/* Zone ombrée sous la courbe */}
                        <path
                            d={areaPath}
                            fill={strokeColor}
                            fillOpacity="0.15" // Augmenté pour plus de visibilité
                        />

                        {/* Courbe de Bézier */}
                        <path
                            d={linePath}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="2.5" // Augmenté pour plus de visibilité
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Points de début et de fin */}
                        <circle
                            cx={startX}
                            cy={startY}
                            r={3} // Augmenté pour plus de visibilité
                            fill={strokeColor}
                        />
                        <circle
                            cx={endX}
                            cy={endY}
                            r={3} // Augmenté pour plus de visibilité
                            fill={strokeColor}
                        />

                        {/* Pourcentage de variation */}
                        <g className="percentage-indicator" transform={`translate(${graphAreaWidth}, 0)`}>
                            <rect x="0" y="0" width={percentageWidth} height={height}
                                className={`percentage-bg ${changeClass}`}
                                rx="4" ry="4" />
                            <text x={percentageWidth / 2} y={height / 2}
                                dy=".3em" textAnchor="middle"
                                className={`percentage-text ${changeClass}`}>
                                {formattedChange}%
                            </text>
                        </g>
                    </svg>
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