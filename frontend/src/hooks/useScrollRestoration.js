// src/hooks/useScrollRestoration.js
import { useLayoutEffect, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function useScrollRestoration(shouldRestore = true) {
    const location = useLocation();
    const key = location.pathname; // clé basée sur le chemin

    useLayoutEffect(() => {
        console.log(`[useScrollRestoration] Mount for key: ${key}, shouldRestore: ${shouldRestore}`);
        if (shouldRestore) {
            const savedPosition = sessionStorage.getItem(`scroll-${key}`);
            console.log(`[useScrollRestoration] Retrieved saved position for ${key}: ${savedPosition}`);
            if (savedPosition !== null) {
                const pos = parseInt(savedPosition, 10);
                window.scrollTo(0, pos);
                console.log(`[useScrollRestoration] Scrolled to position ${pos}`);
            } else {
                window.scrollTo(0, 0);
                console.log(`[useScrollRestoration] No saved position for ${key}, scrolling to top`);
            }
        }
    }, [key, shouldRestore]);

    useEffect(() => {
        return () => {
            // Pour la page de liste (key === "/"), on ne sauvegarde pas ici car on le fait manuellement dans le Link
            if (key !== '/') {
                const currentPos = window.pageYOffset;
                sessionStorage.setItem(`scroll-${key}`, currentPos.toString());
                console.log(`[useScrollRestoration] Cleanup for key: ${key}. Saving position: ${currentPos}`);
            } else {
                console.log(`[useScrollRestoration] Cleanup for key: ${key} skipped manual saving.`);
            }
        };
    }, [key]);

    return null;
}