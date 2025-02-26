// src/hooks/useScrollRestoration.js
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const useScrollRestoration = (key) => {
    const location = useLocation(); // <-- Ajout ici

    useEffect(() => {
        // Restaurer la position au montage
        const savedPosition = sessionStorage.getItem(`scrollPosition_${key}`);
        if (savedPosition) {
            // Pour laisser le temps au DOM d’être prêt, on peut mettre un petit délai :
            requestAnimationFrame(() => {
                window.scrollTo(0, parseInt(savedPosition, 10));
            });
        }

        // Écoute du scroll (pour sauvegarder la position)
        const handleScroll = () => {
            sessionStorage.setItem(`scrollPosition_${key}`, window.scrollY);
        };
        window.addEventListener('scroll', handleScroll);

        // Nettoyage
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [key, location.pathname]); // on rajoute location.pathname
};

export default useScrollRestoration;
