/**
 * Global Chat component - sliding panel from the right.
 * Users can view active sessions and chat globally across the app.
 */
import { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import api from '../services/api';

export default function GlobalChat() {
  const { user } = useAuthStore();
  const { isOpen, closeChat, activeSessionId, setActiveSession } = useChatStore();
  
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const wsRef = useRef(null);
  const chatRef = useRef(null);

  // Fetch all active sessions (accepted or in_progress)
  useEffect(() => {
    if (!isOpen || !user) return;
    const fetchSessions = async () => {
      try {
        const res = await api.get('/api/sessions/');
        const active = res.data.filter(s => ['accepted', 'in_progress'].includes(s.status));
        setSessions(active);
      } catch (err) { console.error("Failed to load sessions for chat", err); }
    };
    fetchSessions();
  }, [isOpen, user]);

  // Handle WebSocket connection for active chat
  useEffect(() => {
    if (!activeSessionId || !isOpen) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    setLoading(true);
    // Fetch chat history first
    api.get(`/api/chat/history/${activeSessionId}`).then(res => {
      setMessages(res.data);
      setLoading(false);
      scrollToBottom();
    }).catch(() => setLoading(false));

    // Connect WebSocket
    const apiUrl = import.meta.env.VITE_API_URL || '';
    let wsUrl;
    if (apiUrl) {
      // Production: connect directly to backend
      const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
      const host = apiUrl.replace(/^https?:\/\//, '');
      wsUrl = `${wsProtocol}//${host}/api/chat/ws/${activeSessionId}`;
    } else {
      // Dev: use Vite proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/api/chat/ws/${activeSessionId}`;
    }
    
    try {
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      };
      wsRef.current = ws;
    } catch (err) { console.error('WS Error', err); }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [activeSessionId, isOpen]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 50);
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

  if (!isOpen) return null;

  const currentSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', maxWidth: '100vw',
      background: 'rgba(15, 15, 26, 0.95)', backdropFilter: 'blur(16px)',
      boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', zIndex: 100,
      borderLeft: '1px solid rgba(108,99,255,0.2)',
      display: 'flex', flexDirection: 'column',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem', borderBottom: '1px solid rgba(108,99,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {activeSessionId && (
            <button onClick={() => setActiveSession(null)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 0 }}>
              <ArrowLeft size={20} />
            </button>
          )}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activeSessionId ? (
              <>Chat with {currentSession?.teacher_id === user?.id ? currentSession?.learner?.name : currentSession?.teacher?.name}</>
            ) : (
              <><MessageSquare size={18} color="var(--primary)" /> Active Conversations</>
            )}
          </h2>
        </div>
        <button onClick={closeChat} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {!activeSessionId ? (
          // Session List
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <MessageSquare size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>No active sessions to chat in.</p>
              </div>
            ) : (
              sessions.map(s => {
                const isTeacher = s.teacher_id === user?.id;
                const partner = isTeacher ? s.learner : s.teacher;
                const skill = isTeacher ? s.skill_offered : s.skill_requested;
                return (
                  <div key={s.id} onClick={() => setActiveSession(s.id)}
                    className="glass-card" style={{ padding: '1rem', cursor: 'pointer', transition: 'var(--transition)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>{partner?.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>{isTeacher ? 'Teaching' : 'Learning'}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Skill: {skill}</p>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // Chat Interface
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading history...</p>}
              {!loading && messages.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2rem' }}>Say hello!</p>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    {!isMe && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)', marginBottom: '0.2rem', display: 'block' }}>
                        {msg.sender_name || 'Partner'}
                      </span>
                    )}
                    <div style={{
                      padding: '0.6rem 1rem', borderRadius: '14px',
                      background: isMe ? 'var(--gradient-primary)' : 'rgba(108,99,255,0.15)',
                      fontSize: '0.9rem', lineHeight: 1.4,
                      borderBottomRightRadius: isMe ? '4px' : '14px',
                      borderBottomLeftRadius: !isMe ? '4px' : '14px',
                    }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Input Area */}
            <div style={{ padding: '1rem', borderTop: '1px solid rgba(108,99,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="input-field" value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '20px' }} />
                <button onClick={sendMessage} className="btn-primary"
                  style={{ padding: '0 1rem', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
