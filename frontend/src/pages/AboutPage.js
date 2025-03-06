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
            <div className="developer-card">
                <h2>About the Developer</h2>
                <p>
                    PriceTracker was developed by [Your Name], a full-stack developer specializing in
                    data-driven applications and web scraping solutions. With expertise in both
                    backend data processing and frontend visualization, I create tools that transform
                    raw data into actionable insights.
                </p>

                <div className="skills-container">
                    <span className="skills-tag">Python</span>
                    <span className="skills-tag">Scrapy</span>
                    <span className="skills-tag">Flask</span>
                    <span className="skills-tag">React</span>
                    <span className="skills-tag">MySQL</span>
                    <span className="skills-tag">Data Visualization</span>
                    <span className="skills-tag">Web Scraping</span>
                </div>

                <h3>Looking for similar solutions?</h3>
                <p>
                    I can help you build custom price tracking, data scraping, or market intelligence
                    tools tailored to your business needs. Whether you need to monitor competitors'
                    pricing, track market trends, or gather data at scale, I can deliver a complete
                    solution from data acquisition to beautiful visualization.
                </p>

                <div className="contact-buttons">
                    <a href="mailto:your.email@example.com" className="contact-button">
                        <span className="contact-button-icon">✉️</span> Contact Me
                    </a>
                    <a href="https://yourportfolio.com" target="_blank" rel="noopener noreferrer" className="contact-button">
                        <span className="contact-button-icon">🔗</span> Portfolio
                    </a>
                    <a href="https://linkedin.com/in/yourprofile" target="_blank" rel="noopener noreferrer" className="contact-button">
                        <span className="contact-button-icon">👔</span> LinkedIn
                    </a>
                </div>
            </div>

            <div className="about-footer">
                <p>© 2025 PriceTracker - All Rights Reserved</p>
            </div>

        </div>
    );
}

export default AboutPage;