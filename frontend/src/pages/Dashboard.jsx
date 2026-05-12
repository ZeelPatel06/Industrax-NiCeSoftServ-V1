import productService from '../services/productService';
import orderService from '../services/orderService';
import materialService from '../services/materialService';
import productionService from '../services/productionService';
import dashboardService from '../services/dashboardService';
import jobWorkService from '../services/jobWorkService';
import machineService from '../services/machineService';
import { Package, ShoppingCart, Hammer, AlertTriangle, CheckCircle, Activity, ChevronDown, ChevronUp, Briefcase, Cpu } from 'lucide-react';
import { useState, useEffect } from 'react';

const Dashboard = () => {
    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        materialsLow: 0,
        activeJobs: 0,
        delayedOrders: 0,
        activeJobWork: 0,
        delayedJobWork: 0
    });
    const [activities, setActivities] = useState([]);
    const [showActivity, setShowActivity] = useState(false);
    const [activeJobsList, setActiveJobsList] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [priorityOrdersList, setPriorityOrdersList] = useState([]);
    const [activeJobWorkList, setActiveJobWorkList] = useState([]);
    const [machinesList, setMachinesList] = useState([]);

    const fetchStats = async () => {
        try {
            const [products, orders, materials, jobs, activity, jobWorks, machines] = await Promise.all([
                productService.getAll().catch(() => []),
                orderService.getAll().catch(() => []),
                materialService.getAll().catch(() => []),
                productionService.getAll().catch(() => []),
                dashboardService.getActivity().catch(() => []),
                jobWorkService.getAll().catch(() => []),
                machineService.getMachines().catch(() => [])
            ]);

            const activeOrders = (orders || []).filter(o => !['Completed', 'Delivered'].includes(o.status));

            // Priority list: All active orders (shows late alerts if overdue)
            const priority = activeOrders || [];

            const lowMaterials = (materials || []).filter(m => (m.currentStock || 0) <= (m.minimumLevel || 0));
            setLowStockItems(lowMaterials);

            const activeJobWork = (jobWorks || []).filter(jw => jw.status !== 'Completed');
            const delayedJobWork = activeJobWork.filter(jw => jw.deadline && new Date() > new Date(jw.deadline));

            setStats({
                products: (products || []).length,
                orders: activeOrders.length,
                materialsLow: lowMaterials.length,
                activeJobs: jobs ? jobs.filter(j => j.status === 'Started').length : 0,
                delayedOrders: activeOrders.filter(o => o.deliveryDate && new Date() > new Date(o.deliveryDate)).length,
                activeJobWork: activeJobWork.length,
                delayedJobWork: delayedJobWork.length,
                activeMachines: (machines || []).filter(m => m.operationalStatus === 'Running').length
            });

            setActiveJobsList(jobs ? jobs.filter(j => j.status === 'Started') : []);
            setMachinesList(machines || []);
            setActivities(activity);
            setPriorityOrdersList(priority);
            setActiveJobWorkList(activeJobWork);

        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon: Icon, colorClass, glowClass, subText }) => (
        <div className={`glass-card stat-card ${glowClass} animate-fade-in`} style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--surface-border)', position: 'relative' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', marginRight: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className={colorClass}>
                <Icon size={32} />
            </div>
            <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>{title}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{value}</h3>
                    {subText && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{subText}</span>}
                </div>
            </div>
        </div>
    );

    const DetailedOrderCard = ({ order }) => {
        const isLate = new Date() > new Date(order.deliveryDate) && !['Completed', 'Delivered'].includes(order.status);
        const isDueSoon = !isLate && (new Date(order.deliveryDate) - new Date()) < (3 * 24 * 60 * 60 * 1000);

        return (
            <div className={`glass-card hover-lift ${isLate ? 'border-danger' : ''}`} style={{
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden',
                background: isLate ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)' : 'var(--glass-bg)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                {isLate && (
                    <div className="pulse-danger" style={{
                        position: 'absolute', top: '12px', right: '12px',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: 'var(--danger-color)', color: 'white',
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800,
                        boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
                    }}>
                        <AlertTriangle size={12} /> LATE ALERT
                    </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: isLate ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                                {order.customerName}
                            </h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                #{order.orderId || 'ORD-NEW'}
                            </span>
                        </div>
                        {!isLate && (
                            <span className={`badge ${['Completed', 'Delivered'].includes(order.status) ? 'badge-success' : 'badge-warning'}`}
                                style={{ fontSize: '0.65rem', padding: '4px 8px' }}>
                                {order.status}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <ShoppingCart size={14} className="text-secondary" />
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {(order.items || []).length} {(order.items || []).length === 1 ? 'Item' : 'Items'}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                                ({(order.items || []).map(i => i.productId?.name || i.name).filter(Boolean).join(', ').substring(0, 30)}...)
                            </span>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                        marginTop: '4px'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Deadline</div>
                        <div style={{
                            fontSize: '0.9rem', fontWeight: 600,
                            color: isLate ? 'var(--danger-color)' : (isDueSoon ? 'var(--warning-color)' : 'var(--text-primary)')
                        }}>
                            {new Date(order.deliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const JobWorkCard = ({ order }) => {
        const isLate = order.deadline && new Date() > new Date(order.deadline) && order.status !== 'Completed';
        const isDueSoon = !isLate && order.deadline && (new Date(order.deadline) - new Date()) < (3 * 24 * 60 * 60 * 1000);
        return (
            <div className={`glass-card hover-lift ${isLate ? 'border-danger' : ''}`} style={{
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden',
                background: isLate ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)' : 'var(--glass-bg)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                {isLate && (
                    <div className="pulse-danger" style={{
                        position: 'absolute', top: '12px', right: '12px',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: 'var(--danger-color)', color: 'white',
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800,
                        boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
                    }}>
                        <AlertTriangle size={12} /> LATE ALERT
                    </div>
                )}
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.6rem', padding: '3px 8px' }}>JOB WORK</span>
                </div>
                <div style={{ marginBottom: '1rem', marginTop: '28px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: isLate ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                        {order.clientId?.name || 'Unknown Client'}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{order.orderTitle || 'No Title'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <Briefcase size={14} className="text-primary" />
                        <span style={{ fontWeight: 500 }}>
                            {order.jobType}: {order.materials?.length > 0 ? order.materials.map(m => m.materialName).join(', ') : order.materialName}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Deadline</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isLate ? 'var(--danger-color)' : (isDueSoon ? 'var(--warning-color)' : 'var(--text-primary)') }}>
                            {order.deadline ? new Date(order.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Deadline'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-color)' }}>₹{(order.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="gradient-text" style={{ margin: 0 }}>Dashboard Overview</h1>
                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowActivity(!showActivity)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                    >
                        <Activity size={18} />
                        {showActivity ? 'Hide Activity' : 'Recent Activity'}
                        {showActivity ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {/* Welcome Section for New Users */}
            {(stats.products === 0 && stats.orders === 0 && stats.activeJobWork === 0) && (
                <div className="glass-card animate-fade-in" style={{
                    marginBottom: '2rem',
                    padding: '2.5rem',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <Briefcase size={32} className="text-primary" />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Welcome to Industrax!</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem' }}>
                        Your dashboard is empty because you haven't added any products or orders yet. Let's get started with your factory setup!
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={() => window.location.href = '/products'}>
                            <Package size={18} style={{ marginRight: '8px' }} /> Add Your First Product
                        </button>
                        <button className="btn btn-accent" onClick={() => window.location.href = '/orders'}>
                            <ShoppingCart size={18} style={{ marginRight: '8px' }} /> Create First Order
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div className="hover-lift"><StatCard title="Total Products" value={stats.products} icon={Package} colorClass="text-primary" subText="Items you sell" /></div>
                <div className="hover-lift"><StatCard title="Direct Orders" value={stats.orders} icon={ShoppingCart} colorClass="text-accent" subText="Standard sales" /></div>
                <div className="hover-lift"><StatCard title="Job Work" value={stats.activeJobWork} icon={Briefcase} colorClass="text-info" subText="Custom tasks" /></div>
                <div className="hover-lift"><StatCard title="Late Orders" value={stats.delayedOrders} icon={AlertTriangle} colorClass="text-danger" subText="Needs attention" /></div>
                <div className="hover-lift"><StatCard title="Late Jobs" value={stats.delayedJobWork} icon={AlertTriangle} colorClass="text-danger" subText="Needs attention" /></div>
                <div className="hover-lift"><StatCard title="Low Stock" value={stats.materialsLow} icon={AlertTriangle} colorClass="text-warning" subText="Refill soon" /></div>
                <div className="hover-lift"><StatCard title="Active Work" value={stats.activeJobs} icon={Hammer} colorClass="text-primary" subText="In factory" /></div>
                <div className="hover-lift"><StatCard title="Active Machines" value={stats.activeMachines} icon={Cpu} colorClass="text-primary" subText="Currently running" /></div>
            </div>

            {/* Recent Activity (Toggleable) */}
            {showActivity && (
                <div className="glass-card animate-fade-in" style={{ marginTop: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={24} className="text-primary" />
                        Recent Activity
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        {activities.map((act, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s ease' }} className="hover-lift">
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{act.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{act.description}</div>
                                </div>
                                <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    <span className={`badge badge-${act.status}`} style={{ fontSize: '0.7rem' }}>{act.type}</span>
                                </div>
                            </div>
                        ))}
                        {activities.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No recent activity found.</div>
                        )}
                    </div>
                </div>
            )}

            <div className="dashboard-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '2rem',
                marginTop: '2rem',
                /* Mobile Overrides are handled via className in index.css */
            }}>
                {/* Active Production */}
                <div className="glass-card animate-fade-in dashboard-section" style={{ gridColumn: 'span 1' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Active Production</h2>
                    {activeJobsList.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {activeJobsList.map(job => (
                                <div key={job._id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{job.productId?.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Due: {new Date(job.endDate).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                                        <div style={{ width: `${((job.producedQty || 0) / (job.plannedQty || 1)) * 100}%`, background: 'var(--primary-color)', height: '100%' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                                        <span>Progress: {(((job.producedQty || 0) / (job.plannedQty || 1)) * 100).toFixed(0)}%</span>
                                        <span>{job.producedQty || 0} / {job.plannedQty || 0} units</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            No active production jobs.
                        </div>
                    )}
                </div>

                {/* Machine Status */}
                <div className="glass-card animate-fade-in dashboard-section" style={{ gridColumn: 'span 1' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Machine Status</h2>
                    {machinesList.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {machinesList.map(machine => (
                                <div key={machine._id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{machine.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{machine.type}</div>
                                        </div>
                                        <span className={`badge ${machine.operationalStatus === 'Running' ? 'badge-success' :
                                                machine.operationalStatus === 'Maintenance' ? 'badge-warning' :
                                                    machine.operationalStatus === 'Broken Down' ? 'badge-danger' :
                                                        'badge-info'
                                            }`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                                            {machine.operationalStatus}
                                        </span>
                                    </div>
                                    {machine.currentJobId && (
                                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                                                <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>Active Job</span>
                                                <span style={{ color: 'var(--text-secondary)' }}>{machine.currentJobId.jobId}</span>
                                            </div>
                                            <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', height: '4px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${(machine.currentJobId.producedQty / machine.currentJobId.plannedQty) * 100}%`,
                                                    background: 'var(--primary-color)',
                                                    height: '100%'
                                                }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            No machines added.
                        </div>
                    )}
                </div>

                {/* Active Orders + Job Work Combined */}
                <div className="dashboard-section" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '8px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Active Orders</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{priorityOrdersList.length} Standard</span>
                            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{activeJobWorkList.length} Job Work</span>
                        </div>
                    </div>

                    {/* Standard Orders */}
                    {priorityOrdersList.length > 0 && (
                        <>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Standard Orders</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                {priorityOrdersList.map(order => (
                                    <DetailedOrderCard key={order._id} order={order} />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Job Work Orders */}
                    {activeJobWorkList.length > 0 && (
                        <>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>Job Work Orders</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                {activeJobWorkList.map(order => (
                                    <JobWorkCard key={order._id} order={order} />
                                ))}
                            </div>
                        </>
                    )}

                    {priorityOrdersList.length === 0 && activeJobWorkList.length === 0 && (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <CheckCircle size={48} style={{ marginBottom: '1rem', color: 'var(--success-color)', opacity: 0.5 }} />
                            <h3 style={{ margin: 0 }}>All caught up!</h3>
                            <p style={{ fontSize: '0.9rem' }}>No active orders or job work found.</p>
                        </div>
                    )}
                </div>

                {/* Low Stock Alerts */}
                <div className="glass-card animate-fade-in dashboard-section" style={{ gridColumn: 'span 4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '8px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Inventory Watchlist</h2>
                        {lowStockItems.length > 0 && <span className="badge badge-warning">{lowStockItems.length} Low Items</span>}
                    </div>
                    {lowStockItems.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                            {lowStockItems.map(item => (
                                <div key={item._id} className="pulse-danger" style={{
                                    padding: '1rem', borderLeft: '4px solid var(--danger-color)',
                                    background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--danger-color)' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Min Level: {item.minimumLevel?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {item.unit}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--danger-color)' }}>{item.currentStock?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Current Stock</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            <p>Stock levels are healthy across all materials.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
