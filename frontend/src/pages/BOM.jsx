import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bomService from '../services/bomService';
import productService from '../services/productService';
import materialService from '../services/materialService';
import partService from '../services/partService';
import jobWorkService from '../services/jobWorkService';
import { Package, Plus, Trash2, Edit2, Search, Calculator, FileText, ChevronRight, X, ArrowLeft, Briefcase, ListTree, RefreshCw, Play } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import Loading from './Loading';

const BOM = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [jobWorkOrders, setJobWorkOrders] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [parts, setParts] = useState([]);
    const [selectedEntity, setSelectedEntity] = useState(null); // Can be Product or JobWorkOrder
    const [bomItems, setBomItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [editItem, setEditItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Standard'); // 'Standard', 'JobWork', or 'Parts'
    const [isSyncing, setIsSyncing] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const hasModule = (m) => userInfo.selectedModules?.includes(m);

    const [formData, setFormData] = useState({
        selectedId: '',
        type: 'material',
        qtyPerUnit: '',
        unit: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Parallel fetch with fallback to empty arrays
            const [prods, mats, prts, jwOrders] = await Promise.all([
                productService.getAll().catch(() => []),
                materialService.getAll().catch(() => []),
                partService.getAll().catch(() => []),
                jobWorkService.getAll().catch(() => [])
            ]);
            
            setProducts(prods);
            setMaterials(mats);
            setParts(prts);
            setJobWorkOrders(jwOrders);
        } catch (err) {
            setError('An unexpected error occurred while loading data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchBOM = async (id) => {
        try {
            setLoading(true);
            const data = await bomService.getByProduct(id);
            setBomItems(data || []);
        } catch (err) {
            setError('Failed to load Bill of Materials');
        } finally {
            setLoading(false);
        }
    };

    const handleEntitySelect = (entity) => {
        setSelectedEntity(entity);
        fetchBOM(entity._id);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'componentId') {
            if (!value || value === 'undefined-' || value === '-') {
                setFormData(prev => ({ ...prev, selectedId: '', type: 'material', unit: '' }));
                return;
            }
            const [prefix, id] = value.split('-');
            const type = prefix === 'mat' ? 'material' : 'part';
            const component = type === 'material' 
                ? materials.find(m => m._id === id) 
                : parts.find(p => p._id === id);
            setFormData(prev => ({ ...prev, selectedId: id, type, unit: component?.unit || '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editItem) {
                await bomService.updateItem(editItem._id, {
                    qtyPerUnit: Number(formData.qtyPerUnit),
                    unit: formData.unit
                });
            } else {
                const payload = {
                    qtyPerUnit: Number(formData.qtyPerUnit),
                    unit: formData.unit
                };
                if (formData.type === 'material') {
                    payload.materialId = formData.selectedId;
                } else {
                    payload.partId = formData.selectedId;
                }
                
                if (activeTab === 'Standard') {
                    payload.productId = selectedEntity._id;
                } else if (activeTab === 'Parts') {
                    payload.parentPartId = selectedEntity._id;
                } else {
                    payload.jobWorkOrderId = selectedEntity._id;
                }
                await bomService.addItem(payload);
            }
            setShowModal(false);
            setEditItem(null);
            setFormData({ selectedId: '', type: 'material', qtyPerUnit: '', unit: '' });
            await fetchBOM(selectedEntity._id);
            
            // Auto-sync cost if it's a Standard product or part
            if (activeTab === 'Standard' || activeTab === 'Parts') {
                await syncCostToMaster();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save BOM item');
        }
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setFormData({
            selectedId: item.materialId?._id || item.partId?._id || item.materialId || item.partId,
            type: item.materialId ? 'material' : 'part',
            qtyPerUnit: item.qtyPerUnit,
            unit: item.unit
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Remove this material from BOM?')) {
            try {
                await bomService.deleteItem(id);
                await fetchBOM(selectedEntity._id);
                
                // Auto-sync cost if it's a Standard product or part
                if (activeTab === 'Standard' || activeTab === 'Parts') {
                    await syncCostToMaster();
                }
            } catch (err) {
                setError('Failed to delete BOM item');
            }
        }
    };

    const syncCostToMaster = async () => {
        if (!selectedEntity) return;
        setIsSyncing(true);
        try {
            const totalCost = bomItems.reduce((acc, item) => {
                let unitCost = 0;
                if (item.materialId) {
                    const material = materials.find(m => m._id === (item.materialId?._id || item.materialId));
                    unitCost = material?.price || 0;
                } else if (item.partId) {
                    const part = parts.find(p => p._id === (item.partId?._id || item.partId));
                    unitCost = part?.standardCost || 0;
                }
                return acc + ((item.qtyPerUnit || 0) * unitCost);
            }, 0);

            if (activeTab === 'Standard') {
                await productService.update(selectedEntity._id, { 
                    ...selectedEntity,
                    standardCost: totalCost 
                });
            } else if (activeTab === 'Parts') {
                await partService.update(selectedEntity._id, { 
                    ...selectedEntity,
                    standardCost: totalCost 
                });
            }
            
            // Refresh local state to show updated price
            const freshData = await fetchInitialData();
            
            // Re-sync the selected entity with fresh data to update the UI immediately
            if (freshData) {
                const updated = (activeTab === 'Standard' ? freshData.prods : freshData.prts).find(i => i._id === selectedEntity._id);
                if (updated) setSelectedEntity(updated);
            }
            
            alert('Standard cost updated successfully in Master catalog!');
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to sync cost to master';
            setError(msg);
        } finally {
            setIsSyncing(false);
        }
    };

    const totalEstimatedCost = bomItems.reduce((acc, item) => {
        let cost = 0;
        if (item.materialId) {
            const material = materials.find(m => m._id === (item.materialId?._id || item.materialId));
            cost = material?.price || 0;
        } else if (item.partId) {
            const part = parts.find(p => p._id === (item.partId?._id || item.partId));
            cost = part?.standardCost || 0;
        }
        return acc + ((item.qtyPerUnit || 0) * cost);
    }, 0);

    const filteredData = (activeTab === 'Standard' ? products : (activeTab === 'Parts' ? parts : jobWorkOrders)).filter(item => {
        const name = item.name || item.materialName || item.orderTitle || '';
        const code = item.productCode || item.orderNumber || item.partCode || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) || code.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading && products.length === 0 && jobWorkOrders.length === 0) return <Loading />;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {selectedEntity && (
                        <button className="btn" style={{ padding: '8px' }} onClick={() => setSelectedEntity(null)}>
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
                            {selectedEntity ? (
                                activeTab === 'Standard' 
                                    ? selectedEntity.name 
                                    : (activeTab === 'Parts' ? selectedEntity.name : `${selectedEntity.clientId?.name || 'Client'}: ${selectedEntity.orderTitle || selectedEntity.materialName}`)
                            ) : 'BOM (Bill of Materials)'}
                        </h1>
                        {selectedEntity && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {activeTab === 'Standard' ? <Package size={14} /> : (activeTab === 'Parts' ? <ListTree size={14} /> : <Briefcase size={14} />)}
                                {selectedEntity.productCode || selectedEntity.orderNumber || selectedEntity.partCode}
                            </span>
                        )}
                    </div>
                </div>
                {!selectedEntity && (
                    <div className="header-actions">
                        <div className="search-container" style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder={`Search ${activeTab === 'Standard' ? 'products' : (activeTab === 'Parts' ? 'parts' : 'orders')}...`}
                                className="form-control"
                                style={{ paddingLeft: '40px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        </div>
                    </div>
                )}
                {selectedEntity && (
                    <button className="btn btn-primary" onClick={() => { setEditItem(null); setFormData({ selectedId: '', type: 'material', qtyPerUnit: '', unit: '' }); setShowModal(true); }}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Add Component
                    </button>
                )}
            </div>

            {!selectedEntity && (
                <div className="tabs-container" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    <button 
                        className={`tab-btn ${activeTab === 'Standard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Standard')}
                        style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', color: activeTab === 'Standard' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'Standard' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600 }}
                    >
                        Standard Products
                    </button>
                    {hasModule('parts') && (
                        <button 
                            className={`tab-btn ${activeTab === 'Parts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('Parts')}
                            style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', color: activeTab === 'Parts' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'Parts' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600 }}
                        >
                            Sub-Assembly Parts
                        </button>
                    )}
                    {hasModule('orders') && (
                        <button 
                            className={`tab-btn ${activeTab === 'JobWork' ? 'active' : ''}`}
                            onClick={() => setActiveTab('JobWork')}
                            style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', color: activeTab === 'JobWork' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', borderBottom: activeTab === 'JobWork' ? '2px solid var(--primary-color)' : 'none', fontWeight: 600 }}
                        >
                            Job Work Orders
                        </button>
                    )}
                </div>
            )}

            {error && <ErrorMessage message={error} onClose={() => setError('')} />}

            {!selectedEntity ? (
                <>
                    {filteredData.length > 0 ? (
                        <div className="bom-mobile-selector grid-3-col" style={{ gap: '1.5rem' }}>
                            {filteredData.map(item => (
                                <div key={item._id} className="glass-card clickable-card" onClick={() => handleEntitySelect(item)} style={{ padding: '1.5rem', transition: 'transform 0.2s', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px' }}>
                                            {activeTab === 'Standard' ? <Package size={24} className="text-primary" /> : (activeTab === 'Parts' ? <ListTree size={24} className="text-info" /> : <Briefcase size={24} className="text-accent" />)}
                                        </div>
                                        <div>
                                            {activeTab === 'JobWork' && (
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: '2px' }}>
                                                    {item.clientId?.name || 'Unknown Client'}
                                                </div>
                                            )}
                                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.name || item.orderTitle || item.materialName}</h3>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.productCode || item.orderNumber || item.partCode}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className={`badge ${activeTab === 'Standard' ? 'badge-info' : (activeTab === 'Parts' ? 'badge-primary' : 'badge-warning')}`}>
                                            {activeTab === 'Standard' ? item.category : (activeTab === 'Parts' ? item.category : item.jobType)}
                                        </span>
                                        <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                            <Package size={64} style={{ color: 'var(--primary-color)', opacity: 0.3, marginBottom: '1.5rem' }} />
                            <h2>No {activeTab === 'Standard' ? 'Products' : 'Job Orders'} Found</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                {activeTab === 'Standard' 
                                    ? "You need to create products before you can define their Material Recipe (BOM)." 
                                    : (activeTab === 'Parts' ? "No sub-assembly parts found. Create parts to define their sub-components." : "No active job work orders found to define materials for.")}
                            </p>
                        </div>
                    )}
                </>
            ) : (
                <div className="grid-top-layout" style={{ display: 'grid', gap: '2rem' }}>
                    <div className="glass-card table-container">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>Component Name</th>
                                    <th>Quantity</th>
                                    <th>Unit</th>
                                    <th>Est. Cost</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bomItems.map(item => {
                                        let name = 'Unknown';
                                        let code = '';
                                        let unitCost = 0;
                                        let typeLabel = '';
                                        
                                        if (item.materialId) {
                                            const material = materials.find(m => m._id === (item.materialId?._id || item.materialId));
                                            name = material?.name || 'Unknown';
                                            code = material?.materialCode || '';
                                            unitCost = material?.price || 0;
                                            typeLabel = 'Material';
                                        } else if (item.partId) {
                                            const part = parts.find(p => p._id === (item.partId?._id || item.partId));
                                            name = part?.name || 'Unknown';
                                            code = part?.partCode || '';
                                            unitCost = part?.standardCost || 0;
                                            typeLabel = 'Part';
                                        }
                                        
                                        const quantity = item.qtyPerUnit || 0;
                                        const cost = quantity * unitCost;

                                    return (
                                        <tr key={item._id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{name} <span style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>({typeLabel})</span></div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{code}</div>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{(item.qtyPerUnit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                            <td>{item.unit || '-'}</td>
                                            <td style={{ color: 'var(--accent-color)', fontWeight: 600 }}>₹{cost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn" style={{ padding: '6px' }} onClick={() => handleEdit(item)}>
                                                        <Edit2 size={16} className="text-primary" />
                                                    </button>
                                                    <button className="btn" style={{ padding: '6px' }} onClick={() => handleDelete(item._id)}>
                                                        <Trash2 size={16} className="text-danger" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {bomItems.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                                <Calculator size={48} style={{ color: 'var(--primary-color)', opacity: 0.2, marginBottom: '1rem' }} />
                                <h3 style={{ color: 'var(--text-secondary)' }}>Material Recipe is Empty</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Start by adding the first material required for this {activeTab === 'Standard' ? 'product' : (activeTab === 'Parts' ? 'part' : 'job')}.</p>
                                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                                    <Plus size={16} style={{ marginRight: '8px' }} /> Add First Material
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="sidebar-stats">
                        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <Calculator size={20} className="text-primary" />
                                <h3 style={{ margin: 0 }}>Cost Summary</h3>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Estimated internal cost {activeTab === 'Standard' ? 'per unit' : 'for this job'} (Materials Only).
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: '0.5rem' }}>
                                ₹{totalEstimatedCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </div>
                            
                            {(activeTab === 'Standard' || activeTab === 'Parts') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ width: '100%', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)' }}
                                        onClick={syncCostToMaster}
                                        disabled={isSyncing || bomItems.length === 0}
                                    >
                                        {isSyncing ? (
                                            <RefreshCw size={16} className="animate-spin" />
                                        ) : (
                                            <><RefreshCw size={16} style={{ marginRight: '8px' }} /> Sync to Master catalog</>
                                        )}
                                    </button>

                                    <button 
                                        className="btn btn-primary" 
                                        style={{ width: '100%', background: 'var(--primary-color)', color: 'white' }}
                                        onClick={() => navigate('/production', { 
                                            state: { 
                                                productId: activeTab === 'Standard' ? selectedEntity._id : '', 
                                                partId: activeTab === 'Parts' ? selectedEntity._id : '' 
                                            } 
                                        })}
                                        disabled={bomItems.length === 0}
                                    >
                                        <Play size={16} style={{ marginRight: '8px' }} /> Start Production Build
                                    </button>
                                </div>
                            )}

                            {activeTab === 'Standard' && (
                                <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', marginTop: '1.5rem' }}>
                                    Standard Selling Price: ₹{selectedEntity.sellingPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </div>
                            )}
                        </div>

                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <FileText size={20} className="text-primary" />
                                <h3 style={{ margin: 0 }}>Reference Details</h3>
                            </div>
                            <div className="summary-scroll-container">
                                <div className="info-row summary-item-chip" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    <span className="label" style={{ color: 'var(--text-secondary)' }}>{activeTab === 'JobWork' ? 'Order Total Amount:' : 'Master Standard Cost:'}</span>
                                    <span className="value" style={{ fontWeight: 600, color: 'var(--accent-color)' }}>₹{(selectedEntity.standardCost || selectedEntity.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                                </div>
                                <div className="info-row summary-item-chip" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    <span className="label" style={{ color: 'var(--text-secondary)' }}>{activeTab === 'Standard' ? 'Category' : 'Job Type'}:</span>
                                    <span className="value" style={{ fontWeight: 600 }}>{selectedEntity.category || selectedEntity.jobType}</span>
                                </div>
                                <div className="info-row summary-item-chip" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    <span className="label" style={{ color: 'var(--text-secondary)' }}>{activeTab === 'Standard' ? 'Output Unit' : 'Quantity'}:</span>
                                    <span className="value" style={{ fontWeight: 600 }}>{selectedEntity.unit || selectedEntity.materialQuantity}</span>
                                </div>
                                {activeTab === 'JobWork' && (
                                    <div className="info-row summary-item-chip" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        <span className="label" style={{ color: 'var(--text-secondary)' }}>Client:</span>
                                        <span className="value" style={{ fontWeight: 600 }}>{selectedEntity.clientId?.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-card modal-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>{editItem ? 'Edit BOM Item' : 'Add BOM Item'}</h2>
                            <button className="btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Select Component</label>
                                <select 
                                    name="componentId" 
                                    value={formData.selectedId ? `${formData.type === 'material' ? 'mat' : 'part'}-${formData.selectedId}` : ''} 
                                    onChange={handleInputChange} 
                                    className="form-control" 
                                    disabled={!!editItem}
                                    required
                                >
                                    <option value="">-- Choose Material or Part --</option>
                                    {hasModule('materials') && (
                                        <optgroup label="Materials">
                                            {materials.map(m => (
                                                <option key={`mat-${m._id}`} value={`mat-${m._id}`}>{m.name} ({m.materialCode})</option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {hasModule('parts') && activeTab !== 'Parts' && (
                                        <optgroup label="Parts">
                                            {parts.filter(p => p._id !== selectedEntity._id).map(p => (
                                                <option key={`part-${p._id}`} value={`part-${p._id}`}>{p.name} ({p.partCode})</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </div>

                            <div className="responsive-modal-grid">
                                <div className="form-group">
                                    <label className="form-label">Quantity Required</label>
                                    <input 
                                        type="number" step="0.0001" 
                                        name="qtyPerUnit" 
                                        value={formData.qtyPerUnit} 
                                        onChange={handleInputChange} 
                                        className="form-control" 
                                        placeholder={activeTab === 'Standard' ? "Qty per Product Unit" : (activeTab === 'Parts' ? "Qty per Part Unit" : "Total Qty for this Job")}
                                        required 
                                        min="0.0001"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Material Unit</label>
                                    <input 
                                        type="text" 
                                        name="unit" 
                                        value={formData.unit} 
                                        readOnly 
                                        className="form-control" 
                                        style={{ background: 'rgba(255,255,255,0.02)' }}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                    {editItem ? 'Update Item' : 'Add to BOM'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BOM;
