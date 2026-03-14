/**
 * Navbar component - responsive navigation with auth-aware links.
 * Features glassmorphism design, mobile hamburger menu, and user avatar.
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Zap, User, LogOut, LayoutDashboard, Store, Sparkles, Wallet, Shield, MessageSquare, Award, BookOpen } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const { toggleChat } = useChatStore();

  const isActive = (path) => location.pathname === path;

  const navLinks = token ? [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/marketplace', label: 'Marketplace', icon: Store },
    { to: '/matches', label: 'Matches', icon: Sparkles },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
    { to: '/courses', label: 'Courses', icon: BookOpen },
    { to: '/premium', label: 'Premium', icon: Award },
  ] : [];

  return (
    <nav className="glass" style={{
      position: 'sticky', top: 0, zIndex: 50,
      borderBottom: '1px solid rgba(108,99,255,0.1)',
      borderRadius: 0,
    }}>
      <div style={{
        maxWidth: '1280px', margin: '0 auto',
        padding: '0.75rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div style={{
            background: 'var(--gradient-primary)',
            borderRadius: '10px', padding: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={22} color="white" />
          </div>
          <span style={{
            fontSize: '1.25rem', fontWeight: 700,
            background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>SkillSwap</span>
        </Link>

        {/* Desktop Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
             className="hidden md:flex">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', borderRadius: '10px',
              color: isActive(to) ? 'var(--primary-light)' : 'var(--text-secondary)',
              background: isActive(to) ? 'rgba(108,99,255,0.1)' : 'transparent',
              textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
              transition: 'var(--transition)',
            }}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>

        {/* Auth Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
             className="hidden md:flex">
          {token ? (
            <>
              {user?.is_admin && (
                <Link to="/admin" style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem',
                }}>
                  <Shield size={14} /> Admin
                </Link>
              )}
              
              <button onClick={toggleChat} style={{
                background: 'rgba(108,99,255,0.15)', border: 'none', color: 'var(--primary-light)',
                width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)'
              }}>
                <MessageSquare size={18} />
              </button>

              <Link to="/profile" style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                textDecoration: 'none', color: 'var(--text-primary)',
              }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 600,
                }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.name?.split(' ')[0]}</span>
              </Link>
              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.85rem',
              }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                Login
              </Link>
              <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', textDecoration: 'none' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden" style={{
          padding: '1rem 1.5rem', borderTop: '1px solid rgba(108,99,255,0.1)',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setIsOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1rem', borderRadius: '10px',
              color: isActive(to) ? 'var(--primary-light)' : 'var(--text-secondary)',
              background: isActive(to) ? 'rgba(108,99,255,0.1)' : 'transparent',
              textDecoration: 'none', fontSize: '0.95rem',
            }}>
              <Icon size={18} /> {label}
            </Link>
          ))}
          {token ? (
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1rem', background: 'none', border: 'none',
              color: 'var(--secondary)', cursor: 'pointer', fontSize: '0.95rem',
            }}>
              <LogOut size={18} /> Logout
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Link to="/login" className="btn-secondary" onClick={() => setIsOpen(false)}
                style={{ flex: 1, textAlign: 'center', padding: '0.6rem', fontSize: '0.9rem' }}>Login</Link>
              <Link to="/register" className="btn-primary" onClick={() => setIsOpen(false)}
                style={{ flex: 1, textAlign: 'center', padding: '0.6rem', fontSize: '0.9rem', textDecoration: 'none' }}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
