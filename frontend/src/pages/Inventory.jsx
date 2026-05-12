import { useState, useEffect } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import inventoryService from '../services/inventoryService';
import materialService from '../services/materialService';
import productService from '../services/productService';
import partService from '../services/partService';
import { PackagePlus, PackageMinus, RefreshCw, History, ChevronDown, ChevronUp, X } from 'lucide-react';

const Inventory = () => {
    const [materials, setMaterials] = useState([]);
    const [products, setProducts] = useState([]);
    const [parts, setParts]       = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [txType, setTxType] = useState('IN');
    const [formData, setFormData] = useState({
        materialId: '', productId: '', partId: '', itemName: '', quantity: 0,
        referenceType: 'Manual Adjustment', referenceId: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const hasModule = (m) => userInfo.selectedModules?.includes(m);

    const fetchData = async () => {
        try {
            const [mats, prods, pts, txs] = await Promise.all([
                materialService.getAll().catch(() => []),
                productService.getAll().catch(() => []),
                partService.getAll().catch(() => []),
                inventoryService.getTransactions().catch(() => [])
            ]);
            setMaterials(mats || []);
            setProducts(prods || []);
            setParts(pts || []);
            setTransactions(txs || []);
        } catch (err) {
            console.error('Failed to load inventory data', err);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!formData.itemName && !formData.materialId && !formData.productId && !formData.partId) {
            setError('Please provide an item name or select from the suggestions list.');
            return;
        }
        try {
            if (txType === 'IN') {
                await inventoryService.stockIn(formData);
            } else {
                await inventoryService.stockOut(formData);
            }
            setShowTransactionModal(false);
            fetchData();
            setFormData({ materialId: '', productId: '', partId: '', itemName: '', quantity: 0, referenceType: 'Manual Adjustment', referenceId: '' });
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Transaction failed');
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.materialCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredProducts = products.filter(p => {
        const hasSearchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             p.productCode.toLowerCase().includes(searchTerm.toLowerCase());
        const hasMovement = p.currentStock > 0 || transactions.some(tx => tx.productId?._id === p._id);
        return hasSearchMatch && hasMovement;
    });

    const filteredParts = parts.filter(p => {
        const hasSearchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             p.partCode.toLowerCase().includes(searchTerm.toLowerCase());
        const hasMovement = p.currentStock > 0 || transactions.some(tx => tx.partId?._id === p._id);
        return hasSearchMatch && hasMovement;
    });

    const filteredTransactions = transactions.filter(tx =>
        (tx.materialId?.name && tx.materialId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.productId?.name && tx.productId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.partId?.name && tx.partId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tx.referenceType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Resolve display name and code for a transaction
    const txItemName = (tx) => tx.materialId?.name || tx.productId?.name || tx.partId?.name || tx.itemName || 'Unknown Item';
    const txItemCode = (tx) => tx.materialId?.materialCode || tx.productId?.productCode || tx.partId?.partCode || '-';
    const txItemTag  = (tx) => tx.materialId ? 'Material' : tx.productId ? 'Product' : tx.partId ? 'Part' : 'Ad-hoc';

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>Inventory Control</h1>
                <div className="header-actions inventory-actions">
                    <div className="inventory-actions-row">
                        <div className="search-container" style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search items..."
                                className="form-control"
                                style={{ paddingRight: '35px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
                        </div>
                        <button className="btn btn-secondary" onClick={() => setShowHistory(!showHistory)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <History size={18} />
                            {showHistory ? 'Hide History' : 'View History'}
                            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                    <div className="inventory-actions-row">
                        <button className="btn btn-accent" onClick={() => { setTxType('IN'); setShowTransactionModal(true); }}>
                            <PackagePlus size={18} style={{ marginRight: '8px' }} /> Receive Goods
                        </button>
                        <button className="btn btn-warning" onClick={() => { setTxType('OUT'); setShowTransactionModal(true); }} style={{ background: 'var(--warning-color)', color: 'white' }}>
                            <PackageMinus size={18} style={{ marginRight: '8px' }} /> Use / Withdraw
                        </button>
                    </div>
                </div>
            </div>

            <div className="inventory-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Stock Levels Card */}
                <div className="glass-card table-container" style={{ maxHeight: '900px', overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <RefreshCw size={22} className="text-primary" />
                        Current Stock Levels
                    </h3>

                    {/* Raw Materials */}
                    {hasModule('materials') && (
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                🧱 Raw Materials
                            </h4>
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th style={{ textAlign: 'right' }}>Physical Stock</th>
                                        <th style={{ textAlign: 'right' }}>Reserved</th>
                                        <th style={{ textAlign: 'right' }}>Available</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMaterials.map(mat => (
                                        <tr key={mat._id}>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{mat.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{mat.materialCode}</div>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {(mat.currentStock || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {mat.unit}
                                            </td>
                                            <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                {(mat.reservedStock || 0) > 0 ? `(${(mat.reservedStock || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})` : '-'}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: ((mat.currentStock || 0) - (mat.reservedStock || 0)) <= (mat.minimumLevel || 0) ? 'var(--warning-color)' : 'var(--primary-color)' }}>
                                                {Number((mat.currentStock || 0) - (mat.reservedStock || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {mat.unit}
                                            </td>
                                            <td>
                                                {((mat.currentStock || 0) - (mat.reservedStock || 0)) <= (mat.minimumLevel || 0) ? (
                                                    <span className="badge badge-danger">Low stock</span>
                                                ) : (
                                                    <span className="badge badge-success">Sufficient</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredMaterials.length === 0 && (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>{searchTerm ? 'No matching materials.' : 'No materials configured.'}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Finished Products */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            📦 Finished Products
                        </h4>
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th style={{ textAlign: 'right' }}>Physical Stock</th>
                                    <th style={{ textAlign: 'right' }}>Reserved</th>
                                    <th style={{ textAlign: 'right' }}>Available</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(prod => (
                                    <tr key={prod._id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{prod.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{prod.productCode}</div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            {(prod.currentStock || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {prod.unit || 'pcs'}
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {(prod.reservedStock || 0) > 0 ? `(${(prod.reservedStock || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: ((prod.currentStock || 0) - (prod.reservedStock || 0)) <= (prod.minimumLevel || 0) ? 'var(--warning-color)' : 'var(--primary-color)' }}>
                                            {Number((prod.currentStock || 0) - (prod.reservedStock || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {prod.unit || 'pcs'}
                                        </td>
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>{searchTerm ? 'No matching products.' : 'No finished products in stock.'}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Finished Parts */}
                    {hasModule('parts') && (
                        <div>
                            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                🔩 Finished Parts
                            </h4>
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Part</th>
                                        <th>Category</th>
                                        <th style={{ textAlign: 'right' }}>Current Stock</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredParts.map(part => (
                                        <tr key={part._id}>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{part.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{part.partCode}</div>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {part.category}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: (part.currentStock || 0) <= 0 ? 'var(--warning-color)' : 'var(--primary-color)' }}>
                                                {Number(part.currentStock || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {part.unit}
                                            </td>
                                            <td>
                                                {(part.currentStock || 0) <= 0 ? (
                                                    <span className="badge badge-danger">Out of stock</span>
                                                ) : (
                                                    <span className="badge badge-success">In stock</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredParts.length === 0 && (
                                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>{searchTerm ? 'No matching parts.' : 'No finished parts in stock.'}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Transaction History */}
                {showHistory && (
                    <div className="glass-card table-container animate-fade-in" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <History size={22} className="text-primary" />
                            Transaction History
                        </h3>
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Item</th>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th>Reference</th>
                                    <th style={{ textAlign: 'right' }}>Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map(tx => (
                                    <tr key={tx._id}>
                                        <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            <div>{new Date(tx.date).toLocaleDateString()}</div>
                                            <div>{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{txItemName(tx)}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{txItemCode(tx)}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${tx.materialId ? 'badge-info' : tx.productId ? 'badge-primary' : tx.partId ? 'badge-warning' : 'badge-secondary'}`} style={{ fontSize: '0.68rem', backgroundColor: !tx.materialId && !tx.productId && !tx.partId ? '#cbd5e1' : undefined, color: !tx.materialId && !tx.productId && !tx.partId ? '#334155' : undefined }}>
                                                {txItemTag(tx)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${tx.type === 'IN' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tx.referenceType}</td>
                                        <td style={{ fontWeight: 600, textAlign: 'right' }}>
                                            {tx.type === 'IN' ? '+' : '-'}{(tx.quantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                        </td>
                                    </tr>
                                ))}
                                {filteredTransactions.length === 0 && (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>{searchTerm ? 'No matching transactions.' : 'No transactions recorded.'}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Stock In/Out Modal */}
            {showTransactionModal && (
                <div className="modal-overlay">
                    <div className="glass-card modal-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, color: txType === 'IN' ? 'var(--success-color)' : 'var(--warning-color)' }}>
                                {txType === 'IN' ? 'Receive Goods (Stock In)' : 'Use Goods (Stock Out)'}
                            </h2>
                            <button className="btn" onClick={() => { setShowTransactionModal(false); setError(''); }} style={{ padding: '0.4rem' }}><X size={20} /></button>
                        </div>
                        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
                        <form onSubmit={handleTransaction}>
                            <div className="form-group">
                                <label className="form-label">Item / Material / Part</label>
                                <input
                                    type="text"
                                    list="inventory-options"
                                    className="form-control"
                                    placeholder="Type or select item..."
                                    value={formData.itemName || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        const selectedMat  = materials.find(m => m.name === val);
                                        const selectedProd = products.find(p => p.name === val);
                                        const selectedPart = parts.find(p => p.name === val);
                                        setFormData({
                                            ...formData,
                                            itemName:   val,
                                            materialId: selectedMat  ? selectedMat._id  : '',
                                            productId:  selectedProd ? selectedProd._id : '',
                                            partId:     selectedPart ? selectedPart._id : '',
                                        });
                                    }}
                                    required
                                />
                                <datalist id="inventory-options">
                                    {hasModule('materials') && materials.map(m => <option key={m._id} value={m.name}>{m.currentStock} {m.unit} · Material</option>)}
                                    {hasModule('products') && products.map(p => <option key={p._id} value={p.name}>{p.currentStock} {p.unit || 'pcs'} · Product</option>)}
                                    {hasModule('parts') && parts.map(p => <option key={p._id} value={p.name}>{p.currentStock} {p.unit} · Part ({p.category})</option>)}
                                </datalist>
                                {formData.materialId && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>🧱 Raw Material selected</p>}
                                {formData.productId  && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>📦 Finished Product selected</p>}
                                {formData.partId     && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>🔩 Finished Part selected</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quantity</label>
                                <input type="number" step="0.0001" min="0.0001"  className="form-control" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reference Type</label>
                                <input
                                    type="text"
                                    list="reference-options"
                                    className="form-control"
                                    placeholder="e.g. Manual Adjustment"
                                    value={formData.referenceType}
                                    onChange={e => setFormData({ ...formData, referenceType: e.target.value })}
                                    required
                                />
                                <datalist id="reference-options">
                                    <option value="Manual Adjustment" />
                                    <option value="Purchase Order" />
                                    <option value="Sales Order" />
                                    {txType === 'OUT' && <option value="Production Run" />}
                                    {txType === 'OUT' && <option value="Dispatch" />}
                                </datalist>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => { setShowTransactionModal(false); setError(''); }}>Cancel</button>
                                <button type="submit" className={txType === 'IN' ? 'btn btn-accent' : 'btn btn-warning'} style={txType === 'OUT' ? { background: 'var(--warning-color)', color: 'white' } : {}}>Confirm {txType}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
