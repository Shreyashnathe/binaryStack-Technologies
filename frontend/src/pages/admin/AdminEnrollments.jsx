import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getAllEnrollments } from '../../api/api';

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');

  useEffect(() => {
    getAllEnrollments()
      .then((r) => setEnrollments(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = enrollments.filter(
    (e) =>
      e.studentName.toLowerCase().includes(search.toLowerCase()) ||
      e.courseTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">All Enrollments</h1>
        <p className="text-slate-600 mt-1">{enrollments.length} total enrollment{enrollments.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="card">
        <div className="mb-5">
          <input
            className="input-field max-w-xs"
            placeholder="Search by student or course"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-slate-600 animate-pulse py-8 text-center">Loading enrollments...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-600">{search ? 'No results found.' : 'No enrollments yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th className="text-left pb-3 font-medium">#</th>
                  <th className="text-left pb-3 font-medium">Student</th>
                  <th className="text-left pb-3 font-medium">Email</th>
                  <th className="text-left pb-3 font-medium">Course</th>
                  <th className="text-left pb-3 font-medium">Enrolled At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((e, i) => (
                  <tr key={e.id} className="hover:bg-slate-100/70 transition-colors">
                    <td className="py-3 text-slate-500">{i + 1}</td>
                    <td className="py-3 text-slate-900 font-medium">{e.studentName}</td>
                    <td className="py-3 text-slate-600">{e.studentEmail}</td>
                    <td className="py-3 text-primary-700">{e.courseTitle}</td>
                    <td className="py-3 text-slate-600">{new Date(e.enrolledAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
