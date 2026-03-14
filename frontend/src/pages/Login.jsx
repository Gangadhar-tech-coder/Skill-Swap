/**
 * Login page with glassmorphism card design and form validation.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Zap, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="gradient-bg" style={{
      minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem 1.5rem', position: 'relative',
    }}>
      <div className="glass-card animate-fade-in-up" style={{
        width: '100%', maxWidth: '440px', padding: '3rem 2.5rem',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '16px',
            background: 'var(--gradient-primary)', margin: '0 auto 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Login to continue your skill journey
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem', borderRadius: '10px',
            background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)',
            color: '#FF6B81', fontSize: '0.85rem', marginBottom: '1.5rem',
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }} />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="input-field" style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }} />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="input-field" style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}
            style={{ width: '100%', padding: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            {isLoading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        {/* Demo login hint */}
        <div style={{
          marginTop: '1.5rem', padding: '0.75rem', borderRadius: '10px',
          background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)',
          textAlign: 'center', fontSize: '0.8rem', color: 'var(--accent-light)',
        }}>
          Demo: alice@example.com / password123
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
