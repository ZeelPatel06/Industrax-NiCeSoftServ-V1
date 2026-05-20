import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const AVAILABLE_MODULES = [
    { id: 'products', name: 'Products', description: 'Manage your product catalog' },
    { id: 'parts', name: 'Parts', description: 'Manage sub-assembly parts' },
    { id: 'materials', name: 'Materials', description: 'Track raw materials and requirements' },
    { id: 'bom', name: 'BOM', description: 'Bill of Materials for products' },
    { id: 'inventory', name: 'Inventory', description: 'Track stock ins and outs' },
    { id: 'orders', name: 'Orders', description: 'Manage customer orders' },
    { id: 'jobWork', name: 'Job Work', description: 'Manage custom job work orders and catalog' },
    { id: 'production', name: 'Production Tracking', description: 'Monitor production jobs and status' },
    { id: 'employees', name: 'Employees', description: 'Manage your workforce' },
    { id: 'attendance', name: 'Attendance', description: 'Track employee attendance' },
    { id: 'invoices', name: 'Invoicing / Billing', description: 'Generate and manage invoices' },
    { id: 'machines', name: 'Machines', description: 'Manage and track factory equipment' },
];

const ModulesSettings = () => {
    const [selected, setSelected] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('modules'); // 'modules' or 'profile'
    
    // Profile State
    const [profile, setProfile] = useState({
        companyName: '',
        companyAddress: '',
        gstNumber: '',
        currency: 'INR'
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    // Fetch Modules & Profile
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [modRes, profRes] = await Promise.all([
                    apiClient.get('/modules').catch(() => ({ data: { selectedModules: [] } })),
                    apiClient.get('/profile').catch(() => ({ data: { companyProfile: {} } }))
                ]);
                setSelected(modRes.data.selectedModules || []);
                setProfile({
                    companyName: profRes.data.companyProfile?.companyName || '',
                    companyAddress: profRes.data.companyProfile?.companyAddress || '',
                    gstNumber: profRes.data.companyProfile?.gstNumber || '',
                    currency: profRes.data.companyProfile?.currency || 'INR'
                });
            } catch (err) {
                setError('Failed to fetch settings data');
            } finally {
                setIsLoading(false);
            }
        };

        if (userInfo.role === 'Owner') {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, [userInfo.role]);

    if (userInfo.role !== 'Owner') {
        return <div className="page-container"><h2>Unauthorized Access</h2><p>Only the owner can manage modules.</p></div>;
    }

    const toggleModule = async (id) => {
        setError(null);
        setSuccessMsg('');
        
        const isCurrentlyEnabled = selected.includes(id);
        const newSelection = isCurrentlyEnabled 
            ? selected.filter(m => m !== id)
            : [...selected, id];

        if (newSelection.length === 0) {
            setError('At least one module must remain enabled.');
            return;
        }

        setIsSaving(true);
        try {
            const { data } = await apiClient.put('/modules', { selectedModules: newSelection });
            setSelected(data.selectedModules);
            setSuccessMsg('Settings updated successfully');
            
            const updatedUserInfo = { ...userInfo, selectedModules: data.selectedModules };
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        } catch (err) {
            setError(err.response?.data?.message || 'Cannot disable module. Please check dependencies.');
        } finally {
            setIsSaving(false);
        }
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg('');
        setIsSavingProfile(true);
        try {
            await apiClient.put('/profile', profile);
            setSuccessMsg('Company profile updated successfully');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    if (isLoading) return <div className="page-container">Loading settings...</div>;

    return (
        <div className="form-page-layout">
            <div className="glass-card" style={{ maxWidth: '900px' }}>
                <h1 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Workspace Settings</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Manage your company profile and organization features.</p>

            <div className="tabs-container" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                <button 
                    className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('profile'); setError(null); setSuccessMsg(''); }}
                    style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', color: activeTab === 'profile' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'profile' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600 }}
                >
                    Company Profile
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('modules'); setError(null); setSuccessMsg(''); }}
                    style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', color: activeTab === 'modules' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'modules' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600 }}
                >
                    Feature Modules
                </button>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem', color: '#ff4d4f', background: 'rgba(255, 77, 79, 0.1)', padding: '1rem', borderRadius: '8px' }}>{error}</div>}
            {successMsg && <div className="alert alert-success" style={{ marginBottom: '1rem', color: '#52c41a', background: 'rgba(82, 196, 26, 0.1)', padding: '1rem', borderRadius: '8px' }}>{successMsg}</div>}

            {activeTab === 'profile' && (
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <form onSubmit={saveProfile}>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Company Name</label>
                            <input 
                                type="text"
                                className="form-control"
                                value={profile.companyName}
                                onChange={(e) => setProfile({...profile, companyName: e.target.value})}
                                placeholder="Enter company name"
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Company Address</label>
                            <textarea 
                                className="form-control"
                                rows={3}
                                value={profile.companyAddress}
                                onChange={(e) => setProfile({...profile, companyAddress: e.target.value})}
                                placeholder="Full address"
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                        <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>GST Number (Optional)</label>
                                <input 
                                    type="text"
                                    className="form-control"
                                    value={profile.gstNumber}
                                    onChange={(e) => setProfile({...profile, gstNumber: e.target.value})}
                                    placeholder="Enter GSTIN"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Default Currency</label>
                                <select 
                                    className="form-control"
                                    value={profile.currency}
                                    onChange={(e) => setProfile({...profile, currency: e.target.value})}
                                >
                                    <option value="INR">INR (₹)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
                                {isSavingProfile ? 'Saving...' : 'Save Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'modules' && (
                <>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Enable or disable features for your organization. Please note, you cannot disable a module if it has existing data.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {AVAILABLE_MODULES.map(mod => {
                    const isSelected = selected.includes(mod.id);
                    return (
                        <div key={mod.id} style={{ 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                            padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px',
                            border: '1px solid var(--border-color)' 
                        }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {mod.name}
                                    {isSelected ? 
                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(82, 196, 26, 0.2)', color: '#52c41a', borderRadius: '12px' }}>Enabled</span> : 
                                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'rgba(255, 77, 79, 0.2)', color: '#ff4d4f', borderRadius: '12px' }}>Disabled</span>
                                    }
                                </h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{mod.description}</p>
                            </div>
                            <button 
                                onClick={() => toggleModule(mod.id)}
                                disabled={isSaving}
                                className={`btn ${isSelected ? 'btn-outline' : 'btn-primary'}`}
                                style={{
                                    border: isSelected ? '1px solid #ff4d4f' : 'none',
                                    color: isSelected ? '#ff4d4f' : 'white',
                                    padding: '0.5rem 1.5rem',
                                }}
                            >
                                {isSelected ? 'Disable' : 'Enable'}
                            </button>
                        </div>
                    );
                })}
                    </div>
                </>
            )}
            </div>
        </div>
    );
};

export default ModulesSettings;
