import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Archive, ShoppingCart, Hammer, LogOut, X, Database, ChevronLeft, ChevronRight, ShelvingUnit, ClipboardList, Settings, Network, CalendarCheck, Factory, Users, Component } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const canAccessData = userInfo?.role === 'Owner' || userInfo?.role === 'Engineer';
    const isOperator = userInfo?.role === 'Operator';
    const selectedModules = userInfo?.selectedModules || [];
    const hasModule = (moduleName) => selectedModules.includes(moduleName);

    const logoutHandler = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const navStyles = ({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        marginBottom: '0.5rem',
        textDecoration: 'none',
        color: isActive ? 'white' : 'var(--text-secondary)',
        backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
        transition: 'all var(--transition-fast)'
    });

    const iconStyle = { flexShrink: 0 };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Header with logo + toggle */}
            <div className="sidebar-header desktop-only" style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '0 0.5rem' }}>
                {!collapsed && <h2 style={{ color: 'white', letterSpacing: '1px', margin: 0 }}>Indus<span style={{ color: 'var(--primary-color)' }}>trax</span></h2>}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {(isOperator ? [
                    ...(hasModule('production') ? [{ to: '/production', icon: <Hammer size={20} style={iconStyle} />, label: 'Production', sub: 'Track ongoing work' }] : []),
                    ...(hasModule('machines') ? [{ to: '/machines', icon: <Factory size={20} style={iconStyle} />, label: 'Machines', sub: 'Manage equipment' }] : []),
                    ...(hasModule('attendance') ? [{ to: '/attendance', icon: <CalendarCheck size={20} style={iconStyle} />, label: 'My Attendance', sub: 'Mark your presence' }] : []),
                ] : [
                    { to: '/dashboard', icon: <LayoutDashboard size={20} style={iconStyle} />, label: 'Dashboard', sub: 'Overview at a glance' },
                    ...(hasModule('products') ? [{ to: '/products', icon: <Package size={20} style={iconStyle} />, label: 'Products', sub: 'What you sell' }] : []),
                    ...(hasModule('parts') ? [{ to: '/parts', icon: <Archive size={20} style={iconStyle} />, label: 'Parts', sub: 'Sub-assembly components' }] : []),
                    ...(hasModule('materials') ? [{ to: '/materials', icon: <Component size={20} style={iconStyle} />, label: 'Materials', sub: 'Raw material list' }] : []),
                    ...(hasModule('bom') ? [{ to: '/bom', icon: <Network size={20} style={iconStyle} />, label: 'BOM', sub: 'What goes into each product' }] : []),
                    ...(hasModule('inventory') ? [{ to: '/inventory', icon: <ShelvingUnit size={20} style={iconStyle} />, label: 'Inventory', sub: 'Stock in / Stock out' }] : []),
                    ...(hasModule('orders') ? [{ to: '/orders', icon: <ShoppingCart size={20} style={iconStyle} />, label: 'Orders', sub: 'Customer & job orders' }] : []),
                    ...(hasModule('production') ? [{ to: '/production', icon: <Hammer size={20} style={iconStyle} />, label: 'Production', sub: 'Schedule & track jobs' }] : []),
                    ...(hasModule('attendance') ? [{ to: '/attendance', icon: <CalendarCheck size={20} style={iconStyle} />, label: 'Attendance', sub: 'Employee daily log' }] : []),
                    ...(hasModule('employees') ? [{ to: '/employees', icon: <Users size={20} style={iconStyle} />, label: 'Employees', sub: 'Manage your team' }] : []),
                    ...(hasModule('invoices') ? [{ to: '/invoices', icon: <ClipboardList size={20} style={iconStyle} />, label: 'Invoices & Bills', sub: 'Generate client bills' }] : []),
                    ...(hasModule('machines') ? [{ to: '/machines', icon: <Factory size={20} style={iconStyle} />, label: 'Machines', sub: 'Manage your equipment' }] : []),
                    ...(canAccessData ? [{ to: '/data-management', icon: <Database size={20} style={iconStyle} />, label: 'Data & Backup', sub: 'Export & backup data' }] : []),
                    ...(userInfo?.role === 'Owner' ? [{ to: '/settings', icon: <Settings size={20} style={iconStyle} />, label: 'Settings', sub: 'App configuration' }] : [])
                ]).map(({ to, icon, label, sub }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onClose}
                        title={collapsed ? label : ''}
                        style={({ isActive }) => ({
                            ...navStyles({ isActive }),
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            padding: collapsed ? '0.75rem' : '0.6rem 1rem',
                        })}
                    >
                        {icon}
                        {!collapsed && (
                            <div style={{ marginLeft: '12px', overflow: 'hidden', opacity: 1, transition: 'opacity 0.2s' }}>
                                <div style={{ whiteSpace: 'nowrap', fontWeight: 500, fontSize: '0.9rem' }}>{label}</div>
                                {sub && <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', marginTop: '1px' }}>{sub}</div>}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto' }}>
                <button
                    onClick={logoutHandler}
                    className="btn"
                    title={collapsed ? 'Logout' : ''}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: collapsed ? '0.75rem' : '0.75rem 1rem' }}
                >
                    <LogOut size={20} style={iconStyle} />
                    {!collapsed && <span style={{ marginLeft: '12px' }}>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
