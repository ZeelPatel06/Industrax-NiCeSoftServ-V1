import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorMessage = ({ message, onClose }) => {
    if (!message) return null;

    // Split messages if they are comma-separated (from Zod)
    const messages = typeof message === 'string' ? message.split(', ') : [message];

    return (
        <div className="glass-card pulse-danger animate-fade-in" style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            position: 'relative',
            borderRadius: '12px'
        }}>
            <AlertCircle className="text-danger" size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
            
            <div style={{ flex: 1 }}>
                <h4 style={{ color: 'var(--danger-color)', fontSize: '0.95rem', margin: 0, fontWeight: 600 }}>
                    Action Required
                </h4>
                <div style={{ marginTop: '0.25rem' }}>
                    {messages.length > 1 ? (
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {messages.map((msg, index) => (
                                <li key={index} style={{ marginBottom: '0.25rem' }}>{msg}</li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {messages[0]}
                        </p>
                    )}
                </div>
            </div>

            {onClose && (
                <button 
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

export default ErrorMessage;
