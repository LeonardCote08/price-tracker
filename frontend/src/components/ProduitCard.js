// src/components/ProduitCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ProduitCard.css';

const ProduitCard = ({ produit }) => {
    // Assure-toi que produit.price et produit.shipping_cost soient des nombres
    const price = typeof produit.price === 'number' ? produit.price : 0;
    const shippingCost = typeof produit.shipping_cost === 'number' ? produit.shipping_cost : 0;
    const prixTotal = price + shippingCost;

    return (
        <Link
            to={`/produits/${produit.product_id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div className="produit-card">
                <img src={produit.image_url} alt={produit.title || 'Produit sans titre'} />
                <h3>{produit.title || 'Titre non défini'}</h3>
                <p className="product-price">
                    {prixTotal.toFixed(2)} €
                    {shippingCost > 0 && (
                        <span className="price-info">
                            {` (Prix: ${price.toFixed(2)} € + Livraison: ${shippingCost.toFixed(2)} €)`}
                        </span>
                    )}
                </p>
            </div>
        </Link>
    );
};

export default ProduitCard;
