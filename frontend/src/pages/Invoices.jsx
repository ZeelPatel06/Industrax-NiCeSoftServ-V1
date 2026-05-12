import { useState, useEffect } from 'react';
import invoiceService from '../services/invoiceService';
import apiClient from '../api/apiClient';
import { FileText, Printer, Search, Download, Calendar, ArrowLeft, Building2, Trash2, CreditCard, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import Loading from './Loading';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null); // For print view
    const [searchTerm, setSearchTerm] = useState('');
    const [companyProfile, setCompanyProfile] = useState({ companyName: '', companyAddress: '', gstNumber: '' });
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState({ id: null, alreadyPaid: 0, newPayment: 0, totalAmount: 0, invoiceNumber: '' });
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    const fetchProfile = async () => {
        try {
            const { data } = await apiClient.get('/profile');
            setCompanyProfile(data.companyProfile || {});
        } catch (err) {
            console.error('Failed to fetch profile', err);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const data = await invoiceService.getAll();
                setInvoices(data || []);
            } catch (error) {
                console.error(error);
                setInvoices([]);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const fetchInvoicesProxy = async () => {
        try {
            const data = await invoiceService.getAll();
            setInvoices(data || []);
        } catch (error) {
            console.error(error);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                await invoiceService.delete(id);
                fetchInvoicesProxy();
            } catch (err) {
                console.error('Failed to delete invoice', err);
                alert(err.response?.data?.message || 'Failed to delete invoice');
            }
        }
    };

    const printInvoice = () => {
        window.print();
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        const finalAmount = paymentData.alreadyPaid + paymentData.newPayment;
        if (finalAmount > paymentData.totalAmount) {
            alert(`Total paid (₹${finalAmount}) cannot exceed invoice amount (₹${paymentData.totalAmount})`);
            return;
        }
        try {
            await invoiceService.recordPayment(paymentData.id, finalAmount);
            setShowPaymentModal(false);
            fetchInvoicesProxy();
        } catch (err) {
            console.error('Failed to record payment', err);
            alert(err.response?.data?.message || 'Failed to record payment');
        }
    };

    const filteredInvoices = invoices.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.clientId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Loading />;

    // View for printing (Replaces entire screen cleanly during print)
    if (selectedInvoice) {
        return (
            <div className="animate-fade-in" style={{ padding: '1rem' }}>
                <style>{`
                    @media print {
                        /* Robust Print Fix: Avoid hiding the body or using fixed positioning */
                        .no-print, header, nav, .sidebar, .app-header, .header, .sidebar-container { display: none !important; }
                        .main-content { margin: 0 !important; padding: 0 !important; width: 100% !important; }
                        .app-container { display: block !important; padding: 0 !important; }
                        
                        .printable-invoice { 
                            background: white !important; 
                            color: black !important; 
                            width: 100% !important;
                            padding: 20px !important;
                            margin: 0 !important;
                            border: none !important;
                            box-shadow: none !important;
                        }
                    }
                `}</style>
                
                <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                    <button className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }} onClick={() => setSelectedInvoice(null)}>
                        <ArrowLeft size={18} style={{ marginRight: '8px' }} /> Back to List
                    </button>
                    <button className="btn btn-primary" onClick={printInvoice}>
                        <Printer size={18} style={{ marginRight: '8px' }} /> Print / Save PDF
                    </button>
                </div>

                <div className="printable-invoice" style={{ 
                    background: 'white', 
                    color: '#1a1a1a', 
                    padding: '40px', 
                    maxWidth: '800px', 
                    margin: '0 auto', 
                    boxShadow: 'none', 
                    border: '1px solid #eee',
                    position: 'relative',
                    visibility: 'visible'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: '20px', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ margin: 0, color: '#111', fontSize: '1.5rem', fontWeight: 800 }}>COSTING ESTIMATE</h2>
                            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>#{selectedInvoice.invoiceNumber} | {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#444' }}>{companyProfile.companyName || 'Industrax'}</h3>
                            <div style={{ fontSize: '0.8rem', color: '#888', maxWidth: '300px' }}>
                                <div>{companyProfile.companyAddress}</div>
                                {companyProfile.gstNumber && <div style={{ marginTop: '2px', fontWeight: 600 }}>GSTIN: {companyProfile.gstNumber}</div>}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: '5px' }}>Customer:</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedInvoice.clientId?.name || selectedInvoice.customerName}</div>
                        <div style={{ fontSize: '0.9rem', color: '#555' }}>{selectedInvoice.clientId?.address}</div>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem' }}>JOB DESCRIPTION / ITEMS</th>
                                <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem' }}>QTY</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.8rem' }}>RATE</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.8rem' }}>TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                             {selectedInvoice.items && (selectedInvoice.items || []).length > 0 ? (
                                (selectedInvoice.items || []).map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '15px 12px' }}>
                                            <div style={{ fontWeight: 600 }}>{item.name || 'Item'}</div>
                                        </td>
                                        <td style={{ padding: '15px 12px', textAlign: 'center' }}>{item.quantity || 0}</td>
                                        <td style={{ padding: '15px 12px', textAlign: 'right' }}>₹{(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                        <td style={{ padding: '15px 12px', textAlign: 'right', fontWeight: 600 }}>₹{(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                     <td style={{ padding: '15px 12px' }}>
                                        <div style={{ fontWeight: 600 }}>{selectedInvoice.orderId?.jobType || 'Production Order'}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{selectedInvoice.orderId?.orderTitle || 'Manual Adjustment'}</div>
                                    </td>
                                    <td style={{ padding: '15px 12px', textAlign: 'center' }}>1</td>
                                    <td style={{ padding: '15px 12px', textAlign: 'right' }}>₹{(selectedInvoice.orderId?.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                    <td style={{ padding: '15px 12px', textAlign: 'right', fontWeight: 600 }}>₹{(selectedInvoice.orderId?.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {selectedInvoice.materials && selectedInvoice.materials.length > 0 && (
                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Materials Used / Components</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #eee' }}>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>Component/Material</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>Quantity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedInvoice.materials || []).map((m, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                            <td style={{ padding: '8px' }}>{m.materialName}</td>
                                            <td style={{ padding: '8px', textAlign: 'right' }}>{m.quantity || 0} {m.unit || 'units'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {selectedInvoice.extraCosts && selectedInvoice.extraCosts.length > 0 && (
                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Additional Charges:</div>
                             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <tbody>
                                    {(selectedInvoice.extraCosts || []).map((cost, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                            <td style={{ padding: '8px' }}>{cost.description}</td>
                                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>₹{(cost.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #111', paddingTop: '15px' }}>
                        <div style={{ textAlign: 'right', minWidth: '300px' }}>
                            {selectedInvoice.gstType && selectedInvoice.gstType !== 'none' ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '0.9rem', color: '#666', flex: 1, textAlign: 'left' }}>Sub Total:</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>₹{selectedInvoice.subTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) || selectedInvoice.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                                    </div>
                                    {selectedInvoice.gstType === 'intra-state' ? (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span style={{ fontSize: '0.9rem', color: '#666', flex: 1, textAlign: 'left' }}>CGST ({(selectedInvoice.gstRate/2)}%):</span>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>₹{selectedInvoice.cgst?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span style={{ fontSize: '0.9rem', color: '#666', flex: 1, textAlign: 'left' }}>SGST ({(selectedInvoice.gstRate/2)}%):</span>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>₹{selectedInvoice.sgst?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#666', flex: 1, textAlign: 'left' }}>IGST ({selectedInvoice.gstRate}%):</span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>₹{selectedInvoice.igst?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                                        </div>
                                    )}
                                     <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px dotted #ccc' }}>
                                        <span style={{ fontSize: '1rem', color: '#333', fontWeight: 700, flex: 1, textAlign: 'left' }}>Total Receivable:</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{(selectedInvoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#666', flex: 1, textAlign: 'left' }}>Total Amount:</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{(selectedInvoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedInvoice.notes && (
                        <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '4px', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: '5px' }}>Notes / Terms:</div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{selectedInvoice.notes}</div>
                        </div>
                    )}

                    <div style={{ marginTop: '50px', fontSize: '0.75rem', color: '#999', textAlign: 'center', borderTop: '1px dashed #eee', paddingTop: '15px' }}>
                        This is an unofficial/dummy and commercial costing estimate and record generated via Industrax.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>Invoices</h1>
                <div className="header-actions">
                    <div className="search-container" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search invoice or client..."
                            className="form-control"
                            style={{ paddingLeft: '40px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    </div>
                </div>
            </div>

            <div className="glass-card table-container">
                <table className="glass-table">
                    <thead>
                        <tr>
                            <th>Invoice Number</th>
                            <th>Issued Date</th>
                            <th>Customer Name</th>
                            <th>Total Amount</th>
                            <th>Paid</th>
                            <th>Balance</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.map(invoice => (
                            <tr key={invoice._id}>
                                <td style={{ padding: '15px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FileText size={16} className="text-primary" />
                                        <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{invoice.invoiceNumber}</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={14} className="text-secondary" />
                                        {new Date(invoice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Building2 size={14} className="text-accent" />
                                        {invoice.clientId?.name || invoice.customerName || 'Unknown'}
                                    </div>
                                </td>
                                 <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                    ₹{(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </td>
                                <td style={{ color: 'var(--success-color)', fontWeight: 600 }}>
                                    ₹{(invoice.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </td>
                                <td style={{ color: 'var(--danger-color)', fontWeight: 700 }}>
                                    ₹{((invoice.totalAmount || 0) - (invoice.paidAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                </td>
                                <td>
                                    <span className={`badge ${
                                        invoice.paymentStatus === 'Paid' ? 'badge-success' : 
                                        invoice.paymentStatus === 'Partially Paid' ? 'badge-warning' : 
                                        'badge-danger'
                                    }`} style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                        {invoice.paymentStatus === 'Paid' ? <CheckCircle size={12} /> : 
                                         invoice.paymentStatus === 'Partially Paid' ? <Clock size={12} /> : 
                                         <AlertCircle size={12} />}
                                        {invoice.paymentStatus || 'Unpaid'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn" style={{ padding: '6px 12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }} onClick={() => setSelectedInvoice(invoice)}>
                                            <Printer size={16} style={{ marginRight: '8px' }} /> View
                                        </button>
                                        <button className="btn" style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }} onClick={() => {
                                            setPaymentData({ 
                                                id: invoice._id, 
                                                alreadyPaid: invoice.paidAmount || 0, 
                                                newPayment: 0, 
                                                totalAmount: invoice.totalAmount, 
                                                invoiceNumber: invoice.invoiceNumber 
                                            });
                                            setShowPaymentModal(true);
                                        }}>
                                            <CreditCard size={16} style={{ marginRight: '8px' }} /> Paid
                                        </button>
                                        {userInfo?.role === 'Owner' && (
                                            <button className="btn" style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }} onClick={() => handleDelete(invoice._id)} title="Delete Invoice">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredInvoices.length === 0 && (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No invoices found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showPaymentModal && (
                <div className="modal-overlay">
                    <div className="glass-card modal-sm" style={{ maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Record Payment</h2>
                            <button className="btn" onClick={() => setShowPaymentModal(false)} style={{ padding: '0.4rem' }}><X size={20} /></button>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Updating payment for Invoice <strong>#{paymentData.invoiceNumber}</strong>
                        </p>
                        <form onSubmit={handleRecordPayment}>
                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Invoice Total:</span>
                                        <span style={{ fontWeight: 600 }}>₹{paymentData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Already Paid:</span>
                                        <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>₹{paymentData.alreadyPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Remaining:</span>
                                        <span style={{ color: 'var(--danger-color)', fontWeight: 700 }}>₹{(paymentData.totalAmount - paymentData.alreadyPaid).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Add New Payment Amount (₹)</label>
                                    <input 
                                        type="number" step="0.0001" 
                                        className="form-control" 
                                        value={paymentData.newPayment} 
                                        onChange={(e) => setPaymentData({ ...paymentData, newPayment: Number(e.target.value) })}
                                        min="0"
                                        max={paymentData.totalAmount - paymentData.alreadyPaid}
                                        placeholder="Enter amount to add..."
                                        autoFocus
                                        required
                                    />
                                </div>

                                <div style={{ padding: '10px', background: 'var(--primary-color)', borderRadius: '8px', opacity: paymentData.newPayment > 0 ? 1 : 0.5, transition: 'all 0.3s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>Final Cumulative Payment:</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>₹{(paymentData.alreadyPaid + paymentData.newPayment).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={paymentData.newPayment <= 0}>Update Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;
