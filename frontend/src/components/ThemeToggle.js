// src/components/ThemeToggle.js
import React, { useState, useEffect } from 'react';

const ThemeToggle = () => {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('theme-dark');
        } else {
            document.body.classList.remove('theme-dark');
        }
    }, [darkMode]);

    return (
        <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? 'Mode Clair' : 'Mode Sombre'}
        </button>
    );
};

export default ThemeToggle;
