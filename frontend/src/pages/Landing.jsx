import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Box, Activity, Factory, PieChart, ShieldCheck } from 'lucide-react';

const Landing = () => {
    return (
        <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem 5%', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '-0.5px' }}>Industrax</div>
                <div>
                    <Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none', marginRight: '2rem', fontWeight: 500, transition: 'color 0.2s' }}>Log in</Link>
                    <Link to="/register" style={{ backgroundColor: '#38bdf8', color: '#0f172a', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, transition: 'background-color 0.2s' }}>Get Started</Link>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{ textAlign: 'center', padding: '6rem 5%', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(15,23,42,0) 70%)', zIndex: 0 }}></div>
                <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-1px' }}>
                        Supercharge Your <span style={{ color: '#38bdf8' }}>Factory</span> Operations
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '2.5rem', lineHeight: 1.5 }}>
                        The all-in-one execution system building the future of manufacturing. Manage inventory, plan BOMs, run production, and track orders in real-time.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/register" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#38bdf8', color: '#0f172a', padding: '1rem 2rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem', transition: 'transform 0.2s, box-shadow 0.2s' }} className="hero-btn">
                            Get Started Now <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '5rem 5%', backgroundColor: '#0f172a' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Everything you need to scale</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                    
                    {[
                        { icon: <Factory size={32} color="#38bdf8" />, title: 'Production Management', desc: 'Track jobs, manage statuses, and monitor facility throughput effortlessly.' },
                        { icon: <Box size={32} color="#38bdf8" />, title: 'Inventory Tracking', desc: 'Keep tabs on raw materials and finished goods with high precision accuracy.' },
                        { icon: <Activity size={32} color="#38bdf8" />, title: 'BOM-based Manufacturing', desc: 'Auto-deduct raw materials based on multi-level Bills of Materials.' },
                        { icon: <PieChart size={32} color="#38bdf8" />, title: 'Real-time Dashboard', desc: 'Visualize your entire enterprise from orders to shipments dynamically.' },
                        { icon: <ShieldCheck size={32} color="#38bdf8" />, title: 'Audit Ready & SOC2 Compliant', desc: 'Every action is securely logged and trackable for internal forensics.' }
                    ].map((feat, i) => (
                        <div key={i} style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '16px', border: '1px solid #334155', transition: 'transform 0.3s' }} className="feature-card">
                            <div style={{ marginBottom: '1rem' }}>{feat.icon}</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{feat.title}</h3>
                            <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Landing;
