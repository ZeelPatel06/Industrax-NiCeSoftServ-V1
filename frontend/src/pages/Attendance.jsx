import React, { useState, useEffect } from 'react';
import attendanceService from '../services/attendanceService';
import employeeService from '../services/employeeService';
import { Calendar, CheckCircle, Clock, IndianRupee, Search, User, Filter, ArrowRight } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';

const Attendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [myEmployeeRecord, setMyEmployeeRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const isOwner = userInfo?.role === 'Owner';

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await attendanceService.getAll(filterDate).catch(() => []);
            setAttendance(data || []);

            if (!isOwner) {
                const emps = await employeeService.getAll().catch(() => []);
                const me = emps.find(e => e._id === userInfo._id);
                setMyEmployeeRecord(me);
            }
        } catch (err) {
            console.error('Attendance fetch error', err);
            setError('Could not load attendance data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterDate]);

    const handleCheckIn = async () => {
        try {
            await attendanceService.mark({
                status: 'Present',
                date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Check-in failed');
        }
    };

    const handleMarkAbsent = async () => {
        try {
            await attendanceService.mark({
                status: 'Absent',
                date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (err) {
            setError('Failed to mark absent');
        }
    };

    const getStats = () => {
        if (isOwner) return null;
        const presentDays = attendance.filter(a => a.status === 'Present').length;
        const earnings = presentDays * (myEmployeeRecord?.dailyWage || 0);
        return { presentDays, earnings };
    };

    const stats = getStats();
    const todayRecord = attendance.find(a => 
        new Date(a.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] &&
        (!isOwner ? (a.userId?._id === userInfo?._id || a.userId === userInfo?._id) : true)
    );

    const filteredRecords = isOwner 
        ? attendance.filter(a => a.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : attendance;

    if (loading) return <div className="p-4">Loading attendance...</div>;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>{isOwner ? 'Organization Attendance' : 'My Daily Attendance'}</h1>
                <div className="header-actions">
                    {isOwner && (
                        <div className="search-container" style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Search employee..." 
                                style={{ paddingLeft: '40px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Filter size={18} className="text-secondary" />
                        <input 
                            type="date" 
                            className="form-control" 
                            value={filterDate} 
                            onChange={(e) => setFilterDate(e.target.value)} 
                        />
                    </div>
                </div>
            </div>

            {error && <ErrorMessage message={error} onClose={() => setError('')} />}

            {!isOwner && (
                <div className="grid-3-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <CheckCircle size={30} className="text-primary" />
                        </div>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Today's Status</h3>
                        <div style={{ marginTop: '1rem' }}>
                            {todayRecord ? (
                                <span className={`badge ${todayRecord.status === 'Present' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '1.1rem', padding: '8px 20px' }}>
                                    {todayRecord.status}
                                </span>
                            ) : (
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    <button className="btn btn-primary" onClick={handleCheckIn}>Mark Present</button>
                                    <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }} onClick={handleMarkAbsent}>Absent</button>
                                </div>
                            )}
                        </div>
                        {todayRecord?.checkInTime && (
                            <p style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <Clock size={12} style={{ marginRight: '4px' }} /> Checked in at {todayRecord.checkInTime}
                            </p>
                        )}
                    </div>

                    <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <Calendar size={30} className="text-success" />
                        </div>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Days Present (Selected Filter)</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>{stats.presentDays}</p>
                    </div>

                    <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <IndianRupee size={30} style={{ color: '#f59e0b' }} />
                        </div>
                        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Estimated Earnings</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--success-color)' }}>
                            ₹{stats.earnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Based on ₹{myEmployeeRecord?.dailyWage?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}/day</p>
                    </div>
                </div>
            )}

            <div className="glass-card table-container">
                <table className="glass-table">
                    <thead>
                        <tr>
                            {isOwner && <th>Employee</th>}
                            <th>Date</th>
                            <th>Status</th>
                            <th>Arrival Time</th>
                            {!isOwner && <th>Amount Earned</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map(rec => (
                            <tr key={rec._id}>
                                {isOwner && (
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{rec.userId?.name || 'Unknown'}</div>
                                    </td>
                                )}
                                <td>{new Date(rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td>
                                    <span className={`badge ${rec.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>
                                        {rec.status}
                                    </span>
                                </td>
                                <td>
                                    {rec.checkInTime ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Clock size={14} className="text-primary" />
                                            {rec.checkInTime}
                                        </div>
                                    ) : '-'}
                                </td>
                                {!isOwner && (
                                <td style={{ fontWeight: 600 }}>
                                    {rec.status === 'Present' ? `₹${myEmployeeRecord?.dailyWage?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '₹0.00'}
                                </td>
                                )}
                            </tr>
                        ))}
                        {filteredRecords.length === 0 && (
                            <tr>
                                <td colSpan={isOwner ? 4 : 4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No attendance records found for this period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Attendance;
