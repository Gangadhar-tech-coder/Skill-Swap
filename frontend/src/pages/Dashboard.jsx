/**
 * User Dashboard – overview of credits, sessions, and quick actions.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, BookOpen, GraduationCap, Clock, Star, ArrowRight, Sparkles, Users, TrendingUp, Check, X, MessageSquare } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [wallet, setWallet] = useState(null);

  const fetchData = async () => {
    try {
      const [sessRes, walRes] = await Promise.all([
        api.get('/api/sessions/'),
        api.get('/api/wallet/'),
      ]);
      setSessions(sessRes.data);
      setWallet(walRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccept = async (id) => {
    try {
      await api.post(`/api/sessions/accept/${id}`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/api/sessions/reject/${id}`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const upcoming = sessions.filter(s => ['pending', 'accepted', 'in_progress'].includes(s.status));
  const completed = sessions.filter(s => s.status === 'completed');

  const statCards = [
    { label: 'Skill Credits', value: user?.skill_credits?.toFixed(1) || '0', icon: Wallet, gradient: 'var(--gradient-primary)' },
    { label: 'Reputation', value: `${user?.reputation_score?.toFixed(1) || '5.0'} ★`, icon: Star, gradient: 'var(--gradient-accent)' },
    { label: 'Sessions Done', value: completed.length, icon: GraduationCap, gradient: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C42 100%)' },
    { label: 'Active Sessions', value: upcoming.length, icon: Clock, gradient: 'linear-gradient(135deg, #42A5F5 0%, #6C63FF 100%)' },
  ];

  return (
    <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', padding: '2rem 1.5rem', position: 'relative' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Welcome Header */}
        <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Welcome back, <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {user?.name?.split(' ')[0]}
            </span>! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Here's your skill exchange overview</p>
        </div>
        
        {/* Skill Guard Banner */}
        {(!user?.skills || user?.skills.length === 0) && (
          <div className="glass-card animate-fade-in-down" style={{ background: 'rgba(255, 107, 157, 0.1)', border: '1px solid rgba(255, 107, 157, 0.3)', marginBottom: '2rem', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star size={24} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FF6B9D' }}>Action Required: Add Your Skills</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You haven't added any skills yet. To start requesting or offering skill swaps, you need at least one skill on your profile.</p>
              </div>
            </div>
            <Link to="/profile" className="btn-accent" style={{ textDecoration: 'none' }}>
              Add Skills Now
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {statCards.map((s, i) => (
            <div key={i} className="glass-card animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>{s.label}</p>
                  <p style={{ fontSize: '1.8rem', fontWeight: 700 }}>{s.value}</p>
                </div>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: s.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <s.icon size={22} color="white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <Link to="/marketplace" className="glass-card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '14px',
              background: 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={22} color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Browse Marketplace</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Find skills to learn from other users</p>
            </div>
            <ArrowRight size={18} color="var(--text-muted)" />
          </Link>

          <Link to="/matches" className="glass-card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '14px',
              background: 'rgba(0,212,170,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={22} color="var(--accent)" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>AI Match Suggestions</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>See your best skill swap partners</p>
            </div>
            <ArrowRight size={18} color="var(--text-muted)" />
          </Link>
        </div>

        {/* Recent Sessions */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Recent Sessions</h2>
            <span className="badge badge-primary">{sessions.length} total</span>
          </div>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <BookOpen size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No sessions yet. Start by browsing the marketplace!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem', borderRadius: '10px',
                  background: 'rgba(15,15,26,0.4)', border: '1px solid rgba(108,99,255,0.1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: session.teacher_id === user?.id
                        ? 'rgba(0,212,170,0.15)' : 'rgba(108,99,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {session.teacher_id === user?.id
                        ? <TrendingUp size={16} color="var(--accent)" />
                        : <BookOpen size={16} color="var(--primary)" />}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                        {session.teacher_id === user?.id ? `Teaching: ${session.skill_offered}` : `Learning: ${session.skill_requested}`}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {session.duration}h • {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge ${session.status === 'completed' ? 'badge-accent' : session.status === 'pending' ? 'badge-secondary' : 'badge-primary'}`}>
                      {session.status}
                    </span>
                    
                    {session.status === 'pending' && session.teacher_id === user?.id && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => handleAccept(session.id)} className="btn-accent" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Check size={14} /> Accept
                        </button>
                        <button onClick={() => handleReject(session.id)} className="btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}

                    {(session.status === 'accepted' || session.status === 'in_progress') && (
                      <Link to={`/session/${session.id}`} className="btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none' }}>
                        <MessageSquare size={14} /> Chat
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
