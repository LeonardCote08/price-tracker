// frontend/src/pages/DetailProduitPage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProduit, fetchHistoriquePrix } from '../services/api';
import HistoriquePrixChart from '../components/HistoriquePrixChart';
import useScrollRestoration from '../hooks/useScrollRestoration';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faExternalLinkAlt,
    faTag,
    faBoxOpen,
    faBox,
    faHistory,
    faCheckCircle,
    faSignature,
    faClock
} from '@fortawesome/free-solid-svg-icons';
import './DetailProduitPage.css';

function formatListingType(listingType) {
    switch (listingType) {
        case 'fixed_price':
            return 'Fixed Price';
        case 'auction':
            return 'Auction';
        case 'auction_with_bin':
            return 'Auction + BIN';
        default:
            return 'N/A';
    }
}

function DetailProduitPage() {
    const { id } = useParams();

    const [produit, setProduit] = useState(null);
    const [historique, setHistorique] = useState({ dates: [], prices: [], stats: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modification ici : utiliser le hook de manière cohérente
    useScrollRestoration(!loading, `detail-${id}`);

    useEffect(() => {
        Promise.all([fetchProduit(id), fetchHistoriquePrix(id)])
            .then(([prodData, histData]) => {
                setProduit(prodData);
                setHistorique(histData);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading product details...</p>
        </div>
    );

    if (error) return (
        <div className="error-message">Error: {error}</div>
    );

    if (!produit) return (
        <div className="error-message">Product not found</div>
    );

    // Prix principal (ex. "Current Bid" ou "Fixed Price" )
    const price = typeof produit.price === 'number' ? produit.price : 0;

    // Détermine la classe CSS pour la variation de prix
    const getVariationClass = () => {
        if (!historique || !historique.stats || typeof historique.stats.variation !== 'number') {
            return 'neutral';
        }
        return historique.stats.variation > 0 ? 'positive' :
            historique.stats.variation < 0 ? 'negative' : 'neutral';
    };

    // Détermine la classe CSS pour la tendance
    const getTrendClass = () => {
        if (!historique || !historique.trend) return 'trend-stable';
        return historique.trend === 'up' ? 'trend-up' :
            historique.trend === 'down' ? 'trend-down' : 'trend-stable';
    };

    return (
        <div className="detail-container">
            {/* Navigation */}
            <div className="detail-header-nav">
                <Link to="/" className="back-button">
                    <FontAwesomeIcon icon={faArrowLeft} className="back-icon" />
                    Back to list
                </Link>
            </div>

            {/* Titre */}
            <div className="detail-product-header">
                <h2 className="detail-title">{produit.title}</h2>
            </div>

            {/* Contenu principal : image & infos */}
            <div className="detail-content">
                <div className="detail-image">
                    <img src={produit.image_url} alt={produit.title} />
                </div>

                <div className="detail-info">
                    {/* --- General Info --- */}
                    <div className="info-block">
                        <h4>General Info</h4>
                        <dl className="info-list">
                            {/* Prix */}
                            <div className="row">
                                <dt>Price</dt>
                                <dd>${price.toFixed(2)}</dd>
                            </div>

                            {/* Condition */}
                            <div className="row">
                                <dt>Condition</dt>
                                <dd>
                                    {produit.normalized_condition === 'New' ? (
                                        <span className="condition-new">
                                            <FontAwesomeIcon icon={faCheckCircle} /> New
                                        </span>
                                    ) : (
                                        <span className="condition-used">
                                            <FontAwesomeIcon icon={faHistory} /> Used
                                        </span>
                                    )}
                                </dd>
                            </div>

                            {/* Seller */}
                            <div className="row">
                                <dt>Seller</dt>
                                <dd>{produit.seller_username || 'Unknown'}</dd>
                            </div>

                            {/* In Box */}
                            <div className="row">
                                <dt>In Box</dt>
                                <dd>
                                    {produit.in_box === true ? (
                                        <span>
                                            <FontAwesomeIcon icon={faBox} /> Yes
                                        </span>
                                    ) : produit.in_box === false ? (
                                        <span>
                                            <FontAwesomeIcon icon={faBoxOpen} /> No
                                        </span>
                                    ) : (
                                        'Unknown'
                                    )}
                                </dd>
                            </div>

                            {/* Signed (affiché seulement si signed = true) */}
                            {produit.signed && (
                                <div className="row">
                                    <dt>Signed</dt>
                                    <dd>
                                        <FontAwesomeIcon icon={faSignature} /> Yes
                                    </dd>
                                </div>
                            )}

                            {/* Last update */}
                            <div className="row">
                                <dt>Last update</dt>
                                <dd>
                                    <FontAwesomeIcon icon={faClock} /> {produit.last_scraped_date || 'N/A'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* --- Listing Details --- */}
                    <div className="info-block">
                        <h4>Listing Details</h4>
                        <dl className="info-list">
                            {/* Type */}
                            <div className="row">
                                <dt>Type</dt>
                                <dd>{formatListingType(produit.listing_type)}</dd>
                            </div>

                            {/* Auction-specific fields */}
                            {(produit.listing_type === 'auction' || produit.listing_type === 'auction_with_bin') && (
                                <>
                                    <div className="row">
                                        <dt>Bids</dt>
                                        <dd>{produit.bids_count ?? 0}</dd>
                                    </div>
                                    <div className="row">
                                        <dt>Time left</dt>
                                        <dd>{produit.time_remaining || 'N/A'}</dd>
                                    </div>
                                </>
                            )}

                            {/* Buy It Now (si "auction_with_bin") */}
                            {produit.listing_type === 'auction_with_bin' && (
                                <div className="row">
                                    <dt>Buy It Now</dt>
                                    <dd>
                                        {produit.buy_it_now_price
                                            ? `$${produit.buy_it_now_price}`
                                            : 'N/A'
                                        }
                                    </dd>
                                </div>
                            )}

                            {/* Lien eBay */}
                            <div className="row">
                                <dt>eBay listing</dt>
                                <dd>
                                    {produit.url ? (

                                        className = "ebay-button"
                                            href={produit.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                        >
                                    <FontAwesomeIcon icon={faExternalLinkAlt} className="ebay-icon" />
                                    View on eBay
                                </a>
                                    ) : 'N/A'}
                            </dd>
                    </div>
                </dl>
            </div>
        </div>
            </div >

        {/* Graphique d'historique de prix */ }
        < div className = "detail-chart" >
                <h3 style={{ textAlign: 'center', margin: '0 0 1.5rem', color: 'var(--accent-color)', fontFamily: 'Poppins, sans-serif' }}>
                    Price History
                </h3>
                <HistoriquePrixChart
                    dates={historique.dates}
                    prices={historique.prices}
                    trend={historique.trend}
                />
    {
        historique.stats && (
            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-label">Average Price</span>
                    <span className="stat-value neutral">
                        ${historique.stats.avg_price?.toFixed(2) || 'N/A'}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Min Price</span>
                    <span className="stat-value neutral">
                        ${historique.stats.min_price?.toFixed(2) || 'N/A'}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Max Price</span>
                    <span className="stat-value neutral">
                        ${historique.stats.max_price?.toFixed(2) || 'N/A'}
                    </span>
                </div>
                {historique.stats.variation !== undefined && (
                    <div className="stat-item">
                        <span className="stat-label">Variation</span>
                        <span className={`stat-value ${getVariationClass()}`}>
                            {historique.stats.variation > 0 ? '+' : ''}
                            {historique.stats.variation.toFixed(2)}%
                        </span>
                    </div>
                )}
                {historique.stats.seven_day_avg !== undefined && (
                    <div className="stat-item">
                        <span className="stat-label">7-Day Avg</span>
                        <span className="stat-value neutral">
                            ${historique.stats.seven_day_avg.toFixed(2)}
                        </span>
                    </div>
                )}
                {historique.trend && (
                    <div className="stat-item">
                        <span className="stat-label">Trend</span>
                        <span className={`stat-value ${getTrendClass()}`}>
                            {historique.trend.toUpperCase()}
                        </span>
                    </div>
                )}
            </div>
        )
    }
            </div >
        </div >
    );
}

export default DetailProduitPage;