// src/components/ProduitCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ProduitCard.css';

function ProduitCard({ produit }) {
    const price = typeof produit.price === 'number' ? produit.price : 0;
    const shippingCost = typeof produit.shipping_cost === 'number' ? produit.shipping_cost : 0;
    const totalPrice = price + shippingCost;

    return (
        <Link to={`/produits/${produit.product_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="produit-card">
                <img src={produit.image_url} alt={produit.title || 'No title'} />
                <h3>{produit.title || 'Untitled product'}</h3>
                <p className="product-price">
                    {totalPrice.toFixed(2)} $
                    {shippingCost > 0 && (
                        <span className="price-info">
                            {` (Item: ${price.toFixed(2)} $ + Shipping: ${shippingCost.toFixed(2)} $)`}
                        </span>
                    )}
                </p>
            </div>
        </Link>
    );
}

export default ProduitCard;
