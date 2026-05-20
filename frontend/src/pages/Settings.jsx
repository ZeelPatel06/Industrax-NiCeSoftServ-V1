import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import authService from '../services/authService';
import ErrorMessage from '../components/ErrorMessage';
import { Shield, Settings as SettingsIcon, Building, Lock } from 'lucide-react';

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

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'modules', 'security'
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Profile State
    const [profile, setProfile] = useState({
        companyName: '',
        companyAddress: '',
        gstNumber: '',
        currency: 'INR'
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Modules State
    const [selectedModules, setSelectedModules] = useState([]);
    const [isSavingModules, setIsSavingModules] = useState(false);

    // Security State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [modRes, profRes] = await Promise.all([
                    apiClient.get('/modules').catch(() => ({ data: { selectedModules: [] } })),
                    apiClient.get('/profile').catch(() => ({ data: { companyProfile: {} } }))
                ]);
                setSelectedModules(modRes.data.selectedModules || []);
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

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setError(null);
        setSuccessMsg('');
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

    const toggleModule = async (id) => {
        setError(null);
        setSuccessMsg('');
        
        const isCurrentlyEnabled = selectedModules.includes(id);
        const newSelection = isCurrentlyEnabled 
            ? selectedModules.filter(m => m !== id)
            : [...selectedModules, id];

        if (newSelection.length === 0) {
            setError('At least one module must remain enabled.');
            return;
        }

        setIsSavingModules(true);
        try {
            const { data } = await apiClient.put('/modules', { selectedModules: newSelection });
            setSelectedModules(data.selectedModules);
            setSuccessMsg('Feature modules updated successfully');
            
            const updatedUserInfo = { ...userInfo, selectedModules: data.selectedModules };
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
        } catch (err) {
            setError(err.response?.data?.message || 'Cannot disable module. Please check dependencies.');
        } finally {
            setIsSavingModules(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        setIsSavingPassword(true);
        try {
            await authService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setSuccessMsg('Password updated successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setIsSavingPassword(false);
        }
    };

    if (isLoading) return <div className="page-container">Loading settings...</div>;

    if (userInfo.role !== 'Owner') {
        return (
            <div className="page-container">
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <Shield size={48} color="#ff4d4f" style={{ marginBottom: '1rem' }} />
                    <h2>Unauthorized Access</h2>
                    <p>Only the organization owner can manage workspace settings.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem' }}>
                        <SettingsIcon size={32} className="text-primary" />
                        Workspace Settings
                    </h1>
                    <p className="text-secondary">Manage your company profile, features, and security.</p>
                </div>

                <div className="tabs-container" style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <button 
                        className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => handleTabChange('profile')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0', border: 'none', background: 'none', color: activeTab === 'profile' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'profile' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600 }}
                    >
                        <Building size={18} />
                        Company Profile
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
                        onClick={() => handleTabChange('modules')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0', border: 'none', background: 'none', color: activeTab === 'modules' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'modules' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600 }}
                    >
                        <SettingsIcon size={18} />
                        Feature Modules
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => handleTabChange('security')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0', border: 'none', background: 'none', color: activeTab === 'security' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'security' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600 }}
                    >
                        <Lock size={18} />
                        Security
                    </button>
                </div>

                {error && <ErrorMessage message={error} />}
                {successMsg && <div className="alert alert-success" style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '8px', background: 'rgba(82, 196, 26, 0.1)', color: '#52c41a', border: '1px solid rgba(82, 196, 26, 0.2)' }}>{successMsg}</div>}

                {activeTab === 'profile' && (
                    <form onSubmit={saveProfile} className="fade-in">
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Company Name</label>
                            <input 
                                type="text"
                                className="form-control"
                                value={profile.companyName}
                                onChange={(e) => setProfile({...profile, companyName: e.target.value})}
                                placeholder="Enter company name"
                                required
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Company Address</label>
                            <textarea 
                                className="form-control"
                                rows={3}
                                value={profile.companyAddress}
                                onChange={(e) => setProfile({...profile, companyAddress: e.target.value})}
                                placeholder="Full address"
                                style={{ resize: 'vertical' }}
                                required
                            />
                        </div>
                        <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="form-group">
                                <label className="form-label">GST Number (Optional)</label>
                                <input 
                                    type="text"
                                    className="form-control"
                                    value={profile.gstNumber}
                                    onChange={(e) => setProfile({...profile, gstNumber: e.target.value})}
                                    placeholder="Enter GSTIN"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Default Currency</label>
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
                                {isSavingProfile ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'modules' && (
                    <div className="fade-in">
                        <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>Enable or disable features for your organization. Some modules depend on others and cannot be disabled independently.</p>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {AVAILABLE_MODULES.map(mod => {
                                const isSelected = selectedModules.includes(mod.id);
                                return (
                                    <div key={mod.id} style={{ 
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                        padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                                        border: '1px solid var(--border-color)' 
                                    }}>
                                        <div>
                                            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{mod.name}</h3>
                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{mod.description}</p>
                                        </div>
                                        <button 
                                            onClick={() => toggleModule(mod.id)}
                                            disabled={isSavingModules}
                                            className={`btn ${isSelected ? 'btn-outline-danger' : 'btn-primary'}`}
                                            style={{ minWidth: '100px' }}
                                        >
                                            {isSelected ? 'Disable' : 'Enable'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="fade-in" style={{ maxWidth: '500px' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Change Account Password</h3>
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label className="form-label">Current Password</label>
                                <input 
                                    type="password"
                                    className="form-control"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label className="form-label">New Password</label>
                                <input 
                                    type="password"
                                    className="form-control"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label className="form-label">Confirm New Password</label>
                                <input 
                                    type="password"
                                    className="form-control"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSavingPassword}>
                                {isSavingPassword ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
