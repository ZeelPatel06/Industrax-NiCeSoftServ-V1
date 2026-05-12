import React, { useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';
import dataService from '../services/dataService';
import { Database, Download, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';

const DataManagement = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleExport = async () => {
        setLoading(true);
        setStatus({ type: '', message: '' });
        try {
            const blob = await dataService.exportData();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `industrax_backup_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            setStatus({ type: 'success', message: 'Backup exported successfully!' });
        } catch (error) {
            console.error(error);
            let errorMsg = 'Export failed. Please try again.';
            
            // Handle error in Blob response
            if (error.response?.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const jsonData = JSON.parse(reader.result);
                        setStatus({ type: 'danger', message: jsonData.message || jsonData.error || errorMsg });
                    } catch (e) {
                        setStatus({ type: 'danger', message: errorMsg });
                    }
                };
                reader.readAsText(error.response.data);
            } else {
                errorMsg = error.response?.data?.message || error.response?.data?.error || errorMsg;
                setStatus({ type: 'danger', message: errorMsg });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.confirm('WARNING: Importing data will update or create records. This action cannot be easily undone. Do you want to proceed?')) {
            e.target.value = '';
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });
        try {
            const result = await dataService.importData(file);
            const s = result.summary;
            const summaryText = s
                ? `Imported: ${s.materials} materials, ${s.products} products, ${s.orders} orders, ${s.inventoryTx} inventory records, ${s.productionJobs} production jobs, ${s.jobWorkOrders || 0} job work orders.`
                : '';
            setStatus({ type: 'success', message: `Data imported successfully! ${summaryText} Refresh your pages to see changes.` });
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Import failed. Check CSV format.';
            setStatus({ type: 'danger', message: errorMsg });
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1>Data Management & Backup</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Centralized tools to export your entire company data for offline storage or import from a master CSV.
                    </p>
                </div>
            </div>

            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Export Card */}
                <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(var(--primary-rgb), 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                        <Download size={40} className="text-primary" />
                    </div>
                    <h3>Export Full Backup</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>
                        Download all Materials, Products, Orders, and Production history in a single CSV file. 
                        Best for weekly backups and database optimization.
                    </p>
                    <button 
                        className="btn btn-primary" 
                        style={{ width: '100%' }} 
                        onClick={handleExport}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Generate Backup'}
                    </button>
                </div>

                {/* Import Card */}
                <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(var(--accent-rgb), 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                        <Upload size={40} style={{ color: 'var(--accent-color)' }} />
                    </div>
                    <h3>Import Master CSV</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '1rem 0 2rem' }}>
                        Upload a CSV file to bulk update or restore your data. 
                        Ensure the file matches the standard Industrax structure.
                    </p>
                    <label className="btn btn-accent" style={{ width: '100%', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                        <input 
                            type="file" 
                            accept=".csv" 
                            style={{ display: 'none' }} 
                            onChange={handleImport}
                            disabled={loading}
                        />
                        {loading ? 'Uploading...' : 'Upload & Sync'}
                    </label>
                </div>
            </div>

            {status.message && (
                status.type === 'success' ? (
                    <div className="glass-card border-success" style={{ marginTop: '2rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CheckCircle2 className="text-success" />
                        <span style={{ fontWeight: 500 }}>{status.message}</span>
                    </div>
                ) : (
                    <div style={{ marginTop: '2rem' }}>
                        <ErrorMessage message={status.message} onClose={() => setStatus({ type: '', message: '' })} />
                    </div>
                )
            )}

            <div className="glass-card" style={{ marginTop: '2rem', padding: '2rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <Database size={20} className="text-primary" /> CSV Structure Guide
                </h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineAlpha: 1.6 }}>
                    <p>Your master CSV should contain a <strong>Type</strong> column to identify the record:</p>
                    <ul style={{ marginTop: '0.5rem', listStyleType: 'circle', paddingLeft: '1.5rem' }}>
                        <li><code>MATERIAL</code>: Material definitions with shape and dimensions</li>
                        <li><code>PRODUCT</code> / <code>PART</code>: Product and Parts catalog with pricing</li>
                        <li><code>BOM</code>: Bill of Materials (material links)</li>
                        <li><code>ORDER</code> / <code>ORDER_ITEM</code>: Standard customer orders</li>
                        <li><code>INVENTORY_TX</code>: Stock movements (IN/OUT)</li>
                        <li><code>PRODUCTION_JOB</code>: Manufacturing schedules</li>
                        <li><code>JOB_WORK_ORDER</code>: Custom jobs and work orders</li>
                        <li><code>MACHINE</code>: Factory equipment and status</li>
                        <li><code>EMPLOYEE</code>: Workforce roster and roles</li>
                        <li><code>ATTENDANCE</code>: Daily attendance logs</li>
                        <li><code>CLIENT</code>: Customer and Client database</li>
                        <li><code>INVOICE</code>: Billing and payment records</li>
                    </ul>
                    <p style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '4px' }}>
                        <strong>Tip:</strong> The easiest way to get the correct structure is to perform an <strong>Export</strong> first and use that file as a template.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DataManagement;
