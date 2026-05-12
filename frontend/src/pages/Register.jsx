import authService from '../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, Phone, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [ownerPassword, setOwnerPassword] = useState('');
    
    // OTP State
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [otp, setOtp] = useState('');

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const submitRegisterHandler = async (e) => {
        e.preventDefault();

        try {
            let payload = {
                name,
                email,
                mobile,
                password,
            };

            const data = await authService.register(payload);
            
            if (data.isVerified) {
                if (!data || !data._id) {
                    setError('Registration successful but missing user data. Please login.');
                    return;
                }
                localStorage.setItem("userInfo", JSON.stringify(data));
                const hasOnboarded = data.role === 'Owner' ? (Array.isArray(data.selectedModules) && data.selectedModules.length > 0) : true;
                const redirectPath = data.role === 'Operator' ? '/production' : (!hasOnboarded ? '/onboarding' : '/dashboard');
                window.location.href = redirectPath;
                return;
            }

            setSuccessMessage(data.message || 'OTP sent successfully!');
            setIsOtpSent(true);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const submitOtpHandler = async (e) => {
        e.preventDefault();
        try {
            const data = await authService.verifyOtp(email, otp);
            if (!data || !data._id) {
                setError('Verification successful but missing user data. Please login.');
                return;
            }
            localStorage.setItem("userInfo", JSON.stringify(data));
            const hasOnboarded = data.role === 'Owner' ? (Array.isArray(data.selectedModules) && data.selectedModules.length > 0) : true;
            const redirectPath = data.role === 'Operator' ? '/production' : (!hasOnboarded ? '/onboarding' : '/dashboard');
            window.location.href = redirectPath;
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const resendOtpHandler = async () => {
        try {
            setError('');
            setSuccessMessage('');
            const data = await authService.register({ name, email, mobile, password });
            setSuccessMessage(data.message || 'OTP resent successfully!');
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    return (
        <div className="center-container">
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 600 }}>Industrax</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {isOtpSent ? 'Verify your email' : 'Register to access your owner dashboard'}
                    </p>
                </div>

                {error && <ErrorMessage message={error} onClose={() => setError('')} />}
                {successMessage && <div style={{ color: 'var(--success-color)', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '5px', marginBottom: '15px', fontSize: '0.875rem' }}>{successMessage}</div>}

                {!isOtpSent ? (
                    <form onSubmit={submitRegisterHandler}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--text-secondary)' }} size={20} />
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ paddingLeft: '40px' }}
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (error) setError('');
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <User style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--text-secondary)' }} size={20} />
                                <input
                                    type="email"
                                    className="form-control"
                                    style={{ paddingLeft: '40px' }}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError('');
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mobile Number</label>
                            <div style={{ position: 'relative' }}>
                                <Phone style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--text-secondary)' }} size={20} />
                                <input
                                    type="tel"
                                    className="form-control"
                                    style={{ paddingLeft: '40px' }}
                                    value={mobile}
                                    onChange={(e) => {
                                        setMobile(e.target.value);
                                        if (error) setError('');
                                    }}
                                    pattern="[0-9]{10}"
                                    title="10-digit mobile number"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--text-secondary)' }} size={20} />
                                <input
                                    type="password"
                                    className="form-control"
                                    style={{ paddingLeft: '40px' }}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError('');
                                    }}
                                    minLength="6"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                            Register as Owner
                        </button>
                        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                            Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)' }}>Login</Link>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={submitOtpHandler}>
                        <div className="form-group">
                            <label className="form-label">Verification OTP</label>
                            <div style={{ position: 'relative' }}>
                                <CheckCircle style={{ position: 'absolute', top: '10px', left: '10px', color: 'var(--text-secondary)' }} size={20} />
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ paddingLeft: '40px' }}
                                    value={otp}
                                    onChange={(e) => {
                                        setOtp(e.target.value);
                                        if (error) setError('');
                                    }}
                                    maxLength="6"
                                    placeholder="Enter 6-digit OTP"
                                    required
                                />
                            </div>
                            <p style={{ fontSize: '12px', marginTop: '10px' }}>An email containing a 6-digit verification code has been sent to <strong>{email}</strong>.</p>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                            Verify Account
                        </button>
                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Didn't receive the code?{' '}
                                <button
                                    type="button"
                                    onClick={resendOtpHandler}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 500 }}
                                >
                                    Resend OTP
                                </button>
                            </p>
                            <button
                                type="button"
                                onClick={() => setIsOtpSent(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '1rem', fontSize: '0.875rem' }}
                            >
                                Back to Registration
                            </button>
                        </div>
                    </form>
                ) }
            </div>
        </div>
    );
};

export default Register;
