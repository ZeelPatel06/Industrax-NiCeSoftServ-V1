import React from 'react';
import { Edit2, PowerOff, Settings, AlertTriangle, Play, Coffee, User } from 'lucide-react';

const MachineCard = ({ machine, onEdit, onDeactivate }) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isRestrictedRole = ['Operator', 'Worker', 'Helper', 'Labour'].includes(userInfo?.role);
    const isOwner = userInfo.role === 'Owner';
    const canEditAdmin = !isRestrictedRole;
    
    const getStatusStyles = (status) => {
        switch (status) {
            case 'Running':
                return { color: '#52c41a', bg: 'rgba(82, 196, 26, 0.1)', icon: <Play size={14} /> };
            case 'Maintenance':
                return { color: '#faad14', bg: 'rgba(250, 173, 20, 0.1)', icon: <Settings size={14} /> };
            case 'Broken Down':
                return { color: '#ff4d4f', bg: 'rgba(255, 77, 79, 0.1)', icon: <AlertTriangle size={14} /> };
            case 'Idle':
                return { color: '#1890ff', bg: 'rgba(24, 144, 255, 0.1)', icon: <Coffee size={14} /> };
            default:
                return { color: 'var(--text-secondary)', bg: 'rgba(255, 255, 255, 0.05)', icon: null };
        }
    };

    const opStyles = getStatusStyles(machine.operationalStatus);

    return (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{machine.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>{machine.type || 'Generic Machine'}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span className={`badge ${machine.status === 'active' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10px' }}>
                        {machine.status === 'active' ? 'Account Active' : 'Deactivated'}
                    </span>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        color: opStyles.color,
                        background: opStyles.bg,
                        border: `1px solid ${opStyles.color}33`
                    }}>
                        {opStyles.icon} {machine.operationalStatus}
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Serial Number</span>
                        <span style={{ fontWeight: 500 }}>{machine.serialNumber || 'N/A'}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Model Number</span>
                        <span style={{ fontWeight: 500 }}>{machine.modelNumber || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {machine.currentJobId && (
                <div style={{ 
                    marginBottom: '1.5rem', 
                    padding: '12px', 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    borderRadius: '12px',
                    borderLeft: '4px solid var(--primary-color)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Active Job</span>
                        <span className="badge badge-info" style={{ fontSize: '10px' }}>{machine.currentJobId.status}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>{machine.currentJobId.jobId}</div>
                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '6px', overflow: 'hidden', marginTop: '8px' }}>
                        <div style={{ 
                            width: `${(machine.currentJobId.producedQty / machine.currentJobId.plannedQty) * 100}%`, 
                            background: 'var(--primary-color)', 
                            height: '100%',
                            transition: 'width 0.5s ease'
                        }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                        <span>Progress: {((machine.currentJobId.producedQty / machine.currentJobId.plannedQty) * 100).toFixed(0)}%</span>
                        <span>{machine.currentJobId.producedQty} / {machine.currentJobId.plannedQty}</span>
                    </div>
                    {machine.currentOperatorId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', marginTop: '10px', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                            <User size={14} /> <span style={{ opacity: 0.8 }}>Operator:</span> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{machine.currentOperatorId.name}</span>
                        </div>
                    )}
                </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                <button 
                    className="btn btn-primary" 
                    onClick={() => onEdit(machine)} 
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '0.9rem' }}
                >
                    <Edit2 size={16} /> {canEditAdmin ? 'Edit' : 'Update Status'}
                </button>
                {isOwner && (
                    <button 
                        className="btn btn-outline" 
                        onClick={() => onDeactivate(machine._id)} 
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '0.9rem', color: 'var(--danger-color)', border: '1px solid var(--danger-color)' }}
                    >
                        <PowerOff size={16} /> Deactivate
                    </button>
                )}
            </div>
        </div>
    );
};

export default MachineCard;
