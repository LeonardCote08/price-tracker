// frontend/src/components/ProduitCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ProduitCard.css';

function ProduitCard({ produit }) {
    const price = typeof produit.price === 'number' ? produit.price : 0;
    const shippingCost = typeof produit.shipping_cost === 'number' ? produit.shipping_cost : 0;
    const totalPrice = price + shippingCost;

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
                        <span className="price-total">
                            ${totalPrice.toFixed(2)}
                        </span>

                        {shippingCost > 0 && (
                            <small className="price-breakdown">
                                (Item: <span className="price-base">
                                    ${price.toFixed(2)}
                                </span>{' '}
                                + <span className="price-shipping">
                                    ${shippingCost.toFixed(2)}
                                </span>)
                            </small>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default ProduitCard;
