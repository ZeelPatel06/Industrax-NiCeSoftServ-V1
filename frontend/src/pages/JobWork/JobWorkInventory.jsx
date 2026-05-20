import { useState, useEffect } from 'react';
import ErrorMessage from '../../components/ErrorMessage';
import jobWorkService from '../../services/jobWorkService';
import { PackagePlus, PackageMinus, RefreshCw, History, ChevronDown, ChevronUp, X } from 'lucide-react';

const JobWorkInventory = () => {
    const [materials, setMaterials] = useState([]);
    const [parts, setParts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [txType, setTxType] = useState('IN');
    const [formData, setFormData] = useState({
        jobWorkMaterialId: '', jobWorkPartId: '', itemName: '', quantity: 0,
        referenceType: 'Client Provided', referenceId: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            const [mats, pts, txs] = await Promise.all([
                jobWorkService.getMaterials().catch(() => []),
                jobWorkService.getParts().catch(() => []),
                jobWorkService.getInventoryTransactions().catch(() => [])
            ]);
            setMaterials(mats || []);
            setParts(pts || []);
            setTransactions(txs || []);
        } catch (err) {
            console.error('Failed to load job work inventory data', err);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!formData.itemName && !formData.jobWorkMaterialId && !formData.jobWorkPartId) {
            setError('Please provide an item name or select from the suggestions list.');
            return;
        }
        try {
            if (txType === 'IN') {
                await jobWorkService.addInventoryIn(formData);
            } else {
                await jobWorkService.addInventoryOut(formData);
            }
            setShowTransactionModal(false);
            fetchData();
            setFormData({ jobWorkMaterialId: '', jobWorkPartId: '', itemName: '', quantity: 0, referenceType: 'Client Provided', referenceId: '' });
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Transaction failed');
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.materialCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredParts = parts.filter(p => {
        const hasSearchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             p.partCode.toLowerCase().includes(searchTerm.toLowerCase());
        const hasMovement = p.currentStock > 0 || transactions.some(tx => tx.jobWorkPartId?._id === p._id);
        return hasSearchMatch && hasMovement;
    });

    const filteredTransactions = transactions.filter(tx =>
        (tx.jobWorkMaterialId?.name && tx.jobWorkMaterialId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.jobWorkPartId?.name && tx.jobWorkPartId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tx.referenceType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const txItemName = (tx) => tx.jobWorkMaterialId?.name || tx.jobWorkPartId?.name || tx.itemName || 'Unknown Item';
    const txItemCode = (tx) => tx.jobWorkMaterialId?.materialCode || tx.jobWorkPartId?.partCode || '-';
    const txItemTag  = (tx) => tx.jobWorkMaterialId ? 'Material' : tx.jobWorkPartId ? 'Part' : 'Ad-hoc';

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>Job Work Inventory</h1>
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
                <div className="glass-card table-container" style={{ maxHeight: '900px', overflowY: 'auto' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <RefreshCw size={22} className="text-primary" />
                        Current Stock Levels (Client Provided)
                    </h3>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            🧱 Job Work Materials
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

                    <div>
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            🔩 Job Work Parts
                        </h4>
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>Part</th>
                                    <th style={{ textAlign: 'right' }}>Physical Stock</th>
                                    <th style={{ textAlign: 'right' }}>Reserved</th>
                                    <th style={{ textAlign: 'right' }}>Available</th>
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
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            {(part.currentStock || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {part.unit}
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {(part.reservedStock || 0) > 0 ? `(${(part.reservedStock || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: ((part.currentStock || 0) - (part.reservedStock || 0)) <= (part.minimumLevel || 0) ? 'var(--warning-color)' : 'var(--primary-color)' }}>
                                            {Number((part.currentStock || 0) - (part.reservedStock || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {part.unit}
                                        </td>
                                        <td>
                                            {((part.currentStock || 0) - (part.reservedStock || 0)) <= (part.minimumLevel || 0) ? (
                                                <span className="badge badge-danger">Low stock</span>
                                            ) : (
                                                <span className="badge badge-success">Sufficient</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredParts.length === 0 && (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>{searchTerm ? 'No matching parts.' : 'No finished parts in stock.'}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

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
                                            <span className={`badge ${tx.jobWorkMaterialId ? 'badge-info' : tx.jobWorkPartId ? 'badge-warning' : 'badge-secondary'}`} style={{ fontSize: '0.68rem', backgroundColor: !tx.jobWorkMaterialId && !tx.jobWorkPartId ? '#cbd5e1' : undefined, color: !tx.jobWorkMaterialId && !tx.jobWorkPartId ? '#334155' : undefined }}>
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
                                        const selectedPart = parts.find(p => p.name === val);
                                        setFormData({
                                            ...formData,
                                            itemName:   val,
                                            jobWorkMaterialId: selectedMat  ? selectedMat._id  : '',
                                            jobWorkPartId:     selectedPart ? selectedPart._id : '',
                                        });
                                    }}
                                    required
                                />
                                <datalist id="inventory-options">
                                    {materials.map(m => <option key={m._id} value={m.name}>{m.currentStock} {m.unit} · Material</option>)}
                                    {parts.map(p => <option key={p._id} value={p.name}>{p.currentStock} {p.unit} · Part</option>)}
                                </datalist>
                                {formData.jobWorkMaterialId && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>🧱 Job Work Material selected</p>}
                                {formData.jobWorkPartId     && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>🔩 Job Work Part selected</p>}
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
                                    placeholder="e.g. Client Provided"
                                    value={formData.referenceType}
                                    onChange={e => setFormData({ ...formData, referenceType: e.target.value })}
                                    required
                                />
                                <datalist id="reference-options">
                                    <option value="Client Provided" />
                                    <option value="Manual Adjustment" />
                                    <option value="Purchase Order" />
                                    <option value="Returned from Job" />
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

export default JobWorkInventory;
