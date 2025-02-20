// frontend/src/components/ProduitCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ProduitCard.css';

function ProduitCard({ produit }) {
    const price = typeof produit.price === 'number' ? produit.price : 0;

    return (
        <Link to={`/produits/${produit.product_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="produit-card">
                <img
                    className="product-image"
                    src={produit.image_url}
                    alt={produit.title || 'No title'}
                />

                <div className="product-info">
                    <h3 className="product-title">
                        {produit.title || 'Untitled product'}
                    </h3>

                    {/* Affichage des infos supplémentaires */}
                    <p>Condition: {produit.normalized_condition || 'N/A'}</p>

                    {produit.listing_type === 'fixed_price' && (
                        <p>Listing: Fixed Price</p>
                    )}

                    {produit.listing_type === 'auction' && (
                        <>
                            <p>Listing: Auction</p>
                            <p>Bids: {produit.bids_count || 'N/A'}</p>
                            <p>Time remaining: {produit.time_remaining || 'N/A'}</p>
                        </>
                    )}

                    {produit.listing_type === 'auction_with_bin' && (
                        <>
                            <p>Listing: Auction with BIN</p>
                            <p>Bids: {produit.bids_count || 'N/A'}</p>
                            <p>Time remaining: {produit.time_remaining || 'N/A'}</p>

                            {/* Affiche le prix actuel d’enchère */}
                            <p>Current Bid: ${produit.price?.toFixed(2)}</p>

                            {/* Affiche le prix Buy It Now */}
                            <p>Buy It Now: {produit.buy_it_now_price
                                ? `$${produit.buy_it_now_price.toFixed(2)}`
                                : 'N/A'
                            }</p>
                        </>
                    )}


                    <p>Last scraped: {produit.last_scraped_date || 'N/A'}</p>

                    <div className="price-block">
                        {produit.listing_type === 'fixed_price' && (
                            <span className="price-total">
                                ${price.toFixed(2)}
                            </span>
                        )}

                        {produit.listing_type === 'auction' && (
                            <span className="price-total">
                                ${price.toFixed(2)} {/* prix d’enchère */}
                            </span>
                        )}

                        {produit.listing_type === 'auction_with_bin' && (
                            // Soit tu le supprimes, soit tu affiches un "prix principal" si tu veux
                            <span className="price-total">
                                ${price.toFixed(2)} {/* par ex. "enchère actuelle" */}
                            </span>
                        )}
                    </div>

                </div>
            </div>
        </Link>
    );
}

export default ProduitCard;
