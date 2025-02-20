// frontend/src/components/ProduitCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ProduitCard.css';

function ProduitCard({ produit }) {
    const price = typeof produit.price === 'number' ? produit.price : 0;
    const buyItNow = typeof produit.buy_it_now_price === 'number'
        ? produit.buy_it_now_price
        : null;

    // Récupération d'un texte plus court pour la condition
    const conditionText = produit.normalized_condition?.trim() || 'Not specified';

    // Détermine le label de type d’annonce
    let listingLabel = '';
    if (produit.listing_type === 'fixed_price') {
        listingLabel = 'Fixed Price';
    } else if (produit.listing_type === 'auction') {
        listingLabel = 'Auction';
    } else if (produit.listing_type === 'auction_with_bin') {
        listingLabel = 'Auction + BIN';
    }

    // Vérifie si on doit afficher la section Bids + Time
    const isAuction = (produit.listing_type === 'auction' || produit.listing_type === 'auction_with_bin');

    return (
        <Link
            to={`/produits/${produit.product_id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className="produit-card">

                {/* Image principale */}
                <img
                    className="product-image"
                    src={produit.image_url}
                    alt={produit.title || 'No title'}
                />

                <div className="product-info">
                    {/* Titre + badge Signed */}
                    <h3 className="product-title">
                        {produit.title || 'Untitled product'}
                        {produit.signed && (
                            <span
                                style={{
                                    marginLeft: '0.5rem',
                                    backgroundColor: '#E74C3C', // Rouge pour le badge
                                    color: '#fff',
                                    padding: '0.2rem 0.4rem',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem'
                                }}
                            >
                                Signed
                            </span>
                        )}
                    </h3>

                    {/* Condition + type de listing sur une seule ligne */}
                    <p style={{ color: '#bbb', margin: '0.3rem 0' }}>
                        {conditionText} &nbsp;|&nbsp; {listingLabel}
                    </p>

                    {/* Bids + Time Left (si c’est un auction) sur une seule ligne */}
                    {isAuction && (
                        <p style={{ color: '#bbb', margin: '0.3rem 0' }}>
                            Bids: {produit.bids_count ?? 0} &nbsp;|&nbsp;
                            Time left: {produit.time_remaining || 'N/A'}
                        </p>
                    )}

                    {/* Bloc des prix */}
                    <div className="price-section" style={{ marginTop: '0.5rem' }}>
                        {/* Auction / Auction+BIN => Current Bid */}
                        {isAuction && (
                            <div className="price-line">
                                <span className="price-label">Current Bid:</span>
                                <span className="price-value">${price.toFixed(2)}</span>
                            </div>
                        )}

                        {/* Auction+BIN => Buy It Now */}
                        {produit.listing_type === 'auction_with_bin' && (
                            <div className="price-line">
                                <span className="price-label">Buy It Now:</span>
                                <span className="price-value">
                                    {buyItNow ? `$${buyItNow.toFixed(2)}` : 'N/A'}
                                </span>
                            </div>
                        )}

                        {/* Fixed Price => Price */}
                        {produit.listing_type === 'fixed_price' && (
                            <div className="price-line">
                                <span className="price-label">Price:</span>
                                <span className="price-value">${price.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    {/* Date (petit, en bas) */}
                    <p style={{ fontSize: '0.7rem', color: '#777', marginTop: '0.5rem' }}>
                        Updated: {produit.last_scraped_date || 'N/A'}
                    </p>
                </div>
            </div>
        </Link>
    );
}

export default ProduitCard;
