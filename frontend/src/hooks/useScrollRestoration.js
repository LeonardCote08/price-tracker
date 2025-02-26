import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const useScrollRestoration = (key) => {
    const location = useLocation();

    // Restaurer la position après le chargement de la page
    useEffect(() => {
        const savedPosition = sessionStorage.getItem(`scrollPosition_${key}`);
        if (savedPosition) {
            // Laisser un petit délai pour être sûr que le DOM est chargé
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedPosition, 10));
            }, 100);
        } else {
            window.scrollTo(0, 0);
        }
    }, [key, location.pathname]);

    // Enregistrer la position pendant le scroll
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem(`scrollPosition_${key}`, window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [key]);
};

export default useScrollRestoration;
