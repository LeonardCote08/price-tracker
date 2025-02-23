// src/hooks/useScrollRestoration.js

import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const useScrollRestoration = (key) => {
    useEffect(() => {
        // Restaurer la position de défilement au montage
        const savedPosition = sessionStorage.getItem(`scrollPosition_${key}`);
        if (savedPosition) {
            window.scrollTo(0, parseInt(savedPosition, 10));
        }

        // Enregistrer la position de défilement avant de quitter
        const handleScroll = () => {
            sessionStorage.setItem(`scrollPosition_${key}`, window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);

        // Nettoyer l'écouteur d'événements
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [key]); // Dépendance sur la clé pour réexécuter l'effet lors des changements de page
};

export default useScrollRestoration;