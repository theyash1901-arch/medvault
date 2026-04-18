import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiClock, FiPlus, FiTrash2, FiBell } from 'react-icons/fi';
import { offlineStore } from '../../lib/offlineStore';

export default function RemindersScreen() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newReminder, setNewReminder] = useState({ medicine: '', time: '', dosage: '' });

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    const saved = await offlineStore.load(`reminders_${user.id}`);
    if (saved) setReminders(saved);
  };

  const saveReminders = async (data) => {
    setReminders(data);
    await offlineStore.save(`reminders_${user.id}`, data);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newReminder.medicine || !newReminder.time) return;
    
    const reminder = {
      id: Date.now().toString(),
      ...newReminder,
      active: true
    };
    
    saveReminders([...reminders, reminder].sort((a, b) => a.time.localeCompare(b.time)));
    setNewReminder({ medicine: '', time: '', dosage: '' });
    setShowAdd(false);
  };

  const deleteReminder = (id) => {
    saveReminders(reminders.filter(r => r.id !== id));
  };

  const toggleReminder = (id) => {
    saveReminders(reminders.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Medication Reminders</h1>
            <p>Never miss a dose</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <FiPlus /> Add
          </button>
        </div>

        {showAdd && (
          <div className="card" style={{ marginBottom: 20, border: '1px solid var(--primary)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Add Reminder</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Medicine Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Paracetamol"
                  value={newReminder.medicine}
                  onChange={e => setNewReminder({...newReminder, medicine: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={newReminder.time}
                    onChange={e => setNewReminder({...newReminder, time: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dosage</label>
                  <input
                    className="form-input"
                    placeholder="e.g. 1 pill"
                    value={newReminder.dosage}
                    onChange={e => setNewReminder({...newReminder, dosage: e.target.value})}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-full">Save</button>
              </div>
            </form>
          </div>
        )}

        {reminders.length === 0 && !showAdd ? (
          <div className="text-center" style={{ padding: '40px 0' }}>
            <FiClock size={40} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <h3 style={{ color: 'var(--text-secondary)' }}>No reminders set</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reminders.map(r => (
              <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: r.active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ background: r.active ? 'var(--primary)' : 'var(--border)', color: 'white', padding: '8px 12px', borderRadius: 'var(--radius-md)', fontWeight: 'bold' }}>
                    {r.time}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', margin: 0 }}>{r.medicine}</h4>
                    {r.dosage && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{r.dosage}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleReminder(r.id)} style={{ color: r.active ? 'var(--primary)' : 'var(--text-muted)' }}>
                    <FiBell />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteReminder(r.id)} style={{ color: 'var(--danger)' }}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
