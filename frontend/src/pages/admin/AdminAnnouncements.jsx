import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import {
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../../api/api';

const emptyForm = {
  title: '',
  message: '',
  audience: 'ALL',
  active: true,
};

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = () =>
    getAdminAnnouncements()
      .then((res) => setAnnouncements(res.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (announcement) => {
    setForm({
      title: announcement.title,
      message: announcement.message,
      audience: announcement.audience,
      active: announcement.active,
    });
    setEditId(announcement.id);
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
        await updateAnnouncement(editId, form);
      } else {
        await createAnnouncement(form);
      }
      closeModal();
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Announcements</h1>
          <p className="text-slate-600 mt-1">Publish and control communication for students and staff</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ New Announcement</button>
      </div>

      {loading ? (
        <div className="text-slate-600 animate-pulse">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-600">No announcements created yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{announcement.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">Created: {formatDate(announcement.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={announcement.active ? 'badge-student' : 'badge-admin'}>
                    {announcement.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="badge-admin">{announcement.audience}</span>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{announcement.message}</p>
              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => openEdit(announcement)} className="btn-secondary text-sm">Edit</button>
                <button onClick={() => handleDelete(announcement.id)} className="btn-danger text-sm">Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg animate-fade-in">
            <h2 className="text-xl font-bold text-slate-900 mb-5">
              {editId ? 'Edit Announcement' : 'Create Announcement'}
            </h2>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                Error: {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Announcement title"
                  required
                />
              </div>

              <div>
                <label className="label">Message</label>
                <textarea
                  className="input-field resize-none"
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Write the announcement message"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Audience</label>
                  <select
                    className="input-field"
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  >
                    <option value="ALL">All Users</option>
                    <option value="STUDENT">Students</option>
                    <option value="ADMIN">Admins</option>
                  </select>
                </div>

                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    />
                    Active Announcement
                  </label>
                </div>
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
