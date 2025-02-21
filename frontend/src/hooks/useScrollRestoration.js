// src/hooks/useScrollRestoration.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function useScrollRestoration() {
    const location = useLocation();

    useEffect(() => {
        // Lorsqu'on arrive sur la page, récupère la position stockée (si elle existe)
        const savedPosition = sessionStorage.getItem(location.key);
        if (savedPosition) {
            window.scrollTo(0, parseInt(savedPosition, 10));
        } else {
            window.scrollTo(0, 0);
        }

        // Lorsque la page se quitte, enregistre la position
        return () => {
            sessionStorage.setItem(location.key, window.pageYOffset);
        };
    }, [location]);
}
