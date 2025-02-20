// frontend/src/components/ProduitCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ProduitCard.css';

function ProduitCard({ produit }) {
    const price = typeof produit.price === 'number' ? produit.price : 0;
    const totalPrice = price;

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
                    <p>Condition: {produit.item_condition || 'N/A'}</p>
                    <p>Listing: {produit.listing_type || 'N/A'}</p>
                    <p>Last scraped: {produit.last_scraped_date || 'N/A'}</p>
                    {/* Tu peux aussi afficher signed, in_box, etc. */}

                    <div className="price-block">
                        <span className="price-total">
                            ${totalPrice.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}


export default ProduitCard;
