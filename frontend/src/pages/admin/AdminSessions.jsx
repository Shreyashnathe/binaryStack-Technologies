import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import {
  getAdminSessions,
  createSession,
  updateSession,
  deleteSession,
} from '../../api/api';

const emptyForm = {
  title: '',
  description: '',
  mentorName: '',
  startTime: '',
  endTime: '',
  mode: 'ONLINE',
  meetingLink: '',
  location: '',
  active: true,
};

function toInputDateTime(value) {
  return value ? value.slice(0, 16) : '';
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSessions = () =>
    getAdminSessions()
      .then((res) => setSessions(res.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchSessions();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (session) => {
    setForm({
      title: session.title,
      description: session.description || '',
      mentorName: session.mentorName,
      startTime: toInputDateTime(session.startTime),
      endTime: toInputDateTime(session.endTime),
      mode: session.mode,
      meetingLink: session.meetingLink || '',
      location: session.location || '',
      active: session.active,
    });
    setEditId(session.id);
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (editId) {
        await updateSession(editId, form);
      } else {
        await createSession(form);
      }
      closeModal();
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class session?')) return;
    try {
      await deleteSession(id);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Class Schedule</h1>
          <p className="text-slate-600 mt-1">Plan and publish live sessions for your coaching batches</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Add Session</button>
      </div>

      {loading ? (
        <div className="text-slate-600 animate-pulse">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-600">No sessions scheduled yet.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th className="text-left py-3 font-medium">Session</th>
                <th className="text-left py-3 font-medium">Mentor</th>
                <th className="text-left py-3 font-medium">Start</th>
                <th className="text-left py-3 font-medium">Mode</th>
                <th className="text-left py-3 font-medium">Status</th>
                <th className="text-right py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-100/70 transition-colors">
                  <td className="py-3">
                    <p className="text-slate-900 font-medium">{session.title}</p>
                    <p className="text-slate-500 text-xs mt-1">Ends: {formatDateTime(session.endTime)}</p>
                  </td>
                  <td className="py-3 text-slate-700">{session.mentorName}</td>
                  <td className="py-3 text-slate-700">{formatDateTime(session.startTime)}</td>
                  <td className="py-3">
                    <span className="badge-admin">{session.mode}</span>
                  </td>
                  <td className="py-3">
                    <span className={session.active ? 'badge-student' : 'badge-admin'}>
                      {session.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(session)} className="btn-secondary text-sm">Edit</button>
                      <button onClick={() => handleDelete(session.id)} className="btn-danger text-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl animate-fade-in max-h-[92vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-5">
              {editId ? 'Edit Class Session' : 'Create Class Session'}
            </h2>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                Error: {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Session Title</label>
                  <input
                    className="input-field"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Mentor Name</label>
                  <input
                    className="input-field"
                    value={form.mentorName}
                    onChange={(e) => setForm({ ...form, mentorName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time</label>
                  <input
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    className="input-field"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input
                    type="datetime-local"
                    min={form.startTime || new Date().toISOString().slice(0, 16)}
                    className="input-field"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Mode</label>
                  <select
                    className="input-field"
                    value={form.mode}
                    onChange={(e) => {
                      const newMode = e.target.value;
                      setForm({
                        ...form,
                        mode: newMode,
                        meetingLink: newMode === 'OFFLINE' ? '' : form.meetingLink,
                        location: newMode === 'ONLINE' ? '' : form.location
                      });
                    }}
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="HYBRID">HYBRID</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    />
                    Active Session
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(form.mode === 'ONLINE' || form.mode === 'HYBRID') && (
                  <div>
                    <label className="label">Meeting Link <span className="text-red-500 font-bold">*</span></label>
                    <input
                      type="url"
                      className="input-field"
                      value={form.meetingLink}
                      onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                      placeholder="https://..."
                      required
                    />
                  </div>
                )}
                {(form.mode === 'OFFLINE' || form.mode === 'HYBRID') && (
                  <div>
                    <label className="label">Location <span className="text-red-500 font-bold">*</span></label>
                    <input
                      className="input-field"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Classroom or branch"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Saving...' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
