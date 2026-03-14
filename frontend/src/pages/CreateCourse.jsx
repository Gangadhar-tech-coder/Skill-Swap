/**
 * Create Course page – premium teachers can create new courses with lectures.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Trash2, Upload } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function CreateCourse() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', category: '', price: 5, thumbnail_url: '',
    lectures: [{ title: '', video_url: '', duration_minutes: 10 }],
  });

  const addLecture = () => {
    setForm(f => ({ ...f, lectures: [...f.lectures, { title: '', video_url: '', duration_minutes: 10 }] }));
  };

  const removeLecture = (index) => {
    setForm(f => ({ ...f, lectures: f.lectures.filter((_, i) => i !== index) }));
  };

  const updateLecture = (index, field, value) => {
    setForm(f => {
      const lectures = [...f.lectures];
      lectures[index] = { ...lectures[index], [field]: value };
      return { ...f, lectures };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category) {
      return alert('Please fill in all required fields');
    }
    if (form.lectures.some(l => !l.title || !l.video_url)) {
      return alert('Please fill in all lecture fields');
    }
    try {
      await api.post('/api/courses/', form);
      alert('Course created successfully!');
      navigate('/premium');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create course');
    }
  };

  if (!user?.is_premium_teacher) {
    return (
      <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <BookOpen size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)' }}>Only premium teachers can create courses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <BookOpen size={26} color="var(--primary)" /> Create
            <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Course</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="glass-card animate-fade-in-up" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Course Details</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Title *</label>
                <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Advanced Python Development" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Description *</label>
                <textarea className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what students will learn..." style={{ width: '100%', minHeight: '100px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Category *</label>
                  <input className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Programming" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Price (credits)</label>
                  <input className="input-field" type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Thumbnail URL (optional)</label>
                <input className="input-field" value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg" style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Lectures */}
          <div className="glass-card animate-fade-in-up" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Lectures ({form.lectures.length})</h2>
              <button type="button" onClick={addLecture} className="btn-accent" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Plus size={14} /> Add Lecture
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {form.lectures.map((lec, i) => (
                <div key={i} style={{
                  padding: '1rem', borderRadius: '10px', background: 'rgba(15,15,26,0.4)',
                  border: '1px solid rgba(108,99,255,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-light)' }}>Lecture {i + 1}</span>
                    {form.lectures.length > 1 && (
                      <button type="button" onClick={() => removeLecture(i)} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input className="input-field" value={lec.title} onChange={e => updateLecture(i, 'title', e.target.value)}
                      placeholder="Lecture title" style={{ width: '100%' }} />
                    <input className="input-field" value={lec.video_url} onChange={e => updateLecture(i, 'video_url', e.target.value)}
                      placeholder="Video URL (e.g. YouTube link)" style={{ width: '100%' }} />
                    <input className="input-field" type="number" min="1" value={lec.duration_minutes}
                      onChange={e => updateLecture(i, 'duration_minutes', parseInt(e.target.value) || 1)}
                      placeholder="Duration (minutes)" style={{ width: '100%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{
            width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem',
          }}>
            <Upload size={20} /> Publish Course
          </button>
        </form>
      </div>
    </div>
  );
}
