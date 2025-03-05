// src/hooks/useScrollRestoration.js

import { useEffect } from 'react';

const useScrollRestoration = (key) => {
    useEffect(() => {
        // Construct a consistent storage key
        const storageKey = `scrollPosition_${key}`;

        // Restore position on mount
        const savedPosition = sessionStorage.getItem(storageKey);
        if (savedPosition) {
            // Small delay to ensure content is rendered before scrolling
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedPosition, 10));
            }, 100);
        }

        // Save position on scroll with throttling to improve performance
        let timeoutId = null;
        const handleScroll = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                sessionStorage.setItem(storageKey, window.scrollY.toString());
            }, 100);
        };

        window.addEventListener('scroll', handleScroll);

        // Clean up on unmount
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (timeoutId) clearTimeout(timeoutId);
            // Save final position before unmounting
            sessionStorage.setItem(storageKey, window.scrollY.toString());
        };
    }, [key]); // Re-run effect if key changes
};

export default useScrollRestoration;