import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import ErrorMessage from '../components/ErrorMessage';
import { Mail, Lock, ArrowLeft, CheckCircle, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password, 3: Success
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await authService.forgotPassword(email);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'We couldn\'t find an account with that email.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            await authService.resetPassword({ email, otp, newPassword });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP or expired. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper" style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'radial-gradient(circle at top right, rgba(124, 58, 237, 0.1), transparent), radial-gradient(circle at bottom left, rgba(124, 58, 237, 0.05), transparent), #0a0a0f',
            padding: '2rem'
        }}>
            <div className="glass-card animate-fade-in" style={{ 
                width: '100%', 
                maxWidth: '450px', 
                padding: '2.5rem', 
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                {/* Decorative Elements */}
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--primary-color)', filter: 'blur(100px)', opacity: 0.15, pointerEvents: 'none' }} />
                
                <div className="auth-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        background: 'rgba(124, 58, 237, 0.1)', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 1.5rem',
                        color: 'var(--primary-color)',
                        border: '1px solid rgba(124, 58, 237, 0.2)'
                    }}>
                        {step === 1 && <KeyRound size={32} />}
                        {step === 2 && <ShieldCheck size={32} />}
                        {step === 3 && <CheckCircle size={32} />}
                    </div>
                    
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'white' }}>
                        {step === 1 && "Reset Password"}
                        {step === 2 && "Verification"}
                        {step === 3 && "Success!"}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        {step === 1 && "Don't worry! Enter your email and we'll send you a 6-digit code to reset your password."}
                        {step === 2 && <span>We've sent a code to <br/><strong style={{ color: 'var(--primary-color)' }}>{email}</strong></span>}
                        {step === 3 && "Your password has been securely updated. You can now log in with your new credentials."}
                    </p>
                </div>

                {error && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <ErrorMessage message={error} onClose={() => setError('')} />
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleEmailSubmit} className="fade-in">
                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block', fontWeight: 500 }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ paddingLeft: '48px', height: '52px', background: 'rgba(255,255,255,0.03)' }}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '52px', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={isLoading}>
                            {isLoading ? 'Processing...' : (
                                <>
                                    Send Reset Code <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleResetSubmit} className="fade-in">
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Verification Code</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="0 0 0 0 0 0"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.25rem', fontWeight: 700, height: '52px', background: 'rgba(255,255,255,0.03)' }}
                                maxLength={6}
                                required
                            />
                        </div>
                        
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '2rem 0' }} />

                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                            <label className="form-label">New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    style={{ paddingLeft: '48px', height: '52px', background: 'rgba(255,255,255,0.03)' }}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label className="form-label">Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{ paddingLeft: '48px', height: '52px', background: 'rgba(255,255,255,0.03)' }}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '52px', fontSize: '1rem', fontWeight: 600 }} disabled={isLoading}>
                            {isLoading ? 'Updating...' : 'Verify & Reset Password'}
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={() => setStep(1)} 
                            className="btn btn-outline" 
                            style={{ width: '100%', marginTop: '1rem', border: 'none', color: 'var(--text-secondary)' }}
                        >
                            Change Email
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <div style={{ textAlign: 'center' }} className="fade-in">
                        <div style={{ marginBottom: '2rem', color: '#52c41a' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(82, 196, 26, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                <CheckCircle size={48} />
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/login')} 
                            className="btn btn-primary"
                            style={{ width: '100%', height: '52px', fontSize: '1rem', fontWeight: 600 }}
                        >
                            Back to Login
                        </button>
                    </div>
                )}

                {step !== 3 && (
                    <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                        <Link to="/login" style={{ 
                            color: 'var(--text-secondary)', 
                            textDecoration: 'none', 
                            fontSize: '0.9rem', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            transition: 'color 0.2s'
                        }} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
