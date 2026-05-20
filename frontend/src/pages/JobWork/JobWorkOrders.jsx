import { useState, useEffect } from 'react';
import ErrorMessage from '../../components/ErrorMessage';
import jobWorkService from '../../services/jobWorkService';
import clientService from '../../services/clientService';
import invoiceService from '../../services/invoiceService';

const materialService = { getAll: jobWorkService.getMaterials };
const partService = { getAll: jobWorkService.getParts };
const bomService = { getAll: jobWorkService.getBOMItems, getByProduct: async (id) => jobWorkService.getBOMItems({ parentPartId: id, productId: id, jobWorkOrderId: id }) };

import { ShoppingCart, Edit, Plus, Trash2, Search, Package, User, IndianRupee, Calendar, FileText, ChevronRight, X, Clock, CheckCircle2, Edit2, Briefcase, Download, RefreshCw } from 'lucide-react';

const JobWorkOrders = () => {
    // Shared State
    const [activeTab, setActiveTab] = useState('JobWork'); // 'Standard' or 'JobWork'
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

    // Job Work Orders State
    const [jobWorkOrders, setJobWorkOrders] = useState([]);
    const [clients, setClients] = useState([]);
    const [masterMaterials, setMasterMaterials] = useState([]);
    const [masterParts, setMasterParts] = useState([]);
    const [showJobModal, setShowJobModal] = useState(false);
    const [jobEditMode, setJobEditMode] = useState(false);
    const [standardEditMode, setStandardEditMode] = useState(false);
    const [standardCurrentId, setStandardCurrentId] = useState(null);
    const [currentJobId, setCurrentJobId] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const [invoiceConfig, setInvoiceConfig] = useState({
        gstType: 'none',
        gstRate: 18,
        extraCosts: [], // { description: '', amount: 0 }
        notes: ''
    });
    const [jobFormData, setJobFormData] = useState({
        customerName: '',
        clientName: '',
        clientId: '',
        orderTitle: '',
        isClientMaterial: true,
        deadline: '',
        jobType: '',
        totalAmount: 0,
        materials: [],
        materialName: '',
        materialQuantity: 1,
        unit: 'pcs',
        outputProduct: '',
        outputPart: ''
    });

    const [allBoms, setAllBoms] = useState([]);
    const [currentMaterial, setCurrentMaterial] = useState({ materialName: '', quantity: 1, unit: 'pcs' });

    const fetchData = async () => {
        try {
            if (activeTab === 'Standard') {
                const [ordersData, productsData] = await Promise.all([
                    orderService.getAll().catch(() => []),
                    productService.getAll().catch(() => [])
                ]);
                setOrders(ordersData || []);
                setProducts((productsData || []).filter(p => p.isActive));
            } else {
                const [jwData, clientsData, matsData, partsData, bomsData, jwProductsData] = await Promise.all([
                    jobWorkService.getAll().catch(() => []),
                    clientService.getAll().catch(() => []),
                    materialService.getAll().catch(() => []),
                    partService.getAll().catch(() => []),
                    bomService.getAll().catch(() => []),
                    jobWorkService.getProducts().catch(() => [])
                ]);
                setJobWorkOrders(jwData || []);
                setClients(clientsData || []);
                setMasterMaterials(matsData || []);
                setMasterParts(partsData || []);
                setAllBoms(bomsData || []);
                setProducts((jwProductsData || []).filter(p => p.isActive !== false));
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

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

    // --- Job Work Handlers ---
    const handleJobInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setJobFormData(prev => ({
            ...prev,
            [name]: val,
            ...(name === 'isClientMaterial' && val === true ? { materialName: '' } : {})
        }));
    };

    const submitJobHandler = async (e) => {
        e.preventDefault();
        try {
            let finalClientId = jobFormData.clientId;
            if (!finalClientId && jobFormData.clientName) {
                const newClient = await clientService.create({ name: jobFormData.clientName });
                finalClientId = newClient._id;
            }
            if (!finalClientId) return setError("Please select or enter a client name");

            const orderPayload = {
                clientId: finalClientId,
                orderTitle: jobFormData.orderTitle,
                materials: jobFormData.materials.length > 0 ? jobFormData.materials : [{ 
                    materialName: jobFormData.materialName, 
                    quantity: Number(jobFormData.materialQuantity) || 0, 
                    unit: jobFormData.unit 
                }],
                jobType: jobFormData.jobType,
                totalAmount: Number(jobFormData.totalAmount),
                isClientMaterial: jobFormData.isClientMaterial,
                deadline: jobFormData.deadline || undefined,
                outputProduct: jobFormData.outputProduct || undefined,
                outputPart: jobFormData.outputPart || undefined
            };

            if (jobEditMode) {
                await jobWorkService.update(currentJobId, orderPayload);
            } else {
                await jobWorkService.create(orderPayload);
            }
            setShowJobModal(false);
            setJobEditMode(false);
            fetchData();
        } catch (error) {
            setError(error.response?.data?.message || "Failed to save job order");
        }
    };

    const handleSyncToCatalog = async (id) => {
        try {
            const res = await jobWorkService.syncCatalog(id);
            alert(res.message);
            fetchData();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to sync with master catalog');
        }
    };

    const handleImportBOM = async (targetId) => {
        if (!targetId) return;
        try {
            const bomItems = await bomService.getByProduct(targetId);
            if (bomItems.length === 0) {
                alert("No BOM items found for this selection.");
                return;
            }

            const newMaterials = bomItems.map(item => ({
                materialName: item.materialId?.name || item.partId?.name || 'Unknown',
                quantity: item.qtyPerUnit,
                unit: item.unit || 'pcs'
            }));

            setJobFormData(prev => ({
                ...prev,
                materials: [...prev.materials, ...newMaterials]
            }));
        } catch (error) {
            console.error(error);
            setError('Failed to import BOM items');
        }
    };

    const handleJobEdit = (order) => {
        setJobEditMode(true);
        setCurrentJobId(order._id);
        const savedMaterials = order.materials && order.materials.length > 0 
            ? order.materials 
            : (order.materialName ? [{ materialName: order.materialName, quantity: order.materialQuantity, unit: order.unit || 'pcs' }] : []);
            
        setJobFormData({
            clientId: order.clientId?._id || order.clientId,
            clientName: order.clientId?.name || '',
            orderTitle: order.orderTitle || '',
            materials: savedMaterials,
            materialName: '',
            materialQuantity: '',
            unit: 'pcs',
            jobType: order.jobType || '',
            totalAmount: order.totalAmount || '',
            isClientMaterial: order.isClientMaterial,
            deadline: order.deadline ? new Date(order.deadline).toISOString().split('T')[0] : '',
            outputProduct: order.outputProduct?._id || order.outputProduct || '',
            outputPart: order.outputPart?._id || order.outputPart || '',
        });
        setCurrentMaterial({ materialName: '', quantity: 1, unit: 'pcs' });
        setShowJobModal(true);
    };

    const handleJobDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this job order?')) {
            try {
                await jobWorkService.delete(id);
                fetchData();
            } catch (error) {
                setError('Failed to delete job order');
            }
        }
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
                clientId: activeTab === 'Standard' ? undefined : (invoiceOrder.clientId?._id || invoiceOrder.clientId),
                customerName: activeTab === 'Standard' ? invoiceOrder.customerName : (invoiceOrder.clientId?.name || ''),
                invoiceNumber,
                subTotal,
                totalAmount,
                gstType: invoiceConfig.gstType,
                gstRate: invoiceConfig.gstRate,
                cgst,
                sgst,
                igst,
                orderModel: activeTab === 'Standard' ? 'Order' : 'JobWorkOrder',
                items: (invoiceOrder.items || []).map(i => ({
                    name: i.productId?.name || i.name || 'Item',
                    quantity: i.quantity || 0,
                    price: i.price || 0,
                    total: (i.price || 0) * (i.quantity || 0)
                })),
                materials: (invoiceOrder.materials || []).map(m => ({
                    materialName: m.materialName || 'Material',
                    quantity: m.quantity || 0,
                    unit: m.unit || 'units'
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

    const filteredJobOrders = jobWorkOrders.filter(order => {
        const s = searchTerm.toLowerCase();
        const clientMatch = (order.clientId?.name || '').toLowerCase().includes(s);
        const titleMatch = (order.orderTitle || '').toLowerCase().includes(s);
        const typeMatch = (order.jobType || '').toLowerCase().includes(s);
        const legacyMatMatch = (order.materialName || '').toLowerCase().includes(s);
        
        // Search in materials array
        const arrayMatMatch = order.materials?.some(m => 
            (m.materialName || '').toLowerCase().includes(s)
        );

        return clientMatch || titleMatch || typeMatch || legacyMatMatch || arrayMatMatch;
    });

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
                            placeholder={`Search ${activeTab === 'Standard' ? 'orders' : 'job orders'}...`}
                            className="form-control"
                            style={{ paddingLeft: '40px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    </div>
                    {(!['Operator', 'Worker', 'Helper', 'Labour'].includes(userInfo?.role)) && (
                        <button className="btn btn-primary" onClick={() => {
                            if (activeTab === 'Standard') {
                                setStandardEditMode(false);
                                setStandardCurrentId(null);
                                setNewOrder({ customerName: '', deliveryDate: '', items: [], status: 'Draft' });
                                setShowStandardModal(true);
                            } else {
                                setJobEditMode(false);
                                setJobFormData({ clientId: '', clientName: '', orderTitle: '', materials: [], materialName: '', materialQuantity: '', unit: 'pcs', jobType: '', totalAmount: '', isClientMaterial: true, deadline: '', outputProduct: '', outputPart: '' });
                                setCurrentMaterial({ materialName: '', quantity: 1, unit: 'pcs' });
                                setShowJobModal(true);
                            }
                        }}>
                            <Plus size={18} style={{ marginRight: '8px' }} /> New {activeTab === 'Standard' ? 'Order' : 'Job'}
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs hidden in JobWork module */}

            {activeTab === 'Standard' ? (
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
            ) : (
                <div className="glass-card table-container">
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>Client & Title</th>
                                <th>Process Details</th>
                                <th>Quantity</th>
                                <th>Deadline</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredJobOrders.map(order => (
                                <tr key={order._id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{order.clientId?.name || 'Unknown'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.orderTitle || 'No Title'}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Package size={14} className="text-primary" />
                                            <span>
                                                {order.jobType}: {order.materials?.length > 0 ? order.materials.map(m => m.materialName).join(', ') : order.materialName}
                                            </span>
                                        </div>
                                        {order.isClientMaterial && <span className="badge badge-info" style={{ marginTop: '5px', fontSize: '10px', display: 'block', width: 'fit-content' }}>Client Material</span>}
                                    </td>
                                    <td>
                                        {order.materials?.length > 0 
                                            ? order.materials.reduce((acc, m) => acc + m.quantity, 0) + ' items'
                                            : `${order.materialQuantity} ${order.unit}`
                                        }
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem', color: new Date(order.deadline) < new Date() && order.status !== 'Completed' ? 'var(--danger-color)' : 'inherit' }}>
                                            {order.deadline ? new Date(order.deadline).toLocaleDateString() : 'No Deadline'}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, color: 'var(--accent-color)' }}>₹{(order.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                    <td>
                                        <span className={`badge ${order.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                                            {order.status === 'Pending' ? <Clock size={12} style={{ marginRight: '5px' }} /> : <CheckCircle2 size={12} style={{ marginRight: '5px' }} />}
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <button 
                                                className="btn" 
                                                style={{ 
                                                    padding: '6px 12px', 
                                                    fontSize: '0.8rem', 
                                                    background: (order.outputProduct || order.outputPart) ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                                                    color: (order.outputProduct || order.outputPart) ? 'white' : 'var(--text-secondary)',
                                                    cursor: (order.outputProduct || order.outputPart) ? 'pointer' : 'not-allowed',
                                                    border: '1px solid ' + ((order.outputProduct || order.outputPart) ? 'transparent' : 'rgba(255,255,255,0.1)')
                                                }} 
                                                onClick={() => (order.outputProduct || order.outputPart) && handleSyncToCatalog(order._id)}
                                                title={(order.outputProduct || order.outputPart) ? 'Sync rate to master catalog' : 'Link to a product/part first to sync'}
                                            >
                                                <RefreshCw size={14} style={{ marginRight: '5px' }} className={(order.outputProduct || order.outputPart) ? '' : 'opacity-50'} /> 
                                                {(order.outputProduct || order.outputPart) ? 'Sync to Master' : 'Link Required'}
                                            </button>
                                            <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openInvoiceModal(order)}>
                                                <FileText size={14} style={{ marginRight: '5px' }} /> Invoice
                                            </button>
                                            <button className="btn" style={{ padding: '6px', color: 'var(--primary-color)', background: 'rgba(99, 102, 241, 0.1)' }} onClick={() => handleJobEdit(order)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn" style={{ padding: '6px', color: 'var(--danger-color)', background: 'rgba(239, 68, 68, 0.1)' }} onClick={() => handleJobDelete(order._id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredJobOrders.length === 0 && (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No job orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

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

            {showJobModal && (
                <div className="modal-overlay">
                    <div className="glass-card modal-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>{jobEditMode ? 'Edit Job Order' : 'Create Job Order'}</h2>
                            <button className="btn" onClick={() => setShowJobModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={submitJobHandler}>
                            <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                <input type="checkbox" name="isClientMaterial" checked={jobFormData.isClientMaterial} onChange={handleJobInputChange} id="checkCM" />
                                <label htmlFor="checkCM" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>Client Provided Material</label>
                            </div>
                            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Client Selection</label>
                                    <select name="clientId" value={jobFormData.clientId} onChange={handleJobInputChange} className="form-control">
                                        <option value="">-- New Client --</option>
                                        {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    {!jobFormData.clientId && <input type="text" name="clientName" placeholder="Client Name" value={jobFormData.clientName} onChange={handleJobInputChange} className="form-control" style={{ marginTop: '10px' }} required />}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Order Title / PO</label>
                                    <input type="text" name="orderTitle" value={jobFormData.orderTitle} onChange={handleJobInputChange} className="form-control" placeholder="e.g. 500 units of Shaft Polishing" />
                                </div>
                            </div>

                            {!hasModule('materials') && !hasModule('parts') && (
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--primary-color)' }}>Quick Job Details</h4>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 2 }}>
                                            <label className="form-label">Product / Job Item</label>
                                            <select 
                                                name="materialName" 
                                                value={jobFormData.materialName} 
                                                onChange={(e) => {
                                                    const selectedName = e.target.value;
                                                    const prod = products.find(p => p.name === selectedName);
                                                    setJobFormData(prev => ({
                                                        ...prev,
                                                        materialName: selectedName,
                                                        unit: prod?.unit || prev.unit || 'pcs'
                                                    }));
                                                }} 
                                                className="form-control"
                                                required
                                            >
                                                <option value="">-- Select Product --</option>
                                                {products.map(p => (
                                                    <option key={p._id} value={p.name}>
                                                        {p.name} ({p.productCode})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ width: '100px' }}>
                                            <label className="form-label">Qty</label>
                                            <input type="number" step="0.0001" min="0.0001" name="materialQuantity" value={jobFormData.materialQuantity} onChange={handleJobInputChange} className="form-control" />
                                        </div>
                                        <div style={{ width: '100px' }}>
                                            <label className="form-label">Unit</label>
                                            <select name="unit" value={jobFormData.unit} onChange={handleJobInputChange} className="form-control">
                                                <option value="pcs">pcs</option><option value="kg">kg</option><option value="mtr">mtr</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(hasModule('materials') || hasModule('parts')) && (
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary-color)' }}>Materials / Parts Tracker</h4>
                                        {hasModule('bom') && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quick Import:</label>
                                                <select 
                                                    className="form-control" 
                                                    style={{ width: '200px', fontSize: '0.85rem', padding: '4px 8px', height: 'auto' }}
                                                    value=""
                                                    onChange={e => handleImportBOM(e.target.value)}
                                                >
                                                    <option value="">-- Import from BOM --</option>
                                                    <optgroup label="Products">
                                                        {products.map(p => {
                                                            const hasBom = allBoms.some(b => b.productId === p._id || b.productId?._id === p._id);
                                                            return hasBom ? <option key={p._id} value={p._id}>{p.name}</option> : null;
                                                        })}
                                                    </optgroup>
                                                    <optgroup label="Sub-Assembly Parts">
                                                        {masterParts.map(p => {
                                                            const hasBom = allBoms.some(b => b.parentPartId === p._id || b.parentPartId?._id === p._id);
                                                            return hasBom ? <option key={p._id} value={p._id}>{p.name}</option> : null;
                                                        })}
                                                    </optgroup>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
                                    <div style={{ flex: 2 }}>
                                        <label className="form-label">Select Material/Part</label>
                                        <select 
                                            className="form-control"
                                            value={masterMaterials.find(m => m.name === currentMaterial.materialName)?._id ? `material:${masterMaterials.find(m => m.name === currentMaterial.materialName)._id}` : masterParts.find(p => p.name === currentMaterial.materialName)?._id ? `part:${masterParts.find(p => p.name === currentMaterial.materialName)._id}` : ''}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (!val) {
                                                    setCurrentMaterial({ ...currentMaterial, materialName: '', unit: 'pcs' });
                                                    return;
                                                }
                                                const [type, id] = val.split(':');
                                                const item = type === 'material' ? masterMaterials.find(m => m._id === id) : masterParts.find(p => p._id === id);
                                                if (item) {
                                                    setCurrentMaterial({ ...currentMaterial, materialName: item.name, unit: item.unit });
                                                }
                                            }}
                                        >
                                            <option value="">-- Choose from Inventory --</option>
                                            <optgroup label="Materials">
                                                {masterMaterials.map(m => <option key={m._id} value={`material:${m._id}`}>{m.name} ({m.materialCode})</option>)}
                                            </optgroup>
                                            <optgroup label="Sub-Assembly Parts">
                                                {masterParts.map(p => <option key={p._id} value={`part:${p._id}`}>{p.name} ({p.partCode})</option>)}
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div style={{ width: '80px' }}>
                                        <label className="form-label">Qty</label>
                                        <input type="number" step="0.0001" min="0.0001" value={currentMaterial.quantity} onChange={e => setCurrentMaterial({...currentMaterial, quantity: Number(e.target.value)})} className="form-control" />
                                    </div>
                                    <div style={{ width: '100px' }}>
                                        <label className="form-label">Unit</label>
                                        <select value={currentMaterial.unit} onChange={e => setCurrentMaterial({...currentMaterial, unit: e.target.value})} className="form-control">
                                            <option value="pcs">pcs</option><option value="kg">kg</option><option value="mtr">mtr</option>
                                        </select>
                                    </div>
                                    <button type="button" className="btn btn-accent" onClick={() => {
                                        if(currentMaterial.materialName){
                                            setJobFormData({...jobFormData, materials: [...jobFormData.materials, currentMaterial]});
                                            setCurrentMaterial({ materialName: '', quantity: 1, unit: 'pcs' });
                                        }
                                    }}>Add</button>
                                </div>
                                {jobFormData.materials.length > 0 && (
                                    <table className="glass-table" style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }}>
                                        <tbody>
                                            {jobFormData.materials.map((it, idx) => (
                                                <tr key={idx}>
                                                    <td>{it.materialName}</td>
                                                    <td>{it.quantity} {it.unit}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button type="button" className="btn" style={{ padding: '2px', color: 'var(--danger-color)' }} onClick={() => {
                                                            const newMats = [...jobFormData.materials];
                                                            newMats.splice(idx, 1);
                                                            setJobFormData({...jobFormData, materials: newMats});
                                                        }}><X size={14}/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            )}

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--primary-color)' }}>Catalog Integration (Output)</h4>
                                <div className="form-group">
                                    <label className="form-label">Link to Master Catalog (to sync price/qty later)</label>
                                    <select 
                                        className="form-control"
                                        value={jobFormData.outputProduct ? `product:${jobFormData.outputProduct}` : jobFormData.outputPart ? `part:${jobFormData.outputPart}` : ''}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (!val) {
                                                setJobFormData({ ...jobFormData, outputProduct: '', outputPart: '' });
                                                return;
                                            }
                                            const [type, id] = val.split(':');
                                            setJobFormData({ 
                                                ...jobFormData, 
                                                outputProduct: type === 'product' ? id : '', 
                                                outputPart: type === 'part' ? id : '' 
                                            });
                                        }}
                                    >
                                        <option value="">-- No Catalog Link --</option>
                                        <optgroup label="Products">
                                            {products.map(p => <option key={p._id} value={`product:${p._id}`}>{p.name} ({p.productCode})</option>)}
                                        </optgroup>
                                        <optgroup label="Finished Parts">
                                            {masterParts.map(p => <option key={p._id} value={`part:${p._id}`}>{p.name} ({p.partCode})</option>)}
                                        </optgroup>
                                    </select>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        Link this job to an existing Product or Part to enable "Sync to Master Catalog" functionality.
                                    </p>
                                </div>
                            </div>

                            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Job Process</label>
                                    <input type="text" name="jobType" value={jobFormData.jobType} onChange={handleJobInputChange} className="form-control" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Total Cost (₹)</label>
                                    <input type="number" step="0.0001" min="0" name="totalAmount" value={jobFormData.totalAmount} onChange={handleJobInputChange} className="form-control" required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deadline</label>
                                <input type="date" name="deadline" value={jobFormData.deadline} onChange={handleJobInputChange} className="form-control" />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} onClick={() => setShowJobModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Confirm</button>
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

export default JobWorkOrders;
