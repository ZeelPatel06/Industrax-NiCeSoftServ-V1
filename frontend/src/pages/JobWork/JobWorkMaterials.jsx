import jobWorkService from '../../services/jobWorkService';
import productionService from '../../services/productionService';
import bomService from '../../services/bomService';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import ErrorMessage from '../../components/ErrorMessage';

const JobWorkMaterials = () => {
    const [materials, setMaterials] = useState([]);
    const [reservedMap, setReservedMap] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        materialCode: '', 
        name: '', 
        unit: '', 
        minimumLevel: 0,
        price: 0,
        shape: 'Generic',
        dimensions: {
            length: '',
            width: '',
            thickness: '',
            diameter: '',
            wallThickness: '',
            side: '',
            dimensionUnit: 'mm'
        }
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    const fetchMaterials = async () => {
        try {
            const [mats, jobs] = await Promise.all([
                jobWorkService.getMaterials().catch(() => []),
                productionService.getAll().catch(() => [])
            ]);

            setMaterials(mats || []);

            // Calculate Reservation (Planned Jobs only)
            const plannedJobs = (jobs || []).filter(j => j.status === 'Planned');
            const reservations = {};

            for (let job of plannedJobs) {
                try {
                    const productId = job.productId?._id || job.productId;
                    if (!productId) continue;
                    const bom = await bomService.getByProduct(productId).catch(() => []);
                    bom.forEach(item => {
                        const matId = item.materialId?._id || item.materialId;
                        if (!matId) return;
                        const needed = (item.qtyPerUnit || 0) * (job.plannedQty || 0);
                        reservations[matId] = (reservations[matId] || 0) + needed;
                    });
                } catch (e) { console.error("BOM fetch failed for reservation", e); }
            }
            setReservedMap(reservations);

        } catch (error) {
            console.error('Failed to load materials initial data', error);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await jobWorkService.updateMaterial(currentId, formData);
            } else {
                await jobWorkService.createMaterial(formData);
            }

            setShowModal(false);
            setEditMode(false);
            setCurrentId(null);
            fetchMaterials();
            setFormData({ 
                materialCode: '', 
                name: '', 
                unit: '', 
                minimumLevel: 0,
                price: 0,
                shape: 'Generic',
                dimensions: { length: '', width: '', thickness: '', diameter: '', wallThickness: '', side: '', dimensionUnit: 'mm' }
            });
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || 'Failed to save material');
        }
    };

    const handleEdit = (material) => {
        setEditMode(true);
        setCurrentId(material._id);
        setFormData({
            materialCode: material.materialCode,
            name: material.name,
            unit: material.unit,
            minimumLevel: material.minimumLevel,
            price: material.price || 0,
            shape: material.shape || 'Generic',
            dimensions: material.dimensions || { length: '', width: '', thickness: '', diameter: '', wallThickness: '', side: '', dimensionUnit: 'mm' }
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this material?')) {
            try {
                await jobWorkService.deleteMaterial(id);
                fetchMaterials();
            } catch (error) {
                console.error(error);
                setError(error.response?.data?.message || 'Failed to delete material');
            }
        }
    };

    const openCreateModal = () => {
        setEditMode(false);
        setFormData({ 
            materialCode: '', 
            name: '', 
            unit: '', 
            minimumLevel: 0,
            price: 0,
            shape: 'Generic',
            dimensions: { length: '', width: '', thickness: '', diameter: '', wallThickness: '', side: '', dimensionUnit: 'mm' }
        });
        setShowModal(true);
    };

    const filteredMaterials = materials.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.materialCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>Raw Materials</h1>
                <div className="header-actions">
                    <div className="search-container" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search materials..."
                            className="form-control"
                            style={{ paddingRight: '35px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
                    </div>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Add Material
                    </button>
                </div>
            </div>

            <div className="glass-card table-container">
                <table className="glass-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Price / Unit</th>
                            <th>Min. Level</th>
                            <th>Current Stock</th>
                            <th>Reserved</th>
                            <th>Available</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMaterials.map(m => {
                            const reserved = reservedMap[m._id] || 0;
                            const currentStock = m.currentStock || 0;
                            const minimumLevel = m.minimumLevel || 0;
                            const available = currentStock - reserved;
                            const isLow = available <= minimumLevel;

                            return (
                                <tr key={m._id} className="hover-lift">
                                    <td><span style={{ fontFamily: 'monospace', color: 'var(--primary-color)' }}>{m.materialCode}</span></td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{m.name}</div>
                                        {m.dimensions && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {m.shape === 'Round Bar' && (
                                                    <span>Ø {m.dimensions.diameter || '0'} × {m.dimensions.length || '0'} {m.dimensions.dimensionUnit}</span>
                                                )}
                                                {m.shape === 'Sheet' && (
                                                    <span>{m.dimensions.length || '0'} × {m.dimensions.width || '0'} × {m.dimensions.thickness || '0'} {m.dimensions.dimensionUnit}</span>
                                                )}
                                                {m.shape === 'Pipe' && (
                                                    <span>OD Ø {m.dimensions.diameter || '0'} × {m.dimensions.wallThickness || '0'} WT × {m.dimensions.length || '0'} {m.dimensions.dimensionUnit}</span>
                                                )}
                                                {m.shape === 'Square Bar' && (
                                                    <span>□ {m.dimensions.side || '0'} × {m.dimensions.length || '0'} {m.dimensions.dimensionUnit}</span>
                                                )}
                                                {(!m.shape || m.shape === 'Generic') && (m.dimensions.length || m.dimensions.width || m.dimensions.thickness) && (
                                                    <span>{m.dimensions.length || '0'} × {m.dimensions.width || '0'} × {m.dimensions.thickness || '0'} {m.dimensions.dimensionUnit}</span>
                                                )}
                                                <span className="badge" style={{ fontSize: '0.6rem', padding: '2px 4px', background: 'rgba(255,255,255,0.05)' }}>{m.shape}</span>
                                            </div>
                                        )}
                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--accent-color)' }}>
                                        ₹{(m.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                    </td>
                                    <td>{(m.minimumLevel || 0)} {m.unit}</td>
                                    <td>{(m.currentStock || 0)} {m.unit}</td>
                                    <td style={{ color: reserved > 0 ? 'var(--warning-color)' : 'var(--text-secondary)' }}>
                                        {reserved > 0 ? `-${(reserved || 0).toFixed(4)}` : '0'}
                                    </td>
                                    <td style={{ fontWeight: 600, color: isLow ? 'var(--danger-color)' : 'var(--success-color)' }}>
                                        {(available || 0).toFixed(4)}
                                    </td>
                                    <td>
                                        <span className={`badge ${isLow ? 'badge-danger pulse-danger' : 'badge-success'}`}>
                                            {isLow ? 'Low/Reserved' : 'Healthy'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn"
                                            style={{ padding: '0.25rem 0.5rem', color: 'var(--accent-color)' }}
                                            onClick={() => handleEdit(m)}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="btn"
                                            style={{ padding: '0.25rem 0.5rem', color: 'var(--danger-color)' }}
                                            onClick={() => handleDelete(m._id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredMaterials.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    {searchTerm ? 'No materials matching your search.' : 'No materials found. Define your first raw material!'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-card modal-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>{editMode ? 'Edit Material' : 'New Material'}</h2>
                            <button className="btn" onClick={() => setShowModal(false)} style={{ padding: '0.4rem' }}><X size={20} /></button>
                        </div>
                        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
                        <form onSubmit={handleSubmit}>
                            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Material Code</label>
                                    <input
                                        className="form-control"
                                        value={formData.materialCode}
                                        onChange={e => setFormData({ ...formData, materialCode: e.target.value })}
                                        placeholder="Leave blank for auto-generation"
                                        disabled={editMode}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        className="form-control"
                                        list="material-name-options"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                    <datalist id="material-name-options">
                                        {[...new Set(materials.map(m => m.name))].filter(Boolean).map(name => (
                                            <option key={name} value={name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Unit (e.g. kg, pcs)</label>
                                    <input
                                        className="form-control"
                                        list="mat-unit-options"
                                        placeholder="Type or select unit..."
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value.toLowerCase() })}
                                        required
                                    />
                                    <datalist id="mat-unit-options">
                                        {['kg', 'pcs', 'g', 'liter', 'mtr', 'box', 'roll', 'bag', 'set'].map(u => (
                                            <option key={u} value={u} />
                                        ))}
                                    </datalist>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Minimum Level</label>
                                    <input type="number" step="0.0001" className="form-control" value={formData.minimumLevel} onChange={e => setFormData({ ...formData, minimumLevel: Number(e.target.value) })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Price / Unit (₹)</label>
                                    <input type="number" step="0.0001" className="form-control" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <label className="form-label" style={{ opacity: 0.7, fontSize: '0.8rem', margin: 0 }}>GEOMETRY & DIMENSIONS</label>
                                    <select 
                                        className="form-control form-control-sm" 
                                        style={{ width: 'auto', background: 'var(--primary-color)', color: 'white', border: 'none' }}
                                        value={formData.shape}
                                        onChange={e => setFormData({ ...formData, shape: e.target.value })}
                                    >
                                        <option value="Generic">Generic</option>
                                        <option value="Sheet">Sheet / Plate</option>
                                        <option value="Round Bar">Round Bar</option>
                                        <option value="Pipe">Pipe / Tube</option>
                                        <option value="Square Bar">Square Bar</option>
                                        <option value="Hex Bar">Hex Bar</option>
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.75rem' }}>
                                    {/* Dynamic Fields based on Shape */}
                                    {(formData.shape === 'Sheet' || formData.shape === 'Generic') && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Length</label>
                                                <input type="number" step="0.0001" className="form-control form-control-sm" value={formData.dimensions.length} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: e.target.value } })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Width</label>
                                                <input type="number" step="0.0001" className="form-control form-control-sm" value={formData.dimensions.width} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, width: e.target.value } })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Thickness</label>
                                                <input type="number" step="0.0001" className="form-control form-control-sm" value={formData.dimensions.thickness} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, thickness: e.target.value } })} />
                                            </div>
                                        </>
                                    )}

                                    {formData.shape === 'Round Bar' && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Diameter (Ø)</label>
                                                <input type="number" step="0.0001" className="form-control form-control-sm" value={formData.dimensions.diameter} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, diameter: e.target.value } })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Length</label>
                                                <input type="number" step="0.0001" className="form-control form-control-sm" value={formData.dimensions.length} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: e.target.value } })} />
                                            </div>
                                        </>
                                    )}

                                    {formData.shape === 'Pipe' && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Outer Dia (OD)</label>
                                                <input type="number" step="0.0001" className="form-control form-control-sm" value={formData.dimensions.diameter} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, diameter: e.target.value } })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Wall Thick (WT)</label>
                                                <input type="number" step="0.0001" className="form-control form-control-sm" value={formData.dimensions.wallThickness} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, wallThickness: e.target.value } })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Length</label>
                                                <input type="number" step="0.0001" className="form-control form-control-sm" value={formData.dimensions.length} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: e.target.value } })} />
                                            </div>
                                        </>
                                    )}

                                    {formData.shape === 'Square Bar' && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Side (□)</label>
                                                <input type="number" step="0.0001" className="form-control form-control-sm" value={formData.dimensions.side} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, side: e.target.value } })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Length</label>
                                                <input type="number" step="0.0001" className="form-control form-control-sm" value={formData.dimensions.length} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: e.target.value } })} />
                                            </div>
                                        </>
                                    )}

                                    {formData.shape === 'Hex Bar' && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Across Flats</label>
                                                <input type="number" step="0.0001" className="form-control form-control-sm" value={formData.dimensions.side} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, side: e.target.value } })} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontSize: '0.7rem' }}>Length</label>
                                                <input type="number" step="0.0001" className="form-control form-control-sm" value={formData.dimensions.length} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: e.target.value } })} />
                                            </div>
                                        </>
                                    )}

                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Unit</label>
                                        <select 
                                            className="form-control form-control-sm" 
                                            value={formData.dimensions.dimensionUnit} 
                                            onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, dimensionUnit: e.target.value } })}
                                        >
                                            <option value="mm">mm</option>
                                            <option value="cm">cm</option>
                                            <option value="inch">inch</option>
                                            <option value="mtr">mtr</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Material</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobWorkMaterials;
