import productionService from '../services/productionService';
import orderService from '../services/orderService';
import materialService from '../services/materialService';
import jobWorkService from '../services/jobWorkService';
import bomService from '../services/bomService';
import productService from '../services/productService';
import partService from '../services/partService';
import machineService from '../services/machineService';
import employeeService from '../services/employeeService';
import { Hammer, Play, CheckCircle, Edit, Trash2, Printer, X, Monitor, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import ErrorMessage from '../components/ErrorMessage';

const Production = () => {
    const [jobs, setJobs] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [parts, setParts] = useState([]);
    const [machines, setMachines] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [updateModal, setUpdateModal] = useState({ show: false, jobId: null, currentJob: null, qty: 0 });
    const [printingJob, setPrintingJob] = useState(null);
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // For New Job
    const initialJobState = {
        jobId: '', orderId: '', productId: '', partId: '', plannedQty: 1, endDate: '', priority: 'Normal', machineId: '', operatorId: ''
    };
    const [newJob, setNewJob] = useState(initialJobState);
    const [isEdit, setIsEdit] = useState(false);
    const [editJobId, setEditJobId] = useState(null);

    const [bomRequirements, setBomRequirements] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            const config = { withCredentials: true };
            const [jobsData, ordersData, jobWorkData, invData, partsData, productsData, machinesData, employeesData] = await Promise.all([
                productionService.getAll().catch(() => []), 
                orderService.getAll().catch(() => []),
                jobWorkService.getAll().catch(() => []),
                materialService.getAll().catch(() => []),
                partService.getAll().catch(() => []),
                productService.getAll().catch(() => []),
                machineService.getMachines().catch(() => []),
                employeeService.getAll().catch(() => [])
            ]);

            // Show all jobs to all roles in the workspace
            setJobs(jobsData);
            setParts(partsData);
            setProducts(productsData);
            setMachines(machinesData);
            setEmployees(employeesData);
            
            // Combine orders and mark them
            const combinedOrders = [
                ...ordersData.filter(o => o.status === 'Approved' || o.status === 'In Production').map(o => ({ ...o, _type: 'Order' })),
                ...jobWorkData.filter(j => j.status === 'Pending' || j.status === 'In Progress').map(j => ({ ...j, _type: 'JobWorkOrder' }))
            ];
            setOrders(combinedOrders);
            // Combine materials and parts for a unified inventory check
            const unifiedInventory = [
                ...invData.map(m => ({ ...m, _invType: 'Material' })),
                ...partsData.map(p => ({ ...p, _invType: 'Part' }))
            ];
            setInventory(unifiedInventory);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchBOM = async (targetId, isPart = false) => {
        try {
            const data = await bomService.getByProduct(targetId).catch(() => []);
            setBomRequirements(data || []);
        } catch (error) {
            console.error('BOM fetch error', error);
            setBomRequirements([]);
        }
    };

    useEffect(() => {
        fetchData();
        // Check for navigation state (e.g. from BOM page)
        const state = window.history.state?.usr;
        if (state?.productId || state?.partId) {
            setNewJob(prev => ({
                ...prev,
                productId: state.productId || '',
                partId: state.partId || '',
                plannedQty: 1
            }));
            fetchBOM(state.productId || state.partId);
            setShowModal(true);
        }
    }, []);

    const createJob = async (e) => {
        e.preventDefault();
        
        // Skip validation if creating a manual assembly job without an order
        if (!newJob.orderId && !newJob.productId && !newJob.partId) {
            setError('Please select a Product or Part to produce');
            return;
        }

        try {
            if (isEdit) {
                await productionService.updateJob(editJobId, newJob);
            } else {
                await productionService.create(newJob);
            }
            setShowModal(false);
            setNewJob(initialJobState);
            setIsEdit(false);
            setEditJobId(null);
            fetchData();
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || 'Failed to create job');
        }
    };

    const startJob = async (id) => {
        try {
            await productionService.startJob(id);
            fetchData();
            alert('Job Started.');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to start job (Check inventory/BOM)');
        }
    };

    const submitProgress = async (e) => {
        e.preventDefault();
        try {
            const newTotalQty = updateModal.currentJob.producedQty + updateModal.qty;
            await productionService.updateProgress(updateModal.jobId, newTotalQty);

            if (newTotalQty >= updateModal.currentJob.plannedQty) {
                await productionService.completeJob(updateModal.jobId);
                alert('Job Completed!');
            }

            setUpdateModal({ show: false, jobId: null, currentJob: null, qty: 0 });
            fetchData();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update progress');
        }
    };

    const openEditModal = (job) => {
        setIsEdit(true);
        setEditJobId(job._id);
        setNewJob({
            jobId: job.jobId || '',
            orderId: job.orderId?._id || job.orderId || '',
            productId: job.productId?._id || job.productId || '',
            partId: job.partId?._id || job.partId || '',
            plannedQty: job.plannedQty || 1,
            endDate: job.endDate ? job.endDate.split('T')[0] : '',
            priority: job.priority || 'Normal',
            machineId: job.machineId?._id || job.machineId || '',
            operatorId: job.operatorId?._id || job.operatorId || ''
        });
        
        const targetId = job.productId?._id || job.productId || job.partId?._id || job.partId;
        if (targetId) {
            fetchBOM(targetId);
        } else if (job.orderId) {
            fetchBOM(job.orderId?._id || job.orderId); // For JobWorkOrder
        } else {
            setBomRequirements([]);
        }
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this job?')) {
            try {
                await productionService.delete(id);
                fetchData();
            } catch (error) {
                console.error(error);
                setError(error.response?.data?.message || 'Failed to delete job');
            }
        }
    };

    const handleOrderSelect = (e) => {
        const ordId = e.target.value;
        const order = orders.find(o => o._id === ordId);
        
        if (order) {
            if (order._type === 'JobWorkOrder') {
                const outputProdId = order.outputProduct?._id || order.outputProduct || '';
                const outputPartId = order.outputPart?._id || order.outputPart || '';
                
                setNewJob({
                    ...newJob,
                    orderId: ordId,
                    productId: outputProdId,
                    partId: outputPartId,
                    plannedQty: order.materialQuantity || 1,
                    jobType: order.jobType
                });
                
                const targetId = outputProdId || outputPartId;
                if (targetId) {
                    fetchBOM(targetId);
                } else {
                    setBomRequirements([]);
                }
            } else {
                const firstItem = order.items?.[0];
                const prodId = firstItem?.productId?._id || firstItem?.productId || '';
                
                setNewJob({
                    ...newJob,
                    orderId: ordId,
                    productId: prodId,
                    partId: '',
                    plannedQty: firstItem?.quantity || 1
                });
                
                if (prodId) fetchBOM(prodId);
            }
        } else {
            setNewJob({ ...newJob, orderId: ordId, productId: '', partId: '' });
            setBomRequirements([]);
        }
    };

    const handleItemSelect = (e) => {
        const val = e.target.value;
        if (!val) {
            setNewJob({ ...newJob, productId: '', partId: '' });
            setBomRequirements([]);
            return;
        }

        const [type, id] = val.split(':');
        const updatedJob = {
            ...newJob,
            productId: type === 'product' ? id : '',
            partId: type === 'part' ? id : ''
        };

        // Automate quantity if an order is selected
        if (newJob.orderId) {
            const order = orders.find(o => o._id === newJob.orderId);
            if (order) {
                if (order._type === 'Order') {
                    const item = order.items?.find(i => (i.productId?._id || i.productId) === id);
                    if (item) {
                        updatedJob.plannedQty = item.quantity;
                    }
                } else if (order._type === 'JobWorkOrder') {
                    // Check if selected item matches the JW output
                    const outputId = order.outputProduct?._id || order.outputProduct || order.outputPart?._id || order.outputPart;
                    if (outputId === id) {
                        updatedJob.plannedQty = order.materialQuantity || 1;
                    }
                }
            }
        }

        setNewJob(updatedJob);
        fetchBOM(id);
    };

    const handlePrint = async (job) => {
        try {
            // Priority: Product ID -> Part ID -> Job Work Order ID (embedded in orderId)
            const targetId = job.productId?._id || job.partId?._id || (job.orderModel === 'JobWorkOrder' ? (job.orderId?._id || job.orderId) : null);
            
            if (!targetId) {
                // If manual job with no parts/products, just print without BOM
                setPrintingJob({ ...job, bomRequirements: [] });
            } else {
                const bom = await bomService.getByProduct(targetId);
                setPrintingJob({ ...job, bomRequirements: bom });
            }

            setTimeout(() => {
                window.print();
                setPrintingJob(null);
            }, 500);
        } catch (error) {
            console.error(error);
            setError('Failed to prepare job card for printing');
        }
    };

    const filteredJobs = jobs.filter(job => 
        job.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.productId?.name && job.productId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.partId?.name && job.partId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.orderId?.customerName && job.orderId.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.orderId?.clientId?.name && job.orderId.clientId.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>Production Executions</h1>
                <div className="header-actions">
                    <div className="search-container" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            className="form-control"
                            style={{ paddingRight: '35px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>🔍</span>
                    </div>
                    {(!['Operator', 'Worker', 'Helper', 'Labour'].includes(userInfo?.role)) && (
                        <button className="btn btn-primary" onClick={() => {
                            setIsEdit(false);
                            setEditJobId(null);
                            setNewJob(initialJobState);
                            setBomRequirements([]);
                            setShowModal(true);
                        }}>
                            <Hammer size={18} style={{ marginRight: '8px' }} /> Schedule Job
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-card table-container">
                {(['Operator', 'Worker', 'Helper', 'Labour'].includes(userInfo?.role)) ? (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>Actionable Jobs</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>Start or update ongoing production work.</p>
                        
                        {filteredJobs.filter(j => j.status !== 'Completed').length > 0 ? 
                            filteredJobs.filter(j => j.status !== 'Completed').map(job => (
                                <div key={job._id} style={{ 
                                    background: (job.status === 'Started' || job.status === 'In Progress') ? 'rgba(82, 196, 26, 0.08)' : 'rgba(255,255,255,0.05)', 
                                    padding: '20px', 
                                    borderRadius: '12px', 
                                    border: (job.status === 'Started' || job.status === 'In Progress') ? '1px solid rgba(82, 196, 26, 0.3)' : '1px solid rgba(255,255,255,0.1)' 
                                }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0 }}>{job.jobId}</h3>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>{job.status}</span>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>
                                        {job.productId?.name || job.partId?.name || job.jobType || 'Standard Job'}
                                    </h4>
                                    <p style={{ margin: '2px 0', fontSize: '0.8rem', opacity: 0.7 }}>
                                        {job.productId ? `[PROD] ${job.productId.productCode}` : job.partId ? `[PART] ${job.partId.partCode}` : (job.orderId?.customerName || 'Custom Work')}
                                    </p>
                                    {job.machineId && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--accent-color)', marginTop: '4px' }}>
                                            <Monitor size={14} /> {job.machineId.name}
                                            {job.operatorId && <span style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}><User size={12} /> {job.operatorId.name}</span>}
                                        </div>
                                    )}
                                    {!job.machineId && job.operatorId && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            <User size={14} /> {job.operatorId.name}
                                        </div>
                                    )}
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', margin: '15px 0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span>Progress: {job.producedQty || 0} / {job.plannedQty || 0}</span>
                                        <span>{Math.round(((job.producedQty || 0) / (job.plannedQty || 1)) * 100)}%</span>
                                    </div>
                                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '10px', borderRadius: '5px', marginTop: '8px', overflow: 'hidden' }}>
                                        <div style={{ width: `${((job.producedQty || 0) / (job.plannedQty || 1)) * 100}%`, background: 'var(--primary-color)', height: '100%' }}></div>
                                    </div>
                                </div>
                                { (job.status === 'Planned' || job.status === 'Pending') && (
                                    <button 
                                        className="btn btn-accent" 
                                        style={{ width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}
                                        onClick={() => startJob(job._id)}
                                    >
                                        <Play size={18} style={{ marginRight: '8px' }} /> Start Production
                                    </button>
                                )}
                                {(job.status === 'Started' || job.status === 'In Progress') && (
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold' }}
                                        onClick={() => setUpdateModal({ show: true, jobId: job._id, currentJob: job, qty: 0 })}
                                    >
                                        <Edit size={18} style={{ marginRight: '8px' }} /> Update Production
                                    </button>
                                )}
                                {(job.status === 'Planned' || job.status === 'Pending') && (!['Operator', 'Worker', 'Helper', 'Labour'].includes(userInfo?.role)) && (
                                    <button 
                                        className="btn" 
                                        style={{ width: '100%', padding: '10px', fontSize: '1rem', marginTop: '10px', background: 'rgba(255,255,255,0.1)' }}
                                        onClick={() => openEditModal(job)}
                                    >
                                        <Edit size={16} style={{ marginRight: '8px' }} /> Edit Job
                                    </button>
                                )}
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                No active production jobs at the moment.
                            </div>
                        )}

                        {filteredJobs.filter(j => j.status === 'Completed').length > 0 && (
                            <div style={{ marginTop: '30px' }}>
                                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>Recently Completed</h3>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {filteredJobs.filter(j => j.status === 'Completed').slice(0, 5).map(job => (
                                        <div key={job._id} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{job.jobId}</span>
                                                <span style={{ marginLeft: '10px', fontSize: '0.85rem' }}>{job.productId?.name || job.partId?.name || job.jobType}</span>
                                            </div>
                                            <span style={{ color: 'var(--success-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                                                <CheckCircle size={14} style={{ marginRight: '5px' }} /> Completed
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>Job ID</th>
                                <th>Product/Part</th>
                                <th>Customer</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Progress</th>
                                <th>Est. Total Cost</th>
                                <th>Target Date</th>
                                <th>Completion Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredJobs.map(job => (
                                <tr key={job._id}>
                                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{job.jobId}</td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{job.productId?.name || job.partId?.name || job.jobType || 'Unknown'}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                            {job.productId ? `[PROD] ${job.productId.productCode}` : job.partId ? `[PART] ${job.partId.partCode}` : 'N/A'}
                                        </div>
                                        {job.machineId && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Monitor size={12} /> {job.machineId.name}
                                                {job.operatorId && <span style={{ marginLeft: '8px', opacity: 0.7, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}>{job.operatorId.name}</span>}
                                            </div>
                                        )}
                                        {!job.machineId && job.operatorId && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <User size={12} /> {job.operatorId.name}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        {job.orderId?.customerName || job.orderId?.clientId?.name || job.orderId?.name || 'N/A'}
                                        {job.orderId?.clientId && <span className="badge badge-info" style={{ marginLeft: '-5px', fontSize: '9px' }}>Job Work</span>}
                                    </td>
                                    <td>
                                        <span className={`badge ${job.priority === 'Critical' ? 'badge-danger pulse-danger' : job.priority === 'Urgent' ? 'badge-warning' : 'badge-info'}`}>
                                            {job.priority}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${job.status === 'Completed' ? 'badge-success' : (job.status === 'Started' || job.status === 'In Progress') ? 'badge-primary' : 'badge-warning'}`}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                            <div style={{ width: `${((job.producedQty || 0) / (job.plannedQty || 1)) * 100}%`, background: 'var(--primary-color)', height: '100%' }}></div>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                                            {job.producedQty || 0} / {job.plannedQty || 0}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, color: 'var(--accent-color)', fontSize: '0.85rem' }}>
                                        ₹{((job.productId?.standardCost || job.partId?.standardCost || 0) * (job.plannedQty || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                    </td>
                                    <td>{new Date(job.endDate).toLocaleDateString()}</td>
                                    <td>{job.actualEndDate ? new Date(job.actualEndDate).toLocaleDateString() : '-'}</td>
                                    <td>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {(job.status === 'Planned' || job.status === 'Pending') && (
                                                <>
                                                    <button className="btn btn-accent" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => startJob(job._id)}>
                                                        <Play size={14} style={{ marginRight: '4px' }} /> Start
                                                    </button>
                                                    {(!['Operator', 'Worker', 'Helper', 'Labour'].includes(userInfo?.role)) && (
                                                        <button className="btn" style={{ padding: '0.25rem 0.5rem', color: 'var(--text-secondary)' }} onClick={() => openEditModal(job)} title="Edit Job">
                                                            <Edit size={16} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {(job.status === 'Started' || job.status === 'In Progress') && (
                                                <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setUpdateModal({ show: true, jobId: job._id, currentJob: job, qty: 0 })}>
                                                    <Edit size={14} style={{ marginRight: '4px' }} /> Update
                                                </button>
                                            )}
                                            {job.status === 'Completed' && (
                                                <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}><CheckCircle size={16} style={{ marginRight: '4px' }} /> Done</span>
                                            )}
                                                <button
                                                    className="btn"
                                                    style={{ padding: '0.25rem 0.5rem', color: 'var(--text-secondary)' }}
                                                    onClick={() => handlePrint(job)}
                                                    title="Print Job Card"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                {userInfo?.role === 'Owner' && (
                                                <button
                                                    className="btn"
                                                    style={{ padding: '0.25rem 0.5rem', color: 'var(--danger-color)' }}
                                                    onClick={() => handleDelete(job._id)}
                                                    title="Delete Job"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredJobs.length === 0 && (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>{searchTerm ? 'No jobs matching your search.' : 'No production jobs scheduled.'}</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-card modal-lg">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>{isEdit ? 'Update Production Job' : 'Schedule Production Job'}</h2>
                            <button className="btn" onClick={() => setShowModal(false)} style={{ padding: '0.4rem' }}><X size={20} /></button>
                        </div>
                        {error && <ErrorMessage message={error} onClose={() => setError('')} />}
                        <form onSubmit={createJob}>
                            <div className="form-group">
                                <label className="form-label">Job ID</label>
                                <input
                                    className="form-control"
                                    list="job-id-options"
                                    value={newJob.jobId}
                                    onChange={e => setNewJob({ ...newJob, jobId: e.target.value })}
                                    placeholder="Leave blank for auto-generation"
                                />
                                <datalist id="job-id-options">
                                    {jobs.map(j => <option key={j._id} value={j.jobId} />)}
                                </datalist>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Linked Order (Approved)</label>
                                <select
                                    className="form-control"
                                    value={newJob.orderId}
                                    onChange={handleOrderSelect}
                                >
                                    <option value="">-- Internal Production (Make to Stock) --</option>
                                    {orders.map(o => (
                                        <option key={o._id} value={o._id}>
                                            [{o._type === 'JobWorkOrder' ? 'JW' : 'SO'}] {o.customerName || (o.clientId?.name || 'Client')} - {o.orderTitle || o.jobType} 
                                            {o.deadline ? ` (Deadline: ${new Date(o.deadline).toLocaleDateString()})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <label className="form-label">Item to Produce</label>
                                <select 
                                    className="form-control" 
                                    value={newJob.productId ? `product:${newJob.productId}` : (newJob.partId ? `part:${newJob.partId}` : '')}
                                    onChange={handleItemSelect}
                                >
                                    <option value="">-- Manual Selection (Optional if Order selected) --</option>
                                    <optgroup label="Finished Products">
                                        {products.map(p => <option key={p._id} value={`product:${p._id}`}>{p.name} ({p.productCode})</option>)}
                                    </optgroup>
                                    <optgroup label="Sub-Assembly Parts">
                                        {parts.map(p => <option key={p._id} value={`part:${p._id}`}>{p.name} ({p.partCode})</option>)}
                                    </optgroup>
                                </select>
                            </div>

                            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Production Quantity</label>
                                    <input 
                                        type="number" step="0.0001" 
                                        className="form-control" 
                                        value={newJob.plannedQty} 
                                        onChange={e => setNewJob({ ...newJob, plannedQty: Number(e.target.value) })} 
                                        min="1"
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select 
                                        className="form-control" 
                                        value={newJob.priority} 
                                        onChange={e => setNewJob({ ...newJob, priority: e.target.value })}
                                    >
                                        <option value="Normal">Normal</option>
                                        <option value="Urgent">Urgent</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Target Completion Date</label>
                                <input type="date" className="form-control" value={newJob.endDate} onChange={e => setNewJob({ ...newJob, endDate: e.target.value })} required />
                            </div>

                            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Assign Machine (Optional)</label>
                                    <select 
                                        className="form-control" 
                                        value={newJob.machineId} 
                                        onChange={e => setNewJob({ ...newJob, machineId: e.target.value })}
                                    >
                                        <option value="">-- No Machine Assigned --</option>
                                        {machines.filter(m => m.operationalStatus !== 'Maintenance' && m.operationalStatus !== 'Broken Down').map(m => (
                                            <option key={m._id} value={m._id}>
                                                {m.name} ({m.type || 'Generic'}) - {m.operationalStatus} 
                                                {m.currentJobId ? ` (Currently: ${m.currentJobId.jobId})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Assign Operator (Optional)</label>
                                    <select 
                                        className="form-control" 
                                        value={newJob.operatorId} 
                                        onChange={e => setNewJob({ ...newJob, operatorId: e.target.value })}
                                    >
                                        <option value="">-- No Operator Assigned --</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name} ({emp.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {(newJob.productId || newJob.partId) && (
                                <div style={{ marginTop: '1rem', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px dashed var(--accent-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem' }}>Estimated Production Value:</span>
                                        <span style={{ fontWeight: 800, color: 'var(--accent-color)', fontSize: '1.1rem' }}>
                                            ₹{(
                                                ((newJob.productId ? products.find(p => p._id === newJob.productId) : parts.find(p => p._id === newJob.partId))?.standardCost || 0) * (newJob.plannedQty || 0)
                                            ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        (Unit Cost: ₹{(newJob.productId ? products.find(p => p._id === newJob.productId) : parts.find(p => p._id === newJob.partId))?.standardCost?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) || 0})
                                    </div>
                                </div>
                            )}

                            {bomRequirements.length > 0 && (
                                <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                                    <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        Material Requirements (Total needed for {newJob.plannedQty} units)
                                    </h4>
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {bomRequirements.map(req => {
                                            const totalNeeded = req.qtyPerUnit * newJob.plannedQty;
                                            const targetId = req.materialId?._id || req.partId?._id;
                                            const invItem = inventory.find(m => m._id === targetId);
                                            const available = invItem ? (invItem.currentStock - invItem.reservedStock) : 0;
                                            const isShort = available < totalNeeded;

                                            return (
                                                <li key={req._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: isShort ? 'var(--danger-color)' : 'var(--text-secondary)' }}>
                                                    <span>{req.materialId?.name || req.partId?.name}</span>
                                                    <span>
                                                        {totalNeeded.toFixed(4)} / {available.toFixed(4)} {req.unit || 'units'}
                                                        {isShort && <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>(Shortage!)</span>}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={bomRequirements.some(req => (req.qtyPerUnit * newJob.plannedQty) > (inventory.find(m => m._id === (req.materialId?._id || req.partId?._id)) ? ((inventory.find(m => m._id === (req.materialId?._id || req.partId?._id)).currentStock - inventory.find(m => m._id === (req.materialId?._id || req.partId?._id)).reservedStock)) : 0))}
                                >
                                    {isEdit ? 'Update Job' : 'Create Job'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {
                updateModal.show && (
                    <div className="modal-overlay">
                        <div className="glass-card modal-lg">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 style={{ margin: 0 }}>Update Progress</h2>
                                <button className="btn" onClick={() => setUpdateModal({ show: false, jobId: null, currentJob: null, qty: 0 })} style={{ padding: '0.4rem' }}><X size={20} /></button>
                            </div>
                            <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Target: {updateModal.currentJob.plannedQty}</p>
                            {error && <ErrorMessage message={error} onClose={() => setError('')} />}
                            <form onSubmit={submitProgress}>
                                <div className="form-group" style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Produced so far:</span>
                                        <span style={{ fontWeight: 600 }}>{updateModal.currentJob.producedQty} {updateModal.currentJob.productId?.unit || updateModal.currentJob.partId?.unit || 'units'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Pending Target:</span>
                                        <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{updateModal.currentJob.plannedQty - updateModal.currentJob.producedQty} {updateModal.currentJob.productId?.unit || updateModal.currentJob.partId?.unit || 'units'}</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">New Quantity Produced (Today)</label>
                                    <input 
                                        type="number" step="0.0001" 
                                        min="0.0001" 
                                        max={updateModal.currentJob.plannedQty - updateModal.currentJob.producedQty} 
                                        className="form-control" 
                                        value={updateModal.qty} 
                                        onChange={e => setUpdateModal({ ...updateModal, qty: Number(e.target.value) })} 
                                        placeholder="Enter additional amount..."
                                        required 
                                        autoFocus
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem' }} onClick={() => setUpdateModal({ show: false, jobId: null, currentJob: null, qty: 0 })}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Hidden Printable Job Card */}
            {printingJob && (
                <div id="job-card-print" className="print-only">
                    <div className="job-card-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h1 style={{ color: 'black', margin: 0 }}>JOB CARD: {printingJob.jobId}</h1>
                                <p style={{ color: '#555' }}>Industrax - Manufacturing Operations</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span className="print-badge" style={{ border: '2px solid black', padding: '5px 15px', fontWeight: 'bold' }}>
                                    {printingJob.priority.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="job-card-section">
                        <h3>Production Details</h3>
                        <table className="print-data-table">
                            <tbody>
                                <tr>
                                    <td><strong>{printingJob.productId ? 'Product:' : 'Part:'}</strong></td>
                                    <td>
                                        {printingJob.productId ? (
                                            `${printingJob.productId.name || 'Product'} (${printingJob.productId.productCode || 'N/A'})`
                                        ) : (
                                            `${printingJob.partId?.name || 'Part'} (${printingJob.partId?.partCode || 'N/A'})`
                                        )}
                                    </td>
                                    <td><strong>Customer:</strong></td>
                                    <td>{printingJob.orderId?.customerName || printingJob.orderId?.clientId?.name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Target Quantity:</strong></td>
                                    <td>{printingJob.plannedQty}</td>
                                    <td><strong>Target Date:</strong></td>
                                    <td>{new Date(printingJob.endDate).toLocaleDateString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="job-card-section">
                        <h3>Material Requirements (Bill of Materials)</h3>
                        <table className="print-data-table">
                            <thead>
                                <tr>
                                    <th>Material Name</th>
                                    <th>Code</th>
                                    <th>Quantity Required</th>
                                    <th>Issued Batch / Sign</th>
                                </tr>
                            </thead>
                            <tbody>
                                {printingJob.bomRequirements?.map(req => (
                                    <tr key={req._id}>
                                        <td>{req.materialId?.name}</td>
                                        <td>{req.materialId?.materialCode}</td>
                                        <td>{(req.qtyPerUnit * printingJob.plannedQty).toFixed(4)} {req.unit || req.materialId?.unit}</td>
                                        <td style={{ width: '150px', borderBottom: '1px solid #ccc' }}></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="job-card-section">
                        <h3>Operator Logs & Quality Control</h3>
                        <table className="print-data-table">
                            <thead>
                                <tr>
                                    <th>Operation Step</th>
                                    <th>Operator Name</th>
                                    <th>Date/Time</th>
                                    <th>QC Pass [X]</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Setup & Material Issue</td>
                                    <td>____________________</td>
                                    <td>____________________</td>
                                    <td>[ ]</td>
                                </tr>
                                <tr>
                                    <td>Primary Manufacturing</td>
                                    <td>____________________</td>
                                    <td>____________________</td>
                                    <td>[ ]</td>
                                </tr>
                                <tr>
                                    <td>Final Inspection</td>
                                    <td>____________________</td>
                                    <td>____________________</td>
                                    <td>[ ]</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ textAlign: 'center', width: '200px' }}>
                            <div style={{ borderBottom: '1px solid black', height: '40px' }}></div>
                            <p>Operator Signature</p>
                        </div>
                        <div style={{ textAlign: 'center', width: '200px' }}>
                            <div style={{ borderBottom: '1px solid black', height: '40px' }}></div>
                            <p>Supervisor Signature</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', fontSize: '10px', color: '#888', textAlign: 'center' }}>
                        Generated on {new Date().toLocaleString()} | MechSaaS Project Upgrade 10/10
                    </div>
                </div>
            )}
        </div >
    );
};

export default Production;
