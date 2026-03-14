/**
 * Admin Dashboard – user management, session overview, platform stats.
 * Only accessible by admin users.
 */
import { useState, useEffect } from 'react';
import { Shield, Users, BookOpen, Ban, UserCheck, BarChart3, AlertCircle, Award, Check, X } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [premiumRequests, setPremiumRequests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, sessionsRes, statsRes, premiumRes, coursesRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/sessions'),
        api.get('/api/admin/stats'),
        api.get('/api/admin/premium-requests'),
        api.get('/api/courses/'),
      ]);
      setUsers(usersRes.data);
      setSessions(sessionsRes.data);
      setStats(statsRes.data);
      setPremiumRequests(premiumRes.data);
      setCourses(coursesRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handlePremiumAction = async (requestId, action) => {
    try {
      await api.post(`/api/admin/premium-requests/${requestId}/${action}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Action failed');
    }
  };

  const handleBan = async (userId, isBanned) => {
    try {
      await api.post(`/api/admin/${isBanned ? 'unban' : 'ban'}/${userId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Action failed');
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="gradient-bg" style={{
        minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)' }}>You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading admin data...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, count: stats?.total_users },
    { id: 'sessions', label: 'Sessions', icon: BookOpen, count: stats?.total_sessions },
    { id: 'premium', label: 'Premium Requests', icon: Award, count: premiumRequests.length },
    { id: 'courses', label: 'Courses', icon: BookOpen, count: courses.length },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
  ];

  return (
    <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', padding: '2rem 1.5rem', position: 'relative' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Shield size={28} color="var(--accent)" />
            Admin <span style={{ background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dashboard</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage users, sessions, and platform health</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.6rem 1.25rem', borderRadius: '10px',
                background: tab === id ? 'rgba(108,99,255,0.15)' : 'transparent',
                border: `1px solid ${tab === id ? 'var(--primary)' : 'rgba(108,99,255,0.15)'}`,
                color: tab === id ? 'var(--primary-light)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
                transition: 'var(--transition)',
              }}>
              <Icon size={16} /> {label}
              {count !== undefined && (
                <span style={{
                  background: 'rgba(108,99,255,0.2)', borderRadius: '6px',
                  padding: '0.1rem 0.4rem', fontSize: '0.72rem',
                }}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="glass-card animate-fade-in">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(108,99,255,0.15)' }}>
                    {['Name', 'Email', 'Credits', 'Reputation', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '0.75rem 1rem',
                        color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(108,99,255,0.06)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.8rem', fontWeight: 600,
                          }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500 }}>{u.name}</span>
                          {u.is_admin && <span className="badge badge-accent" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>Admin</span>}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{u.skill_credits.toFixed(1)}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ color: '#FFD700' }}>{'★'.repeat(Math.round(u.reputation_score))}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.3rem' }}>{u.reputation_score.toFixed(1)}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${u.is_banned ? 'badge-secondary' : 'badge-accent'}`}>
                          {u.is_banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {!u.is_admin && (
                          <button onClick={() => handleBan(u.id, u.is_banned)}
                            className={u.is_banned ? 'btn-accent' : 'btn-danger'}
                            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            {u.is_banned ? <><UserCheck size={14} /> Unban</> : <><Ban size={14} /> Ban</>}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {tab === 'sessions' && (
          <div className="glass-card animate-fade-in">
            {sessions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No sessions found</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sessions.map((s) => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.85rem 1rem', borderRadius: '10px',
                    background: 'rgba(15,15,26,0.4)', flexWrap: 'wrap', gap: '0.5rem',
                  }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                        {s.skill_offered} ↔ {s.skill_requested}
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        Teacher #{s.teacher_id} → Learner #{s.learner_id} • {s.duration}h
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${s.status === 'completed' ? 'badge-accent' : s.status === 'pending' ? 'badge-secondary' : 'badge-primary'}`}>
                        {s.status}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Premium Requests Tab */}
        {tab === 'premium' && (
          <div className="glass-card animate-fade-in">
            {premiumRequests.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No premium teacher requests</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {premiumRequests.map(req => (
                  <div key={req.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem', borderRadius: '10px', background: 'rgba(15,15,26,0.4)',
                    border: '1px solid rgba(108,99,255,0.08)', flexWrap: 'wrap', gap: '0.75rem',
                  }}>
                    <div>
                      <p style={{ fontWeight: 600 }}>User #{req.user_id}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        Document: <a href={req.license_document} target="_blank" rel="noreferrer"
                          style={{ color: 'var(--primary-light)' }}>{req.license_document?.substring(0, 40)}...</a>
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        Applied: {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {req.status === 'pending' ? (
                        <>
                          <button onClick={() => handlePremiumAction(req.id, 'approve')}
                            className="btn-accent" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Check size={14} /> Approve
                          </button>
                          <button onClick={() => handlePremiumAction(req.id, 'reject')}
                            className="btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <X size={14} /> Reject
                          </button>
                        </>
                      ) : (
                        <span className={`badge ${req.status === 'approved' ? 'badge-accent' : 'badge-secondary'}`}>
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Courses Tab */}
        {tab === 'courses' && (
          <div className="glass-card animate-fade-in">
            {courses.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No courses yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {courses.map(c => (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(15,15,26,0.4)',
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.title}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {c.category} • {c.lectures?.length || 0} lectures • Teacher #{c.teacher_id}
                      </p>
                    </div>
                    <span className="badge badge-primary">{c.price} credits</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {tab === 'stats' && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Total Users', value: stats.total_users, color: 'var(--primary)' },
              { label: 'Total Sessions', value: stats.total_sessions, color: 'var(--accent)' },
              { label: 'Completed', value: stats.completed_sessions, color: '#FFD700' },
              { label: 'Banned Users', value: stats.banned_users, color: 'var(--secondary)' },
              { label: 'Total Courses', value: stats.total_courses || 0, color: 'var(--primary-light)' },
              { label: 'Premium Requests', value: stats.pending_premium || 0, color: '#FF9800' },
            ].map((s, i) => (
              <div key={i} className="glass-card animate-fade-in-up" style={{ textAlign: 'center', padding: '2rem', animationDelay: `${i * 0.1}s` }}>
                <p style={{ fontSize: '2.5rem', fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
