// frontend/src/pages/DetailProduitPage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchProduit, fetchHistoriquePrix } from '../services/api';
import HistoriquePrixChart from '../components/HistoriquePrixChart';
import useScrollRestoration from '../hooks/useScrollRestoration';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faTag,
    faCheckCircle,
    faHistory,
    faSignature,
    faBoxOpen,
    faBox,
    faClock,
    faArrowTrendUp,
    faArrowTrendDown,
    faChartLine
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

function getTrendIcon(trend) {
    if (trend === 'up') return faArrowTrendUp;
    if (trend === 'down') return faArrowTrendDown;
    return faChartLine;
}

function DetailProduitPage() {
    const { id } = useParams();

    const [produit, setProduit] = useState(null);
    const [historique, setHistorique] = useState({ dates: [], prices: [], stats: {}, trend: 'stable' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useScrollRestoration(loading ? 'loading-true' : 'loading-false');

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

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!produit) return <p>Product not found</p>;

    // Prix principal (ex. "Current Bid" ou "Fixed Price" )
    const price = typeof produit.price === 'number' ? produit.price : 0;

    // Fonction pour rendu des badges
    const renderBadges = () => {
        const badges = [];

        // Badge Condition (NEW ou USED)
        if (produit.normalized_condition === 'New') {
            badges.push(
                <div key="condition" className="detail-badge detail-badge-new">
                    <FontAwesomeIcon icon={faCheckCircle} /> New
                </div>
            );
        } else if (produit.normalized_condition === 'Used') {
            badges.push(
                <div key="condition" className="detail-badge detail-badge-used">
                    <FontAwesomeIcon icon={faHistory} /> Used
                </div>
            );
        }

        // Badge Signed
        if (produit.signed) {
            badges.push(
                <div key="signed" className="detail-badge detail-badge-signed">
                    <FontAwesomeIcon icon={faSignature} /> Signed
                </div>
            );
        }

        // Badge In Box / No Box
        if (produit.in_box === true) {
            badges.push(
                <div key="inbox" className="detail-badge detail-badge-inbox">
                    <FontAwesomeIcon icon={faBox} /> In Box
                </div>
            );
        } else if (produit.in_box === false) {
            badges.push(
                <div key="nobox" className="detail-badge detail-badge-nobox">
                    <FontAwesomeIcon icon={faBoxOpen} /> No Box
                </div>
            );
        }

        // Badge Ended
        if (produit.ended) {
            badges.push(
                <div key="ended" className="detail-badge detail-badge-ended">
                    <FontAwesomeIcon icon={faClock} /> Ended
                </div>
            );
        }

        return badges;
    };

    return (
        <div className="detail-container">
            {/* Retour & Titre */}
            <div className="detail-product-header">
                <Link to="/" className="back-button">
                    <FontAwesomeIcon icon={faArrowLeft} /> Back
                </Link>
                <h2 className="detail-title">{produit.title}</h2>
            </div>

            {/* Badges */}
            <div className="detail-badges">
                {renderBadges()}
            </div>

            {/* Contenu principal : image & infos */}
            <div className="detail-content">
                <div className="detail-image">
                    <img src={produit.image_url} alt={produit.title} />
                </div>

                <div className="detail-info">
                    {/* --- General Info --- */}
                    <div className="general-info-block">
                        <h4>General Information</h4>
                        <dl className="info-list">
                            {/* Prix */}
                            <div className="row">
                                <dt>Price</dt>
                                <dd className="value-price">${price.toFixed(2)}</dd>
                            </div>

                            {/* Condition */}
                            <div className="row">
                                <dt>Condition</dt>
                                <dd>
                                    {produit.normalized_condition === 'New' ? (
                                        <span className="value-new">
                                            New
                                        </span>
                                    ) : (
                                        <span className="value-used">
                                            Used
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
                                    {produit.in_box === true
                                        ? 'Yes'
                                        : produit.in_box === false
                                            ? 'No'
                                            : 'Unknown'
                                    }
                                </dd>
                            </div>

                            {/* Signed (affiché seulement si signed = true) */}
                            {produit.signed && (
                                <div className="row">
                                    <dt>Signed</dt>
                                    <dd>Yes</dd>
                                </div>
                            )}

                            {/* Last update */}
                            <div className="row">
                                <dt>Last update</dt>
                                <dd>{produit.last_scraped_date || 'N/A'}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* --- Listing Details --- */}
                    <div className="listing-info-block">
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
                                        <a
                                            className="ebay-link"
                                            href={produit.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            View on eBay
                                        </a>
                                    ) : 'N/A'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* Graphique d'historique de prix */}
            <div className="detail-chart">
                <h3 className="chart-title">Price History</h3>
                <HistoriquePrixChart
                    dates={historique.dates}
                    prices={historique.prices}
                    trend={historique.trend}
                />
                {historique.stats && (
                    <div className="stats-grid">
                        <div className="stat-item">
                            <span className="stat-label">Average Price</span>
                            <span className="stat-value">
                                ${historique.stats.avg_price?.toFixed(2) || 'N/A'}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Min Price</span>
                            <span className="stat-value">
                                ${historique.stats.min_price?.toFixed(2) || 'N/A'}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Max Price</span>
                            <span className="stat-value">
                                ${historique.stats.max_price?.toFixed(2) || 'N/A'}
                            </span>
                        </div>
                        {historique.stats.variation !== undefined && (
                            <div className="stat-item">
                                <span className="stat-label">Variation</span>
                                <span className={`stat-value ${parseFloat(historique.stats.variation) > 0 ? 'trend-up' : parseFloat(historique.stats.variation) < 0 ? 'trend-down' : ''}`}>
                                    {historique.stats.variation > 0 ? '+' : ''}{historique.stats.variation.toFixed(2)}%
                                </span>
                            </div>
                        )}
                        {historique.stats.seven_day_avg !== undefined && (
                            <div className="stat-item">
                                <span className="stat-label">7-Day Avg</span>
                                <span className="stat-value">
                                    ${historique.stats.seven_day_avg.toFixed(2)}
                                </span>
                            </div>
                        )}
                        {historique.trend && (
                            <div className="stat-item">
                                <span className="stat-label">Trend</span>
                                <span className={`stat-value ${historique.trend === 'up' ? 'trend-up' : historique.trend === 'down' ? 'trend-down' : 'trend-stable'}`}>
                                    <FontAwesomeIcon icon={getTrendIcon(historique.trend)} />{' '}
                                    {historique.trend === 'up' ? 'Rising' : historique.trend === 'down' ? 'Falling' : 'Stable'}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DetailProduitPage;