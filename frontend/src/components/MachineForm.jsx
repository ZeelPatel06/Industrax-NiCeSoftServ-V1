import React, { useState } from 'react';
import { X } from 'lucide-react';

const MachineForm = ({ machine, productionJobs, onSave, onCancel }) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isOwner = userInfo.role === 'Owner';
    
    const [formData, setFormData] = useState({
        name: machine?.name || '',
        type: machine?.type || '',
        serialNumber: machine?.serialNumber || '',
        modelNumber: machine?.modelNumber || '',
        operationalStatus: machine?.operationalStatus || 'Idle',
        currentJobId: machine?.currentJobId?._id || machine?.currentJobId || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="glass-card modal-content" style={{ maxWidth: '600px', width: '95%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>{machine ? (isOwner ? 'Edit Machine' : 'Update Status') : 'Add Machine'}</h2>
                    <button className="btn" onClick={onCancel} style={{ padding: '0.4rem' }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
                        <div className="form-group">
                            <label className="form-label">Machine Name *</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Lathe 1"
                                required
                                disabled={!isOwner}
                                autoFocus={isOwner}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Machine Type</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                placeholder="e.g. CNC"
                                disabled={!isOwner}
                            />
                        </div>
                    </div>

                    <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
                        <div className="form-group">
                            <label className="form-label">Serial Number</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.serialNumber}
                                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                placeholder="S/N: 12345"
                                disabled={!isOwner}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Model Number</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.modelNumber}
                                onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                                placeholder="Model: X-100"
                                disabled={!isOwner}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                        <label className="form-label">Operational Status</label>
                        <select
                            className="form-control"
                            value={formData.operationalStatus}
                            onChange={(e) => setFormData({ ...formData, operationalStatus: e.target.value })}
                        >
                            <option value="Running">Running</option>
                            <option value="Idle">Idle</option>
                            <option value="Maintenance">In Maintenance</option>
                            <option value="Broken Down">Broken Down</option>
                        </select>
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label className="form-label">Attached Production Job</label>
                        <select
                            className="form-control"
                            value={formData.currentJobId}
                            onChange={(e) => setFormData({ ...formData, currentJobId: e.target.value })}
                        >
                            <option value="">-- No Active Job --</option>
                            {productionJobs?.map(job => (
                                <option key={job._id} value={job._id}>
                                    {job.jobId} - {job.productId?.name || job.partId?.name || 'Job'} ({((job.producedQty / job.plannedQty) * 100).toFixed(0)}%)
                                </option>
                            ))}
                        </select>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Setting a job will automatically set status to 'Running'.
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={onCancel} style={{ flex: 1 }}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '12px' }}>
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MachineForm;
