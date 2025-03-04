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

    // Fonction améliorée pour dessiner la sparkline avec SVG
    const renderSparkline = () => {
        if (!priceHistory || priceHistory.length < 2) return null;

        const min = Math.min(...priceHistory) * 0.85; // Augmenté la marge pour éviter l'effet écrasé 
        const max = Math.max(...priceHistory) * 1.15; // Augmenté la marge pour obtenir plus de hauteur
        const range = max - min || 1; // Éviter division par zéro

        // Configuration du SVG améliorée pour éviter l'effet "écrasé"
        const width = 100;
        const height = 70; // Considérablement augmenté pour un graphique plus haut
        const strokeWidth = isHovered ? 3.5 : 2.8;
        const dotRadius = isHovered ? 4 : 3;
        const padding = 8; // Padding augmenté pour plus d'espace

        // Couleurs selon la tendance avec opacité améliorée pour le remplissage
        const trendColors = {
            up: {
                stroke: '#3FCCA4',
                fill: 'rgba(63, 204, 164, 0.3)',
                dot: '#3FCCA4',
                glow: 'rgba(63, 204, 164, 0.7)'
            },
            down: {
                stroke: '#D84C4A',
                fill: 'rgba(216, 76, 74, 0.3)',
                dot: '#D84C4A',
                glow: 'rgba(216, 76, 74, 0.7)'
            },
            stable: {
                stroke: '#1595EB',
                fill: 'rgba(21, 149, 235, 0.2)',
                dot: '#1595EB',
                glow: 'rgba(21, 149, 235, 0.7)'
            }
        };

        const colors = trendColors[trend] || trendColors.stable;

        // Créer les points pour le tracé avec une courbe lissée
        const points = priceHistory.map((price, index) => {
            // Ajuster les coordonnées avec padding pour éviter l'effet écrasé
            const x = padding + ((index / (priceHistory.length - 1)) * (width - 2 * padding));
            // Inverser Y avec padding et ajuster la hauteur pour avoir une meilleure courbe
            const y = padding + ((height - 2 * padding) - ((price - min) / range) * (height - 2 * padding));
            return { x, y };
        });

        // Générer un chemin SVG lissé
        let pathD = '';
        if (points.length > 0) {
            pathD = `M ${points[0].x},${points[0].y}`;

            for (let i = 0; i < points.length - 1; i++) {
                const currentPoint = points[i];
                const nextPoint = points[i + 1];

                // Améliorer la courbe de Bézier pour un rendu plus fluide et naturel
                const controlX1 = currentPoint.x + (nextPoint.x - currentPoint.x) / 3;
                const controlY1 = currentPoint.y;
                const controlX2 = nextPoint.x - (nextPoint.x - currentPoint.x) / 3;
                const controlY2 = nextPoint.y;

                pathD += ` C ${controlX1},${controlY1} ${controlX2},${controlY2} ${nextPoint.x},${nextPoint.y}`;
            }
        }

        // Créer l'aire sous la courbe
        let areaPathD = pathD;
        if (points.length > 0) {
            // Ajouter les points pour fermer le chemin et créer l'aire
            areaPathD += ` L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`;
        }

        // Animation pour le chemin (dépend du hover)
        const animationProps = isHovered ? {
            style: { animation: 'pulsePath 1.5s infinite alternate ease-in-out' }
        } : {};

        // Ajoutons une grille légère pour donner plus de profondeur
        const gridLines = [];
        const numGridLinesY = 4; // Nombre de lignes horizontales

        for (let i = 1; i < numGridLinesY; i++) {
            const y = padding + ((height - 2 * padding) * i / numGridLinesY);
            gridLines.push(
                <line
                    key={`grid-y-${i}`}
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1"
                />
            );
        }

        // Points pour indiquer le min et max
        const minMaxPoints = [];
        const minPrice = Math.min(...priceHistory);
        const maxPrice = Math.max(...priceHistory);

        // Trouver les indices des valeurs min et max
        const minIndex = priceHistory.indexOf(minPrice);
        const maxIndex = priceHistory.indexOf(maxPrice);

        if (minIndex !== -1) {
            const minPoint = points[minIndex];
            minMaxPoints.push(
                <g key="min-indicator" className="min-point-group">
                    <circle
                        cx={minPoint.x}
                        cy={minPoint.y}
                        r={dotRadius + 2}
                        fill="transparent"
                        stroke="rgba(216, 76, 74, 0.5)"
                        strokeWidth="1"
                        opacity={isHovered ? 1 : 0.5}
                    />
                </g>
            );
        }

        if (maxIndex !== -1) {
            const maxPoint = points[maxIndex];
            minMaxPoints.push(
                <g key="max-indicator" className="max-point-group">
                    <circle
                        cx={maxPoint.x}
                        cy={maxPoint.y}
                        r={dotRadius + 2}
                        fill="transparent"
                        stroke="rgba(63, 204, 164, 0.5)"
                        strokeWidth="1"
                        opacity={isHovered ? 1 : 0.5}
                    />
                </g>
            );
        }

        return (
            <div className={`sparkline ${getTrendClass()} ${isHovered ? 'hovered' : ''}`}>
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="none"
                    style={{ overflow: 'visible' }}
                >
                    {/* Effet de glow pour la courbe */}
                    <filter id={`glow-${produit.product_id}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation={isHovered ? "2" : "1"} result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>

                    {/* Dégradé amélioré */}
                    <defs>
                        <linearGradient id={`gradient-${produit.product_id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={colors.fill} stopOpacity="0.7" />
                            <stop offset="100%" stopColor={colors.fill} stopOpacity="0.1" />
                        </linearGradient>

                        {/* Dégradé pour l'effet de lueur */}
                        <linearGradient id={`glow-gradient-${produit.product_id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={colors.glow} stopOpacity="0.5" />
                            <stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Zone de fond avec bordure */}
                    <rect
                        x={padding / 2}
                        y={padding / 2}
                        width={width - padding}
                        height={height - padding}
                        fill="rgba(45, 69, 92, 0.3)"
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeWidth="1"
                        rx="4"
                    />

                    {/* Lignes de grille */}
                    {gridLines}

                    {/* Effet de lueur sous la courbe */}
                    {isHovered && (
                        <path
                            d={areaPathD}
                            fill={`url(#glow-gradient-${produit.product_id})`}
                            stroke="none"
                            style={{
                                animation: 'pulseGlow 1.5s infinite alternate ease-in-out',
                                transformOrigin: 'center'
                            }}
                        />
                    )}

                    {/* Aire sous la courbe avec dégradé */}
                    <path
                        d={areaPathD}
                        fill={`url(#gradient-${produit.product_id})`}
                        stroke="none"
                        style={{
                            transition: 'all 0.3s ease'
                        }}
                    />

                    {/* Ligne de courbe lissée */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke={colors.stroke}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter={`url(#glow-${produit.product_id})`}
                        {...animationProps}
                        style={{
                            transition: 'stroke-width 0.3s ease',
                            ...animationProps.style
                        }}
                    />

                    {/* Indicateurs min-max */}
                    {isHovered && minMaxPoints}

                    {/* Points sur la courbe - seulement quelques points stratégiques */}
                    {points.map((point, index) => {
                        // N'afficher que les points stratégiques pour un look plus propre
                        if (index === 0 || index === points.length - 1 ||
                            (isHovered && (index % Math.ceil(points.length / 4) === 0 || index === minIndex || index === maxIndex))) {
                            const isEndPoint = index === 0 || index === points.length - 1;
                            const isSpecialPoint = index === minIndex || index === maxIndex;

                            return (
                                <circle
                                    key={index}
                                    cx={point.x}
                                    cy={point.y}
                                    r={isSpecialPoint ? dotRadius + 1 : isEndPoint ? dotRadius + 0.5 : dotRadius - 0.5}
                                    fill={colors.dot}
                                    stroke="#fff"
                                    strokeWidth="1"
                                    filter={`url(#glow-${produit.product_id})`}
                                    style={{
                                        transition: 'r 0.3s ease, opacity 0.3s ease',
                                        opacity: isHovered || isEndPoint ? 1 : 0.7
                                    }}
                                />
                            );
                        }
                        return null;
                    })}
                </svg>
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