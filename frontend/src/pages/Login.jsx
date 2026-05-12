import authService from '../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { useState } from 'react';
import ErrorMessage from '../components/ErrorMessage';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const data = await authService.login(email, password);
            localStorage.setItem('userInfo', JSON.stringify(data));
            const hasOnboarded = data.role === 'Owner' ? (Array.isArray(data.selectedModules) && data.selectedModules.length > 0) : true;
            const redirectPath = data.role === 'Operator' ? '/production' : (!hasOnboarded ? '/onboarding' : '/dashboard');
            window.location.href = redirectPath;
        } catch (err) {
            setError(err.response && err.response.data.message ? err.response.data.message : err.message);
        }
    };

    return (
        <div className="center-container">
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 600 }}>Industrax</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Login to access your dashboard</p>
                </div>

                {error && <ErrorMessage message={error} onClose={() => setError('')} />}

                <form onSubmit={submitHandler}>
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
                                required
                            />
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                            <Link to="/forgot-password" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none' }}>Forgot Password?</Link>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        Login
                    </button>
                    <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                        Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)' }}>Register</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
