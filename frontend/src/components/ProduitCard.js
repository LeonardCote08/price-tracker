// frontend/src/components/ProduitCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ProduitCard.css';

function ProduitCard({ produit }) {
    // Récupère le prix du produit (si le champ est numérique, sinon 0)
    const price = typeof produit.price === 'number' ? produit.price : 0;

    // Le prix total sera uniquement le prix de base (le shipping_cost est retiré)
    const totalPrice = price;

    return (
        <Link
            to={`/produits/${produit.product_id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
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

                    <div className="price-block">
                        {/* Affiche uniquement le prix total qui correspond au prix de base */}
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
