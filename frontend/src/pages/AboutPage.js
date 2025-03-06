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

            {/* New Developer Section */}
            <div className="developer-section">
                <h2>About the Developer</h2>
                <p>
                    This project was designed and developed by Léonard Côté, a full-stack developer
                    specializing in data-driven applications and web scraping solutions.
                </p>
                <p>
                    PriceTracker demonstrates my end-to-end development capabilities from
                    data acquisition to processing to visualization, as well as my attention
                    to user experience and design.
                </p>

                <div className="tech-tags">
                    <span className="tech-tag">Python</span>
                    <span className="tech-tag">Scrapy</span>
                    <span className="tech-tag">MySQL</span>
                    <span className="tech-tag">React</span>
                    <span className="tech-tag">Flask</span>
                    <span className="tech-tag">REST API</span>
                    <span className="tech-tag">Chart.js</span>
                </div>

                <p>
                    Looking for similar solutions? I can help you build custom price tracking,
                    data scraping, or market intelligence tools tailored to your business needs.
                </p>

                <div className="contact-info">
                    <p>Contact me at: leonard.cote08@gmail.com</p>
                </div>
            </div>

            <div className="about-footer">
                <p>© 2025 PriceTracker - All Rights Reserved</p>
            </div>
        </div>
    );
}

export default AboutPage;