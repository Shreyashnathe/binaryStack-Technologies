import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getUpcomingSessions } from '../../api/api';

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StudentSchedule() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUpcomingSessions()
      .then((res) => setSessions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Class Schedule</h1>
        <p className="text-slate-600 mt-1">Track your upcoming live sessions and mentor timings</p>
      </div>

      {loading ? (
        <div className="text-slate-600 animate-pulse">Loading schedule...</div>
      ) : sessions.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-600">No upcoming sessions available right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <article key={session.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{session.title}</h2>
                  <p className="text-sm text-slate-600 mt-1">Mentor: {session.mentorName}</p>
                </div>
                <span className="badge-student">{session.mode}</span>
              </div>

              {session.description && (
                <p className="text-slate-700 mt-3 leading-relaxed">{session.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <p className="text-slate-500">Starts</p>
                  <p className="text-slate-800 font-medium">{formatDateTime(session.startTime)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <p className="text-slate-500">Ends</p>
                  <p className="text-slate-800 font-medium">{formatDateTime(session.endTime)}</p>
                </div>
              </div>

              {(session.location || session.meetingLink) && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {session.location && (
                    <span className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                      Location: {session.location}
                    </span>
                  )}
                  {session.meetingLink && (
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary text-sm"
                    >
                      Join Session
                    </a>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
