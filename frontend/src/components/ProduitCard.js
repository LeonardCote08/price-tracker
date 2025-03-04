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
        // Nous allons prendre moins de points mais les rendre plus significatifs
        let displayPoints = [];

        // Toujours inclure le premier et le dernier point
        // Et quelques points intermédiaires significatifs
        if (priceHistory.length <= 5) {
            displayPoints = [...priceHistory];
        } else {
            // Prendre le premier, dernier, point le plus haut, point le plus bas, et quelques points intermédiaires
            const first = priceHistory[0];
            const last = priceHistory[priceHistory.length - 1];
            const max = Math.max(...priceHistory);
            const min = Math.min(...priceHistory);

            // Toujours inclure le premier et le dernier
            displayPoints.push(first);

            // Trouver un ou deux points intermédiaires intéressants
            const midPoint = priceHistory[Math.floor(priceHistory.length / 2)];
            displayPoints.push(midPoint);

            // Ajouter le min et max s'ils ne sont pas déjà inclus
            if (min !== first && min !== last && min !== midPoint) {
                const minIndex = priceHistory.indexOf(min);
                displayPoints.push({ value: min, index: minIndex });
            }

            if (max !== first && max !== last && max !== midPoint) {
                const maxIndex = priceHistory.indexOf(max);
                displayPoints.push({ value: max, index: maxIndex });
            }

            displayPoints.push(last);

            // Trier les points par ordre d'index
            displayPoints = displayPoints
                .map((point, i) => typeof point === 'number' ? { value: point, index: i === 0 ? 0 : i === 1 ? Math.floor(priceHistory.length / 2) : priceHistory.length - 1 } : point)
                .sort((a, b) => a.index - b.index)
                .map(p => p.value);
        }

        // Couleurs selon tendance
        const trendColors = {
            up: {
                main: '#3FCCA4',
                secondary: '#2EAA83',
                gradient: ['rgba(63, 204, 164, 0.8)', 'rgba(63, 204, 164, 0)']
            },
            down: {
                main: '#D84C4A',
                secondary: '#B43A38',
                gradient: ['rgba(216, 76, 74, 0.8)', 'rgba(216, 76, 74, 0)']
            },
            stable: {
                main: '#1595EB',
                secondary: '#1276C0',
                gradient: ['rgba(21, 149, 235, 0.8)', 'rgba(21, 149, 235, 0)']
            }
        };

        const colors = trendColors[trend] || trendColors.stable;

        // Convertir les valeurs en pourcentages pour un affichage plus cohérent
        const min = Math.min(...displayPoints) * 0.95;
        const max = Math.max(...displayPoints) * 1.05;
        const range = max - min || 1;

        // Dimensions du graphique
        const width = 90;
        const height = 40;
        const graphHeight = 30; // Hauteur effective du graphique (pour laisser de la place aux labels)

        // Calculer les positions des points
        const pointCoordinates = displayPoints.map((value, index) => {
            const x = (index / (displayPoints.length - 1)) * width;
            const normalizedValue = (value - min) / range;
            const y = graphHeight - (normalizedValue * graphHeight);
            return { x, y, value };
        });

        // Calculer la tendance en pourcentage
        const percentChange = displayPoints.length >= 2
            ? ((displayPoints[displayPoints.length - 1] - displayPoints[0]) / displayPoints[0] * 100).toFixed(1)
            : "0.0";

        const isPositive = percentChange > 0;
        const isNegative = percentChange < 0;

        return (
            <div className={`enhanced-chart ${getTrendClass()}`}>
                <div className="chart-container">
                    {/* Pourcentage de variation */}
                    <div className={`percent-change ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
                        {isPositive ? '+' : ''}{percentChange}%
                    </div>

                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                        {/* Définitions de gradient et effets */}
                        <defs>
                            <linearGradient id={`line-gradient-${produit.product_id}`} x1="0%" y1="0%" x2="100%" y1="0%">
                                <stop offset="0%" stopColor={colors.secondary} />
                                <stop offset="100%" stopColor={colors.main} />
                            </linearGradient>

                            <filter id={`glow-${produit.product_id}`}>
                                <feGaussianBlur stdDeviation="1.5" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Tracer la ligne entre les points */}
                        <polyline
                            points={pointCoordinates.map(pt => `${pt.x},${pt.y}`).join(' ')}
                            fill="none"
                            stroke={`url(#line-gradient-${produit.product_id})`}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Points */}
                        {pointCoordinates.map((pt, i) => (
                            <g key={i}>
                                {/* Point extérieur */}
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={i === 0 || i === pointCoordinates.length - 1 ? 3.5 : 3}
                                    fill="#243748"
                                />
                                {/* Point intérieur */}
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={i === 0 || i === pointCoordinates.length - 1 ? 2.5 : 2}
                                    fill={colors.main}
                                    filter={`url(#glow-${produit.product_id})`}
                                />
                            </g>
                        ))}
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