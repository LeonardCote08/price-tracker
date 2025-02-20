// frontend/src/components/ProduitCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ProduitCard.css';

function ProduitCard({ produit }) {
    // R�cup�re le prix d'ench�re actuel (ou 0 si non d�fini)
    const price = typeof produit.price === 'number' ? produit.price : 0;

    return (
        <Link to={`/produits/${produit.product_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="produit-card">

                {/* Image du produit */}
                <img
                    className="product-image"
                    src={produit.image_url}
                    alt={produit.title || 'No title'}
                />

                <div className="product-info">

                    {/* Titre du produit */}
                    <h3 className="product-title">
                        {produit.title || 'Untitled product'}
                        {/* Affiche un badge "Signed" si signed === true */}
                        {produit.signed && (
                            <span className="badge-signed" style={{ marginLeft: '0.5rem', backgroundColor: '#E74C3C', color: '#fff', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                Signed
                            </span>
                        )}
                    </h3>

                    {/* Condition (sans le pr�fixe "Condition:") */}
                    <p>
                        {produit.normalized_condition && produit.normalized_condition.trim() !== ''
                            ? produit.normalized_condition
                            : 'Not specified'
                        }
                    </p>

                    {/* Listing type */}
                    {produit.listing_type === 'fixed_price' && (
                        <p>Fixed Price</p>
                    )}

                    {produit.listing_type === 'auction' && (
                        <>
                            <p>Auction</p>
                            <p>Bids: {
                                (produit.bids_count === 0)
                                    ? 0
                                    : (produit.bids_count ?? 'N/A')
                            }</p>
                            <p>Time left: {produit.time_remaining || 'N/A'}</p>
                        </>
                    )}

                    {produit.listing_type === 'auction_with_bin' && (
                        <>
                            <p>Auction + BIN</p>
                            <p>Bids: {produit.bids_count || 'N/A'}</p>
                            <p>Time left: {produit.time_remaining || 'N/A'}</p>
                            <p>Current Bid: ${price.toFixed(2)}</p>
                            <p>Buy It Now: {produit.buy_it_now_price
                                ? `$${produit.buy_it_now_price.toFixed(2)}`
                                : 'N/A'
                            }</p>
                        </>
                    )}

                    {/* Date de mise � jour (remplace "Last scraped") */}
                    <p>Updated: {produit.last_scraped_date || 'N/A'}</p>

                    {/* Bloc du prix principal (selon le listing_type) */}
                    <div className="price-block">
                        {produit.listing_type === 'fixed_price' && (
                            <span className="price-total">
                                ${price.toFixed(2)}
                            </span>
                        )}

                        {produit.listing_type === 'auction' && (
                            <span className="price-total">
                                ${price.toFixed(2)}
                            </span>
                        )}

                        {produit.listing_type === 'auction_with_bin' && (
                            <span className="price-total">
                                ${price.toFixed(2)}
                            </span>
                        )}
                    </div>

                </div>
            </div>
        </Link>
    );
}

export default ProduitCard;
