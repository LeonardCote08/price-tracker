// src/hooks/useScrollRestoration.js
import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function useScrollRestoration() {
    const location = useLocation();
    const key = location.pathname; // on utilise le chemin de la route comme clé

    useLayoutEffect(() => {
        // Lorsqu'on arrive sur la page, on lit la position sauvegardée
        const savedPosition = sessionStorage.getItem(`scroll-${key}`);
        if (savedPosition !== null) {
            window.scrollTo(0, parseInt(savedPosition, 10));
        } else {
            window.scrollTo(0, 0);
        }

        // Lorsque le composant se démonte (ou que la route change),
        // on enregistre la position de scroll actuelle
        return () => {
            sessionStorage.setItem(`scroll-${key}`, window.pageYOffset.toString());
        };
    }, [key]);

    return null;
}
