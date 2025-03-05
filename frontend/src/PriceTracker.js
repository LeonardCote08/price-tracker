// frontend/src/PriceTracker.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faTags,
    faInfoCircle,
    faBars,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import './PriceTracker.css';

const PriceTracker = ({ children }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    // Détermine si le lien est actif
    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className="price-tracker-app">
            <header className="app-header">
                <div className="header-container">
                    {/* Logo et titre */}
                    <div className="header-logo">
                        <Link to="/" onClick={closeMobileMenu}>
                            <FontAwesomeIcon icon={faChartLine} className="logo-icon" />
                            <span className="logo-text">PriceTracker</span>
                        </Link>
                    </div>

                    {/* Bouton menu mobile */}
                    <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                        <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />
                    </div>

                    {/* Navigation */}
                    <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                        <ul>
                            <li>
                                <Link
                                    to="/"
                                    className={isActive('/') ? 'active' : ''}
                                    onClick={closeMobileMenu}
                                >
                                    <FontAwesomeIcon icon={faTags} className="nav-icon" />
                                    <span>Products</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/about"
                                    className={isActive('/about') ? 'active' : ''}
                                    onClick={closeMobileMenu}
                                >
                                    <FontAwesomeIcon icon={faInfoCircle} className="nav-icon" />
                                    <span>About</span>
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>
            <main className="content">
                {children}
            </main>
        </div>
    );
};

export default PriceTracker;