import React from 'react';
import { Menu, X } from 'lucide-react';

const Header = ({ onMenuClick, isSidebarOpen }) => {
    return (
        <header className="mobile-header" style={{ alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem' }}>
            <button
                onClick={onMenuClick}
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--surface-border)',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '0.4rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 style={{ color: 'white', fontSize: '1.2rem', margin: 0, letterSpacing: '1px' }}>
                Indus<span style={{ color: 'var(--primary-color)' }}>trax</span>
            </h2>
        </header>
    );
};

export default Header;
