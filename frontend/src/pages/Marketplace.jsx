/**
 * Skill Marketplace – browse and search skills offered by other users.
 * Features search, filters, and skill cards with request action.
 */
import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Clock, Filter, ArrowRight, BookOpen } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function Marketplace() {
  const { user } = useAuthStore();
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [minRating, setMinRating] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (location) params.append('location', location);
      if (minRating) params.append('min_rating', minRating);
      params.append('skill_type', 'teach');
      const res = await api.get(`/api/skills/browse?${params}`);
      // Filter out own skills
      setSkills(res.data.filter(s => s.user?.id !== user?.id));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchSkills(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSkills();
  };

  const handleRequest = async (skill) => {
    setRequestingId(skill.id);
    try {
      await api.post('/api/sessions/request', {
        teacher_id: skill.user.id,
        skill_offered: 'Skill Exchange',
        skill_requested: skill.skill_name,
        duration: 1.0,
      });
      setSuccess(`Request sent to ${skill.user.name}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Request failed');
    }
    setRequestingId(null);
  };

  return (
    <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', padding: '2rem 1.5rem', position: 'relative' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Skill <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Marketplace</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Discover skills offered by our community</p>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '10px',
            background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)',
            color: 'var(--accent-light)', fontSize: '0.9rem',
          }}>
            ✅ {success}
          </div>
        )}

        {/* Search & Filters */}
        <div className="glass-card animate-fade-in-up" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
              <Search size={18} style={{
                position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }} />
              <input className="input-field" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search skills... (e.g. Python, Design)" style={{ paddingLeft: '2.75rem' }} />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '0.85rem 1.5rem' }}>
              Search
            </button>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className="btn-secondary"
              style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={16} /> Filters
            </button>
          </form>

          {showFilters && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.3rem', display: 'block' }}>Location</label>
                <input className="input-field" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="City or country" />
              </div>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.3rem', display: 'block' }}>Min Rating</label>
                <select className="input-field" value={minRating} onChange={e => setMinRating(e.target.value)}>
                  <option value="">Any</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Skills Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            Loading skills...
          </div>
        ) : skills.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No skills found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {skills.map((skill) => (
              <div key={skill.id} className="glass-card animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600,
                  }}>
                    {skill.user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{skill.user?.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <MapPin size={12} /> {skill.user?.location || 'Remote'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Star size={12} color="#FFD700" /> {skill.user?.reputation_score?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.3rem' }}>{skill.skill_name}</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="badge badge-accent">{skill.skill_level}</span>
                  </div>
                </div>

                {skill.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {skill.description}
                  </p>
                )}

                <button onClick={() => handleRequest(skill)} disabled={requestingId === skill.id}
                  className="btn-primary" style={{
                    width: '100%', padding: '0.7rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '0.4rem', fontSize: '0.9rem',
                  }}>
                  {requestingId === skill.id ? 'Sending...' : <>Request Session <ArrowRight size={16} /></>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
