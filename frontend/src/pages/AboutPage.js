// frontend/src/pages/AboutPage.js
import React from 'react';
import './AboutPage.css';

function AboutPage() {
    return (
        <div className="about-container">
            <h1 className="about-title">About PriceTracker</h1>

            <div className="about-card">
                <h2>What is PriceTracker?</h2>
                <p>
                    PriceTracker is a web application that tracks prices of collectible items on eBay.
                    The app allows you to monitor price trends, compare listings, and make informed purchasing decisions.
                </p>

                <h2>Features</h2>
                <ul className="features-list">
                    <li>
                        <span className="feature-icon">📈</span>
                        <span className="feature-text">Real-time price tracking of collectibles</span>
                    </li>
                    <li>
                        <span className="feature-icon">🔍</span>
                        <span className="feature-text">Detailed historical price charts</span>
                    </li>
                    <li>
                        <span className="feature-icon">🏷️</span>
                        <span className="feature-text">Compare prices across different sellers</span>
                    </li>
                    <li>
                        <span className="feature-icon">📱</span>
                        <span className="feature-text">Mobile-friendly responsive design</span>
                    </li>
                </ul>

                <h2>How It Works</h2>
                <p>
                    PriceTracker uses advanced web scraping technology to gather data from eBay listings.
                    Our automated system collects price information daily, analyzes trends, and presents
                    the data in an easy-to-understand format.
                </p>

                <h2>Coming Soon</h2>
                <p>
                    We're continuously improving PriceTracker! Soon we'll be adding:
                </p>
                <ul>
                    <li>Price alerts via email</li>
                    <li>More collectible categories</li>
                    <li>Price prediction using AI</li>
                    <li>Social sharing features</li>
                </ul>
            </div>

            <div className="about-footer">
                <p>© 2025 PriceTracker - All Rights Reserved</p>
            </div>
        </div>
    );
}

export default AboutPage;