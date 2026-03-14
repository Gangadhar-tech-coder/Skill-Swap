/**
 * Profile page – view/edit profile, manage skills (teach/learn).
 */
import { useState, useEffect } from 'react';
import { User, MapPin, BookOpen, GraduationCap, Plus, X, Save, Edit3, Star } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function Profile() {
  const { user, fetchProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', location: '', availability: '' });
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ skill_name: '', skill_type: 'teach', skill_level: 'intermediate' });
  const [showAddSkill, setShowAddSkill] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, bio: user.bio, location: user.location, availability: user.availability });
    }
    fetchSkills();
  }, [user]);

  const fetchSkills = async () => {
    try {
      const res = await api.get('/api/skills/my');
      setSkills(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    try {
      await api.put('/api/user/profile', form);
      await fetchProfile();
      setEditing(false);
    } catch (err) { console.error(err); }
  };

  const handleAddSkill = async () => {
    if (!newSkill.skill_name.trim()) return;
    try {
      await api.post('/api/skills/add', newSkill);
      setNewSkill({ skill_name: '', skill_type: 'teach', skill_level: 'intermediate' });
      setShowAddSkill(false);
      fetchSkills();
    } catch (err) { console.error(err); }
  };

  const handleDeleteSkill = async (id) => {
    try {
      await api.delete(`/api/skills/${id}`);
      fetchSkills();
    } catch (err) { console.error(err); }
  };

  const teachSkills = skills.filter(s => s.skill_type === 'teach');
  const learnSkills = skills.filter(s => s.skill_type === 'learn');

  return (
    <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', padding: '2rem 1.5rem', position: 'relative' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <h1 className="animate-fade-in-up" style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          My Profile
        </h1>

        {/* Profile Card */}
        <div className="glass-card animate-fade-in-up" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                width: '70px', height: '70px', borderRadius: '18px',
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 700,
              }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                {editing ? (
                  <input className="input-field" value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.25rem' }} />
                ) : (
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>{user?.name}</h2>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={14} /> {user?.location || 'Not set'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={14} color="#FFD700" /> {user?.reputation_score?.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => editing ? handleSave() : setEditing(true)}
              className={editing ? 'btn-accent' : 'btn-secondary'}
              style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              {editing ? <><Save size={16} /> Save</> : <><Edit3 size={16} /> Edit</>}
            </button>
          </div>

          {editing ? (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.3rem', display: 'block' }}>Location</label>
                <input className="input-field" value={form.location}
                  onChange={e => setForm({...form, location: e.target.value})} placeholder="City, Country" />
              </div>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.3rem', display: 'block' }}>Bio</label>
                <textarea className="input-field" value={form.bio}
                  onChange={e => setForm({...form, bio: e.target.value})} placeholder="About you..."
                  style={{ minHeight: '80px', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.3rem', display: 'block' }}>Availability</label>
                <input className="input-field" value={form.availability}
                  onChange={e => setForm({...form, availability: e.target.value})}
                  placeholder="e.g. weekdays,evenings,mornings" />
              </div>
            </div>
          ) : (
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              {user?.bio || 'No bio set yet. Click Edit to add one!'}
            </p>
          )}
        </div>

        {/* Skills Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Teach Skills */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <GraduationCap size={20} color="var(--accent)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Skills I Teach</h3>
              <span className="badge badge-accent">{teachSkills.length}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {teachSkills.map(s => (
                <span key={s.id} className="badge badge-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem' }}>
                  {s.skill_name}
                  <button onClick={() => handleDeleteSkill(s.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0,
                  }}><X size={12} /></button>
                </span>
              ))}
              {teachSkills.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No skills added yet</p>}
            </div>
          </div>

          {/* Learn Skills */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <BookOpen size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Skills I Want to Learn</h3>
              <span className="badge badge-primary">{learnSkills.length}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {learnSkills.map(s => (
                <span key={s.id} className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem' }}>
                  {s.skill_name}
                  <button onClick={() => handleDeleteSkill(s.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0,
                  }}><X size={12} /></button>
                </span>
              ))}
              {learnSkills.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No skills added yet</p>}
            </div>
          </div>
        </div>

        {/* Add Skill */}
        {showAddSkill ? (
          <div className="glass-card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Add New Skill</h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '2', minWidth: '200px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>Skill Name</label>
                <input className="input-field" value={newSkill.skill_name}
                  onChange={e => setNewSkill({...newSkill, skill_name: e.target.value})}
                  placeholder="e.g. Python Programming" />
              </div>
              <div style={{ flex: '1', minWidth: '120px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>Type</label>
                <select className="input-field" value={newSkill.skill_type}
                  onChange={e => setNewSkill({...newSkill, skill_type: e.target.value})}>
                  <option value="teach">Teach</option>
                  <option value="learn">Learn</option>
                </select>
              </div>
              <div style={{ flex: '1', minWidth: '120px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>Level</label>
                <select className="input-field" value={newSkill.skill_level}
                  onChange={e => setNewSkill({...newSkill, skill_level: e.target.value})}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleAddSkill} className="btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Add</button>
                <button onClick={() => setShowAddSkill(false)} className="btn-secondary" style={{ padding: '0.75rem 1rem' }}>Cancel</button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddSkill(true)} className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto' }}>
            <Plus size={18} /> Add Skill
          </button>
        )}
      </div>
    </div>
  );
}
