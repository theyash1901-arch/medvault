import { useState, useEffect } from 'react';
import {
  BarChart3, Users, Brain, Target, TrendingUp, Activity,
  ArrowUpRight, ArrowDownRight, Clock, Zap, GitBranch,
  Award, Code, Globe, Sparkles
} from 'lucide-react';
import './Dashboard.css';

// Demo data for the dashboard
const dashboardData = {
  stats: [
    { label: 'Candidates Analyzed', value: '2,847', change: '+12.5%', trend: 'up', icon: Users },
    { label: 'Avg Match Score', value: '78.3%', change: '+3.2%', trend: 'up', icon: Target },
    { label: 'Hidden Talents Found', value: '1,203', change: '+28.4%', trend: 'up', icon: Sparkles },
    { label: 'Time Saved', value: '340h', change: '+45%', trend: 'up', icon: Clock },
  ],
  recentCandidates: [
    { name: 'Priya Sharma', role: 'Sr. Software Engineer', score: 92, skills: ['React', 'Node.js', 'AWS'], status: 'Shortlisted' },
    { name: 'Arjun Patel', role: 'ML Engineer', score: 85, skills: ['Python', 'TensorFlow', 'MLOps'], status: 'In Review' },
    { name: 'Neha Gupta', role: 'Full Stack Dev', score: 78, skills: ['Vue.js', 'Django', 'PostgreSQL'], status: 'New' },
    { name: 'Raj Kumar', role: 'DevOps Engineer', score: 88, skills: ['Docker', 'K8s', 'Terraform'], status: 'Shortlisted' },
    { name: 'Anita Singh', role: 'Data Scientist', score: 81, skills: ['Python', 'SQL', 'Spark'], status: 'In Review' },
  ],
  topSkills: [
    { name: 'Python', count: 1840, percentage: 82 },
    { name: 'React', count: 1520, percentage: 76 },
    { name: 'Machine Learning', count: 1200, percentage: 68 },
    { name: 'Docker', count: 980, percentage: 58 },
    { name: 'AWS', count: 920, percentage: 54 },
    { name: 'Node.js', count: 860, percentage: 50 },
    { name: 'TypeScript', count: 740, percentage: 44 },
    { name: 'SQL', count: 680, percentage: 40 },
  ],
  activityFeed: [
    { action: 'Analyzed candidate', detail: 'Priya Sharma - Score: 92/100', time: '2 min ago', type: 'analysis' },
    { action: 'Job match completed', detail: 'Arjun Patel → ML Engineer (85%)', time: '15 min ago', type: 'match' },
    { action: 'Hidden talent discovered', detail: 'Neha Gupta - System Design potential', time: '1h ago', type: 'talent' },
    { action: 'Candidate shortlisted', detail: 'Raj Kumar for DevOps Lead role', time: '2h ago', type: 'shortlist' },
    { action: 'Batch analysis complete', detail: '24 candidates processed', time: '3h ago', type: 'batch' },
  ]
};

export default function Dashboard() {
  const [animatedStats, setAnimatedStats] = useState(dashboardData.stats.map(() => 0));

  useEffect(() => {
    // Animate stats on mount
    const timer = setTimeout(() => {
      setAnimatedStats(dashboardData.stats.map(() => 1));
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard-page">
      <div className="page-bg">
        <div className="page-orb page-orb-1" />
        <div className="page-orb page-orb-2" />
      </div>

      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="text-muted">Your talent analytics overview</p>
          </div>
          <div className="dashboard-header-actions">
            <span className="badge badge-success">
              <Activity size={12} /> Live
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid stagger-children">
          {dashboardData.stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon">
                <stat.icon size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
              </div>
              <div className={`stat-change stat-change-${stat.trend}`}>
                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-grid">
          {/* Recent Candidates */}
          <div className="dashboard-card dashboard-card-wide">
            <div className="dashboard-card-header">
              <h3><Users size={18} /> Recent Candidates</h3>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Last 24 hours</span>
            </div>
            <div className="candidates-table">
              <div className="table-header">
                <span>Candidate</span>
                <span>Target Role</span>
                <span>Score</span>
                <span>Key Skills</span>
                <span>Status</span>
              </div>
              {dashboardData.recentCandidates.map((c, i) => (
                <div key={i} className="table-row">
                  <div className="candidate-name">
                    <div className="candidate-avatar">
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span>{c.name}</span>
                  </div>
                  <span className="text-muted">{c.role}</span>
                  <div className="candidate-score">
                    <div className="score-dot" style={{
                      background: c.score >= 90 ? 'var(--success-400)' : c.score >= 80 ? 'var(--accent-400)' : 'var(--warning-400)'
                    }} />
                    <span>{c.score}%</span>
                  </div>
                  <div className="candidate-skills">
                    {c.skills.map((s, j) => (
                      <span key={j} className="tag">{s}</span>
                    ))}
                  </div>
                  <span className={`badge badge-${c.status === 'Shortlisted' ? 'success' : c.status === 'In Review' ? 'accent' : 'primary'}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Skills */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3><Code size={18} /> Trending Skills</h3>
            </div>
            <div className="skills-chart">
              {dashboardData.topSkills.map((skill, i) => (
                <div key={i} className="skill-bar-row">
                  <div className="skill-bar-info">
                    <span className="skill-bar-name">{skill.name}</span>
                    <span className="skill-bar-count">{skill.count}</span>
                  </div>
                  <div className="progress-bar" style={{ height: '8px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${skill.percentage}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3><Activity size={18} /> Activity Feed</h3>
            </div>
            <div className="activity-feed">
              {dashboardData.activityFeed.map((item, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-dot activity-dot-${item.type}`} />
                  <div className="activity-content">
                    <span className="activity-action">{item.action}</span>
                    <span className="activity-detail">{item.detail}</span>
                    <span className="activity-time">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h3><Brain size={18} /> AI Insights</h3>
            </div>
            <div className="insights-list">
              <div className="insight-item">
                <div className="insight-icon insight-icon-violet">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <p><strong>Python skills</strong> are the most common across analyzed candidates at 82% prevalence.</p>
                </div>
              </div>
              <div className="insight-item">
                <div className="insight-icon insight-icon-cyan">
                  <Zap size={16} />
                </div>
                <div>
                  <p><strong>28% of candidates</strong> had hidden talents in areas not listed on their resumes.</p>
                </div>
              </div>
              <div className="insight-item">
                <div className="insight-icon insight-icon-green">
                  <Award size={16} />
                </div>
                <div>
                  <p>Candidates with <strong>open-source contributions</strong> scored 23% higher in technical assessments.</p>
                </div>
              </div>
              <div className="insight-item">
                <div className="insight-icon insight-icon-amber">
                  <Globe size={16} />
                </div>
                <div>
                  <p><strong>Cross-domain skills</strong> are the strongest predictor of growth potential across all roles.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
