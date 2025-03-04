// frontend/src/components/ProduitCard.js

import React, { useEffect, useState } from 'react';
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
        const fetchPriceHistory = async () => {
            console.log(`⏳ Récupération des données pour produit ${produit.product_id}...`);
            try {
                // URL API conforme au format de votre backend
                const response = await fetch(`/api/produits/${produit.product_id}/historique-prix`);

                // Vérifier que la réponse est OK
                if (!response.ok) {
                    throw new Error(`API a répondu avec le statut ${response.status}`);
                }

                const data = await response.json();
                console.log(`📊 Données pour produit ${produit.product_id}:`, data);

                // ICI EST LA CORRECTION: Vérifier d'abord si nous avons un tableau de prix
                if (data && Array.isArray(data.prices) && data.prices.length >= 2) {
                    console.log(`✅ Historique prix trouvé: ${data.prices.length} points`);
                    setPriceHistory(data.prices);

                    // Calculer variation entre premier et dernier point
                    const firstPrice = data.prices[0];
                    const lastPrice = data.prices[data.prices.length - 1];

                    // Vérifier que les prix sont valides
                    if (typeof firstPrice === 'number' && typeof lastPrice === 'number' && firstPrice !== 0) {
                        const change = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(1);
                        console.log(`📈 Variation calculée: ${change}%`);
                        setPercentChange(change);

                        // Déterminer tendance
                        const changeValue = parseFloat(change);
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

                    // Si l'API renvoie déjà une tendance, l'utiliser
                    if (data.trend) {
                        console.log(`🔄 Tendance fournie par API: ${data.trend}`);
                        setTrend(data.trend);
                        if (data.trend === 'up') setTrendText('Price Rising');
                        else if (data.trend === 'down') setTrendText('Price Falling');
                        else setTrendText('Price Stable');
                    }

                    // Si l'API fournit des stats avec variation, l'utiliser pour le pourcentage
                    if (data.stats && typeof data.stats.variation === 'number') {
                        const apiChange = data.stats.variation.toFixed(1);
                        console.log(`🔢 Variation depuis API: ${apiChange}%`);
                        setPercentChange(apiChange);
                    }
                } else {
                    console.warn(`⚠️ Pas d'historique valid pour produit ${produit.product_id}`);
                    fallbackToTrendAPI();
                }
            } catch (err) {
                console.error(`❌ Erreur API pour produit ${produit.product_id}:`, err);
                fallbackToTrendAPI();
            }
        };

        // Fonction de repli en cas d'échec
        const fallbackToTrendAPI = async () => {
            console.log(`🔍 Tentative de récupération tendance via API secondaire...`);
            try {
                const trendResponse = await fetch(`/api/produits/${produit.product_id}/price-trend`);
                if (!trendResponse.ok) {
                    throw new Error(`API tendance a répondu avec le statut ${trendResponse.status}`);
                }
                const trendData = await trendResponse.json();
                console.log(`👍 Tendance récupérée via API secondaire: ${trendData.trend}`);
                setTrend(trendData.trend);
                if (trendData.trend === 'up') setTrendText('Price Rising');
                else if (trendData.trend === 'down') setTrendText('Price Falling');
                else setTrendText('Price Stable');
            } catch (errFallback) {
                console.error('❌ Erreur lors de la récupération de la tendance (fallback)', errFallback);
            }
        };

        fetchPriceHistory();
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

    // Fonction pour tronquer le titre (limite stricte à 40 caractères pour uniformité)
    const truncateTitle = (title, length = 40) => {
        if (!title) return '';

        if (title.length > length) {
            return title.substring(0, length) + '...';
        }
        return title;
    };

    // Rendu du graphique de tendance amélioré avec courbe de Bézier
    const renderSparkline = () => {
        // Au début de la fonction renderSparkline()
        if (!priceHistory || priceHistory.length < 2) {
            console.log(`🔴 Produit ${produit.product_id}: graphique par défaut (pas de données)`);
            return renderDefaultSparkline();
        }

        console.log(`🟢 Produit ${produit.product_id}: graphique avec ${priceHistory.length} points`);

        // Nous utilisons le premier et le dernier point pour la tendance principale
        const firstPrice = priceHistory[0];
        const lastPrice = priceHistory[priceHistory.length - 1];

        // Couleurs selon tendance (uniformisées avec les variables CSS)
        const trendColors = {
            up: 'var(--trend-up)',
            down: 'var(--trend-down)',
            stable: 'var(--trend-stable)'
        };

        const strokeColor = trendColors[trend] || trendColors.stable;

        // Dimensions et configuration du graphique
        const width = 180;    // Largeur totale du SVG
        const height = 38;    // Hauteur du SVG adapté à --sparkline-height
        const graphWidth = 158; // Largeur effective du graphique
        const padding = 4;    // Marge intérieure

        // Valeurs minimale et maximale pour l'échelle avec amplitude augmentée
        const min = Math.min(...priceHistory) * 0.9; // 10% en dessous du minimum
        const max = Math.max(...priceHistory) * 1.1; // 10% au-dessus du maximum
        const range = max - min || 1;

        // Coordonnées pour le début et la fin
        const startX = padding;
        const endX = graphWidth - 70; // Ajusté pour l'indicateur de pourcentage

        // Calculer les coordonnées Y en fonction des prix
        const startY = height - padding - ((firstPrice - min) / range * (height - 2 * padding));
        const endY = height - padding - ((lastPrice - min) / range * (height - 2 * padding));

        // Amélioration de l'intensité de la courbe pour une meilleure visualisation
        const variationPercent = Math.abs((lastPrice - firstPrice) / firstPrice);
        const curveIntensity = Math.min(height * 0.6, Math.max(height * 0.2, height * variationPercent));

        // Points de contrôle pour la courbe de Bézier
        let controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y;

        // Si nous avons plus de 2 points, créer une courbe plus complexe
        if (priceHistory.length > 2) {
            const midIndex = Math.floor(priceHistory.length / 2);
            const midPrice = priceHistory[midIndex];
            const midX = startX + (endX - startX) * (midIndex / (priceHistory.length - 1));
            const midY = height - padding - ((midPrice - min) / range * (height - 2 * padding));

            if (trend === 'up') {
                // Courbe montante avec un point intermédiaire
                controlPoint1X = midX - (midX - startX) * 0.3;
                controlPoint1Y = midY + (startY - midY) * 0.3;
                controlPoint2X = midX + (endX - midX) * 0.3;
                controlPoint2Y = midY + (endY - midY) * 0.3;
            } else if (trend === 'down') {
                // Courbe descendante avec un point intermédiaire
                controlPoint1X = midX - (midX - startX) * 0.3;
                controlPoint1Y = midY + (startY - midY) * 0.3;
                controlPoint2X = midX + (endX - midX) * 0.3;
                controlPoint2Y = midY + (endY - midY) * 0.3;
            } else {
                // Tendance stable: ondulation plus visible
                controlPoint1X = midX - (midX - startX) * 0.5;
                controlPoint1Y = midY - height * 0.1;
                controlPoint2X = midX + (endX - midX) * 0.5;
                controlPoint2Y = midY + height * 0.1;
            }
        } else {
            // Courbe simple avec 2 points
            if (trend === 'up') {
                controlPoint1X = startX + (endX - startX) * 0.3;
                controlPoint1Y = startY - curveIntensity * 0.3;
                controlPoint2X = startX + (endX - startX) * 0.7;
                controlPoint2Y = endY - curveIntensity;
            } else if (trend === 'down') {
                controlPoint1X = startX + (endX - startX) * 0.3;
                controlPoint1Y = startY + curveIntensity;
                controlPoint2X = startX + (endX - startX) * 0.7;
                controlPoint2Y = endY + curveIntensity * 0.3;
            } else {
                controlPoint1X = startX + (endX - startX) * 0.33;
                controlPoint1Y = Math.min(startY, endY) - height * 0.1;
                controlPoint2X = startX + (endX - startX) * 0.67;
                controlPoint2Y = Math.min(startY, endY) - height * 0.1;
            }
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
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                        {/* Points de données intermédiaires pour texture */}
                        {trend !== 'stable' && (
                            <g className="data-points">
                                {[0.2, 0.4, 0.6, 0.8].map((fraction) => {
                                    const t = fraction;
                                    // Formule de Bézier cubique
                                    const pointX = Math.pow(1 - t, 3) * startX +
                                        3 * Math.pow(1 - t, 2) * t * controlPoint1X +
                                        3 * (1 - t) * Math.pow(t, 2) * controlPoint2X +
                                        Math.pow(t, 3) * endX;
                                    const pointY = Math.pow(1 - t, 3) * startY +
                                        3 * Math.pow(1 - t, 2) * t * controlPoint1Y +
                                        3 * (1 - t) * Math.pow(t, 2) * controlPoint2Y +
                                        Math.pow(t, 3) * endY;
                                    return (
                                        <circle
                                            key={fraction}
                                            cx={pointX}
                                            cy={pointY}
                                            r={1.5}
                                            fill={strokeColor}
                                            fillOpacity={0.8}
                                        />
                                    );
                                })}
                            </g>
                        )}

                        {/* Points de données réels (en plus petits) */}
                        {priceHistory.length > 2 && (
                            <g className="real-data-points">
                                {priceHistory.map((price, index) => {
                                    if (index === 0 || index === priceHistory.length - 1) return null;
                                    const pointX = startX + (endX - startX) * (index / (priceHistory.length - 1));
                                    const pointY = height - padding - ((price - min) / range * (height - 2 * padding));
                                    return (
                                        <circle
                                            key={index}
                                            cx={pointX}
                                            cy={pointY}
                                            r={1}
                                            fill={strokeColor}
                                            fillOpacity={0.6}
                                        />
                                    );
                                })}
                            </g>
                        )}

                        {/* Zone ombrée sous la courbe avec dégradé */}
                        <defs>
                            <linearGradient id={`gradient-${produit.product_id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
                                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.05" />
                            </linearGradient>
                        </defs>
                        <path
                            d={areaPath}
                            fill={`url(#gradient-${produit.product_id})`}
                        />

                        {/* Ligne d'axe horizontal subtile */}
                        <line
                            x1={startX}
                            y1={height - padding}
                            x2={endX}
                            y2={height - padding}
                            stroke="rgba(255, 255, 255, 0.1)"
                            strokeWidth="1"
                        />

                        {/* Courbe de Bézier */}
                        <path
                            d={linePath}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Points de début et de fin */}
                        <circle
                            cx={startX}
                            cy={startY}
                            r={3.5}
                            fill={strokeColor}
                        />
                        <circle
                            cx={endX}
                            cy={endY}
                            r={3.5}
                            fill={strokeColor}
                            strokeWidth="1.5"
                            stroke="rgba(0,0,0,0.2)"
                        />
                    </svg>
                </div>

                {/* Pourcentage de variation */}
                <div className={`change-indicator ${changeClass}`}>
                    {formattedChange}%
                </div>
            </div>
        );
    };

    // Rendu d'un graphique par défaut si pas d'historique
    const renderDefaultSparkline = () => {
        // Couleurs selon tendance (uniformisées avec les variables CSS)
        const trendColors = {
            up: 'var(--trend-up)',
            down: 'var(--trend-down)',
            stable: 'var(--trend-stable)'
        };

        const strokeColor = trendColors[trend];

        // Dimensions et configuration du graphique
        const width = 180;
        const height = 38;
        const graphWidth = 158;
        const padding = 4;

        // AUGMENTER LA VARIABILITÉ pour distinguer facilement les graphiques par défaut
        // Utiliser l'ID du produit pour créer une "empreinte" unique
        const productSeed = produit.product_id;

        // Créer des coefficients variés basés sur l'ID (modulo pour éviter les trop grands nombres)
        const offsetX = (productSeed % 7) - 3; // -3 à +3
        const offsetY = (productSeed % 5) - 2; // -2 à +2 
        const variance = ((productSeed % 10) + 1) / 5; // 0.2 à 2.0

        // Variation de hauteur encore plus prononcée
        const heightVariance = ((productSeed % 8) - 4) * 2; // -8 à +6

        // Valeurs par défaut pour un graphique stable
        const startX = padding + offsetX;
        const endX = graphWidth - 70 - offsetX;
        const middleY = height / 2 + heightVariance;

        // Points pour un graphique simple avec FORTE variabilité
        let linePath, areaPath;

        if (trend === 'up') {
            // Courbe montante variée
            linePath = `
                M ${startX},${middleY + 5 * variance}
                C ${startX + 30 + offsetX},${middleY + 2 * variance} ${endX - 30 - offsetX},${middleY - 2 * variance} ${endX},${middleY - 5 * variance}
            `;
            areaPath = `
                M ${startX},${middleY + 5 * variance}
                C ${startX + 30 + offsetX},${middleY + 2 * variance} ${endX - 30 - offsetX},${middleY - 2 * variance} ${endX},${middleY - 5 * variance}
                L ${endX},${height - padding}
                L ${startX},${height - padding}
                Z
            `;
        } else if (trend === 'down') {
            // Courbe descendante variée
            linePath = `
                M ${startX},${middleY - 5 * variance}
                C ${startX + 30 + offsetX},${middleY - 2 * variance} ${endX - 30 - offsetX},${middleY + 2 * variance} ${endX},${middleY + 5 * variance}
            `;
            areaPath = `
                M ${startX},${middleY - 5 * variance}
                C ${startX + 30 + offsetX},${middleY - 2 * variance} ${endX - 30 - offsetX},${middleY + 2 * variance} ${endX},${middleY + 5 * variance}
                L ${endX},${height - padding}
                L ${startX},${height - padding}
                Z
            `;
        } else {
            // Tendance stable: ondulation variée
            linePath = `
                M ${startX},${middleY + offsetY}
                C ${startX + 30 + offsetX},${middleY - 3 * variance} 
                  ${startX + 70 + offsetX * 2},${middleY + 3 * variance}
                  ${endX - 40 - offsetX},${middleY - 2 * variance}
                  ${endX},${middleY + offsetY}
            `;
            areaPath = `
                M ${startX},${middleY + offsetY}
                C ${startX + 30 + offsetX},${middleY - 3 * variance}
                  ${startX + 70 + offsetX * 2},${middleY + 3 * variance}
                  ${endX - 40 - offsetX},${middleY - 2 * variance}
                  ${endX},${middleY + offsetY}
                L ${endX},${height - padding}
                L ${startX},${height - padding}
                Z
            `;
        }

        // Format du pourcentage (si percentChange est null, on utilise 0)
        const changeValue = percentChange !== null ? percentChange : "0.0";
        const formattedChange = (parseFloat(changeValue) > 0 ? '+' : '') + changeValue;
        const changeClass = parseFloat(changeValue) > 0 ? 'positive' : parseFloat(changeValue) < 0 ? 'negative' : 'neutral';

        return (
            <div className="sparkline-container">
                <div className="sparkline">
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                        {/* Zone ombrée sous la courbe avec dégradé */}
                        <defs>
                            <linearGradient id={`gradient-${produit.product_id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
                                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.05" />
                            </linearGradient>
                        </defs>
                        <path
                            d={areaPath}
                            fill={`url(#gradient-${produit.product_id})`}
                        />

                        {/* Ligne d'axe horizontal subtile */}
                        <line
                            x1={startX}
                            y1={height - padding}
                            x2={endX}
                            y2={height - padding}
                            stroke="rgba(255, 255, 255, 0.1)"
                            strokeWidth="1"
                        />

                        {/* Courbe de Bézier */}
                        <path
                            d={linePath}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Points de début et de fin avec variabilité */}
                        <circle
                            cx={startX}
                            cy={trend === 'up' ? middleY + 5 * variance :
                                trend === 'down' ? middleY - 5 * variance :
                                    middleY + offsetY}
                            r={3.5}
                            fill={strokeColor}
                        />
                        <circle
                            cx={endX}
                            cy={trend === 'up' ? middleY - 5 * variance :
                                trend === 'down' ? middleY + 5 * variance :
                                    middleY + offsetY}
                            r={3.5}
                            fill={strokeColor}
                            strokeWidth="1.5"
                            stroke="rgba(0,0,0,0.2)"
                        />
                    </svg>
                </div>

                {/* Pourcentage de variation */}
                <div className={`change-indicator ${changeClass}`}>
                    {formattedChange}%
                </div>
            </div>
        );
    };

    // Format de date pour l'affichage
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            }).format(date);
        } catch (e) {
            return dateString;
        }
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
                    <h3 className="product-title">{truncateTitle(produit.title, 40)}</h3>

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
                            <span className="update-date">{formatDate(produit.last_scraped_date)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default ProduitCard;