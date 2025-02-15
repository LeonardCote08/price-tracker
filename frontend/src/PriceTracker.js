import React from 'react';
import './PriceTracker.css';

const PriceTracker = ({ children }) => {
    return (
        <div className="price-tracker-app cyberpunk-theme">
            <header className="app-header">
                PriceTracker
            </header>
            <main className="content">
                {children}
            </main>
        </div>
    );
};

export default PriceTracker;
