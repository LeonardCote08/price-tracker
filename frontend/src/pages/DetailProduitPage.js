// src/pages/DetailProduitPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProduit, fetchHistoriquePrix } from '../services/api';
// 1) Import du composant Chart
import HistoriquePrixChart from '../components/HistoriquePrixChart';

const DetailProduitPage = () => {
    const { id } = useParams();
    const [produit, setProduit] = useState(null);
    const [historique, setHistorique] = useState({ dates: [], prices: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        Promise.all([
            fetchProduit(id),
            fetchHistoriquePrix(id),
        ])
            .then(([prodData, histData]) => {
                setProduit(prodData);
                setHistorique(histData);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <p>Chargement...</p>;
    if (error) return <p>Erreur : {error}</p>;
    if (!produit) return <p>Produit introuvable</p>;

    return (
        <div>
            <h2>{produit.title}</h2>
            <img src={produit.image_url} alt={produit.title} style={{ maxWidth: '300px' }} />

            {/* 2) Affiche le composant Chart avec les données historique */}
            <HistoriquePrixChart
                dates={historique.dates}
                prices={historique.prices}
            />
        </div>
    );
};

export default DetailProduitPage;
