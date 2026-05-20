import jobWorkService from '../../services/jobWorkService';
import { Plus, Edit2, Trash2, Settings, X, Search, ListTree } from 'lucide-react';
import { useState, useEffect } from 'react';
import ErrorMessage from '../../components/ErrorMessage';
import Loading from '../Loading';

const partService = { getAll: jobWorkService.getParts, create: jobWorkService.createPart, update: jobWorkService.updatePart, delete: jobWorkService.deletePart };
const materialService = { getAll: jobWorkService.getMaterials };
const bomService = { getByProduct: async (id) => jobWorkService.getBOMItems({ parentPartId: id }), addItem: jobWorkService.addBOMItem, updateItem: jobWorkService.updateBOMItem, deleteItem: jobWorkService.deleteBOMItem };

const JobWorkParts = () => {
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        partCode: '', 
        name: '', 
        category: '', 
        unit: '', 
        standardCost: 0, 
        sellingPrice: 0, 
        bomItems: [], 
        description: '',
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

    // Sub-form for BOM line inside Part Form
    const [newInlineBOM, setNewInlineBOM] = useState({ selectedId: '', type: 'material', qtyPerUnit: 1, unit: '' });

    // BOM State
    const [showBOMModal, setShowBOMModal] = useState(false);
    const [bomPart, setBomPart] = useState(null);
    const [bomItems, setBomItems] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [allParts, setAllParts] = useState([]);
    const [newBOMItem, setNewBOMItem] = useState({ selectedId: '', type: 'material', itemName: '', qtyPerUnit: 1, unit: '' });

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const data = await partService.getAll().catch(() => []);
            setParts(data || []);
            setAllParts(data || []);

            const mats = await materialService.getAll().catch(() => []);
            setMaterials(mats || []);
        } catch (error) {
            console.error('Failed to load parts initial data', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBOM = async (partId) => {
        try {
            const data = await bomService.getByProduct(partId);
            setBomItems(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenBOM = (part) => {
        setBomPart(part);
        fetchBOM(part._id);
        setShowBOMModal(true);
    };

    const handleAddBOMItem = async (e) => {
        e.preventDefault();
        if (!newBOMItem.selectedId) {
            setError('Please select a valid material or part');
            return;
        }
        try {
            await bomService.addItem({
                parentPartId: bomPart._id,
                materialId: newBOMItem.type === 'material' ? newBOMItem.selectedId : undefined,
                partId: newBOMItem.type === 'part' ? newBOMItem.selectedId : undefined,
                qtyPerUnit: newBOMItem.qtyPerUnit,
                unit: newBOMItem.unit
            });
            fetchBOM(bomPart._id);
            setNewBOMItem({ selectedId: '', type: 'material', itemName: '', qtyPerUnit: 1, unit: '' });
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to add BOM item');
        }
    };

    const handleDeleteBOMItem = async (itemId) => {
        try {
            await bomService.deleteItem(itemId);
            fetchBOM(bomPart._id);
        } catch (error) {
            setError('Failed to delete BOM item');
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await partService.update(currentId, formData);
            } else {
                await partService.create(formData);
            }
            setShowModal(false);
            setEditMode(false);
            setCurrentId(null);
            fetchInitialData();
            setFormData({ 
                partCode: '', 
                name: '', 
                category: '', 
                unit: '', 
                standardCost: 0, 
                sellingPrice: 0, 
                bomItems: [], 
                description: '',
                shape: 'Generic',
                dimensions: { length: '', width: '', thickness: '', diameter: '', wallThickness: '', side: '', dimensionUnit: 'mm' }
            });
            setNewInlineBOM({ selectedId: '', type: 'material', qtyPerUnit: 1, unit: '' });
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to save part');
        }
    };

    const handleEdit = async (part) => {
        setEditMode(true);
        setCurrentId(part._id);

        let existingBom = [];
        try {
            existingBom = await bomService.getByProduct(part._id);
            existingBom = existingBom.map(b => ({
                materialId: b.materialId?._id,
                partId: b.partId?._id,
                qtyPerUnit: b.qtyPerUnit,
                unit: b.unit || b.materialId?.unit || b.partId?.unit || ''
            }));
        } catch (error) {
            console.error("Failed to fetch BOM for edit", error);
        }

        setFormData({
            partCode: part.partCode,
            name: part.name,
            category: part.category,
            unit: part.unit || '',
            standardCost: part.standardCost,
            sellingPrice: part.sellingPrice || 0,
            bomItems: existingBom,
            description: part.description || '',
            shape: part.shape || 'Generic',
            dimensions: part.dimensions || { length: '', width: '', thickness: '', diameter: '', wallThickness: '', side: '', dimensionUnit: 'mm' }
        });
        setNewInlineBOM({ selectedId: '', type: 'material', qtyPerUnit: 1, unit: '' });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this part?')) return;
        try {
            await partService.delete(id);
            fetchInitialData();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to delete part');
        }
    };

    const openCreateModal = () => {
        setEditMode(false);
        setFormData({ 
            partCode: '', 
            name: '', 
            category: '', 
            unit: '', 
            standardCost: 0, 
            sellingPrice: 0, 
            bomItems: [], 
            description: '',
            shape: 'Generic',
            dimensions: { length: '', width: '', thickness: '', diameter: '', wallThickness: '', side: '', dimensionUnit: 'mm' }
        });
        setNewInlineBOM({ selectedId: '', type: 'material', qtyPerUnit: 1, unit: '' });
        setShowModal(true);
    };

    const addInlineBomItem = () => {
        if (!newInlineBOM.selectedId) {
            setError('Select a material or part');
            return;
        }
        
        if (newInlineBOM.type === 'material' && formData.bomItems.some(i => i.materialId === newInlineBOM.selectedId)) {
            setError('Material already in BOM list');
            return;
        }
        if (newInlineBOM.type === 'part' && formData.bomItems.some(i => i.partId === newInlineBOM.selectedId)) {
            setError('Part already in BOM list');
            return;
        }

        const component = newInlineBOM.type === 'material' 
            ? materials.find(m => m._id === newInlineBOM.selectedId) 
            : allParts.find(p => p._id === newInlineBOM.selectedId);

        setFormData({
            ...formData,
            bomItems: [...formData.bomItems, {
                materialId: newInlineBOM.type === 'material' ? newInlineBOM.selectedId : undefined,
                partId: newInlineBOM.type === 'part' ? newInlineBOM.selectedId : undefined,
                qtyPerUnit: newInlineBOM.qtyPerUnit, 
                unit: newInlineBOM.unit || component?.unit
            }]
        });
        setNewInlineBOM({ selectedId: '', type: 'material', qtyPerUnit: 1, unit: '' });
    };

    const removeInlineBomItem = (index) => {
        const newBom = [...formData.bomItems];
        newBom.splice(index, 1);
        setFormData({ ...formData, bomItems: newBom });
    };

    const filteredParts = parts.filter(part => 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.partCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Loading />;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>Parts Management</h1>
                <div className="header-actions">
                    <div className="search-container" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search parts..."
                            className="form-control"
                            style={{ paddingRight: '35px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    </div>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Add Part
                    </button>
                </div>
            </div>

            <div className="glass-card table-container">
                <table className="glass-table">
                    <thead>
                        <tr>
                            <th>Part Code</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Selling Price</th>
                            <th>Cost</th>
                            <th>Unit</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParts.map(part => (
                            <tr key={part._id}>
                                <td><span style={{ fontFamily: 'monospace', color: 'var(--info-color)' }}>{part.partCode}</span></td>
                                <td>
                                    <div style={{ fontWeight: 500 }}>{part.name}</div>
                                    {part.dimensions && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {part.shape === 'Round Bar' && (
                                                <span>Ø {part.dimensions.diameter || '0'} × {part.dimensions.length || '0'} {part.dimensions.dimensionUnit}</span>
                                            )}
                                            {part.shape === 'Sheet' && (
                                                <span>{part.dimensions.length || '0'} × {part.dimensions.width || '0'} × {part.dimensions.thickness || '0'} {part.dimensions.dimensionUnit}</span>
                                            )}
                                            {part.shape === 'Pipe' && (
                                                <span>OD Ø {part.dimensions.diameter || '0'} × {part.dimensions.wallThickness || '0'} WT × {part.dimensions.length || '0'} {part.dimensions.dimensionUnit}</span>
                                            )}
                                            {part.shape === 'Square Bar' && (
                                                <span>□ {part.dimensions.side || '0'} × {part.dimensions.length || '0'} {part.dimensions.dimensionUnit}</span>
                                            )}
                                            {(!part.shape || part.shape === 'Generic') && (part.dimensions.length || part.dimensions.width || part.dimensions.thickness) && (
                                                <span>{part.dimensions.length || '0'} × {part.dimensions.width || '0'} × {part.dimensions.thickness || '0'} {part.dimensions.dimensionUnit}</span>
                                            )}
                                            <span className="badge" style={{ fontSize: '0.6rem', padding: '2px 4px', background: 'rgba(255,255,255,0.05)' }}>{part.shape}</span>
                                        </div>
                                    )}
                                </td>
                                <td>{part.category}</td>
                                <td>₹{(part.sellingPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                <td style={{ fontWeight: 600 }}>₹{(part.standardCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                <td>{part.unit}</td>
                                <td>
                                    <span className={`badge ${part.isActive ? 'badge-success' : 'badge-danger'}`}>
                                        {part.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button onClick={() => handleOpenBOM(part)} className="btn" style={{ padding: '0.25rem 0.5rem', color: 'var(--primary-color)' }} title="Manage BOM">
                                        <ListTree size={16} />
                                    </button>
                                    <button onClick={() => handleEdit(part)} className="btn" style={{ padding: '0.25rem 0.5rem', color: 'var(--accent-color)' }} title="Edit Part"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(part._id)} className="btn" style={{ padding: '0.25rem 0.5rem', color: 'var(--danger-color)' }} title="Delete Part"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {filteredParts.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    {searchTerm ? 'No parts matching your search.' : 'No parts found. Add your first part!'}
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
                            <h2>{editMode ? 'Edit Part' : 'New Part'}</h2>
                            <button className="btn" onClick={() => setShowModal(false)} style={{ padding: '0.4rem' }}><X size={20} /></button>
                        </div>
                        
                        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
                        
                        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Part Code</label>
                                    <input 
                                        className="form-control" 
                                        value={formData.partCode} 
                                        onChange={e => setFormData({ ...formData, partCode: e.target.value })} 
                                        placeholder="Leave blank for auto-generation"
                                        disabled={editMode} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        className="form-control"
                                        list="part-name-options"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                    <datalist id="part-name-options">
                                        {[...new Set(parts.map(p => p.name))].filter(Boolean).map(name => (
                                            <option key={name} value={name} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <input
                                        className="form-control"
                                        list="part-category-options"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    />
                                    <datalist id="part-category-options">
                                        {[...new Set(parts.map(p => p.category))].filter(Boolean).map(cat => (
                                            <option key={cat} value={cat} />
                                        ))}
                                    </datalist>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unit</label>
                                    <input
                                        className="form-control"
                                        list="unit-options"
                                        value={formData.unit}
                                        onChange={e => setFormData({ ...formData, unit: e.target.value.toLowerCase() })}
                                        required
                                    />
                                    <datalist id="unit-options">
                                        {['pcs', 'kg', 'g', 'set', 'box', 'roll', 'bag', 'mtr', 'liter'].map(u => (
                                            <option key={u} value={u} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Standard Cost</label>
                                    <input type="number" step="0.0001" className="form-control" value={formData.standardCost} onChange={e => setFormData({ ...formData, standardCost: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Selling Price</label>
                                    <input type="number" step="0.0001" className="form-control" value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <textarea className="form-control" rows="2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
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

                            {/* INLINE BOM SECTION */}
                            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ListTree size={18} className="text-primary" />
                                    Sub-Component Requirements (BOM)
                                </h3>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
                                    <div>
                                        <label className="form-label">Component</label>
                                        <select
                                            className="form-control"
                                            value={`${newInlineBOM.type === 'material' ? 'mat' : 'part'}-${newInlineBOM.selectedId}`}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (!val || val === 'undefined-' || val === '-') {
                                                    setNewInlineBOM({ ...newInlineBOM, selectedId: '', type: 'material', unit: '' });
                                                    return;
                                                }
                                                const [prefix, id] = val.split('-');
                                                const type = prefix === 'mat' ? 'material' : 'part';
                                                const component = type === 'material' 
                                                    ? materials.find(m => m._id === id) 
                                                    : allParts.find(p => p._id === id);
                                                setNewInlineBOM({ ...newInlineBOM, selectedId: id, type, unit: component ? component.unit : '' });
                                            }}
                                        >
                                            <option value="">-- Select Material/Part --</option>
                                            <optgroup label="Materials">
                                                {materials.map(m => <option key={`mat-${m._id}`} value={`mat-${m._id}`}>{m.name} ({m.materialCode})</option>)}
                                            </optgroup>
                                            <optgroup label="Parts">
                                                {allParts.map(p => {
                                                    // Prevent circular reference: part cannot contain itself
                                                    if (currentId && p._id === currentId) return null;
                                                    return <option key={`part-${p._id}`} value={`part-${p._id}`}>{p.name} ({p.partCode})</option>;
                                                })}
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Qty</label>
                                        <input
                                            type="number" step="0.0001"
                                            min="0.0001"
                                            className="form-control"
                                            value={newInlineBOM.qtyPerUnit}
                                            onChange={(e) => setNewInlineBOM({ ...newInlineBOM, qtyPerUnit: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Unit</label>
                                        <input
                                            className="form-control"
                                            list="unit-options"
                                            placeholder="Unit"
                                            value={newInlineBOM.unit}
                                            onChange={(e) => setNewInlineBOM({ ...newInlineBOM, unit: e.target.value.toLowerCase() })}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ height: '38px', padding: '0 1.25rem' }}
                                        onClick={addInlineBomItem}
                                    >
                                        Add
                                    </button>
                                </div>

                                {formData.bomItems.length > 0 && (
                                    <table className="glass-table" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr>
                                                <th>Component</th>
                                                <th>Required Quantity</th>
                                                <th style={{ width: '60px' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.bomItems.map((item, index) => {
                                                const mat = (typeof item.materialId === 'object' ? item.materialId : null) || materials.find(m => m._id === item.materialId);
                                                const part = (typeof item.partId === 'object' ? item.partId : null) || allParts.find(p => p._id === item.partId);
                                                return (
                                                    <tr key={item.materialId || item.partId || index}>
                                                        <td>{mat?.name || part?.name || 'Unknown'} <span style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>({mat ? 'Material' : 'Part'})</span></td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <input
                                                                    type="number" step="0.0001"
                                                                    min="0.0001"
                                                                    className="form-control"
                                                                    style={{ width: '80px', padding: '0.2rem' }}
                                                                    value={item.qtyPerUnit}
                                                                    onChange={(e) => {
                                                                        const newBom = [...formData.bomItems];
                                                                        newBom[index].qtyPerUnit = Number(e.target.value);
                                                                        setFormData({ ...formData, bomItems: newBom });
                                                                    }}
                                                                />
                                                                <input
                                                                    className="form-control"
                                                                    style={{ width: '80px', padding: '0.2rem' }}
                                                                    list="unit-options"
                                                                    value={item.unit}
                                                                    onChange={(e) => {
                                                                        const newBom = [...formData.bomItems];
                                                                        newBom[index].unit = e.target.value;
                                                                        setFormData({ ...formData, bomItems: newBom });
                                                                    }}
                                                                />
                                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>per 1 {formData.unit || 'pc'}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => removeInlineBomItem(index)}
                                                                className="btn" 
                                                                style={{ color: 'var(--danger-color)', padding: '4px' }}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Part</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        {/* BOM Modal */}
            {showBOMModal && (
                <div className="modal-overlay">
                    <div className="glass-card modal-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <ListTree size={20} className="text-primary" /> BOM: {bomPart?.name}
                            </h2>
                            <button className="btn" onClick={() => setShowBOMModal(false)}><X size={20} /></button>
                        </div>
                        {error && <ErrorMessage message={error} onClose={() => setError('')} />}

                        <form onSubmit={handleAddBOMItem} style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                            <h4>Add Component</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px auto', gap: '0.75rem', alignItems: 'flex-end', marginTop: '1rem' }}>
                                <div>
                                    <label className="form-label">Component</label>
                                    <input
                                        type="text"
                                        list="part-bom-options-modal"
                                        className="form-control"
                                        placeholder="Search material or part..."
                                        value={newBOMItem.itemName}
                                        onChange={e => {
                                            const mat = materials.find(m => m.name === e.target.value);
                                            const part = allParts.find(p => p.name === e.target.value);
                                            setNewBOMItem({
                                                ...newBOMItem,
                                                itemName: e.target.value,
                                                selectedId: mat ? mat._id : (part ? part._id : ''),
                                                type: mat ? 'material' : 'part',
                                                unit: mat ? mat.unit : (part ? part.unit : newBOMItem.unit)
                                            });
                                        }}
                                        required
                                    />
                                    <datalist id="part-bom-options-modal">
                                        {materials.map(m => <option key={`mat-${m._id}`} value={m.name}>{m.unit} (Material)</option>)}
                                        {allParts.map(p => {
                                            if (bomPart?._id === p._id) return null;
                                            return <option key={`part-${p._id}`} value={p.name}>{p.unit} (Part)</option>;
                                        })}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="form-label">Qty</label>
                                    <input
                                        type="number" step="0.0001"
                                        className="form-control"
                                        value={newBOMItem.qtyPerUnit}
                                        onChange={e => setNewBOMItem({ ...newBOMItem, qtyPerUnit: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Unit</label>
                                    <input
                                        className="form-control"
                                        list="unit-options"
                                        placeholder="Unit"
                                        value={newBOMItem.unit}
                                        onChange={e => setNewBOMItem({ ...newBOMItem, unit: e.target.value.toLowerCase() })}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>Add</button>
                            </div>
                        </form>

                        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Component</th>
                                        <th>Qty per Part</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bomItems.map(item => (
                                        <tr key={item._id}>
                                            <td>
                                                {item.materialId ? `${item.materialId.name} (${item.materialId.materialCode}) - Material` : ''}
                                                {item.partId ? `${item.partId.name} (${item.partId.partCode}) - Part` : ''}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="number" step="0.0001"
                                                        className="form-control"
                                                        style={{ width: '80px', padding: '0.2rem' }}
                                                        value={item.qtyPerUnit}
                                                        onChange={async (e) => {
                                                            const newQty = Number(e.target.value);
                                                            if (newQty > 0) {
                                                                try {
                                                                    await bomService.updateItem(item._id, { qtyPerUnit: newQty, unit: item.unit });
                                                                    fetchBOM(bomPart._id);
                                                                } catch (error) {
                                                                    console.error(error);
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <input
                                                        className="form-control"
                                                        style={{ width: '80px', padding: '0.2rem' }}
                                                        list="unit-options"
                                                        value={item.unit}
                                                        onChange={async (e) => {
                                                            const newUnit = e.target.value;
                                                            try {
                                                                await bomService.updateItem(item._id, { qtyPerUnit: item.qtyPerUnit, unit: newUnit });
                                                                fetchBOM(bomPart._id);
                                                            } catch (error) {
                                                                console.error(error);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <button onClick={() => handleDeleteBOMItem(item._id)} className="btn" style={{ color: 'var(--danger-color)', padding: '0.25rem' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {bomItems.length === 0 && (
                                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem' }}>No components defined for this part.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobWorkParts;
