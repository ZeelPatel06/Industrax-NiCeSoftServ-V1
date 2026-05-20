import React, { useState, useEffect } from 'react';
import employeeService from '../services/employeeService';
import attendanceService from '../services/attendanceService';
import { UserPlus, Calendar, IndianRupee, Phone, Briefcase, Plus, X, Check, XCircle, Search, Clock } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        role: 'Worker',
        dailyWage: '',
        email: '',
        password: ''
    });
    // Use current date for attendance view/mark by default
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        try {
            const [empData, attData] = await Promise.all([
                employeeService.getAll().catch(() => []),
                attendanceService.getAll().catch(() => [])
            ]);
            setEmployees(empData || []);
            setAttendance(attData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load data. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (emp) => {
        setEditingEmployee(emp);
        setFormData({
            name: emp.name,
            phoneNumber: emp.mobile || '',
            role: emp.role,
            dailyWage: emp.dailyWage,
            email: emp.email || '',
            password: '' // Don't show old password
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this employee and revoke their access?")) {
            try {
                await employeeService.delete(id);
                fetchData();
            } catch (error) {
                setError(error.response?.data?.message || "Failed to delete employee");
            }
        }
    };

    const submitEmployee = async (e) => {
        e.preventDefault();
        try {
            if (editingEmployee) {
                await employeeService.update(editingEmployee._id, {
                    ...formData,
                    dailyWage: Number(formData.dailyWage)
                });
            } else {
                await employeeService.create({
                    ...formData,
                    dailyWage: Number(formData.dailyWage)
                });
            }
            setFormData({ name: '', phoneNumber: '', role: 'Worker', dailyWage: '', email: '', password: '' });
            setEditingEmployee(null);
            setShowModal(false);
            fetchData();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to save employee');
        }
    };

    const markAttendance = async (userId, status, checkOut = false) => {
        try {
            await attendanceService.mark({
                userId,
                date: currentDate,
                status,
                checkOut
            });
            fetchData();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to mark attendance');
        }
    };

    const getEmployeeStats = (empId) => {
        const selectedDate = new Date(currentDate);
        const targetMonth = selectedDate.getMonth();
        const targetYear = selectedDate.getFullYear();
        
        const records = attendance.filter(a => {
            const isUser = a.userId?._id === empId || a.userId === empId;
            if (!isUser) return false;
            const recordDate = new Date(a.date);
            return recordDate.getMonth() === targetMonth && recordDate.getFullYear() === targetYear;
        });
        const presentDays = records.filter(a => a.status === 'Present').length;
        const emp = employees.find(e => e._id === empId);
        const wages = presentDays * (emp?.dailyWage || 0);
        return { presentDays, wages };
    };

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper to format check-in time with legacy support
    const formatTime = (timeStr) => {
        if (!timeStr) return '-';
        // If it's already formatted (legacy "04:28 AM"), return as is
        if (/^\d{2}:\d{2} [AP]M$/.test(timeStr)) return timeStr;
        
        try {
            const date = new Date(timeStr);
            if (isNaN(date.getTime())) return timeStr;
            return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (err) {
            return timeStr;
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>Staff Management</h1>
                <div className="header-actions">
                    <div className="search-container" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="form-control"
                            style={{ paddingLeft: '40px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    </div>
                    <div className="header-actions-group">
                        <button className="btn btn-primary" onClick={() => { setEditingEmployee(null); setFormData({ name: '', phoneNumber: '', role: 'Worker', dailyWage: '', email: '', password: '' }); setShowModal(true); }}>
                            <Plus size={18} style={{ marginRight: '8px' }} /> Add Staff
                        </button>
                        <input 
                            type="date" 
                            value={currentDate} 
                            onChange={(e) => setCurrentDate(e.target.value)} 
                            className="form-control" 
                            style={{ width: 'auto' }}
                        />
                    </div>
                </div>
            </div>

            {error && <ErrorMessage message={error} onClose={() => setError('')} />}

            <div className="glass-card table-container">
                <table className="glass-table">
                    <thead>
                        <tr>
                            <th>Employee Name</th>
                            <th>Role & Account</th>
                            <th>Wage Pattern</th>
                            <th>Attendance Level</th>
                            <th>Total Payable</th>
                            <th>Today ({new Date(currentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map(emp => {
                            const stats = getEmployeeStats(emp._id);
                            const todayRecord = attendance.find(a => 
                                (a.userId?._id === emp._id || a.userId === emp._id) && 
                                new Date(a.date).toISOString().split('T')[0] === currentDate
                            );

                            return (
                                <tr key={emp._id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.mobile || 'No phone'}</div>
                                    </td>
                                    <td>
                                        <span className="badge badge-primary" style={{ marginBottom: '5px' }}>{emp.role}</span>
                                        {emp.email ? (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: 600 }}>
                                                Login Enabled: {emp.email}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Offline Only</div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <IndianRupee size={14} className="text-success" />
                                            {emp.dailyWage?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / day
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Calendar size={14} className="text-primary" />
                                            {stats.presentDays} Days Present
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700, color: 'var(--accent-color)' }}>
                                        ₹{stats.wages.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                    </td>
                                    <td>
                                        {todayRecord ? (
                                            <>
                                                <span className={`badge ${todayRecord.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>
                                                    {todayRecord.status}
                                                </span>
                                                {todayRecord.checkInTime && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <Clock size={10} className="text-primary" /> Arr: {formatTime(todayRecord.checkInTime)}
                                                    </div>
                                                )}
                                                {todayRecord.checkOutTime && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <Clock size={10} className="text-warning" /> Lve: {formatTime(todayRecord.checkOutTime)}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>Pending</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            {/* Check In */}
                                            <button 
                                                className="btn" 
                                                style={{ 
                                                    padding: '6px', 
                                                    background: todayRecord?.status === 'Present' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.08)', 
                                                    color: todayRecord?.status === 'Present' ? 'var(--success-color)' : 'rgba(16, 185, 129, 0.6)',
                                                    border: todayRecord?.status === 'Present' ? '1px solid var(--success-color)' : '1px solid transparent',
                                                    fontWeight: todayRecord?.status === 'Present' ? 'bold' : 'normal'
                                                }}
                                                onClick={() => markAttendance(emp._id, 'Present')}
                                                title="Check In"
                                            >
                                                <Check size={18} />
                                            </button>

                                            {/* Check Out */}
                                            <button 
                                                className="btn" 
                                                style={{ 
                                                    padding: '6px', 
                                                    background: todayRecord?.checkOutTime ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.08)', 
                                                    color: todayRecord?.checkOutTime ? 'var(--warning-color)' : 'rgba(245, 158, 11, 0.6)',
                                                    border: todayRecord?.checkOutTime ? '1px solid var(--warning-color)' : '1px solid transparent',
                                                    opacity: (!todayRecord || todayRecord.status !== 'Present') ? 0.4 : 1
                                                }}
                                                onClick={() => markAttendance(emp._id, 'Present', true)}
                                                disabled={!todayRecord || todayRecord.status !== 'Present'}
                                                title={todayRecord?.checkOutTime ? "Checked Out" : "Check Out"}
                                            >
                                                <Clock size={18} />
                                            </button>

                                            {/* Mark Absent */}
                                            <button 
                                                className="btn" 
                                                style={{ 
                                                    padding: '6px', 
                                                    background: todayRecord?.status === 'Absent' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.08)', 
                                                    color: todayRecord?.status === 'Absent' ? 'var(--danger-color)' : 'rgba(239, 68, 68, 0.6)',
                                                    border: todayRecord?.status === 'Absent' ? '1px solid var(--danger-color)' : '1px solid transparent'
                                                }}
                                                onClick={() => markAttendance(emp._id, 'Absent')}
                                                title="Mark Absent"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                            <button 
                                                className="btn" 
                                                style={{ padding: '6px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}
                                                onClick={() => handleEdit(emp)}
                                                title="Edit Staff"
                                            >
                                                <Briefcase size={18} />
                                            </button>
                                            <button 
                                                className="btn" 
                                                style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}
                                                onClick={() => handleDelete(emp._id)}
                                                title="Remove Staff"
                                            >
                                                <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredEmployees.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    No employees found.
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
                            <h2>{editingEmployee ? "Edit Employee Account" : "Add New Employee"}</h2>
                            <button className="btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={submitEmployee}>
                            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            style={{ paddingLeft: '40px' }}
                                            value={formData.name} 
                                            onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                            required 
                                        />
                                        <UserPlus size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="tel" 
                                            className="form-control" 
                                            style={{ paddingLeft: '40px' }}
                                            value={formData.phoneNumber} 
                                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} 
                                        />
                                        <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Job Role</label>
                                    <div style={{ position: 'relative' }}>
                                        <select 
                                            className="form-control" 
                                            style={{ paddingLeft: '40px' }}
                                            value={formData.role} 
                                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                                        >
                                            <option value="Worker">Worker / Labor</option>
                                            <option value="Operator">Machine Operator</option>
                                            <option value="Helper">Helper</option>
                                            <option value="Engineer">Engineer</option>
                                        </select>
                                        <Briefcase size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Daily Wage (₹)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="number" step="0.0001" 
                                            className="form-control" 
                                            style={{ paddingLeft: '40px' }}
                                            value={formData.dailyWage} 
                                            onChange={(e) => setFormData({...formData, dailyWage: e.target.value})} 
                                            required 
                                        />
                                        <IndianRupee size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginTop: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Login Credentials (Optional)</h4>
                                <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Email / Username</label>
                                        <input 
                                            type="email" 
                                            className="form-control" 
                                            placeholder="emp@factory.com"
                                            value={formData.email} 
                                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{editingEmployee ? "New Password (Leave blank to keep)" : "Login Password"}</label>
                                        <input 
                                            type="password" 
                                            className="form-control" 
                                            placeholder="Setting a password enables login"
                                            value={formData.password} 
                                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                            required={!editingEmployee && formData.email}
                                        />
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}> * Employees with an email and password will be able to log in with Operator permissions.</p>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                                    {editingEmployee ? "Update Employee" : "Save & Create Account"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;
