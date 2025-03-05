// src/hooks/useScrollRestoration.js

import { useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

const useScrollRestoration = (shouldRestore = true, extraKey = '') => {
    const location = useLocation();
    const pathKey = location.pathname + (extraKey ? `-${extraKey}` : '');
    const restoredRef = useRef(false);
    const [attemptCount, setAttemptCount] = useState(0);
    const maxAttempts = 5; // Essayer plusieurs fois si nécessaire

    // Effet pour réinitialiser le status de restauration quand le chemin change
    useEffect(() => {
        restoredRef.current = false;
        setAttemptCount(0);
    }, [location.pathname]);

    // Restaurer la position de défilement
    useEffect(() => {
        if (!shouldRestore || restoredRef.current || attemptCount >= maxAttempts) return;

        // Fonction pour restaurer la position de défilement
        const restoreScrollPosition = () => {
            try {
                const savedPosition = sessionStorage.getItem(`scrollPosition_${pathKey}`);

                if (savedPosition) {
                    const scrollPos = parseInt(savedPosition, 10);

                    // Vérifier que la position est valide
                    if (!isNaN(scrollPos) && scrollPos >= 0) {
                        window.scrollTo(0, scrollPos);
                        console.log(`[ScrollRestoration] Restored to ${scrollPos}px for ${pathKey}`);
                        restoredRef.current = true;
                        return true;
                    }
                }
            } catch (error) {
                console.error('[ScrollRestoration] Error restoring scroll position:', error);
            }
            return false;
        };

        // Si restauration réussie, ne plus essayer
        if (restoreScrollPosition()) {
            return;
        }

        // Sinon, augmenter le compteur d'essais et réessayer plus tard
        // Délai progressif (plus l'attempt est élevé, plus le délai est long)
        const delay = 200 + (attemptCount * 150); // 200ms, 350ms, 500ms, etc.
        const timeoutId = setTimeout(() => {
            setAttemptCount(prev => prev + 1);
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [pathKey, shouldRestore, attemptCount, maxAttempts]);

    // Enregistrer la position de défilement lors du scroll
    useEffect(() => {
        if (!shouldRestore) return;

        const handleScroll = () => {
            try {
                // Ne sauvegarder que si nous avons défilé significativement (>10px)
                if (window.scrollY > 10) {
                    sessionStorage.setItem(`scrollPosition_${pathKey}`, window.scrollY.toString());
                }
            } catch (error) {
                console.error('[ScrollRestoration] Error saving scroll position:', error);
            }
        };

        // Utiliser throttle pour éviter trop d'appels pendant le défilement
        let scrollTimeout;
        const throttledScroll = () => {
            if (!scrollTimeout) {
                scrollTimeout = setTimeout(() => {
                    handleScroll();
                    scrollTimeout = null;
                }, 100);
            }
        };

        window.addEventListener('scroll', throttledScroll);

        // Aussi enregistrer la position au moment du démontage du composant
        return () => {
            window.removeEventListener('scroll', throttledScroll);
            if (scrollTimeout) clearTimeout(scrollTimeout);
            handleScroll(); // Capture la dernière position
        };
    }, [pathKey, shouldRestore]);
};

export default useScrollRestoration;