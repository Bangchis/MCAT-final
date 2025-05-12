import React, { useState, useEffect } from 'react';
import './StartPage.css';

export function StartPage({ onStart }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isButtonHovered, setIsButtonHovered] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <div className={`start-page ${isLoaded ? 'loaded' : ''}`}>
            <div className="hero-section">
                <div className="hero-content">
                    <div className="hero-icon">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L13.09 8.26L19 7L14.74 11.74L16 12L11.74 14.74L12 16L8.26 13.09L7 19L11.74 12.26L10 12L14.26 9.74L12 8L16.74 10.91L19 7L12.26 10.91L12 2Z" fill="currentColor" />
                        </svg>
                    </div>
                    <h1 className="hero-title">
                        Welcome to <span className="gradient-text">MCAT Demo</span>
                    </h1>
                    <p className="hero-subtitle">
                        Multidimensional Hybrid Computerized Adaptive Testing
                    </p>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🧮</div>
                            <h3>Adaptive Testing</h3>
                            <p>Questions adapt to your ability level in real-time</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📊</div>
                            <h3>Multi-dimensional</h3>
                            <p>Evaluates multiple subject areas simultaneously</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">⚡</div>
                            <h3>Intelligent Selection</h3>
                            <p>Optimized item selection for maximum information</p>
                        </div>
                    </div>

                    <div className="test-info">
                        <div className="info-item">
                            <span className="info-label">Total Questions:</span>
                            <span className="info-value">30</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Subjects:</span>
                            <span className="info-value">Math, Physics, Chemistry, Biology</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Duration:</span>
                            <span className="info-value">~15-20 minutes</span>
                        </div>
                    </div>

                    <button
                        className={`start-button ${isButtonHovered ? 'hovered' : ''}`}
                        onClick={onStart}
                        onMouseEnter={() => setIsButtonHovered(true)}
                        onMouseLeave={() => setIsButtonHovered(false)}
                    >
                        <span className="button-text">Start Your Test</span>
                        <span className="button-icon">→</span>
                    </button>
                </div>
            </div>

            <div className="background-elements">
                <div className="floating-element element-1"></div>
                <div className="floating-element element-2"></div>
                <div className="floating-element element-3"></div>
            </div>
        </div>
    );
}