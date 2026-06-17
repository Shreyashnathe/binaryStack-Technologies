import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getAnnouncements } from '../../api/api';

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

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnnouncements()
      .then((res) => setAnnouncements(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
        <p className="text-slate-600 mt-1">Important updates from your coaching management team</p>
      </div>

      {loading ? (
        <div className="text-slate-600 animate-pulse">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-600">No announcements available right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-xl font-semibold text-slate-900">{announcement.title}</h2>
                <span className="badge-student">
                  {announcement.audience === 'ALL' ? 'General' : announcement.audience}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{announcement.message}</p>
              <div className="mt-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
                <span>Published: {formatDate(announcement.createdAt)}</span>
                <span>By: {announcement.createdBy || 'Admin'}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
