import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { askMedicalAI } from '../../lib/gemini';
import { FiSend, FiCpu, FiUser } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';

export default function AIChatScreen() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'ai', content: `Hello ${profile?.full_name || 'there'}! I'm your MedVault AI Assistant. How can I help you understand your medical reports or conditions today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const context = `Name: ${profile?.full_name}
        Blood Group: ${profile?.blood_group || 'Unknown'}
        Gender: ${profile?.gender || 'Unknown'}`;

      // We pass the conversation history + the new prompt
      const prompt = messages.map(m => `${m.role === 'ai' ? 'Assistant' : 'User'}: ${m.content}`).join('\n') + `\nUser: ${userMessage}\nAssistant:`;
      
      const response = await askMedicalAI(prompt, context);
      
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: `⚠️ **Error:** ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}>
      {/* Header */}
      <div style={{ padding: '20px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiCpu color="var(--primary)" /> MedVault AI
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Powered by Google Gemini</p>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            display: 'flex',
            gap: 12,
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user' ? 'var(--primary)' : 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
            }}>
              {msg.role === 'user' ? <FiUser size={16} /> : <FiCpu size={16} />}
            </div>
            
            <div style={{
              background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-elevated)',
              color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
              padding: '12px 16px',
              borderRadius: '16px',
              borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
              borderTopLeftRadius: msg.role === 'ai' ? '4px' : '16px',
              maxWidth: '80%',
              fontSize: '0.9rem',
              lineHeight: 1.5
            }}>
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <FiCpu size={16} />
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: '4px' }}>
              <span className="spinner" style={{ width: 16, height: 16 }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            style={{ flex: 1, borderRadius: '24px', paddingLeft: 16 }}
            placeholder="Ask about your health..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ borderRadius: '50%', width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            disabled={!input.trim() || loading}
          >
            <FiSend />
          </button>
        </form>
      </div>
    </div>
  );
}
