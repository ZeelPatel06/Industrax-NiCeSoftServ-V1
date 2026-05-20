import React, { useState } from 'react';
import { Briefcase, Layers, Box, Package, ListTree } from 'lucide-react';
import JobWorkOrders from './JobWorkOrders';
import JobWorkMaterials from './JobWorkMaterials';
import JobWorkParts from './JobWorkParts';
import JobWorkProducts from './JobWorkProducts';
import JobWorkBOM from './JobWorkBOM';
import JobWorkInventory from './JobWorkInventory';
import { PackageSearch } from 'lucide-react';

const JobWork = () => {
    const [activeTab, setActiveTab] = useState('Orders');

    const renderContent = () => {
        switch (activeTab) {
            case 'Orders': return <JobWorkOrders />;
            case 'Materials': return <JobWorkMaterials />;
            case 'Parts': return <JobWorkParts />;
            case 'Products': return <JobWorkProducts />;
            case 'BOM': return <JobWorkBOM />;
            case 'Inventory': return <JobWorkInventory />;
            default: return <JobWorkOrders />;
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '0 1rem' }}>
            <div className="page-header" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h1>Job Work Module</h1>
            </div>
            
            <div className="tabs-container" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '0.5rem' }}>
                <button 
                    className={`tab-btn ${activeTab === 'Orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Orders')}
                    style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', color: activeTab === 'Orders' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'Orders' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Briefcase size={16} /> Orders
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'Materials' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Materials')}
                    style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', color: activeTab === 'Materials' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'Materials' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Layers size={16} /> Materials
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'Parts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Parts')}
                    style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', color: activeTab === 'Parts' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'Parts' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Box size={16} /> Parts
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'Products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Products')}
                    style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', color: activeTab === 'Products' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'Products' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Package size={16} /> Products
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'BOM' ? 'active' : ''}`}
                    onClick={() => setActiveTab('BOM')}
                    style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', color: activeTab === 'BOM' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'BOM' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <ListTree size={16} /> BOM
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'Inventory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Inventory')}
                    style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', color: activeTab === 'Inventory' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'Inventory' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <PackageSearch size={16} /> Inventory
                </button>
            </div>

            <div className="tab-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default JobWork;
