/**
 * Landing page – Hero section, How It Works, Popular Skills, Testimonials, CTA.
 * Features vibrant gradients, animations, and glassmorphism cards.
 */
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Users, Clock, Award, Star, Code, Palette, Camera, BarChart3, Mic, Music } from 'lucide-react';

const skills = [
  { name: 'Python Programming', icon: Code, color: '#6C63FF' },
  { name: 'UI/UX Design', icon: Palette, color: '#FF6B9D' },
  { name: 'Photography', icon: Camera, color: '#00D4AA' },
  { name: 'Data Science', icon: BarChart3, color: '#FFD700' },
  { name: 'Public Speaking', icon: Mic, color: '#FF8C42' },
  { name: 'Guitar', icon: Music, color: '#42A5F5' },
];

const steps = [
  { number: '01', title: 'Create Your Profile', desc: 'List your teachable skills and what you want to learn.', icon: Users },
  { number: '02', title: 'Get AI-Matched', desc: 'Our engine finds the perfect skill swap partner for you.', icon: Zap },
  { number: '03', title: 'Exchange Skills', desc: 'Teach 1 hour, learn 1 hour. No money needed.', icon: Clock },
  { number: '04', title: 'Grow Together', desc: 'Build reputation, earn badges, and master new skills.', icon: Award },
];

const testimonials = [
  { name: 'Sarah K.', role: 'Learned Python', text: 'Traded my UI design skills for Python lessons. Best decision ever! The matching was perfect.', rating: 5 },
  { name: 'Marco T.', role: 'Learned Photography', text: 'I taught data science and learned photography. The community is incredibly supportive.', rating: 5 },
  { name: 'Priya M.', role: 'Learned Guitar', text: 'As a public speaking coach, I exchanged my skills for guitar lessons. Absolutely love this platform!', rating: 5 },
];

export default function Landing() {
  return (
    <div className="gradient-bg" style={{ position: 'relative' }}>
      {/* Hero Section */}
      <section style={{
        minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '4rem 1.5rem', position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: '900px', textAlign: 'center' }}>
          <div className="animate-fade-in-up" style={{ marginBottom: '1.5rem' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
              <Zap size={14} /> Skill Economy — No Money Required
            </span>
          </div>
          <h1 className="animate-fade-in-up delay-100" style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800,
            lineHeight: 1.1, marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #A0A0C0 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Learn Anything.<br />
            Teach Anything.<br />
            <span style={{
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Pay With Skills.</span>
          </h1>
          <p className="animate-fade-in-up delay-200" style={{
            fontSize: '1.2rem', color: 'var(--text-secondary)',
            maxWidth: '600px', margin: '0 auto 2.5rem',
            lineHeight: 1.6,
          }}>
            Join a community where your knowledge is currency. Trade hours of teaching for learning.
            Master new skills without spending a dime.
          </p>
          <div className="animate-fade-in-up delay-300" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary" style={{
              fontSize: '1.1rem', padding: '1rem 2.5rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              textDecoration: 'none',
            }}>
              Start Swapping <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn-secondary" style={{
              fontSize: '1.1rem', padding: '1rem 2.5rem',
              textDecoration: 'none',
            }}>
              Login
            </Link>
          </div>
          {/* Stats */}
          <div className="animate-fade-in-up delay-400" style={{
            display: 'flex', justifyContent: 'center', gap: '3rem',
            marginTop: '4rem', flexWrap: 'wrap',
          }}>
            {[
              { label: 'Active Users', value: '10,000+' },
              { label: 'Skills Traded', value: '50,000+' },
              { label: 'Avg Rating', value: '4.8★' },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2rem', fontWeight: 700,
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{stat.value}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '6rem 1.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
            How It <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Works</span>
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '4rem', maxWidth: '500px', margin: '0 auto 4rem' }}>
            Four simple steps to start exchanging skills
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {steps.map((step, i) => (
              <div key={i} className="glass-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '16px',
                  background: 'var(--gradient-primary)', margin: '0 auto 1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <step.icon size={28} color="white" />
                </div>
                <div style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  STEP {step.number}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>{step.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Skills */}
      <section style={{ padding: '6rem 1.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
            Popular <span style={{ background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Skills</span>
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
            Discover what our community is learning and teaching
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {skills.map((skill, i) => (
              <div key={i} className="glass-card" style={{
                textAlign: 'center', padding: '2rem 1rem', cursor: 'pointer',
              }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '14px',
                  background: `${skill.color}20`, margin: '0 auto 1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <skill.icon size={24} color={skill.color} />
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{skill.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '6rem 1.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 700, marginBottom: '3rem' }}>
            What Our Users <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Say</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card" style={{ padding: '2rem' }}>
                <div className="stars" style={{ marginBottom: '1rem' }}>
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={16} fill="#FFD700" />)}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 600, fontSize: '0.9rem',
                  }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '6rem 1.5rem', position: 'relative', zIndex: 1,
        textAlign: 'center',
      }}>
        <div className="glass-card animate-pulse-glow" style={{
          maxWidth: '700px', margin: '0 auto', padding: '4rem 2rem',
          background: 'linear-gradient(135deg, rgba(108,99,255,0.15) 0%, rgba(255,107,157,0.1) 100%)',
        }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '1rem' }}>
            Ready to Start?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Join thousands of learners and teachers. Your skills are your currency.
          </p>
          <Link to="/register" className="btn-primary" style={{
            fontSize: '1.1rem', padding: '1rem 3rem',
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            textDecoration: 'none',
          }}>
            Get Started Free <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '2rem 1.5rem', textAlign: 'center',
        borderTop: '1px solid rgba(108,99,255,0.1)',
        color: 'var(--text-muted)', fontSize: '0.85rem',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Zap size={16} color="var(--primary)" />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>SkillSwap</span>
        </div>
        © 2026 SkillSwap. Learn anything, teach anything.
      </footer>
    </div>
  );
}
