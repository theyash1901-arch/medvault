import { useState } from 'react';
import {
  Upload, Brain, TrendingUp, Target, Sparkles, User, Code,
  GraduationCap, Briefcase, Github, ChevronRight, Loader2,
  Award, Lightbulb, ArrowUpRight, Star
} from 'lucide-react';
import { analyzeCandidate, initGemini } from '../utils/gemini';
import './Analyze.css';

export default function Analyze() {
  const [formData, setFormData] = useState({
    name: '',
    skills: '',
    experience: '',
    github: '',
    education: '',
    projects: ''
  });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = () => {
    if (apiKey.trim()) {
      const success = initGemini(apiKey.trim());
      setIsConnected(success);
      if (!success) setError('Failed to connect. Check your API key.');
      else setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.skills) {
      setError('Name and skills are required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isConnected) {
        const analysis = await analyzeCandidate(formData);
        setResult(analysis);
      } else {
        // Demo mode
        await new Promise(r => setTimeout(r, 2000));
        setResult(generateDemoResult(formData));
      }
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const loadSampleData = () => {
    setFormData({
      name: 'Priya Sharma',
      skills: 'React, Node.js, Python, Machine Learning, TensorFlow, Docker, AWS, PostgreSQL, GraphQL',
      experience: '3 years at TechCorp as Full Stack Developer, 1 year at AI Startup as ML Engineer',
      github: 'github.com/priyasharma',
      education: 'B.Tech Computer Science, IIT Kanpur, 2022',
      projects: 'Built a real-time sentiment analysis dashboard, Open-source NLP library with 500+ stars, Automated ML pipeline for e-commerce recommendations'
    });
  };

  return (
    <div className="analyze-page">
      <div className="page-bg">
        <div className="page-orb page-orb-1" />
        <div className="page-orb page-orb-2" />
      </div>

      <div className="container">
        <div className="page-header">
          <span className="badge badge-primary">
            <Brain size={12} />
            AI Analysis
          </span>
          <h1>Candidate <span className="text-gradient">Intelligence</span></h1>
          <p className="text-muted">
            Enter candidate information and let our AI discover hidden talents, skill gaps, and growth potential.
          </p>
        </div>

        {/* API Key Banner */}
        {!isConnected && (
          <div className="api-banner animate-fade-in">
            <div className="api-banner-content">
              <Sparkles size={18} />
              <div>
                <strong>Connect Gemini AI for real analysis</strong>
                <p>Enter your API key for AI-powered insights, or try our demo mode.</p>
              </div>
            </div>
            <div className="api-banner-input">
              <input
                type="password"
                className="input"
                placeholder="Gemini API key..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
              />
              <button className="btn btn-primary btn-sm" onClick={handleConnect}>Connect</button>
            </div>
          </div>
        )}

        <div className="analyze-layout">
          {/* Form */}
          <div className="analyze-form-container">
            <form onSubmit={handleSubmit} className="analyze-form">
              <div className="form-header">
                <h3>Candidate Profile</h3>
                <button type="button" className="btn btn-ghost btn-sm" onClick={loadSampleData}>
                  Load Sample
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <User size={16} /> Full Name *
                </label>
                <input
                  className="input"
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Code size={16} /> Skills & Technologies *
                </label>
                <input
                  className="input"
                  placeholder="e.g. React, Python, Machine Learning, AWS"
                  value={formData.skills}
                  onChange={e => handleChange('skills', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Briefcase size={16} /> Experience
                </label>
                <textarea
                  className="input textarea"
                  placeholder="Current and past roles, responsibilities..."
                  value={formData.experience}
                  onChange={e => handleChange('experience', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Github size={16} /> GitHub / Portfolio
                </label>
                <input
                  className="input"
                  placeholder="github.com/username"
                  value={formData.github}
                  onChange={e => handleChange('github', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <GraduationCap size={16} /> Education
                </label>
                <input
                  className="input"
                  placeholder="Degree, Institution, Year"
                  value={formData.education}
                  onChange={e => handleChange('education', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lightbulb size={16} /> Notable Projects
                </label>
                <textarea
                  className="input textarea"
                  placeholder="Brief descriptions of key projects..."
                  value={formData.projects}
                  onChange={e => handleChange('projects', e.target.value)}
                />
              </div>

              {error && <div className="form-error">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isLoading}
                style={{ width: '100%' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="spinning" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Brain size={20} />
                    Analyze Candidate
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="analyze-results">
            {!result && !isLoading && (
              <div className="results-empty">
                <div className="results-empty-icon">
                  <Brain size={48} />
                </div>
                <h3>Ready to Analyze</h3>
                <p>Fill in candidate details and click &quot;Analyze&quot; to get AI-powered insights on skills, growth potential, and role compatibility.</p>
              </div>
            )}

            {isLoading && (
              <div className="results-loading">
                <div className="loader-ring">
                  <div className="loader-ring-inner" />
                </div>
                <h3>Analyzing Profile...</h3>
                <p>AI is evaluating skills, potential, and fit</p>
                <div className="loader-steps">
                  <div className="loader-step loader-step-active">
                    <span>Parsing skills graph</span>
                  </div>
                  <div className="loader-step">
                    <span>Evaluating growth potential</span>
                  </div>
                  <div className="loader-step">
                    <span>Matching roles</span>
                  </div>
                </div>
              </div>
            )}

            {result && !isLoading && (
              <div className="results-content animate-fade-in">
                {/* Overall Score */}
                <div className="result-score-card">
                  <div className="result-score-ring">
                    <svg viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        stroke="url(#scoreGradient)" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(result.overallScore / 100) * 327} 327`}
                        transform="rotate(-90 60 60)"
                        className="score-circle"
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#7c3aed" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="result-score-value">
                      <span className="result-score-number">{result.overallScore}</span>
                      <span className="result-score-label">Overall Score</span>
                    </div>
                  </div>

                  <div className="result-score-details">
                    <h3>{formData.name}</h3>
                    <p className="result-summary">{result.summary}</p>
                    <div className="result-mini-scores">
                      <div className="result-mini">
                        <span>Learning Potential</span>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${result.learningPotential}%` }} />
                        </div>
                        <span>{result.learningPotential}%</span>
                      </div>
                      <div className="result-mini">
                        <span>Culture Fit</span>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${result.cultureFit}%` }} />
                        </div>
                        <span>{result.cultureFit}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Analysis */}
                <div className="result-section">
                  <h4><Code size={18} /> Skill Analysis</h4>
                  <div className="skills-list">
                    {result.skillAnalysis?.map((skill, i) => (
                      <div key={i} className="skill-item">
                        <div className="skill-info">
                          <span className="skill-name">{skill.skill}</span>
                          <span className={`badge badge-${skill.trend === 'rising' ? 'success' : skill.trend === 'stable' ? 'accent' : 'warning'}`}>
                            {skill.trend === 'rising' ? '↑' : skill.trend === 'stable' ? '→' : '↓'} {skill.level}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${skill.score}%`, animationDelay: `${i * 0.1}s` }}
                          />
                        </div>
                        <span className="skill-score">{skill.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Growth */}
                <div className="result-grid">
                  <div className="result-section">
                    <h4><Award size={18} /> Strengths</h4>
                    <ul className="result-list">
                      {result.strengths?.map((s, i) => (
                        <li key={i}><Star size={14} /> {s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="result-section">
                    <h4><TrendingUp size={18} /> Growth Areas</h4>
                    <ul className="result-list">
                      {result.growthAreas?.map((a, i) => (
                        <li key={i}><ArrowUpRight size={14} /> {a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Hidden Talents */}
                <div className="result-section">
                  <h4><Lightbulb size={18} /> Hidden Talents</h4>
                  <div className="hidden-talents">
                    {result.hiddenTalents?.map((t, i) => (
                      <div key={i} className="hidden-talent-tag">
                        <Sparkles size={14} />
                        {t}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Roles */}
                <div className="result-section">
                  <h4><Target size={18} /> Recommended Roles</h4>
                  <div className="roles-list">
                    {result.recommendedRoles?.map((role, i) => (
                      <div key={i} className="role-card">
                        <div className="role-header">
                          <span className="role-title">{role.title}</span>
                          <span className="role-score">{role.matchScore}%</span>
                        </div>
                        <div className="progress-bar" style={{ height: '4px' }}>
                          <div className="progress-bar-fill" style={{ width: `${role.matchScore}%` }} />
                        </div>
                        <p className="role-reason">{role.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function generateDemoResult(profile) {
  const skills = profile.skills.split(',').map(s => s.trim()).filter(Boolean);
  return {
    overallScore: 82,
    skillAnalysis: skills.slice(0, 8).map((skill, i) => ({
      skill,
      level: ['Expert', 'Advanced', 'Intermediate', 'Advanced'][i % 4],
      score: Math.floor(Math.random() * 25) + 65,
      trend: ['rising', 'stable', 'rising', 'stable'][i % 4]
    })),
    strengths: [
      'Strong full-stack development capabilities',
      'Demonstrated ability to learn new technologies quickly',
      'Good balance of theoretical and practical knowledge'
    ],
    growthAreas: [
      'System design and architecture patterns',
      'Team leadership and mentoring'
    ],
    hiddenTalents: [
      'Cross-domain problem solving',
      'Rapid prototyping ability',
      'Strong documentation skills'
    ],
    learningPotential: 88,
    cultureFit: 76,
    recommendedRoles: [
      { title: 'Senior Software Engineer', matchScore: 87, reason: 'Strong coding skills and breadth of technology experience' },
      { title: 'ML Engineer', matchScore: 79, reason: 'Growing ML/AI skills with solid engineering foundation' },
      { title: 'Tech Lead', matchScore: 72, reason: 'Good technical depth, developing leadership potential' }
    ],
    summary: `${profile.name} shows strong technical capability across multiple domains with a clear growth trajectory. Their project portfolio demonstrates practical problem-solving ability and initiative. (Demo Mode - Connect Gemini API for real analysis)`
  };
}
