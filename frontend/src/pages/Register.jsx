/**
 * Registration page with multi-field form and glassmorphism design.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, MapPin, AlertCircle, Zap } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    bio: '', location: '',
  });
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const result = await register({
      name: form.name, email: form.email, password: form.password,
      bio: form.bio, location: form.location,
    });
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const fields = [
    { name: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'John Doe', required: true },
    { name: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'you@example.com', required: true },
    { name: 'password', label: 'Password', icon: Lock, type: 'password', placeholder: '••••••••', required: true },
    { name: 'confirmPassword', label: 'Confirm Password', icon: Lock, type: 'password', placeholder: '••••••••', required: true },
    { name: 'location', label: 'Location', icon: MapPin, type: 'text', placeholder: 'New York, USA' },
  ];

  return (
    <div className="gradient-bg" style={{
      minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem 1.5rem', position: 'relative',
    }}>
      <div className="glass-card animate-fade-in-up" style={{
        width: '100%', maxWidth: '480px', padding: '2.5rem 2rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'var(--gradient-accent)', margin: '0 auto 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={26} color="white" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.4rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Start exchanging skills today
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem', borderRadius: '10px',
            background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)',
            color: '#FF6B81', fontSize: '0.85rem', marginBottom: '1rem',
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {fields.map(({ name, label, icon: Icon, type, placeholder, required }) => (
            <div key={name}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                {label}
              </label>
              <div style={{ position: 'relative' }}>
                <Icon size={16} style={{
                  position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }} />
                <input
                  name={name} type={type} value={form[name]}
                  onChange={handleChange} placeholder={placeholder}
                  required={required}
                  className="input-field" style={{ paddingLeft: '2.5rem', padding: '0.75rem 1rem 0.75rem 2.5rem' }}
                />
              </div>
            </div>
          ))}

          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
              Bio (optional)
            </label>
            <textarea
              name="bio" value={form.bio} onChange={handleChange}
              placeholder="Tell us about yourself..."
              className="input-field" style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}
            style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            {isLoading ? 'Creating account...' : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
