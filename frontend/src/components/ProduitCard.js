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
                    setPriceHistory(data.prices.slice(-8)); // On prend les 8 derniers points pour plus de détail
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

    // Fonction améliorée pour dessiner la sparkline avec SVG
    const renderSparkline = () => {
        if (!priceHistory || priceHistory.length < 2) return null;

        const min = Math.min(...priceHistory) * 0.95; // Légère marge pour éviter que la courbe touche le bord
        const max = Math.max(...priceHistory) * 1.05;
        const range = max - min || 1; // Éviter division par zéro

        // Configuration du SVG
        const width = 100; // Pourcentage de la largeur
        const height = 30; // Hauteur en pixels augmentée pour plus de clarté
        const strokeWidth = 2.5; // Épaisseur de ligne plus importante
        const dotRadius = 3; // Taille des points

        // Couleurs selon la tendance avec opacité améliorée pour le remplissage
        const trendColors = {
            up: {
                stroke: '#3FCCA4',
                fill: 'rgba(63, 204, 164, 0.3)',
                dot: '#3FCCA4'
            },
            down: {
                stroke: '#D84C4A',
                fill: 'rgba(216, 76, 74, 0.3)',
                dot: '#D84C4A'
            },
            stable: {
                stroke: '#1595EB',
                fill: 'rgba(21, 149, 235, 0.2)',
                dot: '#1595EB'
            }
        };

        const colors = trendColors[trend] || trendColors.stable;

        // Créer les points pour le tracé avec une courbe lissée
        // Utilisation de courbes de Bézier pour un rendu plus fluide
        let pathD = '';
        const points = priceHistory.map((price, index) => {
            const x = (index / (priceHistory.length - 1)) * width;
            // Inverser Y car SVG commence en haut
            const y = height - ((price - min) / range) * height;
            return { x, y };
        });

        // Générer un chemin SVG lissé
        if (points.length > 0) {
            pathD = `M ${points[0].x},${points[0].y}`;

            for (let i = 0; i < points.length - 1; i++) {
                const currentPoint = points[i];
                const nextPoint = points[i + 1];

                // Calculer les points de contrôle pour une courbe douce
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
            areaPathD += ` L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;
        }

        return (
            <div className={`sparkline ${getTrendClass()}`}>
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="none"
                    style={{ overflow: 'visible' }}
                >
                    {/* Effet de glow pour la courbe */}
                    <filter id={`glow-${produit.product_id}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>

                    {/* Aire sous la courbe avec dégradé */}
                    <defs>
                        <linearGradient id={`gradient-${produit.product_id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={colors.fill} stopOpacity="0.7" />
                            <stop offset="100%" stopColor={colors.fill} stopOpacity="0.1" />
                        </linearGradient>
                    </defs>

                    {/* Aire sous la courbe avec dégradé */}
                    <path
                        d={areaPathD}
                        fill={`url(#gradient-${produit.product_id})`}
                        stroke="none"
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
                    />

                    {/* Points sur la courbe - seulement premier et dernier point */}
                    {points.map((point, index) => {
                        // N'afficher que les points de début et de fin pour un look plus propre
                        if (index === 0 || index === points.length - 1) {
                            return (
                                <circle
                                    key={index}
                                    cx={point.x}
                                    cy={point.y}
                                    r={index === points.length - 1 ? dotRadius : dotRadius - 0.5}
                                    fill={colors.dot}
                                    stroke="#fff"
                                    strokeWidth="1"
                                    filter={`url(#glow-${produit.product_id})`}
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