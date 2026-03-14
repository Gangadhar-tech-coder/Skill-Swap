/**
 * AI Skill Match Suggestions – shows AI-powered compatible skill swap partners.
 */
import { useState, useEffect } from 'react';
import { Sparkles, Star, MapPin, ArrowRight, Zap, BookOpen, GraduationCap, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function MatchSuggestions() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);
  const [success, setSuccess] = useState('');

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/match/suggestions');
      setMatches(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchMatches(); }, []);

  const handleRequest = async (match) => {
    setRequesting(match.user.id);
    try {
      const skillOffered = match.skills_they_learn?.[0] || 'Skill Exchange';
      const skillRequested = match.matching_skills?.[0] || match.skills_they_teach?.[0] || 'Skill Exchange';
      await api.post('/api/sessions/request', {
        teacher_id: match.user.id,
        skill_offered: skillOffered,
        skill_requested: skillRequested,
        duration: 1.0,
      });
      setSuccess(`Request sent to ${match.user.name}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Request failed');
    }
    setRequesting(null);
  };

  return (
    <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', padding: '2rem 1.5rem', position: 'relative' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sparkles size={28} color="var(--accent)" />
              AI Match <span style={{ background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Suggestions</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Smart matches based on skill compatibility, reputation & availability</p>
          </div>
          <button onClick={fetchMatches} className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Success */}
        {success && (
          <div style={{
            marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '10px',
            background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)',
            color: 'var(--accent-light)', fontSize: '0.9rem',
          }}>✅ {success}</div>
        )}

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <Sparkles size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Finding your best matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Zap size={48} style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No matches found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Add more skills to your profile to get matched!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {matches.map((match, i) => (
              <div key={i} className="glass-card animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  {/* User Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: '55px', height: '55px', borderRadius: '16px',
                        background: 'var(--gradient-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', fontWeight: 700,
                      }}>
                        {match.user.name.charAt(0).toUpperCase()}
                      </div>
                      {/* Compatibility Score Badge */}
                      <div style={{
                        position: 'absolute', top: '-8px', right: '-8px',
                        background: 'var(--gradient-accent)', borderRadius: '8px',
                        padding: '2px 6px', fontSize: '0.65rem', fontWeight: 700,
                      }}>
                        {match.compatibility_score}%
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{match.user.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <MapPin size={12} /> {match.user.location || 'Remote'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Star size={12} color="#FFD700" /> {match.user.reputation_score.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => handleRequest(match)} disabled={requesting === match.user.id}
                    className="btn-primary" style={{
                      padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem',
                    }}>
                    {requesting === match.user.id ? 'Sending...' : <>Swap Skills <ArrowRight size={16} /></>}
                  </button>
                </div>

                {/* Skills */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem', color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600 }}>
                      <GraduationCap size={14} /> They Teach
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {match.skills_they_teach.map((s, j) => (
                        <span key={j} className={`badge ${match.matching_skills.includes(s) ? 'badge-accent' : 'badge-primary'}`}
                          style={{ fontSize: '0.75rem' }}>
                          {match.matching_skills.includes(s) && '✓ '}{s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem', color: 'var(--primary-light)', fontSize: '0.78rem', fontWeight: 600 }}>
                      <BookOpen size={14} /> They Want to Learn
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {match.skills_they_learn.map((s, j) => (
                        <span key={j} className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
