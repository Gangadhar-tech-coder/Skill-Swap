/**
 * Premium Teacher page – apply for premium status, view status, and manage courses.
 * Supports rich application form with multiple fields and video upload management.
 */
import { useState, useEffect } from 'react';
import { Award, Upload, CheckCircle, Clock, XCircle, BookOpen, Plus, Star, Briefcase, GraduationCap, FileText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function PremiumTeacher() {
  const { user, fetchProfile } = useAuthStore();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myCourses, setMyCourses] = useState([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState({});

  // Application form state
  const [form, setForm] = useState({
    full_name: '',
    expertise_area: '',
    years_of_experience: 1,
    bio: '',
    document_url: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/premium/status');
        setStatus(res.data);
      } catch { setStatus(null); }
      if (user?.is_premium_teacher) {
        try {
          const res = await api.get('/api/courses/');
          setMyCourses(res.data.filter(c => c.teacher_id === user.id));
        } catch {}
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleApply = async () => {
    if (!form.full_name.trim()) return alert('Please enter your full name');
    if (!form.expertise_area.trim()) return alert('Please enter your area of expertise');
    if (!form.bio.trim() || form.bio.length < 10) return alert('Please write a bio (at least 10 characters)');
    if (!form.document_url.trim()) return alert('Please provide a certification/portfolio URL');
    try {
      await api.post('/api/premium/apply', form);
      const res = await api.get('/api/premium/status');
      setStatus(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to apply');
    }
  };

  if (loading) {
    return (
      <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  const isPremium = user?.is_premium_teacher;

  return (
    <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Award size={28} color="var(--accent)" />
            Premium <span style={{ background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Teacher</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Become a premium teacher and create paid courses for other users</p>
        </div>

        {isPremium ? (
          <>
            {/* Premium Badge */}
            <div className="glass-card animate-fade-in-up" style={{
              background: 'linear-gradient(135deg, rgba(0,212,170,0.15) 0%, rgba(108,99,255,0.1) 100%)',
              border: '1px solid rgba(0,212,170,0.3)', marginBottom: '2rem',
              display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={28} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>You're a Premium Teacher! 🎉</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You can create courses, upload video content, and earn credits from sales.</p>
              </div>
            </div>

            {/* Premium Benefits */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { icon: BookOpen, label: 'Create Courses', desc: 'Build premium video courses', color: 'var(--primary)' },
                { icon: Upload, label: 'Upload Videos', desc: 'Add video lectures to courses', color: 'var(--accent)' },
                { icon: Users, label: 'Reach Students', desc: 'Sell to the entire platform', color: 'var(--secondary)' },
              ].map((b, i) => (
                <div key={i} className="glass-card animate-fade-in-up" style={{ textAlign: 'center', padding: '1.5rem', animationDelay: `${i * 0.1}s` }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${b.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                    <b.icon size={22} color={b.color} />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{b.label}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{b.desc}</p>
                </div>
              ))}
            </div>

            {/* My Courses */}
            <div className="glass-card animate-fade-in-up" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={18} /> My Courses
                </h2>
                <Link to="/courses/create" className="btn-accent" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <Plus size={16} /> Create Course
                </Link>
              </div>
              {myCourses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <GraduationCap size={48} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block' }} />
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No courses yet. Create your first premium course!</p>
                  <Link to="/courses/create" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> Create First Course
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {myCourses.map(c => (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1rem', borderRadius: '12px', background: 'rgba(15,15,26,0.4)',
                      border: '1px solid rgba(108,99,255,0.08)', transition: 'var(--transition)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,170,0.15))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <BookOpen size={20} color="var(--primary-light)" />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.title}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{c.category} • {c.lectures?.length || 0} lectures • {c.total_duration?.toFixed(0) || 0} min</p>
                        </div>
                      </div>
                      <span className="badge badge-accent" style={{ fontSize: '0.9rem', fontWeight: 700 }}>{c.price} credits</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Application Status */}
            {status && status.status !== 'none' ? (
              <div className="glass-card animate-fade-in-up" style={{
                marginBottom: '2rem',
                background: status.status === 'pending'
                  ? 'linear-gradient(135deg, rgba(255,193,7,0.1) 0%, rgba(108,99,255,0.05) 100%)'
                  : status.status === 'rejected'
                  ? 'linear-gradient(135deg, rgba(255,107,157,0.1) 0%, rgba(108,99,255,0.05) 100%)'
                  : 'transparent',
                border: status.status === 'pending'
                  ? '1px solid rgba(255,193,7,0.3)'
                  : '1px solid rgba(255,107,157,0.3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px',
                    background: status.status === 'pending' ? 'linear-gradient(135deg, #FFC107, #FF9800)' : 'linear-gradient(135deg, #FF6B9D, #FF4040)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {status.status === 'pending' ? <Clock size={22} color="white" /> : <XCircle size={22} color="white" />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: status.status === 'pending' ? '#FFC107' : '#FF6B9D' }}>
                      {status.status === 'pending' ? 'Application Under Review' : 'Application Rejected'}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {status.status === 'pending'
                        ? 'Your premium teacher application is being reviewed by our admin team. This usually takes 24–48 hours.'
                        : 'Your application was not approved. You can re-apply with updated documentation below.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Apply Form */}
            {(!status || status.status === 'none' || status.status === 'rejected') && (
              <div className="glass-card animate-fade-in-up">
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star size={18} color="var(--accent)" /> Apply for Premium Teacher
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.92rem', lineHeight: 1.6 }}>
                  Premium teachers can create and sell video courses on SkillSwap. Fill out the form below to apply.
                  Our admin team will review your application.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <Users size={14} /> Full Name *
                    </label>
                    <input className="input-field" value={form.full_name}
                      onChange={e => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Your full legal name"
                      style={{ width: '100%', padding: '0.85rem 1rem' }} />
                  </div>

                  {/* Expertise + Years */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        <Briefcase size={14} /> Area of Expertise *
                      </label>
                      <input className="input-field" value={form.expertise_area}
                        onChange={e => setForm({ ...form, expertise_area: e.target.value })}
                        placeholder="e.g., Web Development, Data Science, UI Design"
                        style={{ width: '100%', padding: '0.85rem 1rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        <GraduationCap size={14} /> Years of Exp *
                      </label>
                      <input className="input-field" type="number" min="0" max="50" value={form.years_of_experience}
                        onChange={e => setForm({ ...form, years_of_experience: parseInt(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '0.85rem 1rem' }} />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <FileText size={14} /> Teaching Bio *
                    </label>
                    <textarea className="input-field" value={form.bio}
                      onChange={e => setForm({ ...form, bio: e.target.value })}
                      placeholder="Describe your teaching experience, qualifications, and what you'd like to teach on SkillSwap..."
                      style={{ width: '100%', padding: '0.85rem 1rem', minHeight: '120px', resize: 'vertical' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                      {form.bio.length}/1000 characters (minimum 10)
                    </p>
                  </div>

                  {/* Document URL */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      <Upload size={14} /> License / Certification / Portfolio URL *
                    </label>
                    <input className="input-field" value={form.document_url}
                      onChange={e => setForm({ ...form, document_url: e.target.value })}
                      placeholder="https://linkedin.com/in/yourprofile or https://portfolio.com"
                      style={{ width: '100%', padding: '0.85rem 1rem' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                      Link to your teaching certification, LinkedIn, portfolio site, or any proof of expertise
                    </p>
                  </div>
                </div>

                <button onClick={handleApply} className="btn-accent" style={{
                  width: '100%', padding: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  marginTop: '2rem', fontSize: '1rem',
                }}>
                  <Upload size={18} /> Submit Application
                </button>
              </div>
            )}

            {/* Benefits Preview */}
            {(!status || status.status === 'none' || status.status === 'rejected') && (
              <div style={{ marginTop: '2rem' }}>
                <h3 className="animate-fade-in-up" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  Why become a Premium Teacher?
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {[
                    { icon: BookOpen, title: 'Create Premium Courses', desc: 'Build structured video courses with multiple lectures and set your own price in skill credits.', color: 'var(--primary)' },
                    { icon: Upload, title: 'Upload Video Content', desc: 'Upload and link video lectures to your courses. Students can watch them after purchase.', color: 'var(--accent)' },
                    { icon: Star, title: 'Earn More Credits', desc: 'Earn skill credits every time a student purchases your course. Build a passive income stream.', color: '#FFD700' },
                    { icon: Award, title: 'Premium Badge', desc: 'Get a verified premium teacher badge on your profile, boosting your credibility.', color: 'var(--secondary)' },
                  ].map((item, i) => (
                    <div key={i} className="glass-card animate-fade-in-up" style={{ animationDelay: `${(i + 1) * 0.1}s` }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                        <item.icon size={20} color={item.color} />
                      </div>
                      <h4 style={{ fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.95rem' }}>{item.title}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
