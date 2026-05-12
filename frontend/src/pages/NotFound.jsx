import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="center-container">
      <div className="glass-card animate-fade-in" style={{ textAlign: 'center', maxWidth: '450px', padding: '3rem' }}>
        <div style={{ fontSize: '6rem', fontWeight: '800', marginBottom: '1rem' }} className="gradient-text">
          404
        </div>
        <h2 style={{ marginBottom: '1rem' }}>Page Not Found</h2>
        <p style={{ marginBottom: '2rem' }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/')}
          style={{ width: '100%' }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;
