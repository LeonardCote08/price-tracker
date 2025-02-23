// frontend/src/PriceTracker.js
import React from 'react';
import { Link } from 'react-router-dom';
import './PriceTracker.css';

const PriceTracker = ({ children }) => {
    return (
        <div className="price-tracker-app">
            <header className="app-header">
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    PriceTracker
                </Link>
            </header>
            <main className="content">
                {children}
            </main>
        </div>
    );
};

export default PriceTracker;