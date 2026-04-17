import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { offlineStore } from '../../lib/offlineStore';
import { FiPlus, FiX, FiCheckCircle, FiAlertCircle, FiClock, FiFileText, FiHeart, FiActivity, FiDroplet } from 'react-icons/fi';

const EVENT_TYPES = [
  { value: 'diagnosis', label: 'Diagnosis', icon: '🩺', color: 'var(--primary)' },
  { value: 'treatment', label: 'Treatment', icon: '💉', color: 'var(--accent)' },
  { value: 'medication', label: 'Medication', icon: '💊', color: '#FBBF24' },
  { value: 'report', label: 'Report', icon: '📄', color: '#818CF8' },
  { value: 'prescription', label: 'Prescription', icon: '📋', color: '#F472B6' },
  { value: 'note', label: 'Note', icon: '📝', color: 'var(--text-secondary)' },
];

export default function HealthTimelineScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    event_type: 'diagnosis',
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // Fetch health events
      const { data: healthEvents } = await supabase
        .from('health_events')
        .select('*')
        .eq('patient_id', user.id)
        .order('event_date', { ascending: false });

      // Fetch reports to merge into timeline
      const { data: reports } = await supabase
        .from('reports')
        .select('*')
        .eq('patient_id', user.id)
        .order('uploaded_at', { ascending: false });

      // Convert reports to timeline events
      const reportEvents = (reports || []).map(r => ({
        id: `report_${r.id}`,
        event_type: 'report',
        title: r.title,
        description: `${r.report_type} report uploaded`,
        event_date: r.uploaded_at?.split('T')[0] || r.uploaded_at,
        created_at: r.uploaded_at,
        metadata: { report_id: r.id, file_url: r.file_url },
        isReport: true,
      }));

      // Merge and sort by date (newest first)
      const merged = [...(healthEvents || []), ...reportEvents].sort(
        (a, b) => new Date(b.event_date) - new Date(a.event_date)
      );

      setEvents(merged);
      await offlineStore.save(`timeline_${user.id}`, merged);
    } catch {
      const cached = await offlineStore.load(`timeline_${user.id}`);
      if (cached) setEvents(cached);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { data, error } = await supabase
        .from('health_events')
        .insert({
          patient_id: user.id,
          event_type: formData.event_type,
          title: formData.title.trim(),
          description: formData.description.trim(),
          event_date: formData.event_date,
        })
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => [data, ...prev].sort((a, b) => new Date(b.event_date) - new Date(a.event_date)));
      setFormData({ event_type: 'diagnosis', title: '', description: '', event_date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      setMessage({ type: 'success', text: 'Event added to timeline!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save: ' + err.message });
    }
    setSaving(false);
  };

  const deleteEvent = async (event) => {
    if (event.isReport) return; // Can't delete reports from here
    if (!confirm('Remove this event from your timeline?')) return;

    try {
      const { error } = await supabase
        .from('health_events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== event.id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const getEventConfig = (type) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[5];

  // Group events by month
  const groupedEvents = events.reduce((groups, event) => {
    const date = new Date(event.event_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = { label, events: [] };
    groups[key].events.push(event);
    return groups;
  }, {});

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Health Timeline</h1>
            <p>Your medical journey, chronologically</p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? <FiX size={14} /> : <FiPlus size={14} />}
            {showForm ? 'Cancel' : 'Add Event'}
          </button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            {message.text}
          </div>
        )}

        {/* Add Event Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: 24, animation: 'slideUp 0.3s ease' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>Add Timeline Event</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Event Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {EVENT_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      className={`btn btn-sm ${formData.event_type === type.value ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setFormData(prev => ({ ...prev, event_type: type.value }))}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  placeholder="e.g. Diagnosed with Type 2 Diabetes"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.event_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea
                  className="form-input"
                  placeholder="Additional details..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  style={{ minHeight: 60 }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : 'Add to Timeline'}
              </button>
            </form>
          </div>
        )}

        {/* Timeline */}
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <FiClock />
            <h3>No events yet</h3>
            <p>Add your first health event or upload a report to start your timeline</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <FiPlus size={14} /> Add First Event
            </button>
          </div>
        ) : (
          <div className="timeline">
            {Object.entries(groupedEvents).map(([key, group]) => (
              <div key={key} className="timeline-group">
                <div className="timeline-month-label">
                  {group.label}
                </div>
                {group.events.map((event, idx) => {
                  const config = getEventConfig(event.event_type);
                  return (
                    <div key={event.id} className="timeline-item">
                      <div className="timeline-line">
                        <div className="timeline-dot" style={{
                          background: config.color,
                          boxShadow: `0 0 12px ${config.color}40`
                        }}>
                          <span style={{ fontSize: '0.7rem' }}>{config.icon}</span>
                        </div>
                        {idx < group.events.length - 1 && <div className="timeline-connector" />}
                      </div>
                      <div className="timeline-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <p className="timeline-date">
                              {new Date(event.event_date).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </p>
                            <h4 className="timeline-title">{event.title}</h4>
                            {event.description && (
                              <p className="timeline-desc">{event.description}</p>
                            )}
                            <span className="tag" style={{
                              background: `${config.color}20`,
                              color: config.color,
                              border: `1px solid ${config.color}30`,
                              marginTop: 6,
                              fontSize: '0.7rem'
                            }}>
                              {config.icon} {config.label}
                            </span>
                          </div>
                          {!event.isReport && (
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: 4, color: 'var(--text-muted)', opacity: 0.5 }}
                              onClick={() => deleteEvent(event)}
                              title="Delete event"
                            >
                              <FiX size={14} />
                            </button>
                          )}
                          {event.isReport && event.metadata?.file_url && (
                            <a
                              href={event.metadata.file_url}
                              target="_blank"
                              rel="noopener"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              View
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
