// frontend/src/pages/ListeProduitsPage.js
import React, { useEffect, useState } from 'react';
import { fetchProduits } from '../services/api';
import ProduitCard from '../components/ProduitCard';
import './ListeProduitsPage.css';
import useScrollRestoration from '../hooks/useScrollRestoration';

function ListeProduitsPage() {
    useScrollRestoration();
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    useEffect(() => {
        if (!loading) {
            // Vérifions la hauteur de la page et de la fenêtre
            console.log("[ListeProduitsPage] document.body.scrollHeight =", document.body.scrollHeight);
            console.log("[ListeProduitsPage] window.innerHeight =", window.innerHeight);

            const savedPosition = sessionStorage.getItem('scroll-/');
            console.log("[ListeProduitsPage] Position de scroll enregistrée =", savedPosition);
            if (savedPosition !== null) {
                const position = parseInt(savedPosition, 10);
                console.log("[ListeProduitsPage] Restauration du scroll à =", position);
                window.scrollTo(0, position);
            } else {
                console.log("[ListeProduitsPage] Aucune position enregistrée => scroll à 0");
                window.scrollTo(0, 0);
            }
        }
    }, [loading]);

    // Pour voir ce qui se passe au démontage
    useEffect(() => {
        return () => {
            console.log("[ListeProduitsPage] Sauvegarde de la position de scroll =", window.pageYOffset);
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
