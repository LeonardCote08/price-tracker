// src/hooks/useScrollRestoration.js

import { useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';

const useScrollRestoration = (shouldRestore = true, extraKey = '') => {
    const location = useLocation();
    const pathKey = location.pathname + (extraKey ? `-${extraKey}` : '');
    const restoredRef = useRef(false);

    // Restaurer la position de défilement
    useEffect(() => {
        if (!shouldRestore || restoredRef.current) return;

        // Fonction pour restaurer la position de défilement
        const restoreScrollPosition = () => {
            const savedPosition = sessionStorage.getItem(`scrollPosition_${pathKey}`);
            if (savedPosition) {
                window.scrollTo(0, parseInt(savedPosition, 10));
                restoredRef.current = true;
            }
        };

        // Ajouter un délai pour s'assurer que la page est complètement rendue
        const timeoutId = setTimeout(restoreScrollPosition, 150);

        return () => clearTimeout(timeoutId);
    }, [pathKey, shouldRestore]);

    // Enregistrer la position de défilement lors du scroll
    useEffect(() => {
        if (!shouldRestore) return;

        const handleScroll = () => {
            sessionStorage.setItem(`scrollPosition_${pathKey}`, window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);

        // Aussi enregistrer la position au moment du démontage du composant
        return () => {
            handleScroll(); // Capture la dernière position
            window.removeEventListener('scroll', handleScroll);
        };
    }, [pathKey, shouldRestore]);
};

export default useScrollRestoration;