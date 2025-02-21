// frontend/src/pages/ListeProduitsPage.js
import React, { useEffect, useState } from 'react';
import { fetchProduits } from '../services/api';
import ProduitCard from '../components/ProduitCard';
import './ListeProduitsPage.css';

function ListeProduitsPage() {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch des produits ---
    useEffect(() => {
        console.log("[ListeProduitsPage] Début du fetch des produits");
        fetchProduits()
            .then(data => {
                console.log("[ListeProduitsPage] Produits chargés :", data);
                setProduits(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("[ListeProduitsPage] Erreur lors du fetch :", err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    // --- Restauration du scroll après chargement ---
    useEffect(() => {
        if (!loading) {
            const savedPosition = sessionStorage.getItem('scroll-/');
            console.log("[ListeProduitsPage] Position de scroll enregistrée :", savedPosition);
            if (savedPosition !== null) {
                const position = parseInt(savedPosition, 10);
                console.log("[ListeProduitsPage] Restauration du scroll à :", position);
                window.scrollTo(0, position);
            } else {
                console.log("[ListeProduitsPage] Aucune position enregistrée, scroll à 0");
                window.scrollTo(0, 0);
            }
        }
    }, [loading]);

    // --- Sauvegarde du scroll lors du démontage ---
    useEffect(() => {
        return () => {
            console.log("[ListeProduitsPage] Sauvegarde de la position de scroll :", window.pageYOffset);
            sessionStorage.setItem('scroll-/', window.pageYOffset.toString());
        };
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div>
            <div className="subheader">
                Currently tracking Funko Pop Doctor Doom #561 on eBay. More items to come soon!
            </div>
            <div className="produits-grid">
                {produits.map((p) => (
                    <ProduitCard key={p.product_id} produit={p} />
                ))}
            </div>
        </div>
    );
}

export default ListeProduitsPage;
