/**
 * Session page – active session view with chat, timer, video placeholder, and completion.
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Send, Clock, CheckCircle, Star, MessageSquare, Play, Square } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function SessionPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [rating, setRating] = useState({ communication: 5, teaching_quality: 5, professionalism: 5, review: '' });
  const [showRating, setShowRating] = useState(false);
  const wsRef = useRef(null);
  const chatRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchSession();
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const fetchSession = async () => {
    try {
      const res = await api.get('/api/sessions/');
      const found = res.data.find(s => s.id === parseInt(id));
      if (found) setSession(found);
    } catch (err) { console.error(err); }
  };

  const connectWebSocket = () => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    let wsUrl;
    if (apiUrl) {
      const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
      const host = apiUrl.replace(/^https?:\/\//, '');
      wsUrl = `${wsProtocol}//${host}/api/chat/ws/${id}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/api/chat/ws/${id}`;
    }
    try {
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        setMessages(prev => [...prev, msg]);
        setTimeout(() => {
          if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }, 50);
      };
      ws.onerror = () => console.log('WebSocket connection failed - chat unavailable');
      wsRef.current = ws;
    } catch (err) {
      console.log('WebSocket not available');
    }
  };

  const sendMessage = () => {
    if (!newMsg.trim() || !wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({
      sender_id: user.id,
      sender_name: user.name,
      message: newMsg.trim(),
    }));
    setNewMsg('');
  };

  const toggleTimer = () => {
    if (timerRunning) {
      clearInterval(timerRef.current);
      setTimerRunning(false);
    } else {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
      setTimerRunning(true);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleComplete = async () => {
    try {
      await api.post(`/api/sessions/complete/${id}`);
      setShowRating(true);
      fetchSession();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to complete session');
    }
  };

  const handleRate = async () => {
    try {
      // Calculate average rating from the three categories
      const avgRating = parseFloat(((rating.communication + rating.teaching_quality + rating.professionalism) / 3).toFixed(1));
      await api.post(`/api/sessions/rate/${id}`, {
        rating: avgRating,
        content: rating.review || '',
        target_type: 'SESSION',
        target_id: parseInt(id),
      });
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit rating');
    }
  };

  if (!session) {
    return (
      <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading session...</p>
      </div>
    );
  }

  const isTeacher = session.teacher_id === user?.id;
  const partnerName = isTeacher ? session.learner?.name : session.teacher?.name;

  return (
    <div className="gradient-bg" style={{ minHeight: 'calc(100vh - 60px)', padding: '1.5rem', position: 'relative' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Session Header */}
        <div className="glass-card animate-fade-in-up" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Session with <span style={{ color: 'var(--primary-light)' }}>{partnerName || 'User'}</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {isTeacher ? `Teaching: ${session.skill_offered}` : `Learning: ${session.skill_requested}`}
                {' • '}{session.duration}h scheduled
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className={`badge ${session.status === 'completed' ? 'badge-accent' : 'badge-primary'}`}>
                {session.status}
              </span>
            </div>
          </div>
        </div>

        {showRating ? (
          /* Rating Form */
          <div className="glass-card animate-fade-in" style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
              Rate Your Session
            </h2>
            {['communication', 'teaching_quality', 'professionalism'].map((field) => (
              <div key={field} style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.4rem', textTransform: 'capitalize' }}>
                  {field.replace('_', ' ')}
                  <span style={{ color: 'var(--primary-light)' }}>{rating[field]}/5</span>
                </label>
                <input type="range" min="1" max="5" step="0.5" value={rating[field]}
                  onChange={e => setRating({...rating, [field]: parseFloat(e.target.value)})}
                  style={{ width: '100%', accentColor: 'var(--primary)' }} />
              </div>
            ))}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem' }}>Review (optional)</label>
              <textarea className="input-field" value={rating.review}
                onChange={e => setRating({...rating, review: e.target.value})}
                placeholder="Share your experience..." style={{ minHeight: '80px' }} />
            </div>
            <button onClick={handleRate} className="btn-primary" style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Star size={18} /> Submit Rating
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1rem', alignItems: 'start' }}>
            {/* Main Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Video Placeholder */}
              <div className="glass-card" style={{
                minHeight: '300px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', padding: '2rem',
              }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '20px',
                  background: 'rgba(108,99,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
                }}>
                  <Video size={36} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Video Call Area</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                  Video calling feature coming soon. Use the chat to communicate.
                </p>
              </div>

              {/* Timer & Actions */}
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Clock size={22} color="var(--accent)" />
                  <span style={{
                    fontSize: '2rem', fontWeight: 700, fontFamily: 'monospace',
                    background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    {formatTime(timer)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={toggleTimer} className={timerRunning ? 'btn-danger' : 'btn-accent'}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem' }}>
                    {timerRunning ? <><Square size={16} /> Pause</> : <><Play size={16} /> Start</>}
                  </button>
                  {session.status !== 'completed' && (
                    <button onClick={handleComplete} className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.25rem' }}>
                      <CheckCircle size={16} /> Complete
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Panel */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '460px' }}>
              <div style={{
                padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(108,99,255,0.1)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <MessageSquare size={18} color="var(--primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Chat</span>
              </div>

              {/* Messages */}
              <div ref={chatRef} style={{
                flex: 1, overflowY: 'auto', padding: '1rem',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
              }}>
                {messages.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem', marginTop: '2rem' }}>
                    No messages yet. Start chatting!
                  </p>
                )}
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    alignSelf: msg.sender_id === user?.id ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                  }}>
                    {msg.sender_id !== user?.id && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--primary-light)', marginBottom: '0.2rem', display: 'block' }}>
                        {msg.sender_name}
                      </span>
                    )}
                    <div style={{
                      padding: '0.6rem 1rem', borderRadius: '12px',
                      background: msg.sender_id === user?.id
                        ? 'var(--gradient-primary)' : 'rgba(108,99,255,0.12)',
                      fontSize: '0.88rem', lineHeight: 1.4,
                    }}>
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div style={{
                padding: '0.75rem', borderTop: '1px solid rgba(108,99,255,0.1)',
                display: 'flex', gap: '0.5rem',
              }}>
                <input className="input-field" value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  style={{ flex: 1, padding: '0.65rem 0.85rem' }} />
                <button onClick={sendMessage} className="btn-primary"
                  style={{ padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
