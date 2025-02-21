// src/hooks/useScrollRestoration.js
import { useLayoutEffect, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function useScrollRestoration(shouldRestore = true) {
    const location = useLocation();
    const key = location.pathname; // clé basée sur le chemin

    // Restauration du scroll, exécutée avec useLayoutEffect
    useLayoutEffect(() => {
        if (shouldRestore) {
            const savedPosition = sessionStorage.getItem(`scroll-${key}`);
            if (savedPosition !== null) {
                window.scrollTo(0, parseInt(savedPosition, 10));
            } else {
                window.scrollTo(0, 0);
            }
        }
    }, [key, shouldRestore]);

    // Sauvegarde de la position lors du démontage
    useEffect(() => {
        return () => {
            sessionStorage.setItem(`scroll-${key}`, window.pageYOffset.toString());
        };
    }, [key]);

    return null;
}
