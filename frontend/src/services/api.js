// frontend/src/services/api.js

export const fetchProduits = async () => {
    // Appel simple: on ne passe plus de paramètre ?status=...
    const response = await fetch(`/api/produits`);
    if (!response.ok) throw new Error('Erreur lors du chargement des produits');
    return response.json();
};

export const fetchProduit = async (id) => {
    const response = await fetch(`/api/produits/${id}`);
    if (!response.ok) throw new Error('Erreur lors du chargement du produit');
    return response.json();
};

export const fetchHistoriquePrix = async (id) => {
    const response = await fetch(`/api/produits/${id}/historique-prix`);
    if (!response.ok) throw new Error('Erreur lors du chargement de l\'historique');
    return response.json();
};
