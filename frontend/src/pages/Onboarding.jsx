import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const AVAILABLE_MODULES = [
    { id: 'products', name: 'Products', icon: '📦', description: 'Catalog of items you sell' },
    { id: 'parts', name: 'Parts', icon: '🔩', description: 'Components made in-house' },
    { id: 'materials', name: 'Raw Materials', icon: '🧱', description: 'Items you buy from suppliers' },
    { id: 'bom', name: 'Material Recipe (BOM)', icon: '📋', description: 'List of ingredients for each product' },
    { id: 'inventory', name: 'Stock Control', icon: '🏭', description: 'Track items coming in and going out' },
    { id: 'orders', name: 'Sales & Job Orders', icon: '🛒', description: 'Customer orders and custom job work' },
    { id: 'production', name: 'Production Floor', icon: '⚙️', description: 'Track work happening in the factory' },
    { id: 'employees', name: 'Staff Management', icon: '👥', description: 'Manage your workers and team' },
    { id: 'attendance', name: 'Attendance log', icon: '📅', description: 'Daily worker presence log' },
    { id: 'invoices', name: 'Billing & Invoices', icon: '🧾', description: 'Generate professional bills for clients' },
    { id: 'machines', name: 'Machine Management', icon: '🏭', description: 'Track and manage factory equipment' },
];

const Onboarding = () => {
    const [selected, setSelected] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    let userInfo = {};
    try {
        const stored = localStorage.getItem('userInfo');
        if (stored && stored !== 'undefined') userInfo = JSON.parse(stored);
    } catch (e) {
        console.error('Error parsing user info in onboarding', e);
    }

    if (!userInfo || !userInfo._id) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-gradient)',
                color: 'var(--text-primary)',
                flexDirection: 'column',
                gap: '1rem',
            }}>
                <div className="loading-spinner" style={{
                    width: '40px', height: '40px',
                    border: '3px solid rgba(99, 102, 241, 0.1)',
                    borderRadius: '50%',
                    borderTopColor: 'var(--primary-color)',
                    animation: 'spin 1s ease-in-out infinite',
                }} />
                <p>Loading your workspace...</p>
                <a href="/login" style={{ color: 'var(--primary-color)', fontSize: '0.875rem' }}>
                    Taking too long? Login again
                </a>
            </div>
        );
    }

    if (userInfo.role !== 'Owner') {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-gradient)',
            }}>
                <div className="glass-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <p>You are not authorized to set up modules. Please contact your Owner.</p>
                </div>
            </div>
        );
    }

    const toggleModule = (id) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (selected.length === 0) {
            setError('Please select at least one module to continue.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await apiClient.put('/modules', { selectedModules: selected });
            const updatedUserInfo = { ...userInfo, selectedModules: data.selectedModules };
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Error saving modules. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-gradient)',
            overflowY: 'auto',
            padding: '2rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}>
            <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                        Welcome to <span style={{ color: 'var(--primary-color)' }}>Industrax</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
                        Select the modules you want to enable for your workspace. You can change this later in Settings.
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '0.875rem 1.25rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '10px',
                        color: '#ef4444',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                    }}>
                        {error}
                    </div>
                )}

                {/* Selection Multi-Actions */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center'
                    }}>
                        <button 
                            type="button"
                            className="btn"
                            onClick={() => setSelected(AVAILABLE_MODULES.map(m => m.id))}
                            style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                padding: '0.5rem 1rem',
                                fontSize: '0.8rem',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            Select All
                        </button>
                        <button 
                            type="button"
                            className="btn"
                            onClick={() => setSelected([])}
                            style={{ 
                                background: 'transparent', 
                                padding: '0.5rem 1rem',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)'
                            }}
                        >
                            Reset
                        </button>
                    </div>
                    
                    <div style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                    }}>
                        {selected.length === 0
                            ? 'No modules selected yet — click to select'
                            : `${selected.length} feature${selected.length > 1 ? 's' : ''} ready to use`
                        }
                    </div>
                </div>

                {/* Module Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2.5rem',
                }}>
                    {AVAILABLE_MODULES.map(mod => {
                        const isSelected = selected.includes(mod.id);
                        return (
                            <div
                                key={mod.id}
                                onClick={() => toggleModule(mod.id)}
                                style={{
                                    padding: '1.25rem',
                                    border: `2px solid ${isSelected ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    background: isSelected
                                        ? 'rgba(99, 102, 241, 0.15)'
                                        : 'rgba(30, 41, 59, 0.5)',
                                    backdropFilter: 'blur(12px)',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    boxShadow: isSelected ? '0 0 0 1px var(--primary-color)' : 'none',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{mod.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {mod.name}
                                            </h3>
                                            <div style={{
                                                width: '18px', height: '18px',
                                                borderRadius: '50%',
                                                border: `2px solid ${isSelected ? 'var(--primary-color)' : 'rgba(255,255,255,0.3)'}`,
                                                background: isSelected ? 'var(--primary-color)' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0,
                                                transition: 'all 0.2s',
                                            }}>
                                                {isSelected && <span style={{ color: 'white', fontSize: '10px', lineHeight: 1 }}>✓</span>}
                                            </div>
                                        </div>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: '1.45' }}>
                                            {mod.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Action */}
                <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={isLoading || selected.length === 0}
                        style={{
                            padding: '0.875rem 3rem',
                            fontSize: '1rem',
                            opacity: selected.length === 0 ? 0.6 : 1,
                            cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isLoading ? 'Setting up your workspace...' : `Continue with ${selected.length} Module${selected.length !== 1 ? 's' : ''}`}
                    </button>
                    <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        You can add or remove modules anytime from Settings
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
