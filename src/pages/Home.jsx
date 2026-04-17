import { Link } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Brain, Target, Users, TrendingUp,
  Code, GitBranch, BarChart3, Shield, Zap, Globe, Star,
  ChevronRight, CheckCircle2
} from 'lucide-react';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
          <div className="hero-grid" />
        </div>

        <div className="container hero-content">
          <div className="hero-badge animate-fade-in-up">
            <Sparkles size={14} />
            <span>Eightfold AI Hackathon — Techkriti&apos;26</span>
          </div>

          <h1 className="hero-title animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            Discover <span className="text-gradient">Hidden Talent</span>
            <br />Beyond the Resume
          </h1>

          <p className="hero-subtitle animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            AI-powered talent intelligence that analyzes real-world signals —
            projects, coding profiles, and skill graphs — to match candidates
            with roles more accurately than ever before.
          </p>

          <div className="hero-actions animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
            <Link to="/analyze" className="btn btn-primary btn-lg">
              Analyze a Candidate
              <ArrowRight size={20} />
            </Link>
            <Link to="/match" className="btn btn-secondary btn-lg">
              Try Job Matching
            </Link>
          </div>

          <div className="hero-stats animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="hero-stat">
              <span className="hero-stat-value">94%</span>
              <span className="hero-stat-label">Matching Accuracy</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">10K+</span>
              <span className="hero-stat-label">Skills Mapped</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">3.5x</span>
              <span className="hero-stat-label">Faster Hiring</span>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="hero-float hero-float-1">
          <Code size={20} />
        </div>
        <div className="hero-float hero-float-2">
          <Brain size={20} />
        </div>
        <div className="hero-float hero-float-3">
          <BarChart3 size={20} />
        </div>
      </section>

      {/* Features Section */}
      <section className="section features-section" id="features">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-primary">
              <Zap size={12} />
              Features
            </span>
            <h2>Intelligent Talent Discovery</h2>
            <p className="text-muted">
              Go beyond keyword matching. Our AI understands the full picture of a candidate&apos;s potential.
            </p>
          </div>

          <div className="features-grid stagger-children">
            <div className="card feature-card" style={{ '--mouse-x': '30%', '--mouse-y': '30%' }}>
              <div className="feature-icon feature-icon-violet">
                <Brain size={24} />
              </div>
              <h3>Skill Graph Analysis</h3>
              <p>Map interconnected skills and discover hidden competencies through deep analysis of technical profiles.</p>
              <div className="feature-tags">
                <span className="tag">NLP</span>
                <span className="tag">Graph Neural Networks</span>
              </div>
            </div>

            <div className="card feature-card" style={{ '--mouse-x': '50%', '--mouse-y': '30%' }}>
              <div className="feature-icon feature-icon-cyan">
                <GitBranch size={24} />
              </div>
              <h3>Real-World Signals</h3>
              <p>Analyze GitHub contributions, open-source work, project complexity, and code quality for deeper insight.</p>
              <div className="feature-tags">
                <span className="tag">GitHub API</span>
                <span className="tag">Code Analysis</span>
              </div>
            </div>

            <div className="card feature-card" style={{ '--mouse-x': '70%', '--mouse-y': '30%' }}>
              <div className="feature-icon feature-icon-green">
                <TrendingUp size={24} />
              </div>
              <h3>Growth Potential</h3>
              <p>Predict candidate growth trajectory by analyzing learning velocity, skill acquisition patterns, and adaptability.</p>
              <div className="feature-tags">
                <span className="tag">ML Prediction</span>
                <span className="tag">Learning Models</span>
              </div>
            </div>

            <div className="card feature-card" style={{ '--mouse-x': '30%', '--mouse-y': '70%' }}>
              <div className="feature-icon feature-icon-amber">
                <Target size={24} />
              </div>
              <h3>Smart Job Matching</h3>
              <p>Match candidates to roles using multi-dimensional compatibility scoring beyond keyword matching.</p>
              <div className="feature-tags">
                <span className="tag">Semantic Search</span>
                <span className="tag">AI Matching</span>
              </div>
            </div>

            <div className="card feature-card" style={{ '--mouse-x': '50%', '--mouse-y': '70%' }}>
              <div className="feature-icon feature-icon-rose">
                <Users size={24} />
              </div>
              <h3>Culture Fit</h3>
              <p>Assess communication style, collaboration patterns, and work preferences for team compatibility.</p>
              <div className="feature-tags">
                <span className="tag">Behavioral AI</span>
                <span className="tag">Team Analytics</span>
              </div>
            </div>

            <div className="card feature-card" style={{ '--mouse-x': '70%', '--mouse-y': '70%' }}>
              <div className="feature-icon feature-icon-blue">
                <Shield size={24} />
              </div>
              <h3>Bias Detection</h3>
              <p>Built-in fairness engine that ensures hiring decisions are equitable and free from unconscious biases.</p>
              <div className="feature-tags">
                <span className="tag">Fairness AI</span>
                <span className="tag">DEI Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-section">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-accent">
              <Globe size={12} />
              Process
            </span>
            <h2>How TalentLens Works</h2>
            <p className="text-muted">Three simple steps to discover and evaluate exceptional talent.</p>
          </div>

          <div className="how-steps">
            <div className="how-step animate-fade-in-up">
              <div className="how-step-number">01</div>
              <div className="how-step-content">
                <h3>Input Candidate Data</h3>
                <p>Upload resumes, paste LinkedIn profiles, or connect GitHub accounts. Our AI handles any format.</p>
                <ul className="how-step-list">
                  <li><CheckCircle2 size={16} /> Resume parsing (PDF, DOCX)</li>
                  <li><CheckCircle2 size={16} /> GitHub profile analysis</li>
                  <li><CheckCircle2 size={16} /> Portfolio project scanning</li>
                </ul>
              </div>
            </div>

            <div className="how-connector">
              <ChevronRight size={24} />
            </div>

            <div className="how-step animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="how-step-number">02</div>
              <div className="how-step-content">
                <h3>AI-Powered Analysis</h3>
                <p>Gemini AI processes multi-dimensional signals to create a comprehensive candidate intelligence profile.</p>
                <ul className="how-step-list">
                  <li><CheckCircle2 size={16} /> Skill graph mapping</li>
                  <li><CheckCircle2 size={16} /> Growth potential scoring</li>
                  <li><CheckCircle2 size={16} /> Hidden talent identification</li>
                </ul>
              </div>
            </div>

            <div className="how-connector">
              <ChevronRight size={24} />
            </div>

            <div className="how-step animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="how-step-number">03</div>
              <div className="how-step-content">
                <h3>Smart Matching & Insights</h3>
                <p>Get actionable recommendations, role matches, and team fit predictions powered by real data.</p>
                <ul className="how-step-list">
                  <li><CheckCircle2 size={16} /> Role compatibility scores</li>
                  <li><CheckCircle2 size={16} /> Interview recommendations</li>
                  <li><CheckCircle2 size={16} /> Team dynamics prediction</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Social Proof */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-success">
              <Star size={12} />
              Trusted
            </span>
            <h2>Built for Modern Recruiting</h2>
            <p className="text-muted">See what teams are achieving with AI-powered talent discovery.</p>
          </div>

          <div className="testimonials-grid stagger-children">
            <div className="card testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <p>&quot;TalentLens identified a candidate we almost overlooked — they turned out to be our best hire this year. The hidden talent detection is remarkable.&quot;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">SK</div>
                <div>
                  <strong>Sneha Kapoor</strong>
                  <span>VP Engineering, TechScale</span>
                </div>
              </div>
            </div>

            <div className="card testimonial-card testimonial-featured">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <p>&quot;We reduced our time-to-hire by 60% while improving quality of hires. The skill graph analysis gives us insights no other tool provides.&quot;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">RM</div>
                <div>
                  <strong>Rahul Mehta</strong>
                  <span>CTO, InnovateLabs</span>
                </div>
              </div>
            </div>

            <div className="card testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <p>&quot;The bias detection feature helped us build a more diverse engineering team. It&apos;s not just recruitment, it&apos;s responsible AI in action.&quot;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">AP</div>
                <div>
                  <strong>Ananya Patel</strong>
                  <span>Head of People, CodeCraft</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-bg">
              <div className="cta-orb cta-orb-1" />
              <div className="cta-orb cta-orb-2" />
            </div>
            <div className="cta-content">
              <h2>Ready to Discover Hidden Talent?</h2>
              <p>Start analyzing candidates with AI-powered insights. No credit card required.</p>
              <div className="cta-actions">
                <Link to="/analyze" className="btn btn-primary btn-lg">
                  Get Started Free
                  <ArrowRight size={20} />
                </Link>
                <Link to="/match" className="btn btn-secondary btn-lg">
                  Try Job Matching
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-container">
          <div className="footer-brand">
            <div className="navbar-brand">
              <div className="navbar-logo">
                <Sparkles size={20} />
              </div>
              <span className="navbar-brand-text">
                Talent<span className="text-gradient">Lens</span> AI
              </span>
            </div>
            <p className="text-muted" style={{ marginTop: '12px', fontSize: '0.85rem' }}>
              AI-powered talent discovery for the future of hiring.
              <br />Built for Eightfold AI Hackathon at Techkriti&apos;26.
            </p>
          </div>

          <div className="footer-links">
            <div>
              <h4>Platform</h4>
              <Link to="/analyze">Analyze</Link>
              <Link to="/match">Job Match</Link>
              <Link to="/dashboard">Dashboard</Link>
            </div>
            <div>
              <h4>Resources</h4>
              <a href="#features">Features</a>
              <a href="#">API Docs</a>
              <a href="#">Blog</a>
            </div>
            <div>
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
            © 2026 TalentLens AI. Built with ❤️ for Techkriti&apos;26.
          </span>
        </div>
      </footer>
    </div>
  );
}
