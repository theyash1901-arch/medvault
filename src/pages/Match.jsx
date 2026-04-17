import { useState } from 'react';
import {
  Target, Briefcase, Users, Loader2, Sparkles, CheckCircle2,
  XCircle, ArrowUpRight, Brain, TrendingUp, Shield, Zap
} from 'lucide-react';
import { matchJobRole, initGemini } from '../utils/gemini';
import './Match.css';

export default function Match() {
  const [candidate, setCandidate] = useState({
    name: '',
    skills: '',
    experience: '',
    education: ''
  });
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    if (apiKey.trim()) {
      setIsConnected(initGemini(apiKey.trim()));
    }
  };

  const loadSample = () => {
    setCandidate({
      name: 'Arjun Patel',
      skills: 'Python, TensorFlow, PyTorch, SQL, Docker, Kubernetes, MLOps, FastAPI',
      experience: '2 years ML Engineer at DataFlow Inc, 1 year Data Scientist at AnalyticsPro',
      education: 'M.Tech AI & ML, IIIT Hyderabad, 2023'
    });
    setJobDescription(`Senior Machine Learning Engineer

We're looking for an experienced ML Engineer to join our growing AI team. You'll be responsible for designing, building, and deploying production ML systems.

Requirements:
- 3+ years experience in machine learning
- Proficiency in Python, TensorFlow or PyTorch
- Experience with MLOps and model deployment
- Strong foundation in statistics and algorithms
- Experience with cloud platforms (AWS/GCP)

Nice to have:
- Experience with NLP or Computer Vision
- Contributions to open-source ML projects
- Published research papers`);
  };

  const handleMatch = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isConnected) {
        const res = await matchJobRole(candidate, jobDescription);
        setResult(res);
      } else {
        await new Promise(r => setTimeout(r, 2000));
        setResult(generateDemoMatch());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="match-page">
      <div className="page-bg">
        <div className="page-orb page-orb-1" />
        <div className="page-orb page-orb-2" />
      </div>

      <div className="container">
        <div className="page-header">
          <span className="badge badge-accent">
            <Target size={12} />
            Job Matching
          </span>
          <h1>Smart <span className="text-gradient">Role Matching</span></h1>
          <p className="text-muted">
            Match candidates to job roles with AI-powered multi-dimensional compatibility analysis.
          </p>
        </div>

        {!isConnected && (
          <div className="api-banner animate-fade-in">
            <div className="api-banner-content">
              <Sparkles size={18} />
              <div>
                <strong>Connect Gemini AI for real matching</strong>
                <p>Enter your API key or try with demo data.</p>
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

        <form onSubmit={handleMatch} className="match-layout">
          {/* Candidate Side */}
          <div className="match-panel">
            <div className="match-panel-header">
              <Users size={20} />
              <h3>Candidate Profile</h3>
            </div>
            <div className="match-panel-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="input"
                  placeholder="Candidate name"
                  value={candidate.name}
                  onChange={e => setCandidate(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Skills</label>
                <input
                  className="input"
                  placeholder="Python, ML, Docker..."
                  value={candidate.skills}
                  onChange={e => setCandidate(p => ({ ...p, skills: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Experience</label>
                <textarea
                  className="input textarea"
                  placeholder="Work experience..."
                  value={candidate.experience}
                  onChange={e => setCandidate(p => ({ ...p, experience: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Education</label>
                <input
                  className="input"
                  placeholder="Degree, Institution"
                  value={candidate.education}
                  onChange={e => setCandidate(p => ({ ...p, education: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* VS / Match Button */}
          <div className="match-center">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={loadSample}
              style={{ marginBottom: '16px' }}
            >
              Load Sample
            </button>
            <button
              type="submit"
              className="match-btn"
              disabled={isLoading || !candidate.name || !jobDescription}
            >
              {isLoading ? (
                <Loader2 size={24} className="spinning" />
              ) : (
                <Zap size={24} />
              )}
            </button>
            <span className="match-center-label">
              {isLoading ? 'Analyzing...' : 'Match'}
            </span>
          </div>

          {/* Job Side */}
          <div className="match-panel">
            <div className="match-panel-header">
              <Briefcase size={20} />
              <h3>Job Description</h3>
            </div>
            <div className="match-panel-body">
              <textarea
                className="input match-jd-textarea"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
              />
            </div>
          </div>
        </form>

        {/* Match Result */}
        {result && !isLoading && (
          <div className="match-result animate-scale-in">
            <div className="match-result-header">
              <div className="match-score-big">
                <svg viewBox="0 0 140 140" className="match-score-svg">
                  <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <circle
                    cx="70" cy="70" r="60" fill="none"
                    stroke="url(#matchGrad)" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.matchScore / 100) * 377} 377`}
                    transform="rotate(-90 70 70)"
                    className="score-circle"
                  />
                  <defs>
                    <linearGradient id="matchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="50%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="match-score-text">
                  <span className="match-score-number">{result.matchScore}</span>
                  <span className="match-score-pct">%</span>
                </div>
              </div>

              <div className="match-result-info">
                <div className={`match-recommendation match-rec-${result.recommendation}`}>
                  {result.recommendation === 'hire' && '🎯 Strong Hire'}
                  {result.recommendation === 'strong_consider' && '💪 Strong Consider'}
                  {result.recommendation === 'consider' && '🤔 Consider'}
                  {result.recommendation === 'pass' && '⚠️ Not Recommended'}
                </div>
                <p className="match-reasoning">{result.reasoning}</p>
              </div>
            </div>

            {/* Breakdown */}
            {result.matchBreakdown && (
              <div className="match-breakdown">
                <h4>Compatibility Breakdown</h4>
                <div className="breakdown-grid">
                  {Object.entries(result.matchBreakdown).map(([key, val]) => (
                    <div key={key} className="breakdown-item">
                      <div className="breakdown-icon">
                        {key === 'technicalSkills' && <Brain size={18} />}
                        {key === 'experience' && <Briefcase size={18} />}
                        {key === 'cultureFit' && <Users size={18} />}
                        {key === 'growthPotential' && <TrendingUp size={18} />}
                      </div>
                      <div className="breakdown-info">
                        <span className="breakdown-label">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                        </span>
                        <div className="progress-bar" style={{ height: '6px' }}>
                          <div className="progress-bar-fill" style={{ width: `${val}%` }} />
                        </div>
                      </div>
                      <span className="breakdown-score">{val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Match */}
            <div className="match-skills-row">
              {result.matchedSkills && (
                <div className="match-skills-col">
                  <h4><CheckCircle2 size={16} /> Matched Skills</h4>
                  <div className="match-skill-tags">
                    {result.matchedSkills.map((s, i) => (
                      <span key={i} className="tag tag-matched">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.missingSkills && (
                <div className="match-skills-col">
                  <h4><XCircle size={16} /> Missing Skills</h4>
                  <div className="match-skill-tags">
                    {result.missingSkills.map((s, i) => (
                      <span key={i} className="tag tag-missing">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function generateDemoMatch() {
  return {
    matchScore: 76,
    matchBreakdown: {
      technicalSkills: 82,
      experience: 68,
      cultureFit: 80,
      growthPotential: 88
    },
    matchedSkills: ['Python', 'TensorFlow', 'PyTorch', 'Docker', 'MLOps', 'SQL'],
    missingSkills: ['3+ years experience (has 3)', 'AWS/GCP cloud platforms', 'Published research'],
    recommendation: 'strong_consider',
    reasoning: 'Strong technical match with excellent growth potential. The candidate has solid ML engineering skills and good tool proficiency. Minor gap in cloud platform experience, but their learning trajectory suggests rapid adaptation. (Demo Mode)'
  };
}
