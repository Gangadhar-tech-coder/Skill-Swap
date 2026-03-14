/**
 * Courses page – browse, purchase, and view premium courses.
 */
import { useState, useEffect } from 'react';
import { BookOpen, Search, Star, Users, Clock, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function Courses() {
  const { user, fetchProfile } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('browse'); // browse | enrolled
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [coursesRes, enrolledRes] = await Promise.all([
          api.get('/api/courses/'),
          api.get('/api/courses/enrolled'),
        ]);
        setCourses(coursesRes.data);
        setEnrolled(enrolledRes.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, []);

  const handlePurchase = async (courseId) => {
    if (!window.confirm('Purchase this course? Credits will be deducted from your wallet.')) return;
    try {
      await api.post(`/api/courses/${courseId}/purchase`);
      const [coursesRes, enrolledRes] = await Promise.all([
        api.get('/api/courses/'),
        api.get('/api/courses/enrolled'),
      ]);
      setCourses(coursesRes.data);
      setEnrolled(enrolledRes.data);
      fetchProfile();
      alert('Course purchased successfully!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to purchase course');
    }
  };

  const isEnrolled = (courseId) => enrolled.some(e => e.course_id === courseId);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <BookOpen size={28} color="var(--primary)" />
            Premium <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Courses</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Browse and purchase premium courses from verified teachers</p>
        </div>

        {/* Tabs + Search */}
        <div className="glass-card animate-fade-in-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['browse', 'enrolled'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: tab === t ? 'var(--gradient-primary)' : 'rgba(108,99,255,0.1)',
                color: tab === t ? 'white' : 'var(--text-secondary)',
                fontWeight: 500, fontSize: '0.9rem', textTransform: 'capitalize',
              }}>
                {t === 'browse' ? 'Browse Courses' : `My Courses (${enrolled.length})`}
              </button>
            ))}
          </div>
          {tab === 'browse' && (
            <div style={{ position: 'relative', flex: '0 1 300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input-field" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search courses..." style={{ paddingLeft: '2.25rem', width: '100%' }} />
            </div>
          )}
        </div>

        {tab === 'browse' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {filtered.length === 0 ? (
              <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <BookOpen size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                <p>No courses found.</p>
              </div>
            ) : filtered.map(course => (
              <div key={course.id} className="glass-card animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Course Thumbnail */}
                <div style={{
                  height: '140px', borderRadius: '10px', marginBottom: '1rem',
                  background: `linear-gradient(135deg, rgba(108,99,255,0.3) 0%, rgba(0,212,170,0.2) 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BookOpen size={40} color="var(--primary-light)" style={{ opacity: 0.6 }} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>{course.category}</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem' }}>{course.price} credits</span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', lineHeight: 1.3 }}>{course.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    {course.description?.substring(0, 100)}{course.description?.length > 100 ? '...' : ''}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Users size={14} /> {course.teacher?.name}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={14} /> {course.lectures?.length || 0} lectures
                    </span>
                  </div>

                  {/* Expandable Lectures */}
                  {course.lectures?.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <button onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0 }}>
                        {expandedCourse === course.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {expandedCourse === course.id ? 'Hide' : 'View'} lectures
                      </button>
                      {expandedCourse === course.id && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {course.lectures.map((lec, i) => (
                            <div key={lec.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600 }}>{i + 1}</span>
                              {lec.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action */}
                {isEnrolled(course.id) ? (
                  <button disabled className="btn-accent" style={{ width: '100%', opacity: 0.7, cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <Star size={16} /> Enrolled
                  </button>
                ) : course.teacher_id === user?.id ? (
                  <button disabled className="btn-secondary" style={{ width: '100%', opacity: 0.5, cursor: 'default' }}>Your Course</button>
                ) : (
                  <button onClick={() => handlePurchase(course.id)} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <ShoppingCart size={16} /> Purchase
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Enrolled Tab */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {enrolled.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <BookOpen size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                <p>No enrolled courses yet. Browse and purchase one!</p>
              </div>
            ) : enrolled.map(enrollment => (
              <div key={enrollment.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{enrollment.course?.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {enrollment.course?.category} • Purchased for {enrollment.purchase_price} credits • {new Date(enrollment.purchased_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="badge badge-accent">Enrolled</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
