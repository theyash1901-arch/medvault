import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2, Settings, Key } from 'lucide-react';
import { chatWithAI, initGemini } from '../utils/gemini';
import './Chatbot.css';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm TalentLens AI, your intelligent recruitment assistant. I can help you:\n\n• Analyze candidate profiles\n• Match candidates to roles\n• Discuss hiring strategies\n• Explore skill trends\n\nHow can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleConnect = () => {
    if (apiKey.trim()) {
      const success = initGemini(apiKey.trim());
      setIsConnected(success);
      if (success) {
        setShowSettings(false);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '✅ Connected to Gemini AI successfully! I can now provide AI-powered analysis and insights. Ask me anything!'
        }]);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      if (!isConnected) {
        // Provide demo responses when not connected
        await new Promise(r => setTimeout(r, 1000));
        const demoResponses = [
          "Great question! To provide AI-powered analysis, please connect your Gemini API key first. Click the ⚙️ Settings icon above to get started.\n\nIn the meantime, I can share some general insights about talent discovery and recruitment best practices!",
          "I'd love to help analyze that! Connect your Gemini API key to unlock full AI-powered analysis. Here are some quick tips:\n\n• Look beyond resumes for real-world signals\n• Evaluate GitHub contributions and open-source work\n• Consider learning velocity, not just current skills\n• Assess problem-solving approach in technical interviews",
          "That's an interesting angle! For deeper AI-powered insights, connect your Gemini API key via Settings.\n\nHere's what TalentLens can do:\n• Skill graph analysis across multiple dimensions\n• Hidden talent identification from project patterns\n• Culture fit predictions based on work style\n• Growth potential scoring using learning trajectory data"
        ];
        const response = demoResponses[Math.floor(Math.random() * demoResponses.length)];
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      } else {
        const context = messages
          .slice(-6)
          .map(m => `${m.role}: ${m.content}`)
          .join('\n');
        const response = await chatWithAI(userMessage, context);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again or check your API key.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        id="chatbot-trigger"
        className={`chatbot-trigger ${isOpen ? 'chatbot-trigger-hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open AI assistant"
      >
        <div className="chatbot-trigger-icon">
          <MessageCircle size={24} />
        </div>
        <div className="chatbot-trigger-pulse" />
      </button>

      {/* Chat window */}
      <div className={`chatbot ${isOpen ? 'chatbot-open' : ''}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">
              <Sparkles size={18} />
            </div>
            <div>
              <h4>TalentLens AI</h4>
              <span className={`chatbot-status ${isConnected ? 'chatbot-status-connected' : ''}`}>
                {isConnected ? '● Connected' : '○ Demo Mode'}
              </span>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button
              className="chatbot-header-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              {showSettings ? <Key size={18} /> : <Settings size={18} />}
            </button>
            <button
              className="chatbot-header-btn"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="chatbot-settings animate-fade-in">
            <p>Enter your Gemini API key to enable AI features:</p>
            <div className="chatbot-settings-input">
              <input
                type="password"
                className="input"
                placeholder="AIza..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
              />
              <button className="btn btn-primary btn-sm" onClick={handleConnect}>
                Connect
              </button>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="chatbot-settings-link"
            >
              Get a free API key →
            </a>
          </div>
        )}

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chatbot-message chatbot-message-${msg.role}`}>
              <div className="chatbot-message-avatar">
                {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="chatbot-message-content">
                {msg.content.split('\n').map((line, j) => (
                  <span key={j}>{line}<br /></span>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chatbot-message chatbot-message-assistant">
              <div className="chatbot-message-avatar">
                <Bot size={16} />
              </div>
              <div className="chatbot-message-content chatbot-typing">
                <span className="chatbot-dot" />
                <span className="chatbot-dot" />
                <span className="chatbot-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chatbot-input-area">
          <div className="chatbot-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              placeholder="Ask about talent, skills, hiring..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="chatbot-send"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Loader2 size={18} className="spinning" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
