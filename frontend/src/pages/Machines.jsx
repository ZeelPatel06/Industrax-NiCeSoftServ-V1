import React, { useState, useEffect } from 'react';
import { Plus, Search, Hammer, Monitor } from 'lucide-react';
import machineService from '../services/machineService';
import productionService from '../services/productionService';
import MachineForm from '../components/MachineForm';
import MachineCard from '../components/MachineCard';
import ErrorMessage from '../components/ErrorMessage';

const Machines = () => {
    const [machines, setMachines] = useState([]);
    const [productionJobs, setProductionJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingMachine, setEditingMachine] = useState(null);
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isOwner = userInfo.role === 'Owner';

    const fetchMachines = async () => {
        try {
            setIsLoading(true);
            const data = await machineService.getMachines().catch(() => []);
            setMachines(data || []);
            const jobs = await productionService.getAll().catch(() => []);
            setProductionJobs((jobs || []).filter(j => ['Started', 'In Progress'].includes(j.status)));
        } catch (err) {
            console.error('Failed to load machines', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMachines();
    }, []);

    const handleAddMachine = () => {
        setEditingMachine(null);
        setShowForm(true);
    };

    const handleEditMachine = (machine) => {
        setEditingMachine(machine);
        setShowForm(true);
    };

    const handleSaveMachine = async (formData) => {
        try {
            if (editingMachine) {
                await machineService.updateMachine(editingMachine._id, formData);
            } else {
                await machineService.createMachine(formData);
            }
            setShowForm(false);
            fetchMachines();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save machine');
        }
    };

    const handleDeactivate = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this machine? It will no longer be available for selection.')) {
            try {
                await machineService.deactivateMachine(id);
                fetchMachines();
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to deactivate machine');
            }
        }
    };

    const filteredMachines = machines.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.type && m.type.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>Machines</h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your production equipment</p>
                    </div>
                </div>
                <div className="header-actions">
                    <div className="search-container" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search machines..."
                            className="form-control"
                            style={{ paddingLeft: '40px', minWidth: '250px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    </div>
                    {isOwner && (
                        <button className="btn btn-primary" onClick={handleAddMachine} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                            <Plus size={20} /> Add Machine
                        </button>
                    )}
                </div>
            </div>

            {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading machines...</div>
            ) : filteredMachines.length > 0 ? (
                <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {filteredMachines.map(m => (
                        <MachineCard 
                            key={m._id} 
                            machine={m} 
                            onEdit={handleEditMachine} 
                            onDeactivate={handleDeactivate} 
                        />
                    ))}
                </div>
            ) : (
                <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '50%', marginBottom: '1.5rem' }}>
                        <Monitor size={48} color="var(--text-secondary)" />
                    </div>
                    <h3>No machines found</h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', marginBottom: '2rem' }}>
                        {searchTerm ? "Try a different search term" : "Add your first machine to get started with production tracking."}
                    </p>
                    {!searchTerm && JSON.parse(localStorage.getItem('userInfo') || '{}')?.role === 'Owner' && (
                        <button className="btn btn-primary" onClick={handleAddMachine}>
                             <Plus size={20} /> Add Machine
                        </button>
                    )}
                </div>
            )}

            {showForm && (
                <MachineForm 
                    machine={editingMachine} 
                    productionJobs={productionJobs}
                    onSave={handleSaveMachine} 
                    onCancel={() => setShowForm(false)} 
                />
            )}
        </div>
    );
};

export default Machines;
