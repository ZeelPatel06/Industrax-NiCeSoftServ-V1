import { useState, useEffect } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import orderService from '../services/orderService';
import productService from '../services/productService';
import invoiceService from '../services/invoiceService';

import { ShoppingCart, Edit, Plus, Trash2, Search, Package, User, IndianRupee, Calendar, FileText, ChevronRight, X, Clock, CheckCircle2, Edit2, Briefcase, Download, RefreshCw } from 'lucide-react';

const Orders = () => {
    // Shared State
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const hasModule = (m) => userInfo.selectedModules?.includes(m);

    // Standard Orders State
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [showStandardModal, setShowStandardModal] = useState(false);
    const [newOrder, setNewOrder] = useState({
        customerName: '',
        orderId: '',
        deliveryDate: '',
        items: []
    });
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedQty, setSelectedQty] = useState(1);
    const [standardEditMode, setStandardEditMode] = useState(false);
    const [standardCurrentId, setStandardCurrentId] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const [invoiceConfig, setInvoiceConfig] = useState({
        gstType: 'none',
        gstRate: 18,
        extraCosts: [], // { description: '', amount: 0 }
        notes: ''
    });

    const fetchData = async () => {
        try {
            const [ordersData, productsData] = await Promise.all([
                orderService.getAll().catch(() => []),
                productService.getAll().catch(() => [])
            ]);
            setOrders(ordersData || []);
            setProducts((productsData || []).filter(p => p.isActive));
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Standard Order Handlers ---
    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await orderService.updateStatus(orderId, newStatus);
            fetchData();
        } catch (error) {
            setError('Failed to update status');
        }
    };

    const handleDeleteOrder = async (order) => {
        if (order.inProduction) {
            window.alert('You cannot delete this order as it is currently in production.');
            return;
        }
        if (window.confirm('Are you sure you want to delete this order?')) {
            try {
                await orderService.delete(order._id);
                fetchData();
            } catch (error) {
                setError(error.response?.data?.message || 'Failed to delete order');
            }
        }
    };

    const addItemToOrder = () => {
        if (!selectedProduct) return;
        const prod = products.find(p => p._id === selectedProduct);
        setNewOrder({
            ...newOrder,
            items: [...newOrder.items, {
                productId: prod._id,
                name: prod.name,
                quantity: selectedQty,
                price: prod.sellingPrice
            }]
        });
    };

    const createStandardOrder = async (e) => {
        e.preventDefault();
        if (newOrder.items.length === 0) {
            setError("Add at least one item");
            return;
        }
        try {
            const payload = {
                customerName: newOrder.customerName,
                orderId: newOrder.orderId,
                deliveryDate: newOrder.deliveryDate,
                items: newOrder.items.map(i => ({ 
                    productId: i.productId?._id || i.productId, 
                    quantity: i.quantity, 
                    price: i.price 
                }))
            };

            if (standardEditMode) {
                await orderService.update(standardCurrentId, payload);
            } else {
                await orderService.create(payload);
            }

            setShowStandardModal(false);
            setStandardEditMode(false);
            setStandardCurrentId(null);
            setNewOrder({ customerName: '', orderId: '', deliveryDate: '', items: [] });
            fetchData();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to save order');
        }
    };

    const handleEditStandard = (order) => {
        setStandardEditMode(true);
        setStandardCurrentId(order._id);
        setNewOrder({
            customerName: order.customerName,
            orderId: order.orderId,
            deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
            items: order.items.map(it => ({
                productId: it.productId?._id || it.productId,
                name: it.productId?.name || it.name,
                quantity: it.quantity,
                price: it.price
            })),
            status: order.status
        });
        setShowStandardModal(true);
    };



    const openInvoiceModal = (order) => {
        setInvoiceOrder(order);
        setShowInvoiceModal(true);
        setInvoiceConfig({ 
            gstType: 'none', 
            gstRate: 18,
            extraCosts: [],
            notes: ''
        });
    };

    const confirmGenerateInvoice = async () => {
        try {
            const invoiceNumber = 'INV-' + Date.now();
            const extraTotal = invoiceConfig.extraCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
            let subTotal = (invoiceOrder.totalAmount || (invoiceOrder.items ? invoiceOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0) : 0)) + extraTotal;
            subTotal = Math.round((subTotal + Number.EPSILON) * 10000) / 10000;
            let cgst = 0, sgst = 0, igst = 0;

            if (invoiceConfig.gstType === 'intra-state') {
                cgst = Math.round(((subTotal * (invoiceConfig.gstRate / 2)) / 100 + Number.EPSILON) * 10000) / 10000;
                sgst = Math.round(((subTotal * (invoiceConfig.gstRate / 2)) / 100 + Number.EPSILON) * 10000) / 10000;
            } else if (invoiceConfig.gstType === 'inter-state') {
                igst = Math.round(((subTotal * invoiceConfig.gstRate) / 100 + Number.EPSILON) * 10000) / 10000;
            }
            const totalAmount = Math.round((subTotal + cgst + sgst + igst + Number.EPSILON) * 10000) / 10000;

            await invoiceService.create({
                orderId: invoiceOrder._id,
                orderModel: 'Order',
                items: (invoiceOrder.items || []).map(i => ({
                    name: i.productId?.name || i.name || 'Item',
                    quantity: i.quantity || 0,
                    price: i.price || 0,
                    total: (i.price || 0) * (i.quantity || 0)
                })),
                extraCosts: invoiceConfig.extraCosts,
                notes: invoiceConfig.notes
            });
            setShowInvoiceModal(false);
            setInvoiceOrder(null);
            alert(`Invoice Generated: ${invoiceNumber}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Error generating invoice');
        }
    };

    // Filter Logic
    const filteredOrders = orders.filter(order => 
        (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.orderId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );


    const statusColors = {
        'Draft': 'badge-warning',
        'Approved': 'badge-primary',
        'In Production': 'badge-primary',
        'Completed': 'badge-success',
        'Delivered': 'badge-success',
        'Pending': 'badge-warning'
    };

    return (
        <div className="animate-fade-in">
            {error && <ErrorMessage message={error} onClose={() => setError('')} />}
            
            <div className="page-header">
                <h1>Order Management</h1>
                <div className="header-actions">
                    <div className="search-container" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="form-control"
                            style={{ paddingLeft: '40px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    </div>
                    {(!['Operator', 'Worker', 'Helper', 'Labour'].includes(userInfo?.role)) && (
                        <button className="btn btn-primary" onClick={() => {
                                setStandardEditMode(false);
                                setStandardCurrentId(null);
                                setNewOrder({ customerName: '', deliveryDate: '', items: [], status: 'Draft' });
                                setShowStandardModal(true);
                        }}>
                            <Plus size={18} style={{ marginRight: '8px' }} /> New Order
                        </button>
                    )}
                </div>
            </div>


                <div className="glass-card table-container">
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Items</th>
                                <th>Target Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order._id}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {order.orderId || order._id.substring(order._id.length - 6).toUpperCase()}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{order.customerName}
                                        <div>{order.orderTitle && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{order.orderTitle}</span>}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            {order.items.map((item, idx) => (
                                                <div key={idx} style={{ color: 'var(--text-secondary)' }}>
                                                    {item.quantity}x {item.productId?.name || 'Unknown'}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td>{new Date(order.deliveryDate).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`badge ${statusColors[order.status]}`}>{order.status}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <button className="btn btn-accent" style={{ padding: '0.25rem 0.5rem', marginRight: '5px' }} onClick={() => openInvoiceModal(order)} title="Generate Invoice">
                                                <FileText size={16} />
                                            </button>
                                            <select
                                                className="form-control"
                                                style={{ width: '130px', padding: '0.4rem', fontSize: '0.8rem' }}
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                disabled={['Operator', 'Worker', 'Helper', 'Labour'].includes(userInfo?.role)}
                                            >
                                                <option value="Draft">Draft</option>
                                                <option value="Approved">Approve</option>
                                                <option value="In Production" disabled>In Production</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Delivered">Delivered</option>
                                            </select>
                                            <button className="btn" style={{ padding: '0.25rem 0.5rem', color: 'var(--primary-color)', background: 'rgba(99, 102, 241, 0.1)' }} onClick={() => handleEditStandard(order)} title="Edit Order">
                                                <Edit2 size={16} />
                                            </button>
                                            {userInfo?.role === 'Owner' && (
                                                <button className="btn" style={{ padding: '0.25rem 0.5rem', color: 'var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }} onClick={() => handleDeleteOrder(order)} title="Delete Order">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

            {/* Modals */}
            {showStandardModal && (
                <div className="modal-overlay">
                    <div className="glass-card modal-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>{standardEditMode ? 'Edit Order' : 'Create New Order'}</h2>
                            <button className="btn" onClick={() => setShowStandardModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={createStandardOrder}>
                            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Customer Name</label>
                                    <input className="form-control" list="cust-opt" value={newOrder.customerName} onChange={e => setNewOrder({...newOrder, customerName: e.target.value})} required />
                                    <datalist id="cust-opt">
                                        {[...new Set(orders.map(o => o.customerName))].map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Delivery Date</label>
                                    <input type="date" className="form-control" value={newOrder.deliveryDate} onChange={e => setNewOrder({...newOrder, deliveryDate: e.target.value})} required />
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <h4>Add Items</h4>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">Product</label>
                                        <select className="form-control" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
                                            <option value="">-- Select Product --</option>
                                            {products.map(p => <option key={p._id} value={p._id}>{p.name} (₹{p.sellingPrice?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 4 })})</option>)}
                                        </select>
                                    </div>
                                    <div style={{ width: '80px' }}>
                                        <label className="form-label">Qty</label>
                                        <input type="number" min="0.0001" step="0.0001" className="form-control" value={selectedQty} onChange={e => setSelectedQty(Number(e.target.value))} />
                                    </div>
                                    <button type="button" className="btn btn-accent" onClick={addItemToOrder}>Add</button>
                                </div>
                                {newOrder.items.length > 0 && (
                                    <table className="glass-table" style={{ fontSize: '0.8rem' }}>
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Qty</th>
                                                <th>Total</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {newOrder.items.map((it, idx) => (
                                                <tr key={idx}>
                                                    <td>{it.name}</td>
                                                    <td>{it.quantity}</td>
                                                    <td>₹{(it.price * it.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                                    <td>
                                                        <button type="button" className="btn" style={{ padding: '2px', color: 'var(--danger-color)' }} onClick={() => {
                                                            const newItems = [...newOrder.items];
                                                            newItems.splice(idx, 1);
                                                            setNewOrder({...newOrder, items: newItems});
                                                        }}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} onClick={() => setShowStandardModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Save Order</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}



            {/* Invoice Generation Modal */}
            {showInvoiceModal && invoiceOrder && (
                <div className="modal-overlay">
                    <div className="glass-card modal-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>Generate Invoice</h2>
                            <button className="btn" onClick={() => setShowInvoiceModal(false)}><X size={20} /></button>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                Order Total: <strong style={{ color: 'var(--text-primary)' }}>₹{(invoiceOrder.totalAmount || (invoiceOrder.items ? invoiceOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0) : 0))?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</strong>
                            </p>
                            
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    GST System (Indian)
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {invoiceConfig.gstType === 'none' ? 'Plain Bill' : (invoiceConfig.gstType === 'intra-state' ? 'Within State' : 'Other State')}
                                    </span>
                                </label>
                                <select 
                                    className="form-control"
                                    value={invoiceConfig.gstType}
                                    onChange={(e) => setInvoiceConfig({...invoiceConfig, gstType: e.target.value})}
                                    style={{ marginBottom: '1rem' }}
                                >
                                    <option value="none">No GST (Cash/Estimate)</option>
                                    <option value="intra-state">Inside my State (CGST + SGST)</option>
                                    <option value="inter-state">Outside my State (IGST)</option>
                                </select>
                            </div>

                            {invoiceConfig.gstType !== 'none' && (
                                <div className="form-group">
                                    <label className="form-label">GST Rate (%)</label>
                                    <select 
                                        className="form-control"
                                        value={invoiceConfig.gstRate}
                                        onChange={(e) => setInvoiceConfig({...invoiceConfig, gstRate: Number(e.target.value)})}
                                    >
                                        <option value={5}>5%</option>
                                        <option value={12}>12%</option>
                                        <option value={18}>18%</option>
                                        <option value={28}>28%</option>
                                    </select>
                                    {invoiceConfig.gstType === 'intra-state' && (
                                        <small style={{ display: 'block', marginTop: '5px', color: 'var(--text-secondary)' }}>
                                            CGST: {invoiceConfig.gstRate/2}% + SGST: {invoiceConfig.gstRate/2}%
                                        </small>
                                    )}
                                </div>
                            )}

                            {/* Extra Costs Section */}
                            <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Additional Charges (Extra Costs)</h4>
                                {invoiceConfig.extraCosts.map((cost, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <input 
                                            placeholder="Description (e.g. Shipping)" 
                                            className="form-control" 
                                            value={cost.description}
                                            onChange={e => {
                                                const newCosts = [...invoiceConfig.extraCosts];
                                                newCosts[idx].description = e.target.value;
                                                setInvoiceConfig({...invoiceConfig, extraCosts: newCosts});
                                            }}
                                        />
                                        <input 
                                            type="number" step="0.0001" 
                                            placeholder="Amount" 
                                            className="form-control" 
                                            style={{ width: '120px' }}
                                            value={cost.amount}
                                            onChange={e => {
                                                const newCosts = [...invoiceConfig.extraCosts];
                                                newCosts[idx].amount = Number(e.target.value);
                                                setInvoiceConfig({...invoiceConfig, extraCosts: newCosts});
                                            }}
                                        />
                                        <button className="btn" style={{ padding: '0 10px', color: 'var(--danger-color)' }} onClick={() => {
                                            const newCosts = invoiceConfig.extraCosts.filter((_, i) => i !== idx);
                                            setInvoiceConfig({...invoiceConfig, extraCosts: newCosts});
                                        }}><X size={16}/></button>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-accent" style={{ fontSize: '0.8rem', padding: '5px 12px' }} onClick={() => setInvoiceConfig({...invoiceConfig, extraCosts: [...invoiceConfig.extraCosts, { description: '', amount: 0 }]})}>
                                    + Add Extra Cost
                                </button>
                            </div>

                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label className="form-label">Notes / Terms</label>
                                <textarea 
                                    className="form-control" 
                                    rows="2" 
                                    placeholder="Add any specific notes for this invoice..."
                                    value={invoiceConfig.notes}
                                    onChange={e => setInvoiceConfig({...invoiceConfig, notes: e.target.value})}
                                ></textarea>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                            <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={confirmGenerateInvoice}>
                                <FileText size={16} style={{ marginRight: '8px' }} /> Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
