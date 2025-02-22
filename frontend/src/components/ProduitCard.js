// frontend/src/components/ProduitCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ProduitCard.css';

function ProduitCard({ produit }) {
    const price = typeof produit.price === 'number' ? produit.price : 0;
    const buyItNow = typeof produit.buy_it_now_price === 'number'
        ? produit.buy_it_now_price
        : null;

    const conditionText = produit.normalized_condition?.trim() || 'Not specified';

    let listingLabel = '';
    if (produit.listing_type === 'fixed_price') {
        listingLabel = 'Fixed Price';
    } else if (produit.listing_type === 'auction') {
        listingLabel = 'Auction';
    } else if (produit.listing_type === 'auction_with_bin') {
        listingLabel = 'Auction + BIN';
    }

    const isAuction = (produit.listing_type === 'auction' || produit.listing_type === 'auction_with_bin');



    return (
        <Link
            to={`/produits/${produit.product_id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
            onClick={() => {
                const pos = window.pageYOffset;
                console.log(`[ProduitCard] Saving scroll position for "/": ${pos}`);
                sessionStorage.setItem('scroll-/', pos.toString());
            }}
        >
            <div className="produit-card">
                <img
                    className="product-image"
                    src={produit.image_url}
                    alt={produit.title || 'No title'}
                />

                <div className="product-info">
                    {/* Retrait du titre, on affiche seulement les badges (Signed, In Box, Ended) */}
                    <div className="badges-container">
                        {produit.signed && (
                            <span className="badge badge-signed">Signed</span>
                        )}

                        {produit.in_box === true && (
                            <span className="badge badge-inbox">In Box</span>
                        )}
                        {produit.in_box === false && (
                            <span className="badge badge-nobox">No Box</span>
                        )}

                        {produit.ended && (
                            <span className="badge badge-ended">Ended</span>
                        )}
                    </div>


                    <div className="condition-listing-line">
                        <span className="condition-text">{conditionText}</span>
                        <span className="separator"> • </span>
                        <span className="listing-text">{listingLabel}</span>
                    </div>

                    {isAuction && (
                        <div className="auction-info-line">
                            <span>Bids: {produit.bids_count ?? 0}</span>
                            <span className="separator"> • </span>
                            <span>Time left: {produit.time_remaining || 'N/A'}</span>
                        </div>
                    )}


                    

                    <div className="price-section" style={{ marginTop: '0.5rem' }}>
                        {isAuction && (
                            <div className="price-line">
                                <span className="price-label">Current Bid:</span>
                                <span className="price-value">${price.toFixed(2)}</span>
                            </div>
                        )}

                        {produit.listing_type === 'auction_with_bin' && (
                            <div className="price-line">
                                <span className="price-label">Buy It Now:</span>
                                <span className="price-value">
                                    {buyItNow ? `$${buyItNow.toFixed(2)}` : 'N/A'}
                                </span>
                            </div>
                        )}

                        {produit.listing_type === 'fixed_price' && (
                            <div className="price-line">
                                <span className="price-label">Price:</span>
                                <span className="price-value">${price.toFixed(2)}</span>
                            </div>
                        )}
                    </div>


                    <p style={{ fontSize: '0.7rem', color: '#777', marginTop: '0.5rem' }}>
                        Updated: {produit.last_scraped_date || 'N/A'}
                    </p>
                </div>
            </div>
        </Link>
    );
}

export default ProduitCard;
