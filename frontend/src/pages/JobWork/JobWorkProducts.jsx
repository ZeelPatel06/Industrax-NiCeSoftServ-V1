import jobWorkService from '../../services/jobWorkService';

const productService = { getAll: jobWorkService.getProducts, create: jobWorkService.createProduct, update: jobWorkService.updateProduct, delete: jobWorkService.deleteProduct };
const materialService = { getAll: jobWorkService.getMaterials };
const partService = { getAll: jobWorkService.getParts };
const bomService = { getByProduct: async (id) => jobWorkService.getBOMItems({ productId: id }), addItem: jobWorkService.addBOMItem, updateItem: jobWorkService.updateBOMItem, deleteItem: jobWorkService.deleteBOMItem };
import { Plus, Edit2, Trash2, ListTree, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import ErrorMessage from '../../components/ErrorMessage';

const JobWorkProducts = () => {
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        productCode: '', 
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
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const hasModule = (m) => userInfo.selectedModules?.includes(m);

    // Sub-form for BOM line inside Product Form
    const [newInlineBOM, setNewInlineBOM] = useState({ selectedId: '', type: 'material', qtyPerUnit: 1, unit: '' });

    // BOM State
    const [showBOMModal, setShowBOMModal] = useState(false);
    const [bomProduct, setBomProduct] = useState(null);
    const [bomItems, setBomItems] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [parts, setParts] = useState([]);
    const [newBOMItem, setNewBOMItem] = useState({ selectedId: '', type: 'material', itemName: '', qtyPerUnit: 1, unit: '' });

    const fetchProducts = async () => {
        try {
            const data = await productService.getAll().catch(() => []);
            setProducts(data || []);

            const mats = await materialService.getAll().catch(() => []);
            setMaterials(mats || []);
            const prts = await partService.getAll().catch(() => []);
            setParts(prts || []);
        } catch (error) {
            console.error('Failed to load products initial data', error);
        }
    };

    const fetchBOM = async (productId) => {
        try {
            const data = await bomService.getByProduct(productId);
            setBomItems(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenBOM = (product) => {
        setBomProduct(product);
        fetchBOM(product._id);
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
                productId: bomProduct._id,
                materialId: newBOMItem.type === 'material' ? newBOMItem.selectedId : undefined,
                partId: newBOMItem.type === 'part' ? newBOMItem.selectedId : undefined,
                qtyPerUnit: newBOMItem.qtyPerUnit,
                unit: newBOMItem.unit
            });
            fetchBOM(bomProduct._id);
            setNewBOMItem({ selectedId: '', type: 'material', itemName: '', qtyPerUnit: 1, unit: '' });
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to add BOM item');
        }
    };

    const handleDeleteBOMItem = async (itemId) => {
        try {
            await bomService.deleteItem(itemId);
            fetchBOM(bomProduct._id);
        } catch (error) {
            setError('Failed to delete BOM item');
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await productService.update(currentId, formData);
            } else {
                await productService.create(formData);
            }

            setShowModal(false);
            setEditMode(false);
            setCurrentId(null);
            fetchProducts();
            setFormData({ 
                productCode: '', 
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
            console.error(error);
            setError(error.response?.data?.message || 'Failed to save product');
        }
    };

    const recalculateCost = (items) => {
        const total = items.reduce((acc, item) => {
            let unitCost = 0;
            if (item.materialId) {
                const mat = (typeof item.materialId === 'object' ? item.materialId : null) || materials.find(m => m._id === item.materialId);
                unitCost = mat?.price || 0;
            } else if (item.partId) {
                const part = (typeof item.partId === 'object' ? item.partId : null) || parts.find(p => p._id === item.partId);
                unitCost = part?.standardCost || 0;
            }
            return acc + (Number(item.qtyPerUnit) * unitCost);
        }, 0);
        return total;
    };

    const handleEdit = async (product) => {
        setEditMode(true);
        setCurrentId(product._id);
        
        let existingBom = [];
        try {
            existingBom = await bomService.getByProduct(product._id);
            existingBom = existingBom.map(b => ({
                materialId: b.materialId?._id || b.materialId,
                partId: b.partId?._id || b.partId,
                qtyPerUnit: b.qtyPerUnit,
                unit: b.unit || b.materialId?.unit || b.partId?.unit || ''
            }));
        } catch (error) {
            console.error("Failed to fetch BOM for edit", error);
        }

        setFormData({
            productCode: product.productCode,
            name: product.name,
            category: product.category,
            unit: product.unit || '',
            standardCost: product.standardCost,
            sellingPrice: product.sellingPrice || 0,
            bomItems: existingBom,
            description: product.description || '',
            shape: product.shape || 'Generic',
            dimensions: {
                length: product.dimensions?.length || '',
                width: product.dimensions?.width || '',
                thickness: product.dimensions?.thickness || '',
                diameter: product.dimensions?.diameter || '',
                wallThickness: product.dimensions?.wallThickness || '',
                side: product.dimensions?.side || '',
                dimensionUnit: product.dimensions?.dimensionUnit || 'mm'
            }
        }); 
        setNewInlineBOM({ selectedId: '', type: 'material', qtyPerUnit: 1, unit: '' });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await productService.delete(id);
            fetchProducts();
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || 'Failed to delete product');
        }
    };

    const openCreateModal = () => {
        setEditMode(false);
        setFormData({ 
            productCode: '', 
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
            : parts.find(p => p._id === newInlineBOM.selectedId);

        const newItems = [...formData.bomItems, {
            materialId: newInlineBOM.type === 'material' ? newInlineBOM.selectedId : undefined,
            partId: newInlineBOM.type === 'part' ? newInlineBOM.selectedId : undefined,
            qtyPerUnit: newInlineBOM.qtyPerUnit, 
            unit: newInlineBOM.unit || component?.unit
        }];

        setFormData({
            ...formData,
            bomItems: newItems,
            standardCost: recalculateCost(newItems)
        });
        setNewInlineBOM({ selectedId: '', type: 'material', qtyPerUnit: 1, unit: '' });
    };

    const removeInlineBomItem = (index) => {
        const newItems = [...formData.bomItems];
        newItems.splice(index, 1);
        setFormData({ 
            ...formData, 
            bomItems: newItems,
            standardCost: recalculateCost(newItems)
        });
    };

    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>Product Management</h1>
                <div className="header-actions">
                    <div className="search-container" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="form-control"
                            style={{ paddingRight: '35px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
                    </div>
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Add Product
                    </button>
                </div>
            </div>

            <div className="glass-card table-container">
                <table className="glass-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Cost</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product._id}>
                                <td><span style={{ fontFamily: 'monospace', color: 'var(--primary-color)' }}>{product.productCode}</span></td>
                                <td>
                                    <div style={{ fontWeight: 500 }}>{product.name}</div>
                                    {product.dimensions && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {product.shape === 'Round Bar' && (
                                                <span>Ø {product.dimensions.diameter || '0'} × {product.dimensions.length || '0'} {product.dimensions.dimensionUnit}</span>
                                            )}
                                            {product.shape === 'Sheet' && (
                                                <span>{product.dimensions.length || '0'} × {product.dimensions.width || '0'} × {product.dimensions.thickness || '0'} {product.dimensions.dimensionUnit}</span>
                                            )}
                                            {product.shape === 'Pipe' && (
                                                <span>OD Ø {product.dimensions.diameter || '0'} × {product.dimensions.wallThickness || '0'} WT × {product.dimensions.length || '0'} {product.dimensions.dimensionUnit}</span>
                                            )}
                                            {product.shape === 'Square Bar' && (
                                                <span>□ {product.dimensions.side || '0'} × {product.dimensions.length || '0'} {product.dimensions.dimensionUnit}</span>
                                            )}
                                            {(!product.shape || product.shape === 'Generic') && (product.dimensions.length || product.dimensions.width || product.dimensions.thickness) && (
                                                <span>{product.dimensions.length || '0'} × {product.dimensions.width || '0'} × {product.dimensions.thickness || '0'} {product.dimensions.dimensionUnit}</span>
                                            )}
                                            <span className="badge" style={{ fontSize: '0.6rem', padding: '2px 4px', background: 'rgba(255,255,255,0.05)' }}>{product.shape}</span>
                                        </div>
                                    )}
                                </td>
                                <td style={{ fontSize: "14px" }}>{product.category}</td>
                                <td>₹{(product.sellingPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                <td>₹{(product.standardCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                <td style={{ fontWeight: 600, color: product.currentStock > 0 ? 'var(--success-color)' : 'var(--warning-color)' }}>
                                    {product.currentStock} {product.unit}
                                </td>
                                <td>
                                    <span className={`badge ${product.isActive ? 'badge-success' : 'badge-danger'}`}>
                                        {product.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    {hasModule('bom') && (
                                        <button onClick={() => handleOpenBOM(product)} className="btn" style={{ padding: '0.25rem 0.5rem', color: 'var(--primary-color)' }} title="Manage BOM">
                                            <ListTree size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => handleEdit(product)} className="btn" style={{ padding: '0.25rem 0.5rem', color: 'var(--accent-color)' }} title="Edit Product"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(product._id)} className="btn" style={{ padding: '0.25rem 0.5rem', color: 'var(--danger-color)' }} title="Delete Product"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    {searchTerm ? 'No products matching your search.' : 'No products found. Add your first product!'}
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
                            <h2 style={{ margin: 0 }}>{editMode ? 'Edit Product' : 'New Product'}</h2>
                            <button className="btn" onClick={() => setShowModal(false)} style={{ padding: '0.4rem' }}><X size={20} /></button>
                        </div>
                        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
                        <form onSubmit={handleSubmit}>
                            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Product Code</label>
                                    <input 
                                        className="form-control" 
                                        value={formData.productCode} 
                                        onChange={e => setFormData({ ...formData, productCode: e.target.value })} 
                                        placeholder="Leave blank for auto-generation"
                                        disabled={editMode} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        className="form-control"
                                        list="product-name-options"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                    <datalist id="product-name-options">
                                        {[...new Set(products.map(p => p.name))].filter(Boolean).map(name => (
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
                                        list="category-options"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    />
                                    <datalist id="category-options">
                                        {[...new Set(products.map(p => p.category))].filter(Boolean).map(cat => (
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
                            {hasModule('bom') && (
                                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ListTree size={18} className="text-primary" />
                                        Material Requirements (BOM)
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
                                                        : parts.find(p => p._id === id);
                                                    setNewInlineBOM({ ...newInlineBOM, selectedId: id, type, unit: component ? component.unit : '' });
                                                }}
                                            >
                                                <option value="">-- Select Material/Part --</option>
                                                {hasModule('materials') && (
                                                    <optgroup label="Materials">
                                                        {materials.map(m => <option key={`mat-${m._id}`} value={`mat-${m._id}`}>{m.name} ({m.materialCode})</option>)}
                                                    </optgroup>
                                                )}
                                                {hasModule('parts') && (
                                                    <optgroup label="Parts">
                                                        {parts.map(p => <option key={`part-${p._id}`} value={`part-${p._id}`}>{p.name} ({p.partCode})</option>)}
                                                    </optgroup>
                                                )}
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
                                                    const part = (typeof item.partId === 'object' ? item.partId : null) || parts.find(p => p._id === item.partId);
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
                                                                            setFormData({ 
                                                                                ...formData, 
                                                                                bomItems: newBom,
                                                                                standardCost: recalculateCost(newBom)
                                                                            });
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
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Product</button>
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
                                <ListTree className="text-primary" /> BOM: {bomProduct.name}
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
                                        list="bom-material-options"
                                        className="form-control"
                                        placeholder="Search material or part..."
                                        value={newBOMItem.itemName}
                                        onChange={e => {
                                            const mat = materials.find(m => m.name === e.target.value);
                                            const part = parts.find(p => p.name === e.target.value);
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
                                    <datalist id="bom-material-options">
                                        {hasModule('materials') && materials.map(m => <option key={`mat-${m._id}`} value={m.name}>{m.unit} (Material)</option>)}
                                        {hasModule('parts') && parts.map(p => <option key={`part-${p._id}`} value={p.name}>{p.unit} (Part)</option>)}
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

                        <div className="table-container">
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Component</th>
                                        <th>Qty per Product</th>
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
                                                                    fetchBOM(bomProduct._id);
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
                                                                fetchBOM(bomProduct._id);
                                                            } catch (error) {
                                                                console.error(error);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <button onClick={() => handleDeleteBOMItem(item._id)} className="btn btn-danger" style={{ padding: '0.2rem 0.4rem' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {bomItems.length === 0 && (
                                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem' }}>No components defined for this product.</td></tr>
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

export default JobWorkProducts;
