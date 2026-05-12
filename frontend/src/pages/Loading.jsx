import React from 'react';

const Loading = () => {
    return (
        <div className="center-container" style={{ background: 'var(--bg-gradient)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <div className="loading-spinner"></div>
                <h3 className="gradient-text" style={{ letterSpacing: '0.1em', fontWeight: '500' }}>LOADING</h3>
                
                <style>{`
                    .loading-spinner {
                        width: 60px;
                        height: 60px;
                        border: 3px solid rgba(99, 102, 241, 0.1);
                        border-radius: 50%;
                        border-top-color: var(--primary-color);
                        animation: spin 1s ease-in-out infinite;
                        box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
                    }

                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default Loading;
