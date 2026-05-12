import React from 'react';

const Offline = () => {
    return (
        <div className="center-container">
            <div className="glass-card animate-fade-in" style={{ textAlign: 'center', maxWidth: '450px', padding: '3rem' }}>
                <div style={{ fontSize: '6rem', marginBottom: '1rem' }} className="pulse-danger">
                    🛜
                </div>
                <h2 style={{ marginBottom: '1rem' }}>No Internet Connection</h2>
                <p style={{ marginBottom: '2rem' }}>
                    Oops! It looks like you've lost your connection. Please check your internet settings and try again.
                </p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => window.location.reload()}
                  style={{ width: '100%' }}
                >
                  Retry Connection
                </button>
            </div>
        </div>
    );
};

export default Offline;
